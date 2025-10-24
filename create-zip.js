const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Caminho da pasta do projeto que será zipada
const projectFolder = path.join(__dirname, 'cnpj-api-simulado');

// Nome do arquivo ZIP de saída
const outputZip = path.join(__dirname, 'cnpj-api-simulado.zip');

// Cria o arquivo de saída
const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`ZIP criado com sucesso! Total de ${archive.pointer()} bytes.`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);
archive.directory(projectFolder, false); // Adiciona toda a pasta
archive.finalize();
