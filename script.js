
// Sample product list (from user's inventory)
const PRODUCTS = [
  "Bebida Láctea 180g","Bebida Láctea 900g","Queijo Coalho Branco 200g","Queijo Coalho Branco Light 200g",
  "Queijo Coalho Zero Lactose 200g","Creme de Leite 300ml","Manteiga 200g","Manteiga 500g","Manteiga Zero Lactose 200g",
  "Manteiga da Terra 1L","Manteiga da Terra 270g","Requeijão Bisnaga 1.8kg","Requeijão Cremoso 200g",
  "Requeijão Zero Lactose 200g","Doce de Leite 300g","Prato Fatiado 150g","Mussarela Fatiada 150g","Mussarela Fatiada Zero Lactose 150g",
  "Queijo Minas Frescal","Queijo Minas Zero Lactose","Mussarela Barra Grande","Mussarela Processada Barra Grande","Mussarela Zero Lactose Barra Grande",
  "Barrinha Mussarela Zero Lactose","Ricota Fresca 300g"
];

// Sample requests data
let requests = [
  {id:1001,user:'João',product:PRODUCTS[2],reason:'Vencido',status:'pending'},
  {id:1002,user:'Mariana',product:PRODUCTS[6],reason:'Avariado',status:'pending'},
  {id:1003,user:'Carlos',product:PRODUCTS[12],reason:'Erro no pedido',status:'approved'},
  {id:1004,user:'Ana',product:PRODUCTS[0],reason:'Avariado',status:'rejected'},
  {id:1005,user:'Lucas',product:PRODUCTS[3],reason:'Insatisfação',status:'pending'}
];

// Helper to map status to badge
function statusBadge(status){
  if(status==='approved') return '<span class="status-badge" style="background:var(--success);color:#fff">Aprovado</span>';
  if(status==='rejected') return '<span class="status-badge" style="background:var(--danger);color:#fff">Rejeitado</span>';
  return '<span class="status-badge" style="background:var(--warning);color:#111">Pendente</span>';
}

// Render products into index.html
function renderProducts(){
  const el = document.getElementById('products-list');
  if(!el) return;
  el.innerHTML = '';
  PRODUCTS.forEach((p, i)=>{
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `<div class="product-thumb">Imagem<br>${p.split(' ')[0]}</div>
    <strong style="font-size:13px">${p}</strong>
    <div style="margin-top:8px"><button class="btn small" onclick="alert('Pré-visualização: ${p}')">Visualizar</button></div>`;
    el.appendChild(div);
  });
}

// Render requests table and counts (used in painel.html)
function renderRequests(){
  const tbody = document.querySelector('#requests-table tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  requests.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${r.user}</td><td>${r.product}</td><td>${r.reason}</td>
    <td id="status-${r.id}">${statusBadge(r.status)}</td>
    <td>
      <button class="btn small approve" onclick="updateStatus(${r.id},'approved')">Aprovar</button>
      <button class="btn small pending" onclick="updateStatus(${r.id},'pending')">Pendente</button>
      <button class="btn small reject" onclick="updateStatus(${r.id},'rejected')">Rejeitar</button>
    </td>`;
    tbody.appendChild(tr);
  });
  updateCountsAndCharts();
}

// Update status handler
function updateStatus(id, newStatus){
  const idx = requests.findIndex(r=>r.id===id);
  if(idx===-1) return;
  requests[idx].status = newStatus;
  renderRequests();
}

// Charts
let lineChart, pieChart;
function initCharts(){
  const lineCtx = document.getElementById('line-chart');
  const pieCtx = document.getElementById('pie-chart');
  if(!lineCtx || !pieCtx) return;

  const days = Array.from({length:30},(_,i)=>`D-${30-i}`);
  const sample = Array.from({length:30},()=>Math.floor(Math.random()*5));

  lineChart = new Chart(lineCtx,{
    type:'line',
    data:{labels:days,datasets:[{label:'Devoluções',data:sample,fill:true,tension:0.3}]},
    options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });

  pieChart = new Chart(pieCtx,{
    type:'pie',
    data:{labels:['Avariado','Vencido','Erro no pedido','Insatisfação'],datasets:[{data:[12,7,5,6]}]},
    options:{plugins:{legend:{position:'bottom'}}}
  });
}

// Update counts and charts from requests
function updateCountsAndCharts(){
  const pend = requests.filter(r=>r.status==='pending').length;
  const appr = requests.filter(r=>r.status==='approved').length;
  const rej = requests.filter(r=>r.status==='rejected').length;
  document.getElementById('count-pending') && (document.getElementById('count-pending').innerText = pend);
  document.getElementById('count-approved') && (document.getElementById('count-approved').innerText = appr);
  document.getElementById('count-rejected') && (document.getElementById('count-rejected').innerText = rej);
  document.getElementById('count-alerts') && (document.getElementById('count-alerts').innerText = Math.max(0, PRODUCT_ALERTS());

  // update pie chart with dynamic distribution
  if(pieChart){
    const a = requests.filter(r=>r.reason==='Avariado').length;
    const v = requests.filter(r=>r.reason==='Vencido').length;
    const e = requests.filter(r=>r.reason==='Erro no pedido').length;
    const i = requests.filter(r=>r.reason==='Insatisfação').length;
    pieChart.data.datasets[0].data = [a,v,e,i];
    pieChart.update();
  }
  if(lineChart){
    // small random tweak
    lineChart.data.datasets[0].data = lineChart.data.datasets[0].data.map(d=>Math.max(0,d + (Math.floor(Math.random()*3)-1)));
    lineChart.update();
  }
}

// Simple alert count heuristic (products with >2 requests)
function PRODUCT_ALERTS(){
  const counts = {};
  requests.forEach(r=>counts[r.product] = (counts[r.product]||0)+1);
  return Object.values(counts).filter(c=>c>2).length;
}

// Init on page load
document.addEventListener('DOMContentLoaded', ()=>{
  renderProducts();
  renderRequests();
  initCharts();

  // index -> open panel button
  const openPanel = document.getElementById('open-panel');
  if(openPanel) openPanel.addEventListener('click', ()=> location.href='painel.html');

  // simple search filter
  const search = document.getElementById('filter-search');
  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase();
      const filtered = requests.filter(r=> (r.product+ ' ' + r.user + ' ' + r.reason).toLowerCase().includes(q) );
      // show only filtered
      const tbody = document.querySelector('#requests-table tbody');
      if(!tbody) return;
      tbody.innerHTML='';
      filtered.forEach(r=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.id}</td><td>${r.user}</td><td>${r.product}</td><td>${r.reason}</td>
        <td id="status-${r.id}">${statusBadge(r.status)}</td>
        <td>
          <button class="btn small approve" onclick="updateStatus(${r.id},'approved')">Aprovar</button>
          <button class="btn small pending" onclick="updateStatus(${r.id},'pending')">Pendente</button>
          <button class="btn small reject" onclick="updateStatus(${r.id},'rejected')">Rejeitar</button>
        </td>`;
        tbody.appendChild(tr);
      });
    });
  }
});
