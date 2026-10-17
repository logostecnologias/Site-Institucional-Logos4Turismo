-- Banco do site (D1 logos4turismo-teste). Tudo anônimo: sem nome, telefone, e-mail ou IP.

-- Respostas do teste "Sua agência está pronta para a alta temporada?"
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
  whatsapp_em  TEXT,
  visita       TEXT                            -- id da visita em que o teste foi feito
);
CREATE INDEX IF NOT EXISTS testes_criado_em ON testes (criado_em);

-- Uma linha por página aberta no site
CREATE TABLE IF NOT EXISTS visitas (
  id           TEXT PRIMARY KEY,               -- gerado no navegador a cada página aberta
  criado_em    TEXT NOT NULL DEFAULT (datetime('now')),
  visitante    TEXT,                           -- hash do dia (IP + navegador + segredo): conta pessoas no dia, muda todo dia
  pagina       TEXT,
  tempo_s      INTEGER NOT NULL DEFAULT 0,     -- segundos com a aba visível
  scroll_pct   INTEGER NOT NULL DEFAULT 0,     -- quanto da página rolou, de 0 a 100
  secao        INTEGER NOT NULL DEFAULT 0,     -- seção mais funda que viu (lista SECOES no worker.js)
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  referrer     TEXT,
  celular      INTEGER
);
CREATE INDEX IF NOT EXISTS visitas_criado_em ON visitas (criado_em);
