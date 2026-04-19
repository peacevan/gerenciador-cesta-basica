# Plano de Reorganização do Repositório

Este arquivo descreve passos não-invasivos para reorganizar o projeto para o padrão SDD proposto, sem alterar lógica do app.

## Objetivo

Fornecer passos claros para mover arquivos, atualizar imports e adicionar configurações de lint/CI.

## Passos sugeridos (manuais/seguros)

1. Criar pastas alvo:
   - `src/pages/`
   - `src/layout/`
   - `src/utils/`
   - `config/`
   - `scripts/`

2. Mapear arquivos atuais para novas pastas (exemplos):
   - `src/components/Home.jsx` -> `src/pages/Home.jsx`
   - `src/components/ChartPage.jsx` -> `src/pages/ChartPage.jsx`
   - `src/App.jsx` -> `src/App.jsx` (mover para `src/` se estiver na raiz)

3. Atualizar imports: use busca por `from './components/` e ajuste para `from '../components/` ou `from 'src/components/'` conforme sua preferência de caminho.

4. Rodar testes e lint após cada movimento para detectar quebras.

5. Commit granular: um commit por conjunto de movimentos (por página/feature) para facilitar rollback.

## Scripts e Configurações recomendadas

- `config/.env.example` — variáveis de ambiente de exemplo.
- `package.json` scripts:
  - `start`, `build`, `test`, `lint`, `format`.

## Checklist de verificação pós-migração

- [ ] App inicia localmente (`npm start`).
- [ ] Linter limpo (`npm run lint`).
- [ ] Testes passam (`npm test`).
- [ ] CI (GitHub Actions) configurado para rodar lint/test/build.

## Observações

Se quiser, eu posso gerar um patch inicial que cria as novas pastas e atualiza `package.json` com scripts mínimos, sem mover arquivos. Ou posso executar os passos de migração por você, arquivo-por-arquivo.
