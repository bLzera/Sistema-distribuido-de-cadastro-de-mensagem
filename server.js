const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/messages/count', (_req, res) => {
  const { total } = db.prepare('SELECT COUNT(*) as total FROM messages').get();
  res.json({ total });
});

app.get('/api/messages/random', (req, res) => {
  const excludeId = req.query.exclude != null ? Number(req.query.exclude) : null;

  let msg = excludeId != null
    ? db.prepare('SELECT * FROM messages WHERE id != ? ORDER BY RANDOM() LIMIT 1').get(excludeId)
    : null;

  if (!msg) {
    msg = db.prepare('SELECT * FROM messages ORDER BY RANDOM() LIMIT 1').get();
  }

  if (!msg) return res.status(404).json({ error: 'no_messages' });

  const { total } = db.prepare('SELECT COUNT(*) as total FROM messages').get();
  res.json({ id: msg.id, text: msg.text, created_at: msg.created_at, total });
});

app.post('/api/messages', (req, res) => {
  const text = (req.body?.text ?? '').trim();

  if (!text) return res.status(400).json({ error: 'empty' });
  if (text.length > 280) return res.status(400).json({ error: 'too_long' });

  const { lastInsertRowid } = db.prepare('INSERT INTO messages (text) VALUES (?)').run(text);
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(lastInsertRowid);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM messages').get();

  res.status(201).json({ id: msg.id, text: msg.text, created_at: msg.created_at, total });
});

app.listen(PORT, () => console.log(`msg.sys running on http://localhost:${PORT}`));
