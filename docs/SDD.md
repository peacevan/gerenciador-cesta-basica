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
