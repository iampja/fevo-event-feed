import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/eventfeed.db');

// Ensure the directory exists before SQLite tries to create the file
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
    extension: 'ts',
  },
};

const db: Knex = knex(config);

export default db;
export { config };
