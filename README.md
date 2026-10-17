# Site institucional Logos4Turismo

Site da Logos4Turismo, empresa do grupo Logos Tecnologias que cuida do digital de agências de turismo: marketing, sites, sistemas e automação.

Site estático: HTML, CSS e JavaScript puros, sem build e sem dependências. Para ver, abra `index.html` no navegador. A única parte com servidor é a medição anônima e o painel (ver abaixo).

## Estrutura

- `index.html`: página inicial
- `privacidade.html`: política de privacidade (LGPD)
- `assets/css/style.css`: estilos. A paleta da marca está em variáveis no `:root`
- `assets/js/main.js`: interações (menu lateral, abas dos 4 caminhos, notificações animadas, teste da alta temporada, perguntas frequentes e links de WhatsApp)
- `assets/img/`: imagem de compartilhamento (`og.png`) e capturas do site de exemplo (`case/`)
- `marca/`: símbolo D2 e paleta
- `painel.html`: painel interno com visitas e respostas do teste (protegido pelo Cloudflare Access)
- `api/`: worker que grava visitas e respostas do teste e serve o painel (`worker.js`), e as tabelas do banco (`schema.sql`)

As telas de exemplo (WhatsApp, site, painel, automação) são feitas em HTML e CSS, sem imagem: edite direto no `index.html`.

## WhatsApp

O número e a mensagem padrão ficam no topo de `assets/js/main.js` (`WA_NUM` e `WA_MSG`). Todo link com o atributo `data-wa` recebe o link do WhatsApp; um botão pode ter mensagem própria com `data-wa-msg="..."`.

## Publicação (Cloudflare)

No ar em **https://4turismo.logostecnologias.com**, como Worker da Cloudflare só com arquivos estáticos (mesmo esquema do site da Logos Tecnologias). A configuração está em `wrangler.jsonc`; o subdomínio é um custom domain, e a Cloudflare cuida do DNS e do certificado.

Para publicar uma alteração:

```
npx wrangler deploy
```

O que não deve ir para o ar fica listado em `.assetsignore` (arquivos `.md`, configuração, `.git`).

## Medição própria e painel

Tudo fica no banco D1 `logos4turismo-teste`, sem nome, telefone, e-mail, IP nem cookie (tabelas em `api/schema.sql`):

- `visitas`: uma linha por abertura da home, com tempo de aba visível, rolagem (%), seção mais funda vista, UTMs, referrer e celular/computador. O campo `visitante` é um hash do dia (IP + navegador + segredo `VISITA_SAL`) que só serve para contar pessoas diferentes no mesmo dia.
- `testes`: cada teste terminado, com as respostas (`101100`, 1 = sim, na ordem das perguntas do `main.js`), pontuação, origem (`hero`, `link` ou `pagina`), UTMs e se a pessoa clicou no WhatsApp depois.

O painel fica em **https://4turismo.logostecnologias.com/painel** e mostra pessoas e visitas, tempo médio, rolagem, até onde rolaram, de onde vieram e cada teste com a sugestão do que oferecer. Ele só abre com o **Cloudflare Access** configurado; sem isso responde 403.

Para liberar o painel (uma vez, no painel da Cloudflare):

1. Zero Trust > Access > Applications > Add an application > Self-hosted.
2. Domínio `4turismo.logostecnologias.com`, caminhos `painel` e `api/painel` (dois destinos no mesmo app).
3. Política "Allow" com os e-mails de quem pode ver. Login por código no e-mail (One-time PIN).
4. Copie o "Application Audience (AUD) Tag" do app e o domínio da equipe (ex.: `https://logos.cloudflareaccess.com`) e grave como segredos:

```
npx wrangler secret put ACCESS_EQUIPE
npx wrangler secret put ACCESS_AUD
```

Para testar o painel na máquina: crie um `.dev.vars` com `PAINEL_LOCAL=1` e rode `npx wrangler dev` (esse arquivo não vai para o ar nem para o Git; nunca crie `PAINEL_LOCAL` em produção).

Consulta direta, sem o painel:

```
npx wrangler d1 execute logos4turismo-teste --remote --command "SELECT * FROM testes ORDER BY criado_em DESC LIMIT 50"
```

Se mudar a ordem ou a quantidade de perguntas do teste, ajuste também `PERGUNTAS` em `api/worker.js` (as respostas antigas seguem a ordem anterior). Se mudar as seções da home, ajuste `SECOES` no mesmo arquivo.

## Medição

Quando o GA4 e o Pixel da Meta forem instalados, o clique no WhatsApp já dispara `whatsapp_click` (GA4) e `Contact` (Pixel).
