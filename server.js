const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── 管理员密钥（只有你知道，请勿泄露）────────────────────────────────
const ADMIN_SECRET = 'v9x3k7p2';
// 删除留言：GET http://localhost:3000/admin/v9x3k7p2/delete/:id
// ──────────────────────────────────────────────────────────────────────

// 初始化数据库
const db = new Database(path.join(__dirname, 'messages.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname   TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API：获取所有留言（倒序） ────────────────────────────────────────
app.get('/api/messages', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, nickname, content, created_at FROM messages ORDER BY id DESC'
    ).all();
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '服务器错误' });
  }
});

// ─── API：提交留言 ────────────────────────────────────────────────────
app.post('/api/messages', (req, res) => {
  const { nickname, content } = req.body || {};

  if (!nickname?.trim()) {
    return res.status(400).json({ ok: false, error: '请填写昵称' });
  }
  if (!content?.trim()) {
    return res.status(400).json({ ok: false, error: '留言内容不能为空' });
  }
  if (nickname.trim().length > 20) {
    return res.status(400).json({ ok: false, error: '昵称不超过 20 个字' });
  }
  if (content.trim().length > 500) {
    return res.status(400).json({ ok: false, error: '留言不超过 500 个字' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO messages (nickname, content) VALUES (?, ?)'
    );
    const result = stmt.run(nickname.trim(), content.trim());
    const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ok: true, data: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '服务器错误' });
  }
});

// ─── 管理员：访问此 URL 直接删除留言 ──────────────────────────────────
app.get(`/admin/${ADMIN_SECRET}/delete/:id`, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).send('❌ 无效的 ID');
  }

  try {
    const row = db.prepare('SELECT id, nickname, content FROM messages WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).send('❌ 留言不存在（可能已删除）');
    }
    db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    res.send(`
      <html><head><meta charset="utf-8">
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9f9f7}
      .box{text-align:center;padding:2rem 3rem;border-radius:12px;background:#fff;box-shadow:0 2px 20px rgba(0,0,0,.06)}
      h2{color:#6b8cb8;margin-bottom:.5rem}p{color:#666;font-size:.9rem}a{color:#9b8ec4;text-decoration:none}
      </style></head><body>
      <div class="box">
        <h2>✓ 留言已删除</h2>
        <p>来自 <strong>${escapeHtml(row.nickname)}</strong> 的留言已被移除。</p>
        <br><a href="/">← 返回留言板</a>
      </div>
      </body></html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 服务器错误');
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 启动 ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✦ 留言板已启动');
  console.log(`  ✦ 访问地址：http://localhost:${PORT}`);
  console.log(`  ✦ 删除留言：http://localhost:${PORT}/admin/${ADMIN_SECRET}/delete/<留言ID>`);
  console.log('');
});
