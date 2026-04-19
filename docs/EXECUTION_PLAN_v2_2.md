# Plano de Execução — Layout & UX v2.2

**Data:** 2026-04-17  
**Branch:** `feat/MVP_V2_1_implementation`  
**Spec de referência:** `docs/SPEC_LAYOUT_v2_2.md`  
**Estimativa total:** ~4–6 horas de implementação + testes

---

## Resumo de Fases

| Fase | Descrição | Arquivos | Dependências |
|---|---|---|---|
| 0 | Pré-verificação e baseline de testes | — | nenhuma |
| 1 | Header — btn-salvar + menu ⋮ revisado | `ListVoice.jsx`, `ListVoice.css` | — |
| 2 | Footer — nav-bar 3 botões | `ListVoice.jsx`, `ListVoice.css` | Fase 1 |
| 3 | Painel fullscreen inline (Listas Prontas) | `ListVoice.jsx`, `ListVoice.css` | Fase 2 |
| 4 | Grid de cards de templates | `ListVoice.css` | Fase 3 |
| 5 | Display overrides textuais | `ListVoice.jsx` | Fase 3 |
| 6 | Limpeza e remoção de código obsoleto | `ListVoice.jsx`, `ListVoice.css` | Fases 1–5 |
| 7 | Ajuste de testes | `__tests__/*.test.{js,jsx}` | Fase 6 |
| 8 | Validação final e commit | — | Fase 7 |

---

## FASE 0 — Pré-verificação

### 0.1 Rodar testes baseline
```powershell
$env:CI='true'; $env:NODE_OPTIONS='--max-old-space-size=2048'
npm test -- --runInBand --watchAll=false --testPathPattern "ListVoice"
```
Resultado esperado: **9/9 testes passando**.

### 0.2 Listar estados atuais do ListVoice.jsx
Confirmar que os estados necessários já existem:
- [x] `isTemplatesOpen` — existe (linha ~87)
- [x] `showQuickAdd` — existe (linha ~88) → será removido na Fase 6
- [ ] `templateSelecionado` — **não existe** → adicionar na Fase 3

### 0.3 Confirmar importações disponíveis
```js
import useTemplates from '../hooks/useTemplates.js'; // ✅ já importado
import ModalEditarTemplate from './ModalEditarTemplate.jsx'; // verificar se já importado
```

---

## FASE 1 — Header

### 1.1 Adicionar `.header-right` no JSX
**Arquivo:** `src/components/ListVoice.jsx`

Localizar o bloco `<div className="list-voice-header">` (linha ~367).

**Mudança:** Envolver `btn-config` e adicionar `btn-salvar` dentro de `<div className="header-right">`.

```jsx
// ANTES
<button className="btn-config" onClick={toggleMenu} aria-label="Configurações">
  <i className="material-icons">more_vert</i>
</button>

// DEPOIS
<div className="header-right">
  {itens.length > 0 && (
    <button className="btn-salvar" onClick={handleSaveList}>
      <i className="material-icons">save</i>
      Salvar
    </button>
  )}
  <button className="btn-config" onClick={toggleMenu} aria-label="Menu">
    <i className="material-icons">more_vert</i>
  </button>
</div>
```

### 1.2 Revisar itens do menu ⋮
**Arquivo:** `src/components/ListVoice.jsx`

Adicionar no `config-menu`:
- `📷 Importar foto de nota` → `openNotaModal(); closeMenu();`
- `📝 Importar texto livre` → `openTextoModal(); closeMenu();`

Manter:
- Histórico de listas
- Compartilhar (condicional)
- Modo claro/escuro
- Limpar lista (condicional)

### 1.3 Adicionar CSS do header-right
**Arquivo:** `src/styles/ListVoice.css`

Após o seletor `.list-voice-header`, adicionar:
```css
.header-right { display: flex; align-items: center; gap: 8px; }

.btn-salvar {
  display: flex; align-items: center; gap: 4px;
  background: #238636; color: #fff;
  border: none; border-radius: 8px;
  padding: 6px 12px; font-size: 13px;
  font-weight: 500; cursor: pointer;
}
.btn-salvar i { font-size: 16px; }
```

### 1.4 Verificação da Fase 1
- [ ] Botão Salvar aparece no header quando há itens
- [ ] Botão Salvar não aparece quando lista vazia
- [ ] Menu ⋮ contém "Importar foto" e "Importar texto"
- [ ] Demais itens do menu preservados

---

## FASE 2 — Footer Nav-bar

### 2.1 Substituir conteúdo do `<footer>` no JSX
**Arquivo:** `src/components/ListVoice.jsx`

Localizar `<footer className="list-voice-footer">` (linha ~563).

