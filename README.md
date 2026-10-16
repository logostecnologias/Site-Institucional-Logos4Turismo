# Site institucional Logos4Turismo

Site da Logos4Turismo, empresa do grupo Logos Tecnologias que cuida do digital de agências de turismo: marketing, sites, sistemas e automação.

Site estático: HTML, CSS e JavaScript puros, sem build e sem dependências. Para ver, abra `index.html` no navegador.

## Estrutura

- `index.html`: página inicial
- `privacidade.html`: política de privacidade (LGPD)
- `assets/css/style.css`: estilos. A paleta da marca está em variáveis no `:root`
- `assets/js/main.js`: interações (menu lateral, abas dos 4 caminhos, notificações animadas, teste da alta temporada, perguntas frequentes e links de WhatsApp)
- `assets/img/`: imagem de compartilhamento (`og.png`) e capturas do site de exemplo (`case/`)
- `marca/`: símbolo D2 e paleta

As telas de exemplo (WhatsApp, site, painel, automação) são feitas em HTML e CSS, sem imagem: edite direto no `index.html`.

## WhatsApp

O número e a mensagem padrão ficam no topo de `assets/js/main.js` (`WA_NUM` e `WA_MSG`). Todo link com o atributo `data-wa` recebe o link do WhatsApp; um botão pode ter mensagem própria com `data-wa-msg="..."`.

## Publicar em 4turismo.logostecnologias.com

1. Conectar este repositório na Vercel, Netlify ou Cloudflare Pages (sem comando de build; pasta de saída = raiz). Também funciona no GitHub Pages.
2. No DNS de `logostecnologias.com`, criar um registro `CNAME` `4turismo` apontando para o endereço que a hospedagem indicar.

## Medição

Quando o GA4 e o Pixel da Meta forem instalados, o clique no WhatsApp já dispara `whatsapp_click` (GA4) e `Contact` (Pixel).
