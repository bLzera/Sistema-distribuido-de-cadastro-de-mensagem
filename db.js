const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SEED = [
  'o silêncio também é uma forma de fala',
  'se isso aparecer pra você hoje, respira fundo',
  'código é poema com restrições mais severas',
  'ninguém te pediu pra ser produtivo o tempo todo',
  'a melhor parte do café é o cheiro',
  'errar de novo, errar melhor',
  'lembrar é um ato político',
  'às vezes a resposta é dormir oito horas',
  'tudo que importa é feito devagar',
  'alguém em algum lugar está lendo isso pela primeira vez',
  'o que parece ruído pode ser sinal mal sintonizado',
  'guardar segredo é um trabalho cansativo',
  'a gentileza é uma tecnologia subutilizada',
  'se ficou difícil, você está aprendendo',
  'anota essa: ninguém sabe o que está fazendo',
  'o domingo à tarde tem gosto de eternidade',
  'um abraço bem dado dura mais que parece',
  'voltar pra casa é a viagem mais subestimada',
  'escreva mesmo que ninguém leia',
  'a internet é grande e a gente é pequeno',
];

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL PRIMARY KEY,
      text       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM messages');
  if (parseInt(rows[0].count) === 0) {
    for (const text of SEED) {
      await pool.query('INSERT INTO messages (text) VALUES ($1)', [text]);
    }
  }
}

module.exports = { pool, init };