Substituir todo o conteúdo interno pelo novo:
```jsx
<footer className="list-voice-footer">
  <div className="footer-left">
    <h5 className="footer-total">
      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </h5>
    <p className="footer-items-count">
      {qtdMarcados} / {qtdTotal} itens
    </p>
  </div>

  <div className="footer-nav">
    <button
      className={`nav-btn${isTemplatesOpen ? ' active' : ''}`}
      onClick={() => setIsTemplatesOpen(true)}
    >
      <i className="material-icons">grid_view</i>
      <span>Listas Prontas</span>
    </button>
    <button
      className="nav-btn"
      onClick={() => setIsModalOpen(true)}
    >
      <i className="material-icons">search</i>
      <span>Adicionar</span>
    </button>
    <button
      className={`nav-btn${isListening ? ' active' : ''}${isProcessing ? ' processing' : ''}`}
      onClick={isListening ? stopListening : startListening}
      disabled={isProcessing}
    >
      <i className="material-icons">
        {isProcessing ? 'hourglass_top' : 'mic'}
      </i>
      <span>Voz</span>
    </button>
  </div>
</footer>
```

### 2.2 Atualizar CSS do footer
**Arquivo:** `src/styles/ListVoice.css`

Substituir seletores `.list-voice-footer`, `.footer-actions`, `.footer-action-button` pelo novo CSS (ver spec §4).

Adicionar seletores `.footer-nav`, `.nav-btn`, `.nav-btn.active`, `.nav-btn.processing`.

### 2.3 Verificação da Fase 2
- [ ] Footer mostra total e contagem à esquerda
- [ ] Footer mostra exatamente 3 botões à direita
- [ ] Ícone acima, label abaixo em cada botão
- [ ] `nav-btn.active` muda de cor ao ouvir/abrir painel

---

## FASE 3 — Painel Fullscreen de Listas Prontas

### 3.1 Adicionar estado `templateSelecionado`
**Arquivo:** `src/components/ListVoice.jsx`

Na seção de estados (após `showQuickAdd`):
```js
const [templateSelecionado, setTemplateSelecionado] = useState(null);
```

### 3.2 Adicionar derivação de dados
**Arquivo:** `src/components/ListVoice.jsx`

Na seção `// ── Totais ─────────────────────────────────────────────────` (após qtdMarcados):
```js
const todosTemplates      = listarTemplates();
const templatesDoSistema  = todosTemplates.filter(t => t.sistema);
const templatesdoUsuario  = todosTemplates.filter(t => !t.sistema);
```

### 3.3 Adicionar função `aplicarTemplateSelecionado`
**Arquivo:** `src/components/ListVoice.jsx`

Na seção `// ── Templates ─────────────────────────────────────────────`:
```js
const aplicarTemplateSelecionado = () => {
  if (!templateSelecionado) return;
  if (itens.length > 0) {
    handleTemplatesSubstituir(templateSelecionado.itens, templateSelecionado);
  } else {
    handleTemplatesAdicionar(templateSelecionado.itens, templateSelecionado);
  }
  setIsTemplatesOpen(false);
  setTemplateSelecionado(null);
};
```

### 3.4 Adicionar função `abrirEdicaoTemplate`
**Arquivo:** `src/components/ListVoice.jsx`

```js
const abrirEdicaoTemplate = (template) => {
  // Reusar lógica do ModalTemplates se disponível
  // ou abrir ModalEditarTemplate diretamente
  setEditingTemplate(template);
};
const [editingTemplate, setEditingTemplate] = useState(null);
```

> **Atenção:** `ModalEditarTemplate` precisa ser importado se ainda não estiver.

### 3.5 Renderizar painel inline no JSX
**Arquivo:** `src/components/ListVoice.jsx`

Adicionar o bloco `{isTemplatesOpen && ( <div className="modal-fullscreen"> ... </div> )}` **imediatamente antes** do `<footer>`, dentro do `div.list-voice-container`.

Ver JSX completo em `SPEC_LAYOUT_v2_2.md §5`.

### 3.6 Remover chamada ao `<ModalTemplates>` do JSX
**Arquivo:** `src/components/ListVoice.jsx`

Localizar `<ModalTemplates` e remover (ou comentar para referência).

### 3.7 Adicionar CSS do modal fullscreen
**Arquivo:** `src/styles/ListVoice.css`

Adicionar seletores da spec §6.

### 3.8 Verificação da Fase 3
- [ ] Painel aparece ao clicar "Listas Prontas" no footer
- [ ] Painel cobre 100% da tela (position: absolute)
- [ ] Botão × fecha o painel e limpa `templateSelecionado`
- [ ] Selecionar card destaca com borda
- [ ] Botão "Usar lista selecionada" desabilitado sem seleção
- [ ] Confirmar aplica itens e fecha painel

---

## FASE 4 — Grid de Cards

### 4.1 Adicionar CSS do grid
**Arquivo:** `src/styles/ListVoice.css`

Adicionar seletores da spec §7:
- `.templates-grid`
- `.template-card`
- `.template-card.selected`
- `.template-icon`
- `.template-info`
- `.template-name`
- `.template-count`
- `.template-edit-btn`
- `.section-label`
- `.btn-criar-template`

### 4.2 Verificação da Fase 4
- [ ] Cards exibidos em 2 colunas sem extravasar a largura
- [ ] Nome truncado com ellipsis em telas pequenas
- [ ] `selected` adiciona borda colorida
- [ ] Ícone de edição visível em cada card

---

## FASE 5 — Overrides textuais

