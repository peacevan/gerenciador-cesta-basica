"""
prompt_generator.py
Lê o findings-normalized.json e gera um arquivo .md por finding
no formato SDD+TDD usando a API da Anthropic.
Output: .codeguard/prompts/prompt-{ID}.md
"""

import json
import os
import re
import requests
from datetime import datetime

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
CODEGUARD       = os.path.join(BASE_DIR, "..")
FINDINGS_FILE   = os.path.join(CODEGUARD, "findings-normalized.json")
PROMPTS_DIR     = os.path.join(CODEGUARD, "prompts")
ANTHROPIC_KEY   = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL   = "https://api.anthropic.com/v1/messages"
MODEL           = "claude-sonnet-4-20250514"


# ── Gerador de prompt SDD+TDD (sem IA — estrutura base) ───────────────────────

def montar_contexto(f: dict) -> str:
    """Monta o bloco de contexto do finding."""
    linhas = []

    if f.get("file"):
        linhas.append(f"- **Arquivo:** `{f['file']}`")
    if f.get("line_start"):
        linha_info = f"linha {f['line_start']}"
        if f.get("line_end") and f["line_end"] != f["line_start"]:
            linha_info += f"–{f['line_end']}"
        linhas.append(f"- **Localização:** {linha_info}")
    if f.get("package"):
        linhas.append(f"- **Pacote:** `{f['package']}` v{f.get('version', '?')}")
        if f.get("fix_version"):
            linhas.append(f"- **Versão corrigida:** `{f['fix_version']}`")
    if f.get("rule"):
        linhas.append(f"- **Regra/CVE:** `{f['rule']}`")
    if f.get("code"):
        codigo = f["code"][:500]  # limitar tamanho
        linhas.append(f"\n**Trecho de código:**\n```javascript\n{codigo}\n```")

    return "\n".join(linhas)


def montar_prompt_base(f: dict) -> str:
    """Monta o prompt SDD+TDD completo para um finding."""

    severidade_emoji = {
        "CRITICAL": "🔴",
        "HIGH":     "🟠",
        "MEDIUM":   "🟡",
        "LOW":      "🔵",
    }.get(f["severity"], "⚪")

    tipo_label = {
        "sast":   "Análise estática (SAST)",
        "sca":    "Vulnerabilidade em dependência (SCA)",
        "secret": "Secret exposto",
    }.get(f["type"], f["type"])

    cwe_str = ", ".join(f.get("cwe", [])) if f.get("cwe") else "N/A"
    owasp_str = ", ".join(f.get("owasp", [])) if f.get("owasp") else "N/A"
    refs = f.get("references", [])[:3]
    refs_str = "\n".join(f"  - {r}" for r in refs) if refs else "  - N/A"

    contexto = montar_contexto(f)
    descricao = f.get("description") or f.get("title", "")

    prompt = f"""# {severidade_emoji} SDD+TDD Prompt — `{f['id']}`

> **Severidade:** {f['severity']} | **Tipo:** {tipo_label} | **Fonte:** {f['source'].upper()}
> **Gerado em:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC

---

## 1. Contexto do problema

{contexto}

**CWE:** {cwe_str}
**OWASP:** {owasp_str}

**Referências:**
{refs_str}

---

## 2. Descrição da vulnerabilidade

{descricao or f['title']}

{f'**Dica de correção:** {f["fix_hint"]}' if f.get('fix_hint') else ''}

---

## 3. Requisitos SDD (Security-Driven Development)

A correção **deve**:

- [ ] Eliminar completamente o vetor de ataque identificado
- [ ] Não introduzir novas superfícies de ataque
- [ ] Seguir o princípio do menor privilégio
- [ ] Validar e sanitizar todos os inputs relacionados
- [ ] Não expor informações sensíveis em logs, erros ou responses
- [ ] Ser compatível com a versão atual do projeto (sem breaking changes)
{f'- [ ] Atualizar `{f["package"]}` para a versão `{f["fix_version"]}` ou superior' if f.get('fix_version') else ''}

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
"""
    return prompt


# ── Enriquecimento via Claude API (opcional) ───────────────────────────────────

