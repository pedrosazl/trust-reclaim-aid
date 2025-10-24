import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../ormconfig';
import { CNPJ } from '../entities/CNPJ';

const cnpjsPath = path.join(__dirname, '../data/cnpjs.json');

export async function syncJSONToDB() {
  const repository = AppDataSource.getRepository(CNPJ);

  const cnpjsData: CNPJ[] = JSON.parse(fs.readFileSync(cnpjsPath, 'utf-8'));

  for (const cnpj of cnpjsData) {
    const exists = await repository.findOneBy({ cnpj: cnpj.cnpj });
    if (!exists) {
      await repository.save(cnpj);
    }
  }

  console.log('Sincronização do JSON concluída!');
}
