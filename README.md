# Site institucional Logos4Turismo

Site da Logos4Turismo, empresa do grupo Logos Tecnologias que cuida do digital de agências de turismo: marketing, sites, sistemas e automação.

Site estático: HTML, CSS e JavaScript puros, sem build e sem dependências. Para ver, abra `index.html` no navegador. A única parte com servidor é o salvamento das respostas do teste (ver abaixo).

## Estrutura

- `index.html`: página inicial
- `privacidade.html`: política de privacidade (LGPD)
- `assets/css/style.css`: estilos. A paleta da marca está em variáveis no `:root`
- `assets/js/main.js`: interações (menu lateral, abas dos 4 caminhos, notificações animadas, teste da alta temporada, perguntas frequentes e links de WhatsApp)
- `assets/img/`: imagem de compartilhamento (`og.png`) e capturas do site de exemplo (`case/`)
- `marca/`: símbolo D2 e paleta
- `api/`: worker que grava as respostas do teste (`worker.js`) e a tabela do banco (`schema.sql`)

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

## Respostas do teste

Cada teste terminado é gravado, de forma anônima, no banco D1 `logos4turismo-teste`: respostas (`101100`, 1 = sim, na ordem das perguntas do `main.js`), pontuação, origem (`hero`, `link` ou `pagina`), UTMs, referrer, se era celular e se a pessoa clicou no WhatsApp depois. Não há nome nem telefone.

Para consultar:

```
npx wrangler d1 execute logos4turismo-teste --remote --command "SELECT * FROM testes ORDER BY criado_em DESC LIMIT 50"
```

Ou pelo painel da Cloudflare, em Storage & Databases > D1. Se mudar a ordem ou a quantidade de perguntas do teste, ajuste também `api/worker.js` e lembre que as respostas antigas seguem a ordem anterior.

## Medição

Quando o GA4 e o Pixel da Meta forem instalados, o clique no WhatsApp já dispara `whatsapp_click` (GA4) e `Contact` (Pixel).
