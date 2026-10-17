// Logos4Turismo · Worker do site
// Serve os arquivos estáticos, grava visitas e respostas do teste no D1 e entrega o painel.
// Só /api/* e /painel* passam por aqui antes dos assets (run_worker_first no wrangler.jsonc).
//
// Segredos (wrangler secret put):
//   VISITA_SAL     texto aleatório usado no hash diário do visitante (o IP nunca é gravado)
//   ACCESS_EQUIPE  domínio do Cloudflare Access, ex.: https://logos.cloudflareaccess.com
//   ACCESS_AUD     "Application Audience (AUD) Tag" do app do painel no Access
// Sem ACCESS_EQUIPE e ACCESS_AUD o painel fica fechado.

const ID = /^[0-9a-f-]{36}$/;
const RESPOSTAS = /^[01]{6}$/;
const ORIGENS = ['hero', 'link', 'pagina'];

// mesmas 6 perguntas, na mesma ordem do teste em assets/js/main.js
const PERGUNTAS = [
  { curta: 'Responde às 23h', area: 'Automação', venda: 'atendimento automático no WhatsApp, com valores e roteiros respondidos fora do horário' },
  { curta: 'Aparece no Google', area: 'Sites', venda: 'site com uma página por roteiro, pensado pra ser achado no Google' },
  { curta: 'Instagram planejado', area: 'Marketing', venda: 'calendário de conteúdo para as semanas antes do pico' },
  { curta: 'Vagas sem planilha', area: 'Sistemas', venda: 'sistema de saídas, vagas e clientes no lugar da planilha' },
  { curta: 'Confirmação automática', area: 'Automação', venda: 'confirmação e lembrete do passeio enviados sozinhos' },
  { curta: 'Anuncia antes do pico', area: 'Marketing', venda: 'campanha de anúncios no ar antes da procura subir' },
];

// seções da home, na ordem da página (o main.js manda o índice da mais funda que a pessoa viu)
const SECOES = ['Topo', 'Problema', 'O que fazemos', 'Trabalhos', 'Como funciona', 'Alta temporada', 'Teste', 'Por que a gente', 'Perguntas', 'Chamada final'];

const texto = (v, max) => (typeof v === 'string' && v ? v.slice(0, max) : null);
const inteiro = (v, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null);
const vazio = (status) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

// o que oferecer para quem respondeu o teste
function sugestao(respostas) {
  const falhas = PERGUNTAS.filter((_, i) => respostas[i] === '0');
  if (!falhas.length) return 'Já tem o básico rodando. Conversa de crescimento: mais anúncios e conteúdo para vender mais na mesma temporada.';
  // área com mais "não" vem primeiro; empate fica na ordem das perguntas
  const conta = {};
  falhas.forEach((p) => { conta[p.area] = (conta[p.area] || 0) + 1; });
  const areas = Object.keys(conta).sort((a, b) => conta[b] - conta[a]);
  const principal = falhas.filter((p) => p.area === areas[0]);
  const tom = falhas.length >= 5 ? 'Quase tudo é manual: proposta completa, começando por'
    : falhas.length >= 3 ? 'Várias lacunas. Começar por'
      : 'Ajuste pontual. Oferecer';
  let s = `${tom} ${areas[0]}: ${principal.map((p) => p.venda).join('; ')}.`;
  if (areas.length > 1) s += ` Depois: ${areas.slice(1).join(', ')}.`;
  return s;
}

// ---------- Cloudflare Access: confere o token que o Access põe na requisição ----------
let chaves = null;
const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
async function autorizado(request, env) {
  // só no wrangler dev da máquina: PAINEL_LOCAL=1 fica no .dev.vars, que não vai para o ar (nunca crie esse segredo em produção)
  if (env.PAINEL_LOCAL === '1') return true;
  if (!env.ACCESS_EQUIPE || !env.ACCESS_AUD) return false;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return false;
  try {
    const [h, p, sig] = token.split('.');
    const cab = JSON.parse(new TextDecoder().decode(b64url(h)));
    const dados = JSON.parse(new TextDecoder().decode(b64url(p)));
    const equipe = env.ACCESS_EQUIPE.replace(/\/$/, '');
    const aud = Array.isArray(dados.aud) ? dados.aud : [dados.aud];
    if (dados.iss !== equipe || !aud.includes(env.ACCESS_AUD) || dados.exp * 1000 < Date.now()) return false;
    if (!chaves || !chaves.find((k) => k.kid === cab.kid)) {
      chaves = (await (await fetch(`${equipe}/cdn-cgi/access/certs`)).json()).keys;
    }
    const jwk = chaves.find((k) => k.kid === cab.kid);
    if (!jwk) return false;
    const chave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chave, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  } catch {
    return false;
  }
}