### 5.1 "Cesta Básica (DIEESE)" → "Cesta (DIEESE)"
**Arquivo:** `src/components/ListVoice.jsx`

Na renderização do `.template-name` dentro do painel:
```jsx
<div className="template-name">
  {t.nome.replace('Cesta Básica', 'Cesta')}
</div>
```

> **Por que aqui e não no hook:** `useTemplates.js` está na lista de arquivos proibidos. A substituição de display é feita apenas no render visual.

### 5.2 "Templates" → "Listas Prontas" em textos visuais
**Arquivos:** `src/components/ListVoice.jsx`

Localizar todas as strings visíveis ao usuário:
- Botão do empty state: `"Escolher Template →"` → `"Listas Prontas →"`
- Qualquer texto "Template" em `section-label`, títulos ou botões

> **Não renomear:** variáveis internas (`isTemplatesOpen`, `templateSelecionado`, hooks, funções).

### 5.3 Verificação da Fase 5
- [ ] "Cesta (DIEESE)" aparece no card (sem "Básica")
- [ ] Nenhum texto visível usa "Templates" no singular como rótulo de ação

---

## FASE 6 — Limpeza de código obsoleto

### 6.1 Remover `showQuickAdd` e `footer-quick-add`
**Arquivo:** `src/components/ListVoice.jsx`

- Remover `const [showQuickAdd, setShowQuickAdd] = useState(false);`
- Remover o bloco JSX `<div className={`footer-quick-add...`>`
- Remover botão `btn-toggle-add`

**Arquivo:** `src/styles/ListVoice.css`
- Remover `.footer-quick-add`, `.footer-quick-add.hidden`, `.btn-toggle-add`

### 6.2 Remover estilos obsoletos do footer
**Arquivo:** `src/styles/ListVoice.css`
- Remover `.footer-action-button`, `.footer-save`, `.footer-templates`, `.footer-texto`, `.footer-mic`, `.footer-foto`
- Remover `.footer-top-info`, `.footer-actions`

### 6.3 Verificação da Fase 6
- [ ] Nenhum warning de estado não usado
- [ ] CSS sem regras mortas evidentes

---

## FASE 7 — Ajuste de Testes

### 7.1 Identificar falhas
```powershell
$env:CI='true'; $env:NODE_OPTIONS='--max-old-space-size=2048'
npm test -- --runInBand --watchAll=false --testPathPattern "ListVoice"
```

### 7.2 Falhas prováveis e corretivos

| Teste | Causa provável | Correção |
|---|---|---|
| `ListVoice.test.js` — busca por "Templates" | Texto mudou para "Listas Prontas" | Atualizar `getByText` |
| `ListVoice.test.js` — busca por botão Salvar no footer | Salvar foi para o header | Atualizar seletor |
| `ListVoice.checkbox.test.jsx` | Estrutura da tabela inalterada | Provavelmente sem impacto |

### 7.3 Critério de saída da Fase 7
Todos os testes existentes passando (sem regressões).

---

## FASE 8 — Validação Final e Commit

### 8.1 Execução de todos os testes impactados
```powershell
$env:CI='true'; $env:NODE_OPTIONS='--max-old-space-size=2048'
npm test -- --runInBand --watchAll=false --testPathPattern "ListVoice|ModalTemplates"
```

### 8.2 Build de verificação
```powershell
npm run build 2>&1 | Select-String "error|warning|compiled"
```

### 8.3 Atualizar dashboard.html
- Incrementar versão para `v2.2.0`
- Adicionar entry em "fases concluídas": `MVP 2.2 ✅ (nav-bar footer + modal fullscreen)`

### 8.4 Commit
Seguir convenção `docs/COMMIT_GUIDELINES.md`:
```
feat(list-voice): refactor footer to 3-button nav-bar (v2.2)

- Replace 5-button footer with WhatsApp-style nav-bar (Listas Prontas | Adicionar | Voz)
- Move Salvar button to header (visible only with items)
- Move importar foto/texto to ⋮ menu
- Replace ModalTemplates with fullscreen inline panel
- Add 2-column template card grid with overflow control
- Rename user-visible "Templates" → "Listas Prontas"
- Display "Cesta (DIEESE)" without "Básica" (render override)
- Hide "Meus Templates" section when no user templates exist
- Remove showQuickAdd state and related CSS

Closes: BUG-014 (if applicable)
```

---

## Ordem de Implementação Recomendada

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

Cada fase deve ser verificada antes de avançar. Se um critério de verificação falhar, corrigir antes de prosseguir.

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `ModalEditarTemplate` não importado | Média | Verificar import no passo 0.3; adicionar se ausente |
| `listarTemplates()` não é método no hook | Baixa | Hook desestrutura `listarTemplates` — verificar export do hook |
| `color-mix()` não suportado no Safari <16 | Média | Usar `rgba(76, 175, 80, 0.08)` como fallback |
| Testes de snapshot quebram | Baixa | Rodar testes após cada fase |
| `isTemplatesOpen` + `ModalTemplates` abrir em paralelo | Média | Remover `<ModalTemplates>` do JSX na Fase 3 passo 3.6 |
