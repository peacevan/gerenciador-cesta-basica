# Backlog SmartList

## Fase 2 — Waze de Preço
- Ranking de cesta mais barata por localização do usuário.
- Agregação de preços por estabelecimento usando histórico de compras.
- Uso de `estabelecimento` (lat/lng) + `precoUnitario/precoTotal` para comparação.
- Recomendação de mercado com menor custo estimado.

## Fase 2 — Supabase / Login
- Migração progressiva de localStorage para backend persistente (Supabase).
- Login necessário para sincronização entre dispositivos.
- Estratégia de migração e compatibilidade de schema.
- Controle de identidade e dados por usuário.

## Fase 3 — WhatsApp como interface
- Compartilhar lista por link do WhatsApp (`wa.me`) com mensagem formatada.
- Notificações e automações via WhatsApp Business API.
- Solicitação de orçamento/entrega para mercados via WhatsApp.
- Botão de suporte e canal de feedback pelo WhatsApp.
- Possível integração via Twilio (quando houver backend persistente e governança de custos).

## Premium — Parser de voz LLM
- `parserMode: 'regex' (padrão) | 'llm' (premium)`
- LLM como parser principal de voz
- Badge "via IA" no lugar de "via regex"
- Configurável em perfil do usuário
- Requer autenticação/plano, controle de custo e latência

## Outros — Backlog geral
- Perfil familiar completo com onboarding e ajuste inteligente de quantidades.
- Correlações de produtos: evoluir de hardcoded para coocorrência real.
- Templates gerados e calibrados por CSV local com curadoria contínua.
- Sincronização futura de templates do sistema por backend.
- Endurecimento operacional do `ai-proxy` (rate limit, logs, monitoramento).
- Evolução de arquitetura para páginas separadas por rota (conforme diretrizes v2.3).
- Rotina de CI separada para E2E (ambiente com browsers Playwright preparados).

## Nota de consolidação
- ⚠️ Conteúdo não encontrado no arquivo de origem: docs/CLAUDE.md
- ⚠️ Conteúdo não encontrado no arquivo de origem: docs/pendencias.txt
