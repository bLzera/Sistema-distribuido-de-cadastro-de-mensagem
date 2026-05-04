const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'messages.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    text       TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

const isEmpty = db.prepare('SELECT COUNT(*) as count FROM messages').get().count === 0;
if (isEmpty) {
  const insert = db.prepare('INSERT INTO messages (text) VALUES (?)');
  const seedAll = db.transaction((rows) => rows.forEach((t) => insert.run(t)));
  seedAll(SEED);
}

module.exports = db;
