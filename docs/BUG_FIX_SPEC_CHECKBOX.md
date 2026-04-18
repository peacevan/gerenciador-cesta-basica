# BUG-013 Spec — Checkbox state must update total immediately

Short: When a user marks/unmarks an item (checkbox) the app must update the item's `comprado` state and the displayed total must include only marked items.

Owner: frontend
Priority: HIGH
Created: 2026-04-17

---

## Context
The application stores shopping list items and shows a running total. Items can be marked as "comprado" (bought). Currently the checkbox is not visible or not wired to the state in some views; the total sometimes doesn't reflect the marked state.

Files likely involved:
- `src/hooks/useShoppingList.js` — business logic and total calculation
- `src/components/ProductList.jsx` or `src/components/ProductList/*` — item rendering and checkbox
- `src/components/ListVoice.jsx` — summary/total UI
- `src/styles/ListVoice.css`, `src/styles/*.css` — CSS that may hide the checkbox
- `src/components/CardUltimoTemplate.jsx` — when reapplying templates ensure `comprado` is default false

---

## Requirements
1. The checkbox must be visible and keyboard-focusable next to each product name in the list (desktop and mobile). It must respect theme contrast.
2. Marking a checkbox sets `item.comprado = true`; unchecking sets `item.comprado = false`.
3. The running `total` shown in the footer/summary must always be the sum of values for `comprado === true` items.
4. Changing checkbox state must update UI immediately (no page reload). Changes must be persisted on save (same persistence used today — localStorage namespace `smart-list:*`).
5. Accessibility: checkbox must have `aria-label` or be associated with the product name via `label` element.
6. Unit tests and component tests must be added/updated to cover the behavior.

---

## Acceptance Criteria
- [ ] Checkbox is visible in `ProductList` next to each item in browser (light & dark themes).
- [ ] Clicking checkbox toggles `comprado` and the total updates immediately.
- [ ] Keyboard toggling (Space/Enter) toggles the checkbox and updates total.
- [ ] Saving the list persists `comprado` state; reloading the app restores checked items and total.
- [ ] Unit tests pass: `calcularTotalMarcados` returns expected sums.
- [ ] Component tests pass: ProductList renders checkbox and reacts to user input.

---

## Implementation notes
1. Inspect `useShoppingList.js` and ensure it exposes a function `toggleItemComprado(id)` or `marcarItem(id, comprado)`; if absent, add an explicit function that updates state immutably and persists change.
2. Ensure the total calculation function filters `itens.filter(i => i.comprado).reduce(...)` to compute the sum; expose both `total` and `totalMarcados` if needed.
3. In `ProductList.jsx` replace uncontrolled checkbox with controlled input:

```jsx
<input
  type="checkbox"
  checked={item.comprado === true}
  onChange={() => toggleItemComprado(item.id)}
  aria-label={`Marcar ${item.nome} como comprado`}
/>
```

4. Ensure the checkbox label uses `<label for=` or wraps the checkbox to increase hit area for touch devices.
5. CSS: ensure checkbox color/visibility on dark theme (use `filter`/`accent-color` or custom styled checkbox). Avoid `display:none` or `opacity:0` on `.checkbox` classes.
6. Persist changes using existing `save` flow in the hook (reuse `writeJSON` helper) so tests for persistence continue to work.

---

## Tests to add/update

### Unit tests (`src/hooks/__tests__/useShoppingList.pure.test.js`)
- test `toggleItemComprado(id)` toggles `comprado` boolean
- test `calcularTotalMarcados` sums only marked items and ignores unmarked
- test persist: after toggle and save, `readJSON` returns updated comprado state (mock localStorage)

### Component tests (`src/components/__tests__/ProductList.checkbox.test.js`)
- render `ProductList` with 3 items (two priced), simulate checking one box, assert total text updates
- simulate keyboard (Space) on focused checkbox and assert state and total updates

### Integration/E2E (Playwright)
- Flow: add items with prices, mark/unmark items, assert footer total updates and persists after reload

---

## Rollout plan
1. Implement functions in `useShoppingList` and unit tests (fast feedback).
2. Implement controlled checkbox in `ProductList` and component tests.
3. Adjust CSS for visibility and accessibility.
4. Run full test suite and fix regressions.
5. Manual QA: desktop + mobile, light/dark themes.

---

## Notes / Edge cases
- Items without price should not break total calculation (treat missing price as 0).
- If quantity/unit exist, total calculation should incorporate quantity × unitPrice if price per unit is the model — specify formula in team doc if ambiguous.
- If templates are applied (CardUltimoTemplate), ensure copied items default `comprado: false`.

---

End of spec for BUG-013.
