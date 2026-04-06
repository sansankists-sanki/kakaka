/**
 * 数据库初始化脚本（可选）
 * 运行：node init-db.js
 * server.js 启动时也会自动初始化，通常不需要单独运行此脚本。
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'messages.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname   TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )
`);

console.log('✓ 数据库初始化完成：messages.db');
db.close();
