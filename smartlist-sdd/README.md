# CodeGuard — SDD+TDD Pipeline

Pipeline de qualidade e segurança para o SmartList.

## Como funciona

```
Você clica "Run workflow" no GitHub
           ↓
Semgrep escaneia o código (SAST)
Trivy escaneia as dependências (SCA)
           ↓
normalizer.py → findings-normalized.json
           ↓
prompt_generator.py → .codeguard/prompts/*.md
           ↓
Git commita os resultados automaticamente
```

## Como usar

1. Vá em **Actions → SDD — Security-Driven Development**
2. Clique em **Run workflow**
3. Escolha a severidade mínima (padrão: MEDIUM)
4. Aguarde o pipeline terminar (~3-5 minutos)
5. Abra a pasta `.codeguard/` no repositório
6. Consulte o `INDEX.md` para ver todos os findings
7. Abra o prompt do finding desejado e cole na sua IDE

## Estrutura gerada

```
.codeguard/
├── INDEX.md                          ← índice de todos os findings
├── findings-normalized.json          ← JSON unificado
└── prompts/
    ├── prompt-semgrep-[rule].md      ← um prompt por finding SAST
    ├── prompt-trivy-vuln-[cve].md    ← um prompt por CVE
    └── prompt-trivy-secret-[rule].md ← um prompt por secret exposto
```

## Formato de cada prompt

```
1. Contexto do problema (arquivo, linha, código)
2. Descrição da vulnerabilidade
3. Requisitos SDD (o que a correção deve fazer)
4. Requisitos TDD (testes que devem ser escritos)
5. Formato da resposta (testes → código → explicação)
```

## Secrets necessários no GitHub

| Secret | Onde encontrar |
|--------|---------------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

> A `ANTHROPIC_API_KEY` é opcional — sem ela o pipeline gera prompts base sem enriquecimento de IA.

## Adicionar ao repositório SmartList

Copie as pastas para o repositório:
```
smartlist/
├── .codeguard/
│   └── scripts/
│       ├── normalizer.py
│       └── prompt_generator.py
├── .github/
│   └── workflows/
│       └── sdd-pipeline.yml
└── .gitignore   ← adicionar as linhas do .gitignore deste projeto
```
