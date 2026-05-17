Title: Replace insertAdjacentHTML usage — prevent XSS in list rendering

Labels: security, frontend, medium
Assignees: @owner-placeholder

Description
---
Semgrep detected `insertAdjacentHTML` being used with non-constant input in `script.js` which can lead to XSS if any item names are attacker-controlled or malformed.

Files/Lines
---
- script.js (line ~57 originally detected)

Reproduction
---
1. Load app and inject an item with a name containing HTML/JS payload (e.g. `<img src=x onerror=alert(1)>`) via localStorage or input.
2. If rendered via `insertAdjacentHTML` without proper escaping, the payload executes.

Suggested Fix
---
- Do not use `insertAdjacentHTML` with untrusted strings. Build DOM nodes via `document.createElement`, set `textContent` for user-provided text, and append nodes.
- Alternatively, sanitize inputs with a vetted library like DOMPurify before inserting HTML.

Security Rationale
---
- Using `textContent` or DOM creation avoids parsing the string as HTML and prevents script execution.

Acceptance Criteria / Tests
---
- Rendering path uses `textContent` or DOM APIs (automated check: `script.js` contains `criarItemElement` and no `insertAdjacentHTML` usage for list rendering).
- Unit test: attempt to add item with malicious name and verify no script executes and rendered text shows escaped content.

References
---
- https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
- https://github.com/cure53/DOMPurify

Notes
---
I replaced the `insertAdjacentHTML` call with a `criarItemElement` function that constructs nodes safely. Please review and add a unit test for rendering malicious inputs if desired.
