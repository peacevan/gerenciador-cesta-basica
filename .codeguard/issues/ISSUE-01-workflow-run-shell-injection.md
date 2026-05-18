Title: Fix GitHub Actions `run:` shell-injection risk (use env instead of github context)

Labels: security, ci, high
Assignees: @owner-placeholder

Description
---
Semgrep flagged interpolation of `github` context inside `run:` blocks in `.github/workflows/sdd-pipeline.yml`. Direct `${{ github... }}` usage inside `run:` can allow untrusted input to be interpreted by the shell and lead to command injection (CWE-78).

Files/Lines
---
- .github/workflows/sdd-pipeline.yml (original finding lines ~71–77)

Reproduction
---
1. Inspect `run:` blocks in the workflow and search for `${{ github.` occurrences.
2. If present, an attacker able to control the referenced github context could inject shell content.

Suggested Fix
---
- Move interpolated inputs into `env:` at job or step level (e.g. `env: SEVERITY: ${{ github.event.inputs.severity }}`) and reference the env var inside `run:` as `"$SEVERITY"` or `$SEVERITY`.
- Avoid concatenating or echoing untrusted values into commands; pass them as arguments to scripts.

Security Rationale
---
- Treat `github` context as untrusted input. Interpolating it directly into shell code allows arbitrary command execution.
- Using `env` and quoting prevents shell evaluation of special characters introduced by untrusted input.

Acceptance Criteria / Tests
---
- No `run:` block in workflows contains `${{ github.` (automated check: `scripts/checkWorkflowRunSafety.js` passes).
- CI fails if a future commit reintroduces unsafe interpolation.

References
---
- https://docs.github.com/en/actions/learn-github-actions/security-hardening-for-github-actions#understanding-the-risk-of-script-injections
- https://securitylab.github.com/research/github-actions-untrusted-input/

Notes
---
I applied a fix that moves the `severity` value to job `env` and updated `sdd-pipeline.yml`. Please review and if you prefer a different pattern (e.g., passing arguments to a script file), adapt accordingly.