// mesmo visitante no mesmo dia = mesmo código; no dia seguinte o código muda e não dá pra ligar os dois
async function visitante(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  const dia = new Date().toISOString().slice(0, 10);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.VISITA_SAL || ''}|${dia}|${ip}|${ua}`));
  return [...new Uint8Array(bytes).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function painel(url, env) {
  const dias = [7, 30, 90].includes(Number(url.searchParams.get('dias'))) ? Number(url.searchParams.get('dias')) : 30;
  const desde = `-${dias - 1} days`;
  const db = env.DB;
  const [resumo, porDia, secoes, testes, origens] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS visitas, COUNT(DISTINCT date(criado_em) || visitante) AS pessoas,
                  ROUND(AVG(tempo_s)) AS tempo_medio, ROUND(AVG(scroll_pct)) AS scroll_medio
                FROM visitas WHERE date(criado_em) >= date('now', ?)`).bind(desde),
    db.prepare(`SELECT date(criado_em) AS dia, COUNT(*) AS visitas, COUNT(DISTINCT visitante) AS pessoas
                FROM visitas WHERE date(criado_em) >= date('now', ?) GROUP BY dia ORDER BY dia`).bind(desde),
    db.prepare(`SELECT secao, COUNT(*) AS n FROM visitas WHERE date(criado_em) >= date('now', ?) GROUP BY secao`).bind(desde),
    db.prepare(`SELECT t.id, t.criado_em, t.respostas, t.pontos, t.origem, t.utm_source, t.utm_campaign, t.celular,
                  t.whatsapp, v.tempo_s
                FROM testes t LEFT JOIN visitas v ON v.id = t.visita
                WHERE date(t.criado_em) >= date('now', ?) ORDER BY t.criado_em DESC LIMIT 300`).bind(desde),
    db.prepare(`SELECT utm_source, referrer, COUNT(*) AS n FROM visitas
                WHERE date(criado_em) >= date('now', ?) GROUP BY utm_source, referrer ORDER BY n DESC LIMIT 1000`).bind(desde),
  ]);

  // quantas visitas chegaram pelo menos até cada seção
  const porSecao = Object.fromEntries(secoes.results.map((r) => [r.secao, r.n]));
  let acumulado = 0;
  const funil = SECOES.map((nome, i) => ({ nome, i })).reverse().map(({ nome, i }) => {
    acumulado += porSecao[i] || 0;
    return { nome, visitas: acumulado };
  }).reverse();

  // de onde vieram: UTM quando tem, senão o domínio que mandou a visita
  const fontes = {};
  origens.results.forEach((r) => {
    let f = r.utm_source;
    if (!f) {
      try { f = new URL(r.referrer).hostname.replace(/^www\./, ''); } catch { f = ''; }
      if (!f || f === url.hostname) f = 'direto';
    }
    fontes[f] = (fontes[f] || 0) + r.n;
  });

  return Response.json({
    dias,
    resumo: resumo.results[0],
    porDia: porDia.results,
    funil,
    origens: Object.entries(fontes).map(([fonte, n]) => ({ fonte, n })).sort((a, b) => b.n - a.n).slice(0, 8),
    perguntas: PERGUNTAS.map((p) => ({ curta: p.curta, area: p.area })),
    testes: testes.results.map((t) => ({ ...t, sugestao: sugestao(t.respostas) })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/painel') || url.pathname.startsWith('/api/painel')) {
      if (!(await autorizado(request, env))) {
        return new Response('Painel fechado. Ele abre depois que o Cloudflare Access estiver configurado (ver README).', {
          status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      if (url.pathname.startsWith('/api/painel')) return painel(url, env);
      const r = await env.ASSETS.fetch(request);
      const resp = new Response(r.body, r);
      resp.headers.set('X-Robots-Tag', 'noindex, nofollow');
      resp.headers.set('Cache-Control', 'no-store');
      return resp;
    }

    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (request.method !== 'POST') return vazio(405);
    // só aceita envio do próprio site
    if (request.headers.get('Origin') !== url.origin) return vazio(403);

    let d;
    try {
      const corpo = await request.text();
      if (corpo.length > 2000) return vazio(413);
      d = JSON.parse(corpo);
    } catch {
      return vazio(400);
    }
    if (!d || !ID.test(d.id)) return vazio(400);

    if (url.pathname === '/api/visita') {
      // a primeira chamada cria a visita; as seguintes só aumentam tempo e rolagem
      const tempo = inteiro(d.tempo, 0, 3600) ?? 0;
      const scroll = inteiro(d.scroll, 0, 100) ?? 0;
      const secao = inteiro(d.secao, 0, SECOES.length - 1) ?? 0;
      await env.DB.prepare(
        `INSERT INTO visitas (id, visitante, pagina, tempo_s, scroll_pct, secao, utm_source, utm_medium, utm_campaign, referrer, celular)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           tempo_s = max(tempo_s, excluded.tempo_s),
           scroll_pct = max(scroll_pct, excluded.scroll_pct),
           secao = max(secao, excluded.secao)`
      ).bind(
        d.id, await visitante(request, env), texto(d.pagina, 100) || '/',
        tempo, scroll, secao,
        texto(d.utm_source, 100), texto(d.utm_medium, 100), texto(d.utm_campaign, 150),
        texto(d.referrer, 300), d.celular ? 1 : 0,
      ).run();
      return vazio(204);
    }

    if (url.pathname === '/api/teste') {
      if (!RESPOSTAS.test(d.respostas)) return vazio(400);
      const pontos = [...d.respostas].filter((r) => r === '1').length;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO testes (id, respostas, pontos, origem, utm_source, utm_medium, utm_campaign, referrer, celular, visita)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        d.id, d.respostas, pontos,
        ORIGENS.includes(d.origem) ? d.origem : null,
        texto(d.utm_source, 100), texto(d.utm_medium, 100), texto(d.utm_campaign, 150),
        texto(d.referrer, 300),
        d.celular ? 1 : 0,
        ID.test(d.visita) ? d.visita : null,
      ).run();
      return vazio(204);
    }

    if (url.pathname === '/api/teste/whatsapp') {
      await env.DB.prepare(
        `UPDATE testes SET whatsapp = 1, whatsapp_em = datetime('now') WHERE id = ? AND whatsapp = 0`
      ).bind(d.id).run();
      return vazio(204);
    }

    return vazio(404);
  },
};
