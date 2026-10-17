# SEO-PLANO: 4turismo.logostecnologias.com

Plano vivo de ranqueamento (Google + IAs). Atualizado a cada sessão de /seo-ranking.
Estratégia (o porquê): ver playbook.md da skill seo-ranking-ratos.
Documento interno: `*.md` está no `.assetsignore` e não vai para o ar.

## Norte
Ser encontrado por **dono de agência de turismo do Maranhão** que procura ajuda com o digital, no Google e quando pergunta pra uma IA.
Queries-alvo:
- marketing para agência de turismo (São Luís / Maranhão)
- site para agência de turismo
- sistema de reservas para agência de turismo
- automação de WhatsApp para agência de turismo
- como vender mais pacotes na alta temporada / como atender clientes no WhatsApp fora do horário

Métrica que importa: conversas no WhatsApp vindas da busca orgânica (o painel já registra visitas).

## Estado da fundação técnica (auditado em 2026-10-17)
**Pilar 1, técnico**
- robots.txt, sitemap.xml e llms.txt davam **404** no ar → criados nesta sessão (falta deploy).
- JSON-LD: tinha Organization + FAQPage → ampliado para WebSite + Organization/ProfessionalService (cidade, sameAs, 4 serviços em OfferCatalog) + FAQPage.
- Meta title/description, canonical e OG ok. `lang="pt-BR"` ok.
- painel.html: noindex + Access. privacidade.html: noindex. Ok.
- Conteúdo é HTML legível (não depende de JS), menos o teste de 6 perguntas (ok, é interação).
- Site de **uma página só**: não há URL própria pra nenhum dos 4 serviços nem pra nenhuma pergunta.
- Subdomínio de logostecnologias.com: herda parte da autoridade do domínio, mas só se o site principal linkar pra cá.

**Pilar 2, conteúdo**
- Copy boa pra conversão, fraca pra busca: H2 são frases de efeito ("Quatro caminhos. Uma equipe só."), não perguntas que alguém digita.
- Nenhum conteúdo de cauda longa (temporada, WhatsApp, Google pra agência).

**Pilar 3, autoridade**
- **logostecnologias.com não tem nenhum link pro 4turismo** (verificado no HTML da home).
- Sem Google Business Profile, sem diretórios, sem menções. Instagram @logos4turismo existe.
- ExploraMiq (cliente) não linka de volta ("site feito por").

**Pilar 4, medição**
- GSC e Bing Webmaster: não verificados (gap).
- DataForSEO desligado → visibilidade em IA em modo manual.

## Citability Score (média do site: 41/100)
| Página | Score | Maior gap |
|--------|-------|-----------|
| / | 41 | sem dados concretos nem autoria; H2 não são perguntas; um só URL pros 4 serviços |

Rubrica (/ ): dado 3 · front-loading 8 · fonte 2 · autoria/EEAT 4 · definição 6 · schema 11 (era 8) · estrutura 7.

## Baseline (1ª medição)
- Tráfego orgânico/mês: ? (ver painel interno / GSC depois de verificar)
- Keywords/impressões (GSC): GSC não conectado
- Aparece nas IAs pras queries-alvo? não medido. Site novo (out/2026): expectativa é 0/N.

## Backlog (P0 = faz primeiro)
Cada item traz a falsificabilidade: "como saberíamos que falhou?"
### P0
- [ ] Verificar o domínio no Google Search Console e no Bing Webmaster, enviar o sitemap (o dono faz, com a conta dele) · _falha se:_ em 14 dias a home não aparecer como "indexada" no GSC
- [ ] Acompanhar: o GSC mostra logostecnologias.com em "Links externos" · _falha se:_ não aparecer em 30 dias (link publicado em 2026-10-17)
### P1
- [ ] Uma página por serviço: /marketing-para-agencia-de-turismo, /site-para-agencia-de-turismo, /sistema-de-reservas-turismo, /automacao-whatsapp-agencia-de-turismo (H2 = pergunta, resposta direta, FAQ própria, Service schema) · _falha se:_ em 60 dias nenhuma tiver impressão no GSC pra query com "agência de turismo"
- [ ] Reescrever os H2/FAQ da home com perguntas reais de dono de agência, sem perder o tom da copy · _falha se:_ Citability da home não passar de 55
- [ ] Google Business Profile da Logos4Turismo (São Luís, categoria "Agência de marketing") · _falha se:_ não aparecer no Maps buscando "Logos4Turismo"
- [ ] Pedir à ExploraMiq um "site por Logos4Turismo / grupo Logos" no rodapé · _falha se:_ link não aparecer no GSC
- [ ] Rodar ai-visibility em modo manual (dry-run) pra baseline nas IAs · _falha se:_ não houver baseline registrado até a próxima sessão
### P2
- [ ] Artigo "Como preparar a agência para a alta temporada no Maranhão" (julho/dezembro/janeiro), com dados públicos de turismo do MA (SETUR, IBGE, ICMBio) · _falha se:_ sem impressão em 90 dias
- [ ] Artigo "Como responder cliente no WhatsApp às 23h sem perder venda" · _falha se:_ sem impressão em 90 dias
- [ ] Bloco de autoria/EEAT: quem é a equipe, foto, anos de mercado do grupo · _falha se:_ Citability autoria continuar ≤ 4
- [ ] Definir concorrentes (agências de marketing para turismo) pra medir share of voice

## Feito
- [x] (2026-10-17) Seed audit dos 4 pilares — plano criado
- [x] (2026-10-17) robots.txt (libera buscadores e bots de IA, bloqueia /painel e /api), sitemap.xml e llms.txt criados
- [x] (2026-10-17) JSON-LD ampliado: WebSite, ProfessionalService com cidade, sameAs e 4 serviços; validado (JSON ok, `wrangler deploy --dry-run` ok)
- [x] (2026-10-17) Deploy: robots.txt, sitemap.xml e llms.txt respondendo 200 no ar
- [x] (2026-10-17) logostecnologias.com publicado com link no rodapé ("Logos4Turismo: digital para agências de turismo"), subOrganization no schema e linha no llms.txt de lá

## Diário
- 2026-10-17: 1ª sessão. Site no ar desde out/2026 sem robots/sitemap/llms (todos 404) e sem nenhum link de entrada, nem do site da Logos. Corrigida a base técnica e o schema. Próximo passo de maior impacto: deploy + GSC/Bing + link do site principal; depois, páginas por serviço.
- 2026-10-17: deploy dos dois sites. O 4turismo agora tem o primeiro link de entrada, vindo do logostecnologias.com. Falta só o GSC/Bing (ação do dono) para fechar o P0.
