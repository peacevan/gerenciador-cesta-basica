# Commit Guidelines — Minimal (single developer)

Objetivo: manter histórico legível e mudanças atômicas sem atrito para um time de 1 pessoa.

Princípios
- Um commit = uma mudança lógica mínima e coerente (fácil de reverter).
- Mensagens curtas e padronizadas para facilitar buscas e releases.
- Não é obrigatório usar hooks automáticos; doc serve como guia.

Formato de mensagem (Conventional-ish, mínimo)
- Formato: `type(scope?): short-description`
- Tipos recomendados: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.
- Exemplos:
  - `fix(useLLMParser): handle non-ok responses from proxy`
  - `feat(autocomplete): add AutocompleteInput component`
  - `test(useHistorico): add tests for buscar ordering`
  - `docs: add LLM prompt specs`

Regras práticas
- Evite commits que misturem funcionalidades e refatorações grandes.
- Sequência recomendada ao trabalhar com TDD:
  1. Commit do teste falhando: `test(...)` (opcional, curto)
  2. Commit da implementação mínima: `fix(...)` ou `feat(...)`
  3. Commit de refatoração/limpeza: `refactor(...)`
- Mensagem de PR / título do branch: use a mesma frase do primeiro commit (facilita histórico).

Branching (simples)
- Branch por tarefa: `feat/descricao-curta` ou `fix/descricao-curta`.
- `main` ou `main` é a branch de produção; faça PRs do branch de tarefa antes de merge.

Opções automáticas (opcional)
- Se quiser automação leve, instale só `husky` para executar `lint-staged` no pre-commit:

  ```bash
  npm install -D husky lint-staged
  npx husky install
  npx husky add .husky/pre-commit "npx --no -- lint-staged"
  ```

  `package.json` snippet para `lint-staged`:
  ```json
  "lint-staged": {
    "*.{js,jsx}": ["eslint --fix", "git add"]
  }
  ```

- Para commits formatados automaticamente, use `commitizen` ou `commitlint` + `husky` (opcional).

Revisão e merges
- Faça PRs pequenos (uma feature por PR).
- Squash on merge é aceitável se preferir histórico linear; caso contrário, mantenha commits atômicos.

Notas finais
- Esta é uma política mínima pensada para produtividade do desenvolvedor único.
- Se quiser que eu instale uma configuração automática (`husky` + `commitlint` + `lint-staged`), eu faço com comandos e alterações no `package.json`.

--

## Convenção Recomendada: Conventional Commits (mínimo)

Use o formato Conventional Commits de forma enxuta para consistência e geração simples de changelogs se preciso.

- Formato: `type(scope?): short-description`
- Tipos recomendados (use apenas os necessários): `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.

Exemplos práticos:

- `feat(useLLMParser): handle non-ok responses from proxy`
- `fix(useLLMParser): avoid JSON parse error on HTML responses`
- `test(useLLMParser): add failing test for proxy non-ok responses`
- `docs: add LLM prompt specs`

Dicas rápidas:
- Mantenha a descrição curta (imperative mood) — ex: `add`, `fix`, `update`.
- Opcionalmente inclua um corpo explicando o porquê se a mudança não for óbvia.

## Commit template (local)

Você pode usar um template de commit local para facilitar a escrita da mensagem. Criei um modelo simples em `.gitmessage` na raiz do projeto. Para ativar localmente execute:

```bash
git config commit.template .gitmessage
```

Conteúdo do template `.gitmessage` (exemplo):

```
type(scope?): short-description

---
Optional longer description explaining the change. Use imperative mood.

BREAKING CHANGE: explanation (only when necessary)
```

## Uso prático (sequência TDD mínima)

1. Escrever teste (opcional commit):
  - `git add` → `git commit -m "test(useLLMParser): add test for proxy non-ok"`
2. Implementar mínimo para passar testes:
  - `git add` → `git commit -m "fix(useLLMParser): check res.ok and throw readable error"`
3. Refatorar (se necessário):
  - `git add` → `git commit -m "refactor(useLLMParser): extract error parsing helper"`

Cada commit deve representar uma única unidade lógica de trabalho.

## Quando automatizar (opcional)

Se quiser, podemos adicionar `husky` + `lint-staged` depois para aplicar formatação/linters antes do commit. Por enquanto mantenha o processo manual e simples.

---

Arquivo criado automaticamente: `.gitmessage` (use `git config commit.template .gitmessage` para ativar).
