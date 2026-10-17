// Logos4Turismo · interações da home
(() => {
  const WA_NUM = '5598981651527';
  const WA_MSG = 'Olá! Vim pelo site da Logos4Turismo e quero conversar sobre minha agência.';
  const waUrl = `https://wa.me/${WA_NUM}?text=${encodeURIComponent(WA_MSG)}`;

  // todos os links de WhatsApp com a mensagem pronta
  document.querySelectorAll('[data-wa]').forEach((a) => {
    // botão pode ter mensagem própria em data-wa-msg
    a.href = a.dataset.waMsg ? `https://wa.me/${WA_NUM}?text=${encodeURIComponent(a.dataset.waMsg)}` : waUrl;
    a.addEventListener('click', () => {
      // evento pra GA4 / Pixel, quando forem instalados
      if (typeof window.gtag === 'function') window.gtag('event', 'whatsapp_click');
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact');
    });
  });

  // ---------- medição anônima: visitas, tempo e rolagem (gravadas por api/worker.js) ----------
  const novoId = () => (crypto.randomUUID ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));
  const envia = (rota, dados) => {
    try {
      fetch(`/api/${rota}`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) }).catch(() => {});
    } catch (e) { /* o site funciona mesmo sem salvar */ }
  };
  const params = new URLSearchParams(location.search);
  const celular = matchMedia('(max-width: 859px)').matches;
  const utm = { utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'), utm_campaign: params.get('utm_campaign') };
  const visita = { id: novoId(), tempo: 0, scroll: 0, secao: 0 };
  // não mede o arquivo aberto direto do disco nem robôs de teste
  const mede = /^https?:$/.test(location.protocol) && !navigator.webdriver;
  if (mede) {
    // seções da home na ordem da página; a lista de nomes fica no worker (SECOES)
    const secoes = [...document.querySelectorAll('#conteudo > section')];
    let visivelDesde = document.visibilityState === 'visible' ? performance.now() : null;
    let acumulado = 0;
    const tempo = () => Math.round((acumulado + (visivelDesde === null ? 0 : performance.now() - visivelDesde)) / 1000);
    let agendado = false;
    const mediRolagem = () => {
      agendado = false;
      const alto = document.documentElement.scrollHeight - innerHeight;
      const pct = alto > 0 ? Math.round((scrollY / alto) * 100) : 100;
      if (pct > visita.scroll) visita.scroll = Math.min(100, pct);
      secoes.forEach((sec, i) => { if (i > visita.secao && sec.getBoundingClientRect().top < innerHeight * 0.6) visita.secao = i; });
    };
    addEventListener('scroll', () => { if (!agendado) { agendado = true; requestAnimationFrame(mediRolagem); } }, { passive: true });
    const manda = () => envia('visita', { ...visita, tempo: tempo(), pagina: location.pathname, referrer: document.referrer, celular, ...utm });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (visivelDesde !== null) { acumulado += performance.now() - visivelDesde; visivelDesde = null; }
        manda();
      } else {
        visivelDesde = performance.now();
      }
    });
    addEventListener('pagehide', manda);
    manda();
  }

  // header com borda ao rolar
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // menu lateral
  const btn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawer');
  if (btn && drawer) {
    const panel = drawer.querySelector('.drawer__panel');
    const focaveis = () => [...panel.querySelectorAll('a, button')];
    let fechando;
    const abre = () => {
      clearTimeout(fechando);
      drawer.hidden = false;
      document.body.classList.add('menu-aberto');
      btn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('is-open')));
      setTimeout(() => panel.querySelector('.drawer__close').focus(), 50);
    };
    const fecha = (devolveFoco = true) => {
      drawer.classList.remove('is-open');
      document.body.classList.remove('menu-aberto');
      btn.setAttribute('aria-expanded', 'false');
      fechando = setTimeout(() => { drawer.hidden = true; }, 400);
      if (devolveFoco) btn.focus();
    };
    btn.addEventListener('click', abre);
    drawer.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => fecha()));
    drawer.querySelectorAll('.drawer__nav a').forEach((a) => a.addEventListener('click', () => fecha(false)));
    document.addEventListener('keydown', (e) => {
      if (drawer.hidden) return;
      if (e.key === 'Escape') fecha();
      if (e.key === 'Tab') { // mantém o foco dentro do menu
        const f = focaveis(); const primeiro = f[0]; const ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    });
    // se a tela crescer com o menu aberto (girar o tablet), fecha
    window.matchMedia('(min-width: 860px)').addEventListener('change', (m) => { if (m.matches && !drawer.hidden) fecha(false); });
  }

  // conversa do hero
  const chat = document.getElementById('chat');
  if (chat) setTimeout(() => chat.classList.add('is-play'), 500);

  // "O dia a dia": as notificações chegam uma por uma, a mais nova no topo
  const lista = document.getElementById('notifs');
  if (lista) {
    const itens = [...lista.querySelectorAll('.notif')];
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const conts = [...lista.querySelectorAll('.cont, .badge')];
    const mostra = (n) => conts.forEach((c) => { c.textContent = n; });
    let n = 47;

    // reserva a altura final pra página não pular enquanto elas chegam
    const reserva = () => {
      lista.style.minHeight = '';
      const antes = itens.map((i) => i.classList.contains('chegou'));
      itens.forEach((i) => { i.style.transition = 'none'; i.classList.add('chegou'); });
      lista.style.minHeight = `${lista.offsetHeight}px`;
      itens.forEach((i, k) => { i.classList.toggle('chegou', antes[k]); });
      lista.offsetHeight; // aplica antes de devolver a transição
      itens.forEach((i) => { i.style.transition = ''; });
    };

    const contaAte = (alvo, ms) => {
      const t0 = performance.now();
      const passo = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        mostra(Math.max(1, Math.round(alvo * (1 - Math.pow(1 - k, 3)))));
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };

    const chegam = () => {
      // de baixo pra cima: a última a chegar (WhatsApp) fica no topo, como no celular
      [...itens].reverse().forEach((item, k) => {
        setTimeout(() => {
          item.classList.add('chegou');
          if (item === itens[0]) contaAte(47, 1400);
        }, 250 + k * 850);
      });
      // depois disso, o WhatsApp continua recebendo mensagem enquanto a seção está na tela
      let visivel = true;
      new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(lista);
      setTimeout(() => setInterval(() => {
        if (!visivel || n >= 99) return;
        n += 1; mostra(n);
        lista.querySelectorAll('.badge').forEach((b) => { b.classList.remove('pula'); b.offsetWidth; b.classList.add('pula'); });
      }, 3500), 250 + itens.length * 850 + 1500);
    };

    if (reduz || !('IntersectionObserver' in window)) {
      itens.forEach((i) => i.classList.add('chegou'));
    } else {
      reserva();
      if (document.fonts) document.fonts.ready.then(reserva); // a fonte muda a quebra das linhas
      window.addEventListener('resize', reserva);
      mostra(0);
      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        chegam();
      }, { threshold: 0.35 });
      obs.observe(lista);
    }
  }

  // teste "Sua agência está pronta para a alta temporada?"
  const quiz = document.getElementById('quiz');
  if (quiz) {
    const perguntas = [
      { q: 'Quem chama sua agência às 23h recebe resposta na hora?', c: 'Automação', r: 'Resposta automática no WhatsApp, pra ninguém esperar até de manhã.' },
      { q: 'Seus pacotes aparecem no Google quando alguém pesquisa o destino?', c: 'Sites', r: 'Um site com uma página por roteiro, pra sua agência ser achada no Google.' },
      { q: 'Seu Instagram já tem posts planejados para as semanas antes do pico?', c: 'Marketing', r: 'Calendário de conteúdo pronto antes da temporada.' },
      { q: 'Você sabe quantas vagas tem em cada saída sem abrir a planilha?', c: 'Sistemas', r: 'Saídas, vagas e clientes num lugar só.' },
      { q: 'O cliente recebe confirmação e lembrete do passeio sem você mandar na mão?', c: 'Automação', r: 'Confirmação e lembrete automáticos para o cliente.' },
      { q: 'Você começa a anunciar antes do pico, e não quando ele já chegou?', c: 'Marketing', r: 'Anúncios no ar antes da procura subir.' },
    ];
    const faixas = [
      { min: 6, t: 'Sua agência está bem preparada.', d: 'Dá pra ir além e vender mais na mesma temporada. Bora ver onde?' },
      { min: 4, t: 'Quase lá.', d: 'Faltam poucos ajustes, mas eles costumam ser justamente onde a venda escapa no pico.' },
      { min: 2, t: 'Dá pra perder venda nessa temporada.', d: 'Alguns pontos importantes ainda dependem só de você. É aí que o cliente fecha com outra agência.' },
      { min: 0, t: 'A alta temporada vai pesar.', d: 'Hoje quase tudo passa pelas suas mãos. Dá pra mudar isso antes do pico, começando pelo mais urgente.' },
    ];
    let resp = [];
    // respostas vão anônimas para o banco (api/worker.js): sem nome, sem telefone
    let origem = location.hash === '#teste' ? 'link' : 'pagina';
    document.querySelectorAll('[data-teste]').forEach((a) => a.addEventListener('click', () => { origem = 'hero'; }));
    const foca = () => { const b = quiz.querySelector('.quiz__opt, .quiz__end .btn'); if (b) b.focus({ preventScroll: true }); };
    const passo = () => {
      const i = resp.length;
      if (i === perguntas.length) { resultado(); return; }
      quiz.innerHTML = `<div class="quiz__step">
        <div class="quiz__prog"><span>Pergunta ${i + 1} de ${perguntas.length}</span><span class="quiz__bar"><i style="width:${(i / perguntas.length) * 100}%"></i></span></div>
        <p class="quiz__q">${perguntas[i].q}</p>
        <div class="quiz__opts"><button class="quiz__opt" data-r="1">Sim</button><button class="quiz__opt" data-r="0">Não</button></div>
        ${i ? '<button class="quiz__back">Voltar</button>' : ''}
      </div>`;
      quiz.querySelectorAll('.quiz__opt').forEach((b) => b.addEventListener('click', () => { resp.push(b.dataset.r === '1'); passo(); foca(); }));
      const v = quiz.querySelector('.quiz__back');
      if (v) v.addEventListener('click', () => { resp.pop(); passo(); foca(); });
    };
    const resultado = () => {
      const pontos = resp.filter(Boolean).length;
      const id = novoId();
      if (mede) {
        envia('teste', {
          id, origem, respostas: resp.map((r) => (r ? '1' : '0')).join(''),
          referrer: document.referrer, celular, visita: visita.id, ...utm,
        });
      }
      const f = faixas.find((x) => pontos >= x.min);
      const falhas = perguntas.filter((_, k) => !resp[k]);
      const caminhos = [...new Set(falhas.map((p) => p.c))];
      const msg = `Olá! Fiz o teste no site da Logos4Turismo e minha agência fez ${pontos} de ${perguntas.length}.`
        + (caminhos.length ? ` Quero ajuda com: ${caminhos.join(', ')}.` : ' Quero ver como vender mais na temporada.');
      const url = `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
      const wa = document.querySelector('.ico--wa');
      quiz.innerHTML = `<div class="quiz__step">
        <p class="quiz__score"><b>${pontos}</b> de ${perguntas.length}</p>
        <p class="quiz__res">${f.t}</p>
        <p class="quiz__txt">${f.d}</p>
        ${falhas.length ? `<ul class="quiz__recs">${falhas.slice(0, 3).map((p) => `<li><small>${p.c}</small>${p.r}</li>`).join('')}</ul>` : '<div style="height:24px"></div>'}
        <div class="quiz__end">
          <a class="btn btn--sol btn--lg" href="${url}" target="_blank" rel="noopener">${wa ? wa.outerHTML : ''} Quero resolver isso</a>
          <button class="quiz__back">Refazer o teste</button>
        </div>
      </div>`;
      quiz.querySelector('.quiz__end .btn').addEventListener('click', () => {
        if (mede) envia('teste/whatsapp', { id });
        if (typeof window.gtag === 'function') window.gtag('event', 'whatsapp_click', { origem: 'teste', pontos });
        if (typeof window.fbq === 'function') window.fbq('track', 'Contact');
      });
      quiz.querySelector('.quiz__back').addEventListener('click', () => { resp = []; passo(); foca(); });
    };
    passo();
  }

  // barras do gráfico do ano entram em cascata
  document.querySelectorAll('.ano__bars span').forEach((s, i) => s.style.setProperty('--i', i));

  // abas dos 4 caminhos
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const ativa = (i, foco) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
      panels[j].classList.toggle('is-in', on);
    });
    if (foco) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => ativa(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') ativa((i + 1) % tabs.length, true);
      if (e.key === 'ArrowLeft') ativa((i - 1 + tabs.length) % tabs.length, true);
    });
  });
  if (tabs.length) ativa(0);

  // entrada no scroll, em cascata dentro de cada grupo
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const irmaos = [...en.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
        en.target.style.transitionDelay = `${Math.min(irmaos.indexOf(en.target), 5) * 80}ms`;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  // FAQ: uma resposta aberta por vez
  const qas = document.querySelectorAll('.qa');
  qas.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) qas.forEach((o) => { if (o !== d) o.open = false; });
  }));

  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
