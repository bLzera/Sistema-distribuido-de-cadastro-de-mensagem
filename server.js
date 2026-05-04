const express = require('express');
const path = require('path');
const { pool, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/messages/count', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) AS total FROM messages');
    res.json({ total: parseInt(rows[0].total) });
  } catch {
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/messages/random', async (req, res) => {
  try {
    const excludeId = req.query.exclude != null ? Number(req.query.exclude) : null;

    let result = excludeId != null
      ? await pool.query('SELECT * FROM messages WHERE id != $1 ORDER BY RANDOM() LIMIT 1', [excludeId])
      : await pool.query('SELECT * FROM messages ORDER BY RANDOM() LIMIT 1');

    if (result.rows.length === 0 && excludeId != null) {
      result = await pool.query('SELECT * FROM messages ORDER BY RANDOM() LIMIT 1');
    }

    if (result.rows.length === 0) return res.status(404).json({ error: 'no_messages' });

    const msg = result.rows[0];
    const { rows } = await pool.query('SELECT COUNT(*) AS total FROM messages');
    res.json({ id: msg.id, text: msg.text, created_at: msg.created_at, total: parseInt(rows[0].total) });
  } catch {
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const text = (req.body?.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'empty' });
    if (text.length > 280) return res.status(400).json({ error: 'too_long' });

    const { rows: [msg] } = await pool.query(
      'INSERT INTO messages (text) VALUES ($1) RETURNING *',
      [text]
    );
    const { rows } = await pool.query('SELECT COUNT(*) AS total FROM messages');
    res.status(201).json({ id: msg.id, text: msg.text, created_at: msg.created_at, total: parseInt(rows[0].total) });
  } catch {
    res.status(500).json({ error: 'db_error' });
  }
});

init()
  .then(() => app.listen(PORT, () => console.log(`msg.sys running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('db init failed:', err); process.exit(1); });
