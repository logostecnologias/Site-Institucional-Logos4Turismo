-- Respostas do teste "Sua agência está pronta para a alta temporada?" (anônimo, sem dado pessoal)
CREATE TABLE IF NOT EXISTS testes (
  id           TEXT PRIMARY KEY,               -- gerado no navegador, um por teste terminado
  criado_em    TEXT NOT NULL DEFAULT (datetime('now')),
  respostas    TEXT NOT NULL,                  -- uma letra por pergunta, na ordem do main.js: 1 = sim, 0 = não
  pontos       INTEGER NOT NULL,
  origem       TEXT,                           -- 'hero' (botão do topo), 'link' (chegou com #teste) ou 'pagina' (rolou até ele)
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  referrer     TEXT,
  celular      INTEGER,                        -- 1 = tela de celular
  whatsapp     INTEGER NOT NULL DEFAULT 0,     -- 1 = clicou em "Quero resolver isso"
  whatsapp_em  TEXT
);
CREATE INDEX IF NOT EXISTS testes_criado_em ON testes (criado_em);
