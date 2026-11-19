# Arquitetura, decisões e limitações

## Estrutura

```
src/
  app/          providers, router, QueryClient, codec de search params
  components/   layout (Header, Footer, MobileTabBar...), shared (NftImage, Icon, FormField...), ui (shadcn temado)
  features/     auth, catalog, nft, cart, checkout, orders, account (perfil/carteiras), favorites, realtime
  lib/          api (client Axios, contracts, query-keys, errors), assets.ts, money.ts, validation, storage
  mocks/        db (estado + localStorage), fixtures (283 NFTs determinísticos, usuários), handlers, services,
                scenarios, socket (MSW + socket.io-binding), stubs
  routes/       rotas de arquivo (TanStack Router)
tests/e2e/      specs Playwright + baselines visuais
scripts/        lighthouse.mjs
```

Cada feature tem hooks de dados (TanStack Query + Axios) separados da UI. O cliente Axios e os hooks **não** contêm dados falsos:
todo comportamento simulado vive em `src/mocks` (camada de rede).

## Sessão e isolamento de dados

Token + usuário em `localStorage`; validado por `GET /api/session` ao iniciar. Um `401` com token dispara o fluxo de expiração:
o cache privado é descartado, o contexto do checkout (rascunho, chave de idempotência, pedido pendente) é preservado e o usuário vai
para `/login?redirect=…&reason=expired`. Logout/troca de usuário removem o cache privado (`['user', id, …]`, carrinho), o contexto de
checkout e reiniciam o socket (um socket por token). Chaves de query de dados privados incluem o id do usuário.

## Carrinho

REST, por usuário ou por visitante (`X-Cart-Id` em `localStorage`). No login, `POST /api/cart/merge` preserva os itens do visitante
(limitados à disponibilidade). Após pedido confirmado, o servidor remove apenas itens e quantidades comprados.

## Cache, retries e sincronização

- Catálogo/detalhe: `staleTime` 30 s; carrinho e cotação: 0. Catálogo usa `keepPreviousData` (atualização em segundo plano) e o
  `AbortSignal` do Query cancela requisições obsoletas (respostas fora de ordem não sobrescrevem a última consulta).
- Retry: até 2× para falhas transitórias (rede, timeout, 5xx); nunca para 4xx; mutations nunca são repetidas automaticamente.
- Atualização otimista com rollback: favoritos (snapshot; sem snapshot, refetch).
- Invalidação: após mutations e eventos do socket; carrinho/cotação refeitos quando o carrinho muda.

## Pedidos idempotentes

`POST /api/orders` exige `Idempotency-Key`. A mesma chave + mesmo conteúdo devolve o mesmo pedido; conteúdo diferente → 409. O cliente guarda
chave + payload em `sessionStorage`; após timeout/refresh/queda, "Verificar pedido" reenvia a **mesma** tentativa. A cotação (`id` =
fingerprint de itens, preços, cupom, taxa) é revalidada no servidor; divergência → 409 `QUOTE_OUTDATED` e nova confirmação do usuário.
Pedidos confirmados/recusados são terminais; o recibo é o snapshot do pedido.

## Tempo real

Eventos `nft.updated` e `order.updated` com `eventId` e `version`. `EventGuard` descarta duplicatas, versões antigas e eventos de outro
usuário. Após reconectar, as queries ativas são reconciliadas com a API REST. O mock usa `ws.link` do MSW + `@mswjs/socket.io-binding`;
`socket.io-client` é carregado **depois** que o MSW patcheia `WebSocket` (ele captura o construtor ao avaliar o módulo).
### Reconciliação REST ↔ Socket.IO

- **REST é a fonte da verdade; o socket é um atalho de latência.** Ao receber `nft.updated`, o cache do catálogo, detalhe, relacionados e favoritos
  é corrigido em memória (somente se `event.version` > versão em cache) e o carrinho/cotação são invalidados e refeitos pela API.
  `order.updated` atualiza o pedido em cache só se a versão for maior; ao confirmar, o carrinho é refeito.
