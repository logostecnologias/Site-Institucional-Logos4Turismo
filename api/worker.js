// Logos4Turismo · Worker do site
// Serve os arquivos estáticos e grava as respostas do teste da alta temporada no D1.
// Só /api/* passa por aqui antes dos assets (run_worker_first no wrangler.jsonc).

const ID = /^[0-9a-f-]{36}$/;
const RESPOSTAS = /^[01]{6}$/; // 6 perguntas, mesma ordem do main.js
const ORIGENS = ['hero', 'link', 'pagina'];

const texto = (v, max) => (typeof v === 'string' && v ? v.slice(0, max) : null);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (request.method !== 'POST') return new Response(null, { status: 405 });
    // só aceita envio do próprio site
    if (request.headers.get('Origin') !== url.origin) return new Response(null, { status: 403 });

    let d;
    try {
      const corpo = await request.text();
      if (corpo.length > 2000) return new Response(null, { status: 413 });
      d = JSON.parse(corpo);
    } catch {
      return new Response(null, { status: 400 });
    }
    if (!d || !ID.test(d.id)) return new Response(null, { status: 400 });

    if (url.pathname === '/api/teste') {
      if (!RESPOSTAS.test(d.respostas)) return new Response(null, { status: 400 });
      const pontos = [...d.respostas].filter((r) => r === '1').length;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO testes (id, respostas, pontos, origem, utm_source, utm_medium, utm_campaign, referrer, celular)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        d.id, d.respostas, pontos,
        ORIGENS.includes(d.origem) ? d.origem : null,
        texto(d.utm_source, 100), texto(d.utm_medium, 100), texto(d.utm_campaign, 150),
        texto(d.referrer, 300),
        d.celular ? 1 : 0,
      ).run();
      return new Response(null, { status: 204 });
    }

    if (url.pathname === '/api/teste/whatsapp') {
      await env.DB.prepare(
        `UPDATE testes SET whatsapp = 1, whatsapp_em = datetime('now') WHERE id = ? AND whatsapp = 0`
      ).bind(d.id).run();
      return new Response(null, { status: 204 });
    }

    return new Response(null, { status: 404 });
  },
};
