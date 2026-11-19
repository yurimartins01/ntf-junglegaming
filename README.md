# Kurio — Marketplace de NFTs

Solução do **Desafio Frontend — Marketplace de NFTs** ([enunciado original](https://github.com/junglegaming/frontend-challenge/blob/main/README.md)).
React + TypeScript, com API, autenticação, carteiras, pagamento e tempo real **simulados** (MSW + Socket.IO).
Decisões de arquitetura, limitações e desvios do Figma: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Stack

React 19 · TypeScript (strict) · TanStack Router · TanStack Query · Axios · Socket.IO (`socket.io-client`) ·
Tailwind CSS v4 · shadcn/ui (Radix) · MSW (+ `@mswjs/socket.io-binding`) · Playwright · Lighthouse · Vite.
Também: react-hook-form + zod (formulários), big.js (ETH em decimal), Roboto Mono (`@fontsource`).

## Executar

Requisitos: Node 22+ e pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:5173 (mocks ativados)
```

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | desenvolvimento com mocks |
| `pnpm build` | `tsc -b` + build de produção (`dist/`) |
| `pnpm preview` | serve o build em http://localhost:4173 |
| `pnpm typecheck` | verificação de tipos |
| `pnpm lint` | ESLint |
| `pnpm test:e2e` | Playwright (build + preview automáticos; Chromium desktop 1440 e mobile 390) |
| `pnpm test:e2e:update` | regenera as baselines visuais |
| `pnpm test:e2e:report` | abre o relatório HTML |
| `pnpm lighthouse` | auditoria Lighthouse (3 execuções × {início, detalhe} × {mobile, desktop}) → `lighthouse/reports/` |

Na primeira execução dos testes: `npx playwright install chromium`.

## Variáveis de ambiente (`.env`)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa a camada MSW (REST + Socket.IO). Também está ativa no build de demonstração. |
| `VITE_SOCKET_URL` | `wss://realtime.kurio.test` | Endpoint do socket (interceptado pelo MSW; nunca sai pela rede). |

## Credenciais fictícias

| Usuário | E-mail | Senha | Observações |
| --- | --- | --- | --- |
| Nova Sato | `nova@kurio.test` | `Kurio@2026` | carteiras Principal e Reserva, 1 favorito |
| Theo Martins | `theo@kurio.test` | `Kurio@2026` | sem carteiras nem favoritos |

Cupons: `KURIO10` (10%), `GENESIS5` (5%), `EXPIRADO20` (expirado); qualquer outro é inválido.
Senhas nunca são armazenadas em claro (hash SHA-256 com salt no estado do mock).

## Cenários dos mocks

Selecione com `?scenario=<nome>` em qualquer URL (persiste até `?scenario=default`) ou, no console,
`window.__kurioMocks.setScenario('<nome>')`. **Reset total** do estado conhecido: `?mock-reset=1`
(ou `await window.__kurioMocks.reset()`).

| Cenário | Efeito |
| --- | --- |
| `default` | comportamento normal |
| `empty` | catálogo sem resultados |
| `slow` / `variable-latency` / `out-of-order` | latência alta / variável / respostas do catálogo fora de ordem |
| `offline` | falha de conexão (REST e socket) |
| `server-error` / `flaky` | HTTP 503 / 3 falhas e depois sucesso (retry manual recupera) |
| `favorite-failure` | mutation de favoritos falha (rollback otimista) |
| `session-expired` | sessão expira 20 s após o login |
| `forbidden` | HTTP 403 em perfil, carteiras e pedidos |
| `price-change` / `sold-out` | após a 1ª cotação do checkout o preço sobe / a edição esgota (via `nft.updated`) |
| `order-timeout` | pedido criado, resposta nunca chega; recuperação pela mesma `Idempotency-Key` |
| `payment-declined` / `payment-slow` | pedido recusado / pendente por 8 s |
| `socket-drop` | socket cai ao criar o pedido; estado final chega após reconectar |
| `duplicate-events` | cada evento é entregue em duplicidade |

Controles extras para demos/testes: `window.__kurioMocks.updateNft(id, {price, available})`,
`dropSocket(ms)`, `expireSessions()`, `replayLast/replayPrevious(...)` — todos passam pelo servidor mock
(REST e Socket.IO ficam consistentes). Conflito de cadastro: registrar `nova@kurio.test`; erro de validação: campos inválidos.

## Reproduzir os fluxos de falha

Cada roteiro parte de um estado limpo (`/?mock-reset=1`). Para os fluxos de compra, entre como `nova@kurio.test` e coloque o
**Emerald Ape #042** no carrinho (Detalhe → **Comprar**).

| Fluxo | Como reproduzir | Resultado esperado |
| --- | --- | --- |
| Carregamento lento (skeletons) | abrir `/?scenario=slow` | 9 skeletons com shimmer; somem quando os cards chegam |
| Erro HTTP 5xx e nova tentativa | abrir `/?scenario=server-error` → depois, no console, `__kurioMocks.setScenario('default')` → **Tentar novamente** | alerta "Serviço temporariamente indisponível"; o catálogo carrega ao tentar de novo |
| Falha transitória | abrir `/?scenario=flaky` | após 2 retries automáticos aparece o erro; **Tentar novamente** recupera |
| Sem conexão | abrir `/?scenario=offline` → voltar ao `default` → **Tentar novamente** | mensagem "Sem conexão com o servidor" e recuperação |
| Respostas fora de ordem | abrir `/?scenario=out-of-order` e clicar rápido em "Novos lançamentos" e "Em alta" | prevalece o resultado da última consulta (`tab=trending`) |
| Resultado vazio | abrir `/?scenario=empty` | estado vazio com "Limpar filtros" |
| Sessão expirada | entrar com `/?scenario=session-expired`, aguardar 20 s e navegar/recarregar `/profile` (ou `__kurioMocks.expireSessions()`) | redireciona a `/login?...&reason=expired`; após entrar, volta à tela anterior |
| Acesso não autorizado | abrir `/checkout` ou `/profile` sem login; ou `?scenario=forbidden` logado | redireciona ao login / HTTP 403 com mensagem |
| Conflito de cadastro | `/register` com `nova@kurio.test` | "Este e-mail já está cadastrado." |
| Erro de validação | enviar formulários vazios ou inválidos (senha fraca, endereço `0x123`) | erros por campo, associados via `aria-describedby` |
| Cupom inválido/expirado | no carrinho aplicar `NAOEXISTE` e `EXPIRADO20` | "Código promocional inválido." / "Este código promocional expirou." |
| Falha de favorito | `?scenario=favorite-failure` → favoritar | rollback do coração e aviso; ao voltar ao `default` funciona |
| Preço alterado no checkout | `?scenario=price-change` → carrinho → `/checkout` | ~1,5 s depois o aviso "O preço de … mudou" e os totais mudam via `nft.updated`; com a revisão aberta, "Aceitar novos valores" é obrigatório |
| Edição esgotada na compra | com a revisão aberta: `__kurioMocks.updateNft('emerald-ape-042', { available: { '1/10': 0, '1/50': 0, open: 0 } })` | aviso de esgotamento e botão de pagar bloqueado |
| Pagamento recusado | `?scenario=payment-declined` → concluir a compra | tela "Pagamento recusado"; carrinho preservado |
| Recusa na conexão da carteira | em **Confirmar compra**, clicar **Recusar** | "Conexão recusada"; nenhum pedido criado |
| Timeout após criar o pedido | `?scenario=order-timeout` → concluir a compra | cartão "Compra aguardando resposta do servidor"; **Verificar pedido** recupera o **mesmo** pedido (idempotência) |
| Clique repetido | `?scenario=payment-slow` → duplo clique em **Confirmar e pagar** | um único pedido |
| Pedido pendente após refresh | `?scenario=payment-slow` → concluir e recarregar a página de pedido | continua pendente e vira confirmado sem nova compra |
| Queda do socket | `?scenario=socket-drop` → concluir a compra | o pedido confirma depois que o socket reconecta (reconciliação via REST) |
| Eventos duplicados/antigos | `?scenario=duplicate-events` e `__kurioMocks.updateNft(...)` duas vezes, depois `replayPrevious('nft', id)` | o estado permanece na versão mais nova; um aviso por mudança |

Todos esses roteiros são exercitados pelos testes em `tests/e2e/` (`pnpm test:e2e`).

## Contratos

Tipos compartilhados (transporte → estado → UI → mocks): [`src/lib/api/contracts.ts`](src/lib/api/contracts.ts).

| Recurso | Endpoints |
| --- | --- |
| Sessão | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/session`, `POST /api/auth/logout` |
| NFTs | `GET /api/nfts?q&category&network&minPrice&maxPrice&tab&sort&page&pageSize`, `GET /api/nfts/featured`, `GET /api/nfts/:id`, `GET /api/nfts/:id/related` |
| Favoritos | `GET /api/favorites`, `PUT/DELETE /api/favorites/:nftId` |
| Carrinho | `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/:lineId`, `PUT/DELETE /api/cart/coupon`, `POST /api/cart/merge` |
| Cotação | `POST /api/quote` (subtotal, desconto, taxa de rede, total, `id` = fingerprint) |
| Pedidos | `POST /api/orders` (cabeçalho `Idempotency-Key`), `GET /api/orders/:id` |
| Perfil | `GET/PATCH /api/profile`, `PUT/DELETE /api/profile/avatar`, `POST /api/profile/password` |
| Carteiras | `GET /api/wallets`, `PUT /api/wallets/:slot` (`primary` \| `secondary`) |

Erros: `{ error: { code, message, fieldErrors? } }` com 401/403/404/409/422/5xx. Valores em ETH sempre como string decimal.

**Socket.IO** (`nft.updated`, `order.updated`): envelope `{ eventId, type, resource:{type,id}, version, userId?, emittedAt, payload }`.
O cliente ignora duplicatas (`eventId`) e versões antigas, descarta eventos de outro `userId` e reconcilia com REST após reconectar.
Transporte do mock: WebSocket interceptado pelo MSW (`ws.link`) + `@mswjs/socket.io-binding` — apenas transporte `websocket` (sem long-polling), sem rooms/namespaces.

## Estado do desafio

**Implementado e verificado:** todas as telas (Início, Detalhe, Carrinho, Pagamento, Confirmação, Login, Cadastro, Perfil, Carteiras, Lista de interesse), desktop e mobile;
busca/filtros/ordenação/paginação na URL; carrinho persistente com merge de visitante; cupons; cotação revalidada com reconfirmação;
pedidos idempotentes (pendente/confirmado/recusado, recuperação após refresh/timeout/queda do socket); tempo real; sessão com expiração;
favoritos com atualização otimista e rollback; skeletons com shimmer; acessibilidade (teclado, foco, aria-live).
Testes E2E Playwright cobrindo os 12 grupos do enunciado + regressão visual (início, detalhe, carrinho, pagamento).

**Resultados medidos (esta máquina):**
- `tsc`, `eslint` e `pnpm build`: sem erros.
- Playwright (Chromium desktop + mobile), última rodada completa: **106 de 109 testes passando, 3 falhando**. Falhas: (1) `a11y` "foco visível em controles interativos" (desktop); (2) regressão visual do detalhe do NFT (mobile); (3) tempo real "reconexão do socket reconcilia o catálogo" (mobile). Em rodadas anteriores esses testes passaram; as falhas aparecem sob carga paralela (suspeita de timing/baseline), mas **não foram investigadas nem corrigidas** por falta de tempo. Reexecute com `pnpm test:e2e` (e `pnpm test:e2e:update` para regenerar baselines visuais, se necessário).
- Lighthouse (mediana de 3 execuções, relatórios em `lighthouse/reports/`): ver tabela abaixo.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | **89** | 100 | 100 | 92 | 3421 ms | 0.019 | 44 ms |
| Início | desktop | 100 | 100 | 100 | 92 | 763 ms | 0.002 | 0 ms |
| Detalhe | mobile | 93 | 100 | 100 | 92 | 3277 ms | 0.010 | 43 ms |
| Detalhe | desktop | 100 | 100 | 100 | 92 | 746 ms | 0.001 | 0 ms |

Lighthouse 13.6.0, Chrome 157, Windows 11, i5-14400F, build de produção com mocks (cenário `default`), throttling padrão do Lighthouse.

**Abaixo da meta:** *Início/mobile* ficou em 89 (meta 90). Causa: a página é renderizada no cliente e o LCP (primeiro card do catálogo) só
existe depois de baixar o JS, iniciar o worker do MSW e responder à API simulada; sob Slow 4G + CPU 4× isso soma ~3,4 s.
Mitigações já aplicadas: preload de chunks, WebP gerado no build, MSW sem cookie jar (stub), imports tardios do socket.

**Deploy:** https://ntf-junglegaming.vercel.app (Vercel, build de produção com mocks ativos; acesso direto e refresh das rotas
funcionam via rewrite SPA do `vercel.json`).

**Limitações / pendências:** conteúdo editorial, suporte e "Avaliações" estão como ações indisponíveis (fora do escopo);
medidas do Figma foram estimadas a partir dos PNGs (sem acesso às camadas) — ver `ARCHITECTURE.md`.
