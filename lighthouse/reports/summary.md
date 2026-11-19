# Lighthouse — resultados medidos

Medianas de 3 execuções por página e perfil. Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | 89 | 100 | 100 | 92 | 3421 ms | 0.019 | 44 ms |
| Início | desktop | 100 | 100 | 100 | 92 | 763 ms | 0.002 | 0 ms |
| Detalhe do NFT | mobile | 93 | 100 | 100 | 92 | 3277 ms | 0.010 | 43 ms |
| Detalhe do NFT | desktop | 100 | 100 | 100 | 92 | 746 ms | 0.001 | 0 ms |

## Ferramentas e ambiente

- Lighthouse 13.6.0; Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36; Node v22.15.1; Vite ^8.3.8; React ^19.3.1
- Windows_NT 10.0.26300 (x64); Intel(R) Core(TM) i5-14400F x16; 32 GB RAM
- vite build + vite preview, VITE_ENABLE_MOCKS=true, default scenario
- Throttling: Lighthouse defaults (simulated: mobile = Slow 4G + 4x CPU, desktop = no CPU slowdown)
- Data: 2026-11-19T15:27:30.566Z

Relatórios HTML/JSON individuais: `lighthouse/reports/<página>-<perfil>-run<N>.(html|json)`.
