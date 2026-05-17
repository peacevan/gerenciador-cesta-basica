# 🟠 SDD+TDD Prompt — `SEMGREP-YAML-GITHUB-ACTIONS-SECURITY-RUN-SHELL-INJECTION-RUN-SHELL-INJECTION`

> **Severidade:** HIGH | **Tipo:** Análise estática (SAST) | **Fonte:** SEMGREP
> **Gerado em:** 2026-05-10 12:50 UTC

---

## 1. Contexto do problema

- **Arquivo:** `.github/workflows/sdd-pipeline.yml`
- **Localização:** linha 71–77
- **Regra/CVE:** `yaml.github-actions.security.run-shell-injection.run-shell-injection`

**Trecho de código:**
```javascript
requires login
```

**CWE:** CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
**OWASP:** A01:2017 - Injection, A03:2021 - Injection, A05:2025 - Injection

**Referências:**
  - https://docs.github.com/en/actions/learn-github-actions/security-hardening-for-github-actions#understanding-the-risk-of-script-injections
  - https://securitylab.github.com/research/github-actions-untrusted-input/

---

## 2. Descrição da vulnerabilidade

Using variable interpolation `${{...}}` with `github` context data in a `run:` step could allow an attacker to inject their own code into the runner. This would allow them to steal secrets and code. `github` context data can have arbitrary user input and should be treated as untrusted. Instead, use an intermediate environment variable with `env:` to store the data and use the environment variable in the `run:` script. Be sure to use double-quotes the environment variable, like this: "$ENVVAR".



---

## 3. Requisitos SDD (Security-Driven Development)

A correção **deve**:

- [ ] Eliminar completamente o vetor de ataque identificado
- [ ] Não introduzir novas superfícies de ataque
- [ ] Seguir o princípio do menor privilégio
- [ ] Validar e sanitizar todos os inputs relacionados
- [ ] Não expor informações sensíveis em logs, erros ou responses
- [ ] Ser compatível com a versão atual do projeto (sem breaking changes)


---

## 4. Requisitos TDD (Test-Driven Development)

Antes de corrigir o código, escreva os testes que comprovam:

### 4.1 Testes de segurança (devem PASSAR após a correção)
- [ ] Teste: input malicioso é rejeitado/sanitizado corretamente
- [ ] Teste: comportamento seguro em condições de contorno (null, vazio, muito longo)
- [ ] Teste: ausência de dados sensíveis na resposta/log

### 4.2 Testes de regressão (devem PASSAR antes e depois)
- [ ] Teste: funcionalidade original continua funcionando após a correção
- [ ] Teste: casos de uso normais não são afetados

### 4.3 Cobertura mínima esperada
- Cobertura do arquivo corrigido: **≥ 80%**
- Todos os caminhos do fix cobertos por pelo menos 1 teste

---

## 5. Formato da resposta esperado

Responda **nesta ordem exata**:

### Passo 1 — Testes (escreva ANTES do código)
```javascript
// Escreva aqui os testes que validam a correção
// Use o framework de testes já presente no projeto (Jest, Vitest, etc.)
```

### Passo 2 — Código corrigido
```javascript
// Escreva aqui APENAS o código corrigido
// Inclua comentários explicando cada decisão de segurança
```

### Passo 3 — Explicação
Explique em até 5 bullets:
- O que estava vulnerável e por quê
- Como a correção elimina o vetor de ataque
- Qual princípio de segurança foi aplicado
- Como rodar os testes para validar
- O que monitorar em produção após o deploy

---

> ⚠️ **Regra:** não aceite uma correção que não venha acompanhada dos testes do Passo 1.
> Se a IA pular os testes, peça explicitamente antes de continuar.
