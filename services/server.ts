import { initDB, syncJSONToDB } from './services/cnpjService';

initDB().then(async () => {
  await syncJSONToDB(); // Popula banco com dados do JSON
  app.listen(PORT, () => {
    console.log(`API de CNPJs rodando em http://localhost:${PORT}`);
  });
});
