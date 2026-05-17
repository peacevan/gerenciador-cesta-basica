# 🟡 SDD+TDD Prompt — `SEMGREP-TYPESCRIPT-REACT-SECURITY-AUDIT-REACT-UNSANITIZED-METHOD-REACT-UNSANITIZED-METHOD`

> **Severidade:** MEDIUM | **Tipo:** Análise estática (SAST) | **Fonte:** SEMGREP
> **Gerado em:** 2026-05-10 12:50 UTC

---

## 1. Contexto do problema

- **Arquivo:** `script.js`
- **Localização:** linha 57
- **Regra/CVE:** `typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method`

**Trecho de código:**
```javascript
requires login
```

**CWE:** CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')
**OWASP:** A07:2017 - Cross-Site Scripting (XSS), A03:2021 - Injection, A05:2025 - Injection

**Referências:**
  - https://developer.mozilla.org/en-US/docs/Web/API/Document/writeln
  - https://developer.mozilla.org/en-US/docs/Web/API/Document/write
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML

---

## 2. Descrição da vulnerabilidade

Detection of insertAdjacentHTML from non-constant definition. This can inadvertently expose users to cross-site scripting (XSS) attacks if this comes from user-provided input. If you have to use insertAdjacentHTML, consider using a sanitization library such as DOMPurify to sanitize your HTML.



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