- **Idempotência no cliente:** `EventGuard` guarda os últimos `eventId` (duplicata → ignora) e a maior versão vista por recurso
  (versão ≤ conhecida → ignora). Eventos com `userId` diferente do usuário atual são descartados; ao trocar de token o socket é recriado
  e o guard é zerado.
- **Reconexão:** em todo `connect` posterior ao primeiro, as queries ativas (catálogo, detalhe, carrinho/cotação, dados do usuário, pedido)
  são invalidadas e rebuscadas na API. Eventos perdidos durante a queda são, portanto, recuperados por REST; o pedido pendente também
  tem `refetchInterval` de segurança (15 s) enquanto estiver pendente.
- **Divergência de cotação:** o `id` da cotação é um fingerprint (itens, quantidades, preços, cupom, taxa). Se mudar durante a revisão do
  checkout, o botão de pagar é substituído por "Aceitar novos valores"; mesmo assim o servidor confere o `quoteId` e responde 409
  `QUOTE_OUTDATED` se estiver desatualizado.

Limitações do mock: só transporte `websocket`; sem rooms/namespaces; recusa de handshake = conexão que expira (`timeout: 3000`).

## Assets e ícones

`src/lib/assets.ts` mapeia chaves semânticas (`emerald-ape`, …) para os arquivos originais de `src/assets` (importados como WebP em build via
`?webp`, os PNG originais ficam intactos). Para trocar uma imagem, substitua o arquivo ou o import em `assets.ts`. `NftImage` reserva o
espaço e exibe placeholder se o arquivo faltar. Ícones: SVGs do Figma (cores viram `currentColor` via svgr) + lucide-react, centralizados em `components/shared/Icon.tsx`.

## Responsividade

Breakpoints Tailwind: mobile (<768, 390 validado), tablet (768) e desktop (1024+/1440). Mobile segue os frames mobile (barra inferior, cards
arredondados, painéis fixos); perfil, carteiras e confirmação foram derivados dos padrões existentes.

## Desvios do Figma e premissas (a verificar com as camadas do Figma)

- Medidas estimadas a partir dos PNGs 1:1 (container 1200 px, header ~68 px, sidebar ~310 px); tipografia e cores vêm dos estilos e variáveis exportados do Figma (`src/index.css`).
- Footer e blocos editoriais ocultos no mobile (os frames mobile não os mostram). Toasts ficam na base para não cobrir botões.
- Pagamento: cartões de carteiras cadastradas e a conexão simulada (diálogo Conectar/Recusar) foram adicionados porque o README exige
  carteiras cadastradas e simulação de conexão/recusa. No mobile os campos do coletor ficam recolhidos ("Dados do colecionador").
- Facetas de catálogo (283 NFTs; redes 119/78/86; categorias 33/12/65/39/23/17/19/13/18) reproduzem os números do Figma e são totais globais.
- "Lista de interesse" (favoritos) é uma página mínima reaproveitando o card do catálogo.
- Ações fora de escopo (Criadores, Aprenda, "Ler mais", newsletter, login social, rodapé, escanear...) aparecem como indisponíveis
  (`aria-disabled` + aviso), sem simular sucesso. "Ver no Etherscan" abre um link de exploração simulado.
- Acessibilidade: rótulos visualmente ocultos nos campos só com placeholder, link "Pular para o conteúdo", região `aria-live` para mutações e eventos.

## Performance — decisões

Chunks do bootstrap com `modulepreload` (plugin em `vite.config.ts`), render só após app + mocks prontos, WebP gerado no build,
fontes só `latin`, validação de search params sem zod, e **`tough-cookie` substituído por stub** (`src/mocks/stubs/tough-cookie.ts`):
o jar de cookies do MSW custava ~70 KB gzip e o app usa bearer tokens. Consequência: `Set-Cookie`/`request.cookies` não funcionam nos mocks.