def enriquecer_com_ia(finding: dict, prompt_base: str) -> str:
    """
    Usa a API da Anthropic para enriquecer a descrição e os requisitos SDD+TDD.
    Se não tiver API key, retorna o prompt base sem enriquecimento.
    """
    if not ANTHROPIC_KEY:
        print("  ℹ️  ANTHROPIC_API_KEY não configurada — usando prompt base")
        return prompt_base

    system = """Você é um especialista em segurança de software (AppSec) e TDD.
Receberá um finding de segurança e um prompt SDD+TDD base.
Sua tarefa é APENAS enriquecer as seções 2, 3 e 4 com:
- Descrição técnica mais precisa da vulnerabilidade
- Requisitos SDD específicos para o contexto do finding
- Exemplos concretos de testes para a seção TDD

Retorne o markdown completo com as melhorias. Mantenha a estrutura exata.
Responda SOMENTE com o markdown, sem comentários adicionais."""

    user = f"""Finding:
{json.dumps(finding, ensure_ascii=False, indent=2)}

Prompt base:
{prompt_base}"""

    try:
        resp = requests.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key":         ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
            json={
                "model":      MODEL,
                "max_tokens": 2000,
                "system":     system,
                "messages":   [{"role": "user", "content": user}],
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]
    except Exception as e:
        print(f"  ⚠️  API Anthropic falhou ({e}) — usando prompt base")
        return prompt_base


# ── Gerador de nome do arquivo ─────────────────────────────────────────────────

def nome_arquivo(finding: dict) -> str:
    """Gera nome do arquivo markdown a partir do ID do finding."""
    safe_id = re.sub(r"[^a-zA-Z0-9\-]", "-", finding["id"])
    safe_id = re.sub(r"-+", "-", safe_id).strip("-").lower()
    return f"prompt-{safe_id}.md"


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("\n📝 Gerando prompts SDD+TDD...")

    if not os.path.exists(FINDINGS_FILE):
        print("❌ findings-normalized.json não encontrado. Rode o normalizer primeiro.")
        return

    data     = json.load(open(FINDINGS_FILE, encoding="utf-8"))
    findings = data.get("findings", [])

    if not findings:
        print("✅ Nenhum finding acima do nível mínimo. Nenhum prompt gerado.")
        return

    os.makedirs(PROMPTS_DIR, exist_ok=True)

    # Limpar prompts antigos
    for f in os.listdir(PROMPTS_DIR):
        if f.endswith(".md"):
            os.remove(os.path.join(PROMPTS_DIR, f))

    gerados = 0
    for finding in findings:
        print(f"  → {finding['id']} [{finding['severity']}]")

        prompt_base     = montar_prompt_base(finding)
        prompt_final    = enriquecer_com_ia(finding, prompt_base)
        arquivo         = os.path.join(PROMPTS_DIR, nome_arquivo(finding))

        with open(arquivo, "w", encoding="utf-8") as f:
            f.write(prompt_final)

        gerados += 1

    # Gerar índice dos prompts
    _gerar_indice(findings)

    print(f"\n✅ {gerados} prompts gerados em .codeguard/prompts/")


def _gerar_indice(findings: list[dict]):
    """Gera um índice markdown com todos os prompts gerados."""
    emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵"}

    linhas = [
        "# CodeGuard — Índice de Prompts SDD+TDD",
        f"\n> Gerado em {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC\n",
        f"**Total de findings:** {len(findings)}\n",
        "| Severidade | ID | Tipo | Arquivo | Prompt |",
        "|---|---|---|---|---|",
    ]

    for f in findings:
        sev   = f["severity"]
        em    = emoji.get(sev, "⚪")
        fname = nome_arquivo(f)
        arq   = f.get("file") or f.get("package") or "—"
        linhas.append(
            f"| {em} {sev} | `{f['id']}` | {f['type'].upper()} | `{arq}` | [abrir](prompts/{fname}) |"
        )

    indice = os.path.join(os.path.dirname(PROMPTS_DIR), "prompts", "..")
    with open(os.path.join(CODEGUARD, "INDEX.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    print("  📋 INDEX.md gerado")


if __name__ == "__main__":
    main()
