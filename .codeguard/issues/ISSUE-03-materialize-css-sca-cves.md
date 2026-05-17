Title: materialize-css@

Labels: security, dependency, high
Assignees: @owner-placeholder

Description
---
Trivy reported multiple CVEs affecting `materialize-css@1.0.0` (CVE-2019-11002, CVE-2019-11003, CVE-2019-11004, CVE-2022-25349). These are Cross-Site Scripting (XSS) vulnerabilities in tooltip, autocomplete and toast components.

Files/Lines
---
- package.json (dependency: "materialize-css": "^1.0.0")
- package-lock.json (materialize-css v1.0.0)

Impact
---
- XSS vulnerabilities may allow attackers to execute scripts in users' browsers when certain components are used with untrusted input (autocomplete, tooltip, toast).

Suggested Fixes (priority order)
---
1) Update dependency: check if a patched release exists and upgrade (run `npm view materialize-css versions`). If safe version available, `npm install materialize-css@<fixed-version>` and update lockfile.
2) If no patched release, remove or replace `materialize-css` and migrate to an alternative (Bootstrap, Bulma, vanilla components) or implement the specific components used.
3) Short-term mitigation: avoid using Autocomplete/Tooltip/Toast components and disable `M.AutoInit()` until dependency is fixed.

Testing / Acceptance
---
- `npm audit` shows no high/critical vulns for materialize-css after update/removal.
- Manual smoke tests: form selects, modals, toasts, autocomplete still work if replaced.
- Add a CI check (`scripts/checkPackageVulns.js`) that fails when vulnerable versions are present.

References
---
- https://github.com/Dogfalo/materialize
- https://github.com/advisories/GHSA-98f7-p5rc-jx67
- https://nvd.nist.gov/vuln/detail/CVE-2022-25349

Notes
---
I added `scripts/checkPackageVulns.js` which fails CI if materialize-css@1.0.x is present. Recommend creating a dedicated PR to remove/update the dependency and to adapt UI code accordingly.
