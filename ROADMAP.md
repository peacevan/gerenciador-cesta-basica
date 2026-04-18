# Roadmap SmartList

Documento de direção do projeto com base no estado atual da branch `feat/MVP_V2`.

## Legenda

- ✅ Concluído
- 🚧 Em andamento
- ❌ Não iniciado

## MVP 1 - Core

### Funcionalidades principais

- ✅ Comandos de voz com reconhecimento em PT-BR
- ✅ Parser LLM com fallback regex offline
- ✅ Fluxo de confirmação para comandos ambíguos (`ModalConfirmacao`)
- ✅ Persistência da lista em `localStorage` (`smart-list-items`)
- ✅ Ações de lista: adicionar, remover, atualizar preço, marcar/desmarcar
- ✅ UI base da lista (`ListVoice`) responsiva mobile-first
- ✅ Compartilhamento da lista (Web Share API)
- ✅ Proxy LLM (`/api/ai-proxy`) com provedores OpenRouter, Gemini e Anthropic

### Qualidade e segurança

- ✅ Testes unitários de hooks/componentes centrais do MVP 1
- ✅ Validação básica de input no proxy
- 🚧 Endurecimento de segurança do proxy (evolução contínua)

## MVP 2 - Smart Features

### Funcionalidades concluídas

- ✅ Autocomplete de produtos com histórico (`useHistorico` + `AutocompleteInput`)
- ✅ Painel de histórico de listas com snapshots (`HistoricoPanel`)
- ✅ Salvamento de estabelecimento com geolocalização e reverse geocoding (`ModalEstabelecimento`)
- ✅ Entrada por texto livre com IA (`ModalTextoLivre`)
- ✅ Templates offline de lista (`useTemplates` + `ModalTemplates`)
- ✅ Nota fiscal OCR-first com extração local + parse no proxy (`NotaFiscalUpload`)
- ✅ CSS polish dos modais e painéis (remoção de inline styles)
- ✅ Contraste mínimo revisado com tokens de tema para acessibilidade

### Em andamento

- 🚧 Nota fiscal E2E com Playwright
- 🚧 UX mobile em dispositivos reais (Android/iOS)

### Pendências

- ❌ PWA (manifest + service worker)
- ❌ Analytics de uso (eventos anônimos)

## Funcionalidades gerais do sistema

### Entradas de dados suportadas

- ✅ Voz
- ✅ Texto livre
- ✅ Autocomplete por histórico
- ✅ Templates
- ✅ Nota fiscal (OCR)

### Gestão de listas

- ✅ Marcar/desmarcar itens
- ✅ Total calculado por itens marcados (regra atual)
- ✅ Snapshot de lista salvo com todos os itens
- ✅ Carregar e excluir snapshots

### Persistência

- ✅ `smart-list-items`
- ✅ `smart-list:catalog`
- ✅ `smart-list:history`
- ✅ `smartlist_templates`

### Testes e cobertura (última execução)

- ✅ 18 suítes passando
- ✅ 66 testes passando
- ✅ Cobertura global:
	- Lines: 56.87%
	- Statements: 50.66%
	- Functions: 35.00%
	- Branches: 39.18%

## Lembretes operacionais

- ⚠️ Definir no Netlify o valor do limite de uso da LLM para reconhecimento de voz (`/api/ai-proxy`) antes do próximo deploy.
- ⚠️ Revisar periodicamente os limites para evitar consumo excessivo de API e custos inesperados.

## Backlog — Funcionalidades Premium (Plano Pago)

### Parser de Voz LLM (BL-005)
- ❌ Usuário premium pode ativar LLM como parser **principal** no reconhecimento de voz do item expandido (em vez do regex)
- Configuração via `parserMode: "llm"` no perfil salvo no localStorage
- Badge muda de `"via regex"` → `"via IA"` no painel expandido
- LLM chamado via `/api/ai-proxy` com prompt estruturado extraindo `{ quantidade, unidade, preco }`
- Regex continua sendo o padrão gratuito; LLM é upgrade opt-in
- **Depende de:** sistema de autenticação/planos implementado
- **Spec detalhada:** [docs/SPEC_ITEM_EXPANDIDO_E_VOZ.md — BL-005](docs/SPEC_ITEM_EXPANDIDO_E_VOZ.md)

### Agrupamento por Categoria no Carrinho
- ❌ Botão toggle no topo da lista para agrupar/desagrupar itens por categoria visualmente
- Estado visual apenas (não altera dado salvo)
- Útil no supermercado para navegar por corredor
- **Depende de:** Waze de Preço com histórico por categoria implementado

## Próximos passos sugeridos

- 1. Finalizar E2E de nota fiscal (Playwright)
- 2. Testar fluxo completo em dispositivos reais
- 3. Publicar política de segurança e limites operacionais do proxy