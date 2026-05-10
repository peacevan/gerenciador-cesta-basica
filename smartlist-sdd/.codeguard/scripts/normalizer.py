"""
normalizer.py
Unifica os findings do Semgrep e Trivy em um JSON normalizado único.
Output: .codeguard/findings-normalized.json
"""

import json
import os
from datetime import datetime

MIN_SEVERITY  = os.environ.get("MIN_SEVERITY", "MEDIUM").upper()
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
CODEGUARD     = os.path.join(BASE_DIR, "..")
SEMGREP_RAW   = os.path.join(CODEGUARD, "semgrep-raw.json")
TRIVY_RAW     = os.path.join(CODEGUARD, "trivy-raw.json")
OUTPUT        = os.path.join(CODEGUARD, "findings-normalized.json")

SEVERITY_ORDER = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}
SEMGREP_SEV    = {"ERROR": "HIGH", "WARNING": "MEDIUM", "INFO": "LOW"}


def acima_minimo(sev: str) -> bool:
    return SEVERITY_ORDER.get(sev.upper(), 0) >= SEVERITY_ORDER.get(MIN_SEVERITY, 2)


# ── Parser Semgrep ─────────────────────────────────────────────────────────────

def parse_semgrep() -> list[dict]:
    if not os.path.exists(SEMGREP_RAW):
        print("  ⚠️  semgrep-raw.json não encontrado")
        return []
    try:
        data = json.load(open(SEMGREP_RAW, encoding="utf-8"))
    except Exception as e:
        print(f"  ❌ Erro ao ler semgrep-raw.json: {e}")
        return []

    findings = []
    for r in data.get("results", []):
        sev_raw  = r.get("extra", {}).get("severity", "INFO").upper()
        severity = SEMGREP_SEV.get(sev_raw, sev_raw)

        if not acima_minimo(severity):
            continue

        findings.append({
            "id":          f"SEMGREP-{r.get('check_id', 'unknown').replace('.', '-').upper()}",
            "source":      "semgrep",
            "type":        "sast",
            "severity":    severity,
            "title":       r.get("extra", {}).get("message", "Vulnerabilidade detectada"),
            "rule":        r.get("check_id", ""),
            "file":        r.get("path", ""),
            "line_start":  r.get("start", {}).get("line"),
            "line_end":    r.get("end", {}).get("line"),
            "code":        r.get("extra", {}).get("lines", "").strip(),
            "cwe":         r.get("extra", {}).get("metadata", {}).get("cwe", []),
            "owasp":       r.get("extra", {}).get("metadata", {}).get("owasp", []),
            "references":  r.get("extra", {}).get("metadata", {}).get("references", []),
            "fix_hint":    r.get("extra", {}).get("fix", ""),
        })

    print(f"  ✅ Semgrep: {len(findings)} findings (>= {MIN_SEVERITY})")
    return findings


# ── Parser Trivy ───────────────────────────────────────────────────────────────

def parse_trivy() -> list[dict]:
    if not os.path.exists(TRIVY_RAW):
        print("  ⚠️  trivy-raw.json não encontrado")
        return []
    try:
        data = json.load(open(TRIVY_RAW, encoding="utf-8"))
    except Exception as e:
        print(f"  ❌ Erro ao ler trivy-raw.json: {e}")
        return []

    findings = []
    for result in data.get("Results", []):
        target = result.get("Target", "")

        # Vulnerabilidades em dependências
        for vuln in result.get("Vulnerabilities", []):
            severity = vuln.get("Severity", "LOW").upper()
            if not acima_minimo(severity):
                continue

            findings.append({
                "id":          f"TRIVY-VULN-{vuln.get('VulnerabilityID', 'unknown')}",
                "source":      "trivy",
                "type":        "sca",
                "severity":    severity,
                "title":       vuln.get("Title") or f"Vulnerabilidade em {vuln.get('PkgName')}",
                "rule":        vuln.get("VulnerabilityID", ""),
                "file":        target,
                "line_start":  None,
                "line_end":    None,
                "code":        None,
                "package":     vuln.get("PkgName", ""),
                "version":     vuln.get("InstalledVersion", ""),
                "fix_version": vuln.get("FixedVersion", ""),
                "cwe":         vuln.get("CweIDs", []),
                "cvss":        vuln.get("CVSS", {}),
                "description": vuln.get("Description", ""),
                "references":  vuln.get("References", [])[:3],
            })

        # Secrets expostos
        for secret in result.get("Secrets", []):
            severity = secret.get("Severity", "HIGH").upper()
            if not acima_minimo(severity):
                continue

            findings.append({
                "id":         f"TRIVY-SECRET-{secret.get('RuleID', 'unknown').upper()}",
                "source":     "trivy",
                "type":       "secret",
                "severity":   severity,
                "title":      f"Secret exposto: {secret.get('Title', secret.get('RuleID'))}",
                "rule":       secret.get("RuleID", ""),
                "file":       target,
                "line_start": secret.get("StartLine"),
                "line_end":   secret.get("EndLine"),
                "code":       secret.get("Match", ""),
                "cwe":        ["CWE-798"],
                "references": [],
            })

    print(f"  ✅ Trivy: {len(findings)} findings (>= {MIN_SEVERITY})")
    return findings


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("\n🔍 Normalizando findings...")

    semgrep_findings = parse_semgrep()
    trivy_findings   = parse_trivy()

    all_findings = semgrep_findings + trivy_findings

    # Ordenar por severidade (mais crítico primeiro)
    all_findings.sort(
        key=lambda f: SEVERITY_ORDER.get(f["severity"], 0),
        reverse=True
    )

    output = {
        "generated_at":  datetime.utcnow().isoformat() + "Z",
        "min_severity":  MIN_SEVERITY,
        "total":         len(all_findings),
        "summary": {
            "critical": sum(1 for f in all_findings if f["severity"] == "CRITICAL"),
            "high":     sum(1 for f in all_findings if f["severity"] == "HIGH"),
            "medium":   sum(1 for f in all_findings if f["severity"] == "MEDIUM"),
            "low":      sum(1 for f in all_findings if f["severity"] == "LOW"),
            "semgrep":  len(semgrep_findings),
            "trivy":    len(trivy_findings),
        },
        "findings": all_findings,
    }

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n📊 Resumo:")
    print(f"   CRITICAL : {output['summary']['critical']}")
    print(f"   HIGH     : {output['summary']['high']}")
    print(f"   MEDIUM   : {output['summary']['medium']}")
    print(f"   LOW      : {output['summary']['low']}")
    print(f"\n✅ findings-normalized.json gerado ({len(all_findings)} findings)")


if __name__ == "__main__":
    main()
