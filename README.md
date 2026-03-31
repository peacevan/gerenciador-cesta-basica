"# gerenciador-cesta-basica" 
# Lista de Compras

## Sobre

Este projeto é uma aplicação web de "Lista de Compras Inteligente" que vai além de um checklist simples. Além de permitir adicionar itens e calcular totais, a aplicação oferece recursos inteligentes como:

- interpretação de comandos por voz com parsing baseado em LLMs (via `ai-proxy`);
- normalização de unidades e sugestões automáticas de quantidade;
- busca e atualização de preços reais por produto;
- captura OCR de etiquetas/receitas para entrada rápida;
- histórico de compras, análises e recomendações de reabastecimento;
- integração serverless (Netlify Functions) para separar a lógica do modelo e proteger chaves de API.

O produto foi pensado para uso em português brasileiro e para facilitar a automação de listas, testes de voz e integração com provedores de modelos de linguagem.

## Funcionalidades Principais

# gerenciador-cesta-basica

Aplicação web para gerenciar listas de compras, produtos e histórico — com suporte a comandos de voz e integração LLM.

## Sumário
- Visão geral e objetivos
- Como rodar localmente
- Estrutura do projeto
- Documentação e specs (Copilot / Claude)

## Como rodar (desenvolvimento)

1. Instale dependências:

```bash
npm install
```

2. Rodar em modo de desenvolvimento:

```bash
npm start
```

3. Build de produção:

```bash
npm run build
```

Observação: confira `package.json` para scripts disponíveis.

### Como iniciar a aplicação (detalhado)

- Instale dependências:

```bash
npm install
```

- Rodar o frontend em modo de desenvolvimento (padrão React):

```bash
npm start
```

- Rodar localmente com o Netlify Dev (recomendada para testar funções/serverless e proxy):

1. Instale o Netlify CLI (opcional) ou use via npx:

```bash
# instalação global (opcional)
npm install -g netlify-cli

# ou usar sem instalar
npx netlify dev
```

2. Ao executar `netlify dev` a ferramenta irá:

- servir o frontend (usando o servidor de desenvolvimento do React na porta 3000, conforme `netlify.toml`) e
- expor as funções serverless definidas em [netlify/functions/](netlify/functions/).

Por padrão o projeto já contém configuração de desenvolvimento em [netlify.toml](netlify.toml) (o Dev aponta para a porta 3000). A função de proxy para LLM está em [netlify/functions/ai-proxy.js](netlify/functions/ai-proxy.js) e é exposta em `/api/ai-proxy`.

Exemplo rápido (dev):

```bash
# 1) abrir o frontend dev
npm start
# 2) em outro terminal, rodar netlify dev para ativar as funções e proxy
npx netlify dev
```

Observações importantes:

- A função `ai-proxy` usa chaves de API externas (variáveis de ambiente): `OPENROUTER_API_KEY`, `GEMINI_API_KEY` e `ANTHROPIC_API_KEY`. Defina-as no ambiente antes de chamar a API localmente (por exemplo, export/Set-Variable no seu terminal) ou crie um arquivo `.env` que o `netlify dev` carregue.
- A rota pública da função é `/api/ai-proxy` (veja o `export const config = { path: '/api/ai-proxy' }` em [netlify/functions/ai-proxy.js](netlify/functions/ai-proxy.js)).
- Para deploy no Netlify conecte o repositório ao painel do Netlify — a `netlify.toml` existente já contém as instruções básicas de dev; as funções no diretório `netlify/functions/` serão publicadas automaticamente.

## Estrutura principal

- `src/` — código fonte (components, hooks, pages, layout, utils, styles)
- `public/` — arquivos públicos
- `assets/` — imagens e scripts estáticos
- `db/` — lógica/fixtures de persistência
- `netlify/` — funções e deploy (Netlify)
- `docs/` — documentação e specs (SDD, voice command spec)
- `tests/` — testes e fixtures (áudio, e2e)

## Documentação e specs

- SDD e arquitetura: [docs/SDD.md](docs/SDD.md)
- Especificação de comandos de voz: [docs/VOICE_COMMAND_SPEC.md](docs/VOICE_COMMAND_SPEC.md)
- Versões adaptadas para assistentes: [docs/VOICE_COMMAND_SPEC_copilot.md](docs/VOICE_COMMAND_SPEC_copilot.md), [docs/VOICE_COMMAND_SPEC_claude.md](docs/VOICE_COMMAND_SPEC_claude.md)
- Plano de reorganização: [docs/RESTRUCTURE_PLAN.md](docs/RESTRUCTURE_PLAN.md)

Colabore mantendo esses arquivos atualizados para facilitar uso de assistentes de código (Copilot/Claude).

## Testes de voz

- Casos de teste: [tests/voice_command_test_plan.md](tests/voice_command_test_plan.md)
- Amostras de áudio: `tests/audio/` (recomenda-se criar e versionar amostras representativas)

## Guia rápido para contribuições

- Crie branch por feature: `feat/descricao` ou `fix/descricao`.
- Faça commits pequenos e com mensagens claras.
- Atualize `docs/` quando alterar fluxos de voz ou contratos do `useLLMParser`.

## Uso com Copilot / Claude

- Mantenha `src/` bem organizado (`components`, `pages`, `hooks`, `utils`) para melhorar sugestões automáticas.
- Documente prompts e exemplos em `docs/` para gerar implementações mais seguras com LLMs.

## Contato

Abra uma issue para discutir mudanças maiores ou se precisar de ajuda para migrar a estrutura do projeto.
