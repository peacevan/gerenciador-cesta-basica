# Plano de Melhoria de Layout — MVP v2.1.2

**Data:** 2026-04-17  
**Status:** Aprovado para implementação  
**Escopo:** melhorias visuais e de UX sem redesign completo — refino MVP

---

## Análise do estado atual (baseada nos prints)

| Item | Estado atual | Problema |
|---|---|---|
| Header | Gradiente verde/cyan | Chama atenção demais, não é neutro |
| Modal Templates | Altura fixa, scroll vertical | Corta conteúdo em mobile |
| Ação template | Botões grandes "Substituir/Adicionar" | Ocupa espaço; exige dois cliques para confirmar |
| Lista de itens | `<table>` com colunas fixas | Quebra em mobile; espaçamento desigual |
| Preço inline | `<input type="number">` sem máscara | UX ruim — sem "R$", sem formatação |
| Quick-add footer | Input sempre visível | Toma espaço desnecessariamente |
| Cores de ação | Verde (#4CAF50) em tudo | Saturado; footer e header ficam pesados |

---

## Escopo de mudanças

### 1 — Header neutro
**Arquivo:** `src/styles/ListVoice.css`

- Remover `linear-gradient(135deg, accent-primary, accent-secondary)` do `.list-voice-header`
- Substituir por cor sólida neutra: `var(--bg-secondary)` com `border-bottom: 1px solid var(--divider)` e `box-shadow` sutil
- Texto do header passa de branco para `var(--text-primary)`
- Botão de menu (⋮) usa `var(--text-secondary)`

---

### 2 — Tabela → Grid fluido com proporções corretas
**Arquivo:** `src/styles/ListVoice.css` + `src/components/ListVoice.jsx`

Substituir `<table>` por `<div>` com CSS Grid:

```
Nome do produto   40%
Qtd / Un          15%  (juntos, sem espaçamento excessivo)
Preço unit.       15%
Total             15%
Lixeira            5%
Checkbox           10% (coluna à esquerda)
```

- Eliminar `border-collapse`, `thead/tbody` em favor de `display: grid`
- Header da lista: linha cinza leve com labels menores
- Items: altura mínima 48px (touch-friendly)
- Em mobile (< 480px): ocultar colunas "Qtd/Un" e "Total", mostrar só Nome + Preço + Lixeira

---

### 3 — Preço com máscara de moeda
**Arquivo:** `src/components/ListVoice.jsx`

- Adicionar função `formatCurrency(val)` local que formata como `R$ x.xxx,xx` ao exibir
- O `<input>` continua sendo `type="number"` para compatibilidade com o hook, mas com prefixo visual `R$`
- Ao sair do campo (onBlur) mostrar valor formatado; ao focar (onFocus) mostrar número bruto

---

### 4 — Quick-add oculto por padrão
**Arquivo:** `src/components/ListVoice.jsx` + `src/styles/ListVoice.css`

- Novo estado `showQuickAdd` (default: `false`)
- Botão `+` no footer *sempre visível* — clicar alterna visibilidade do autocomplete
- Animação de expand/collapse com `max-height` transition
- Quando input aberto, botão `+` vira `×`

---

### 5 — Modal Templates: fullscreen mobile + checkboxes de ação
**Arquivo:** `src/components/ModalTemplates.jsx` + `src/styles/ListVoice.css`

#### 5a — Fullscreen mobile
```css
@media (max-width: 600px) {
  .modal-templates {
    width: 100% !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }
  .modal-templates .modal-body.templates-body {
    overflow-y: auto;
    flex: 1;
  }
}
```

#### 5b — Checkboxes em vez de botões grandes
Estado atual: dois botões `Substituir lista` / `Adicionar à lista`  
Novo estado:
```jsx
// modoAcao padrão = 'adicionar' (pre-checked)
<label>
  <input type="radio" name="acao" value="adicionar" checked={modoAcao==='adicionar'} /> 
  Adicionar à lista
</label>
<label>
  <input type="radio" name="acao" value="substituir" checked={modoAcao==='substituir'} />
  Substituir lista
</label>
```
- Radios ficam inline e compactos
- `modoAcao` inicia como `'adicionar'` (padrão seguro)
- Botão "Confirmar" habilita tão logo um template esteja selecionado (não precisa escolher ação explicitamente)

#### 5c — Preview sem scroll próprio
- `.template-preview-list` Remove `max-height: 140px; overflow-y: auto`
- Mostra no máximo 5 itens + "...e N mais" texto

---

### 6 — Footer neutro
**Arquivo:** `src/styles/ListVoice.css`

- `.list-voice-footer` background: `var(--bg-secondary)` + `border-top: 1px solid var(--divider)` (sem gradiente verde)
- `.footer-total` cor: `var(--text-primary)` (não mais branco hardcoded)
- Botão Templates: cor `var(--accent-primary)` mantida mas sem degradê no fundo do footer
- Botões de ação secundários (texto/mic/câmera): `var(--bg-tertiary)` fundo, `var(--text-secondary)` ícone

---

## Arquivos a modificar

| Arquivo | Tipo de mudança |
|---|---|
| `src/styles/ListVoice.css` | Header neutro, grid fluido, footer neutro, modal fullscreen, checkbox-acao |
| `src/components/ListVoice.jsx` | Grid de itens, quick-add toggle, máscara de preço |
| `src/components/ModalTemplates.jsx` | Radio/checkbox de ação, `modoAcao` default `'adicionar'` |

---

## O que NÃO muda neste ciclo

- Lógica dos hooks (`useShoppingList`, `useTemplates`, `useVoiceRecognition`)
- Funcionalidades existentes (voz, OCR, histórico, perfil familiar)
- Temas claro/escuro (variáveis CSS mantidas)
- Rotas e estrutura de componentes

---

## Acceptance Criteria

- [ ] Header sem gradiente verde; texto legível em tema claro e escuro
- [ ] Lista de itens usa grid flexível com proporções corretas
- [ ] Quick-add input oculto por padrão; aparece ao clicar `+`
- [ ] Modal Templates 100% da tela em mobile sem scroll externo
- [ ] Ação do template (Adicionar/Substituir) em radios compactos com "Adicionar" pré-selecionado
- [ ] Campo de preço exibe "R$" e formata ao perder foco
- [ ] Footer sem degradê verde; legível nos dois temas
- [ ] Testes existentes continuam passando

