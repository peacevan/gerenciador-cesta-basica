# SPEC — Redesign da Tela Home (Empty State)

**Componente alvo:** `src/components/ListVoice.jsx` → `renderHome()`  
**CSS alvo:** `src/styles/ListVoice.css` → classes `.lv-home*`  
**Status:** Pendente de implementação

---

## 1. Título e Subtítulo

- **Remover** o ícone da sacola centralizado acima do título (`.lv-home__icon-wrap` + `.lv-home__bag`) — o header já exibe `shopping_bag`, é redundante
- Título: `"Pronto pra montar a compra do mês?"`
- Subtítulo: `"Escolha um template e ajuste pro que você precisa."`
- Alinhamento: centralizado
- Padding-top mínimo — conteúdo começa próximo ao header sem espaço morto

---

## 2. Botão Primário

- Fundo `#1D9E75`, largura 100%
- Ícone Material Icons `grid_view` à esquerda do label
- Label: `"Ver Listas Prontas"`
- `onClick`: `setView('listas')`

---

## 3. Chips de Template — Ordem por Frequência

> **CORREÇÃO v2:** Substituir `flex-wrap` por grid 2 colunas

```css
.lv-home__chips {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.lv-chip {
  height: 36px;
  /* ícone à esquerda, texto centralizado */
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

- Cada chip ocupa largura total da coluna (não ajusta ao conteúdo)
- Ícone `tpl.icone` à esquerda, label ocupa espaço restante com `flex: 1; text-align: left`
- Altura fixa `36px` para todos os chips
- Texto truncado com `text-overflow: ellipsis` se necessário

- Gerados dinamicamente a partir de `templatesDoSistema` (já disponível no componente via `useTemplates`)
- **Ordem de exibição** por frequência esperada para o público-alvo:
  1. Compra do Mês
  2. Feira
  3. Café da Manhã
  4. Limpeza
  5. Demais templates na sequência do array
- Implementação: ordenar o array antes de fazer `.map()`, usando um índice de prioridade por `id` ou `nome`
- Cada chip exibe: ícone do template (`tpl.icone`) + nome (`tpl.nome`)
- `onClick`: `setPreviewTpl(tpl); setView('preview')`
- Layout: `flex-wrap` horizontal
- Estilo: fundo branco (`var(--bg-primary)`), borda `0.5px solid var(--divider)`, `border-radius: 20px`

---

## 4. Divisor Contextual

Linha horizontal com texto centralizado usando layout flex:

```jsx
<div className="lv-home__divider">
  <span className="lv-home__divider-line" />
  <span className="lv-home__divider-text">ou repita a última compra</span>
  <span className="lv-home__divider-line" />
</div>
```

```css
.lv-home__divider       { display: flex; align-items: center; gap: 8px; width: 100%; }
.lv-home__divider-line  { flex: 1; height: 1px; background: var(--divider); }
.lv-home__divider-text  { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
```

- Exibir **somente se** houver histórico (mesma condição do card abaixo)

---

## 5. Card Última Compra

### Fonte dos dados
- `useHistorico()` — já importado no componente
- Pegar o snapshot mais recente: `snapshots[0]` (ordenado por data desc)

### Campos exibidos
| Campo | Origem no objeto de histórico |
|---|---|
| Ícone da categoria | `snapshot.templateIcone` ou fallback do `CATEGORIAS` |
| Nome do template | `snapshot.templateNome` |
| Estabelecimento | `snapshot.establishment?.name` ou `"—"` |
| Data | `snapshot.criadoEm` formatado como `dd/mm/aaaa` |
| Valor total | `snapshot.total` formatado como `R$ X.XXX,XX` |

### Badge de valor
- Fundo `#E1F5EE`, texto `#0F6E56`, `border-radius: 12px`, `padding: 2px 10px`

### Botões (grid 2 colunas, largura igual)
| Botão | Ação |
|---|---|
| "Ver itens" | `setPreviewTpl({ ...snapshot, itens: snapshot.itens }); setView('preview')` |
| "Usar de novo" | `handleUsarDeNovo(snapshot)` (já implementado) |

### Condição de exibição
- Ocultar **toda** a seção (divisor + card) se não houver nenhum snapshot no histórico
- Não exibir card vazio, placeholder ou skeleton

---

## 6. Botão Adicionar Manualmente

- Posição: abaixo do card de última compra (ou do botão primário se não houver histórico)
- Estilo: `background: transparent`, `border: 0.5px solid var(--divider)`, largura 100%
- Ícone `add` à esquerda
- Label: `"Adicionar item manualmente"`
- `onClick`: `openModal()` (abre o modal de adicionar item já existente)

---

## 7. Rodapé Global

> O rodapé já existe (`renderBottomNav()`). Ajustes necessários:

- 4 botões: Início (ativo na home), Listas, Carrinho, Loja
- Botão ativo: fundo `#E1F5EE`, cor `#1D9E75`
- **À esquerda do rodapé** (antes dos ícones): total do carrinho + contagem
  - Quando `itens.length === 0`: `"R$ 0,00 · 0 itens"`
  - Quando `itens.length > 0`: valor formatado + `"{n} itens"`
- Badge vermelho no ícone Carrinho quando `qtdTotal > 0` (já implementado)

### Estrutura HTML sugerida para o rodapé com total à esquerda

```jsx
<nav className="lv-bottom-nav">
  <div className="lv-nav-summary">
    <span className="lv-nav-summary__total">{total.toLocaleString(...)}</span>
    <span className="lv-nav-summary__count">{qtdTotal} itens</span>
  </div>
  {/* botões existentes */}
</nav>
```

```css
.lv-nav-summary        { display: flex; flex-direction: column; justify-content: center;
                          padding: 0 12px; border-right: 1px solid var(--divider); }
.lv-nav-summary__total { font-size: 13px; font-weight: 700; color: #1D9E75; line-height: 1; }
.lv-nav-summary__count { font-size: 10px; color: var(--text-secondary); line-height: 1; margin-top: 2px; }
```

---

## 8. Restrições — Não Alterar

| Item | Motivo |
|---|---|
| `localStorage` e suas chaves | Dados do usuário — risco de perda |
| `normalizeProductName` | Usado em múltiplos fluxos |
| `ModalEstabelecimento` | Componente estável |
| Schema do objeto de histórico | Compatibilidade com `useHistorico` |
| Nenhuma nova dependência npm | Bundle size e complexidade |

---

## Ordem de Implementação Sugerida

1. Remover `lv-home__icon-wrap` do JSX e CSS
2. Reordenar chips por frequência
3. Adicionar divisor contextual + condição de exibição
4. Refatorar card última compra com novos campos e botões
5. Ajustar botão "Adicionar manualmente" (label + estilo)
6. Adicionar total à esquerda do rodapé
7. Revisar CSS para eliminar scroll vertical
