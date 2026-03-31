# Software Design Document (SDD)

## 1. Visão Geral

Projeto: gerenciador-cesta-basica

Resumo: aplicação React para gerenciar produtos, compras e histórico de uma "cesta básica". Este SDD documenta arquitetura, decisões e como colaborar usando assistentes de código (Copilot / Claude).

Objetivo do documento: fornecer referência rápida para desenvolvedores, orientar reorganização do repositório e descrever integrações com LLMs.

## 2. Arquitetura de Alto Nível

- Frontend: React (arquivos em `src/` e `App.jsx`).
- Backend/Serverless: funções Netlify em `netlify/functions/` (ex.: `ai-proxy.js`).
- Persistência: código leve em `db/` (ex.: `db.js`) — atualmente local/in-memory.
- Deploy: Netlify (arquivo `netlify.toml`).

Fluxo: UI (React) -> hooks (voice, llm parser, shopping list) -> chamadas a funções (quando necessário) -> persistência local.

## 3. Estrutura de Pastas (proposta estabilizada)

- `src/` — código fonte (components, hooks, pages, layout, utils, styles)
- `public/` — arquivos públicos
- `assets/` — imagens e scripts estáticos auxiliares
- `db/` — wrappers e fixtures de dados
- `docs/` — documentação (SDD, planos, decisões)
- `config/` — exemplos de configuração (eslint, prettier, env)
- `scripts/` — scripts de apoio (migrations, utilitários)
- `netlify/` — configurações de deploy e funções

Observação: hoje o repo já contém `src/components`, `src/hooks`, `netlify/`, `db/` e `assets/`.

## 4. Componentes Principais

- Páginas: Home, ChartPage, PurchaseHistory, ProductRegistration — mover para `src/pages/`.
- Componentes UI: Footer, ThemeToggle, ProductList, ProductCrud — manter em `src/components/`.
- Hooks: `useLLMParser`, `useShoppingList`, `useVoiceRecognition`, `useLocalStorage` — manter em `src/hooks/`.
- Utilitários: abstrair helpers de API/DB/format em `src/utils/`.

## 5. Decisões de Projeto

- Organização: separação clara entre `pages`, `components`, `hooks` e `utils` facilita buscas por assistentes de código.
- Import paths: prefira imports relativos consistentes (ex.: `src/components/Button.jsx`).
- LLM integrations: documentar prompts e contratos em `docs/` para uso por Copilot/Claude.
- Tests: manter testes de hooks em `src/hooks/__tests__/`.

## 6. Guia Rápido para Copilot / Claude Code

- Padronize nomes de pastas: `components`, `pages`, `hooks`, `utils`, `styles` — ajuda a autocompletar e gerar arquivos.
- Inclua comentários JSDoc nos handlers e hooks críticos para que assistentes gerem testes e exemplos.
- Mantenha `docs/SDD.md` e `docs/RESTRUCTURE_PLAN.md` atualizados.

## 7. Requisitos Não-Funcionais

- Lint/Format: integrar ESLint + Prettier.
- CI: adicionar GitHub Actions com checks de lint/test e build.
- Acessibilidade: seguir boas práticas ARIA em componentes interativos.

## 8. Próximos Passos

1. Criar `docs/RESTRUCTURE_PLAN.md` com passos de migração (arquivo separado).
2. Executar mudanças de pasta (mover páginas para `src/pages/`) e atualizar imports.
3. Adicionar `config/.env.example` e scripts em `package.json`.

---
Arquivo gerado automaticamente. Atualize este SDD conforme decisões forem tomadas.

## 9. Estado Atual (Resumo rápido)

- Branch de trabalho: `feat/MVP_V2` — melhorias do MVP v2 em desenvolvimento.
- Parser LLM (`src/hooks/useLLMParser.js`) implementado e testado com diversos provedores.
- Proxy LLM (`netlify/functions/ai-proxy.mjs` e `netlify/functions/ai-proxy-lib.js`) implementado; provedor `texto-livre` completo, `nota-fiscal` aceitando payload `{ ocrText }`.
- UI: `NotaFiscalUpload.jsx` adicionado, com validação de tamanho (5MB), preview e indicador de progresso.

## 10. Testes e E2E

- Testes unitários e de integração (Jest) estão operacionais — execuções locais mostram suites passando.
- Teste E2E inicial com Playwright foi adicionado em `tests/e2e/` porém foi temporariamente desativado no repositório devido a problemas de ambiente (instalação de navegadores falhou com ENOSPC). O arquivo foi movido para `tests/e2e/nota-fiscal.spec.js.disabled` para não quebrar a execução de `jest`.
- Para rodar E2E em ambiente com espaço suficiente: instale apenas Chromium com `npx playwright install chromium` e execute `npx playwright test`.

## 11. Observações Operacionais

- OCR-first: estratégia preferida — executar OCR client-side (Tesseract) para extrair `ocrText`, aplicar `filterOCRText` para reduzir ruído e enviar texto resultante ao proxy LLM.
- Logs/Hardening: adicionar rate-limiting, métricas e logs no `ai-proxy` antes de publicar em produção.
- CI: recomendamos um job separado para E2E em runner com espaço suficiente (ou usar imagem/container preparada com navegadores Playwright instalados).

---
Atualize este SDD quando houver mudanças significativas na arquitetura ou no pipeline de LLM/OCR.
