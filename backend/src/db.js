const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'voting.db');

const db = new DatabaseSync(DB_PATH);

// candidates 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id     INTEGER UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    photo_filename  TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
