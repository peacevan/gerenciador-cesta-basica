Title: Security findings from .codeguard — summary and checklist

Labels: security, triage
Assignees: @owner-placeholder

Summary
---
This folder contains suggested issue templates to address findings from `.codeguard/findings-normalized.json` (Semgrep + Trivy). Create one PR per issue and assign priorities as noted.

Checklist
---
- [ ] Open PR for ISSUE-01: fix workflow interpolation (CI change already applied in branch)
- [ ] Open PR for ISSUE-02: XSS safe rendering (script.js already patched; add unit test)
- [ ] Open PR for ISSUE-03: materialize-css remediation (update/remove dependency)
- [ ] Add CI gating to fail on Trivy SCA high/critical vulns (or block merges until fixed)
- [ ] Add regression tests and security tests per SDD prompt files in `.codeguard/prompts/`

How to use
---
- Copy each `ISSUE-0X-*.md` into GitHub Issue body or create issues via API.
- Link corresponding PRs to issues and to the active PR `Mvp final` if appropriate.

If you want, I can open these issues and create the PRs for the code changes (workflow + script.js + scripts + MITIGATIONS).