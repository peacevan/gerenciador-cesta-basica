# Plano de Execução — Histórico de Compras

**Spec de referência:** `docs/SPEC_HISTORICO_v1.md`  
**Branch:** feat/MVP_V2_1_implementation  
**Abordagem:** passos incrementais, cada passo deve compilar e não quebrar funcionalidade existente.

---

## Resumo dos Passos

| # | Passo | Arquivo(s) | Risco |
|---|---|---|---|
| 1 | Enriquecer `salvarSnapshot` | `useHistorico.js` | Baixo |
| 2 | Adicionar `limparHistorico` | `useHistorico.js` | Baixo |
| 3 | Expor `limparHistorico` no hook React | `useHistorico.js` | Baixo |
| 4 | Adicionar estado e lógica pós-Finalizar | `ListVoice.jsx` | Médio |
| 5 | Renderizar view `historico` | `ListVoice.jsx` | Médio |
| 6 | Renderizar view `detalhe` | `ListVoice.jsx` | Médio |
| 7 | Estilizar views novas | `ListVoice.css` | Baixo |
| 8 | Atualizar `CardUltimoTemplate` | `CardUltimoTemplate.jsx` | Baixo |
| 9 | Ajustar `renderBottomNav` — manter 4 ícones | `ListVoice.jsx` | Baixo |
| 10 | Testes unitários e regressão | `__tests__/` | Baixo |

---

## Passo 1 — Enriquecer `salvarSnapshot`

**Arquivo:** `src/hooks/useHistorico.js`  
**O que muda:** `salvarSnapshot` passa a aceitar e persistir campos extras.

```js
// Assinatura atual:
salvarSnapshot(itens, totalGasto, estabelecimento)

// Assinatura nova (compatível — mesmo número de args, 4º opcional):
salvarSnapshot(itens, totalGasto, estabelecimento, meta = {})
// meta = { templateNome, templateCategoria }
```

Campos calculados automaticamente dentro de `salvarSnapshot`:
```js
totalItens: itens.length,
itensSemPreco: itens.filter(i => !i.preco && !i.precoUnitario).length,
templateNome: meta.templateNome || null,
templateCategoria: meta.templateCategoria || null,
```

Mapeamento de campos de item:
```js
itens: itens.map(it => ({
  nome: it.nome,
  quantidade: it.quantidade,
  unidade: it.unidade,
  preco: it.preco,           // mantido (compatibilidade)
  comprado: !!it.comprado,   // mantido (compatibilidade)
  precoUnitario: it.precoUnitario ?? (it.preco ? parseFloat(it.preco) : null),
  precoTotal: it.precoTotal ?? null,
  marcado: !!it.comprado,
}))
```

**Critério de conclusão:** testes existentes em `useHistorico.test.js` continuam passando.

---

## Passo 2 — Adicionar `limparHistorico`

**Arquivo:** `src/hooks/useHistorico.js`  
**O que muda:** nova função na API.

```js
const limparHistorico = () => {
  try { localStorage.removeItem(HISTORY_KEY); } catch (e) { console.warn('limparHistorico', e); }
};
```

Expor no `return` de `createHistoricoAPI` e no hook React.

---

## Passo 3 — Estado e lógica pós-Finalizar em `ListVoice.jsx`

**Arquivo:** `src/components/ListVoice.jsx`  
**O que muda:**

1. Importar `limparHistorico` via `useHistorico`:
   ```js
   const { registrar, salvarSnapshot, listarSnapshots, limparHistorico } = useHistorico();
   ```

2. Adicionar estado:
   ```js
   const [detalheId, setDetalheId] = useState(null);
   ```

3. Modificar `handleConfirmSave`:
   ```js
   // após salvarSnapshot:
   limparLista();
   setView('historico');
   showToast('Compra salva no histórico!');
   ```

4. Passar `meta` para `salvarSnapshot`:
   ```js
   salvarSnapshot(itens, total, estabelecimento, {
     templateNome: ultimoTemplateUsado.current?.nome || null,
     templateCategoria: ultimoTemplateUsado.current?.categoria || null,
   });
   ```

**Critério de conclusão:** ao finalizar compra, navega para a view `historico` com toast visível.

---

## Passo 4 — Renderizar view `historico`

**Arquivo:** `src/components/ListVoice.jsx`  
**O que muda:** nova função `renderHistorico()`.

```jsx
const renderHistorico = () => {
  const snaps = listarSnapshots();
  const totalCompras = snaps.length;
  const mediaCompra = totalCompras
    ? snaps.reduce((acc, s) => acc + (s.totalGasto || 0), 0) / totalCompras
    : 0;

  return (
    <div className="lv-historico">
      {/* Cards de resumo */}
      <div className="lv-hist-summary">
        <div className="lv-hist-summary__card">
          <span className="lv-hist-summary__label">total de compras</span>
          <span className="lv-hist-summary__value">{totalCompras}</span>
        </div>
        <div className="lv-hist-summary__card">
          <span className="lv-hist-summary__label">média por compra</span>
          <span className="lv-hist-summary__value">
            {mediaCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Lista de cards */}
      {snaps.length === 0 ? (
        <div className="lv-hist-empty">
          <i className="material-icons">receipt_long</i>
          <p>Nenhuma compra registrada ainda.</p>
          <span>Finalize uma compra para ela aparecer aqui.</span>
        </div>
      ) : (
        snaps.map(snap => <HistoricoCard key={snap.id} snap={snap} onClick={() => { setDetalheId(snap.id); setView('detalhe'); }} />)
      )}
    </div>
  );
};
```

Subcomponente `HistoricoCard` (inline no mesmo arquivo, acima do componente principal):
- Recebe `snap` e `onClick`
- Exibe ícone, nome, estabelecimento+data, total, contagem, barra de progresso

---

## Passo 5 — Renderizar view `detalhe`

**Arquivo:** `src/components/ListVoice.jsx`  
**O que muda:** nova função `renderDetalhe()`.

```jsx
const renderDetalhe = () => {
  const snap = listarSnapshots().find(s => s.id === detalheId);
  if (!snap) return null;
  const nomeTpl = snap.templateNome || snap.label;
  const total = snap.totalGasto || 0;
  const dataFormatada = new Date(snap.savedAt).toLocaleDateString('pt-BR');

  const handleUsarDeNovoDaCompra = () => {
    const carregar = () => {
      snap.itens.forEach(it =>
        adicionarManual({ nome: it.nome, quantidade: it.quantidade, unidade: it.unidade, preco: 0 })
      );
      setView('carrinho');
    };
    if (itens.length > 0) {
      if (window.confirm('Substituir lista atual?')) { limparLista(); setTimeout(carregar, 50); }
      else carregar(); // mesclar
    } else {
      carregar();
    }
  };

  return (
    <div className="lv-detalhe">
      {/* Metadados */}
      <div className="lv-detalhe__meta">
        {snap.estabelecimento?.nome && (
          <span><i className="material-icons">store</i> {snap.estabelecimento.nome}</span>
        )}
        <span><i className="material-icons">calendar_today</i> {dataFormatada}</span>
        <span><i className="material-icons">shopping_cart</i> {snap.totalItens ?? snap.itens.length} itens</span>
      </div>

      {/* Lista somente leitura */}
      <div className="lv-detalhe__list">
        {snap.itens.map((it, idx) => {
          const temPreco = it.precoUnitario || it.preco;
          const nomeCap = it.nome.charAt(0).toUpperCase() + it.nome.slice(1);
          return (
            <div key={idx} className="lv-detalhe__item">
              <i className="material-icons lv-detalhe__check">
                {it.marcado || it.comprado ? 'check_box' : 'check_box_outline_blank'}
              </i>
              <span className="lv-detalhe__nome">{nomeCap}</span>
              {temPreco ? (
                <span className="lv-detalhe__preco">
                  {it.quantidade}x R$ {parseFloat(temPreco).toFixed(2)}
                </span>
              ) : (
                <span className="lv-detalhe__sem-preco">sem preço</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão fixo */}
      <div className="lv-detalhe__footer">
        <button className="lv-detalhe__btn-usar" onClick={handleUsarDeNovoDaCompra}>
          Usar esta lista de novo
        </button>
      </div>
    </div>
  );
};
```

---

## Passo 6 — Header das novas views

**Arquivo:** `src/components/ListVoice.jsx` — `renderHeader()`

Adicionar dois novos blocos no `if/else` do `renderHeader`:

```jsx
// view === 'historico'
<div className="lv-header">
  <button className="lv-header__back" onClick={() => setView('home')} aria-label="Voltar">
    <i className="material-icons">arrow_back</i>
  </button>
  <h1 className="lv-header__title">Histórico de Compras</h1>
  <button className="lv-header__icon-btn" onClick={toggleHistMenu} aria-label="Menu">
    <i className="material-icons">more_vert</i>
  </button>
  {/* Menu: Limpar histórico */}
</div>

// view === 'detalhe'
<div className="lv-header lv-header--detalhe">
  <button className="lv-header__back" onClick={() => setView('historico')} aria-label="Voltar">
    <i className="material-icons">arrow_back</i>
  </button>
  <h1 className="lv-header__title lv-header__title--truncate">{nomeTplHeader}</h1>
  <span className="lv-detalhe__badge">
    {totalHeader.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
  </span>
</div>
```

---

## Passo 7 — CSS — `ListVoice.css`

Adicionar ao final do arquivo as classes novas (sem remover existentes):

```css
/* ── Histórico ────────────────────────────────────────────── */
.lv-historico { padding: 12px 12px 100px; }
.lv-hist-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.lv-hist-summary__card { background: var(--bg-secondary); border: 1px solid var(--divider); border-radius: 12px; padding: 14px 16px; }
.lv-hist-summary__label { font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 4px; }
.lv-hist-summary__value { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.lv-hist-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
.lv-hist-empty i { font-size: 64px; display: block; margin-bottom: 12px; opacity: .5; }
.lv-hist-empty p { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
.lv-hist-empty span { font-size: 13px; }

/* ── Card compra ──────────────────────────────────────────── */
.lv-hist-card { background: var(--bg-secondary); border: 1px solid var(--divider); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; cursor: pointer; transition: box-shadow .18s; }
.lv-hist-card:hover { box-shadow: var(--shadow-sm); }
.lv-hist-card__top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.lv-hist-card__icon { font-size: 28px; flex-shrink: 0; }
.lv-hist-card__info { flex: 1; min-width: 0; }
.lv-hist-card__nome { font-weight: 600; font-size: 15px; color: var(--text-primary); }
.lv-hist-card__meta { font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.lv-hist-card__meta i { font-size: 14px; }
.lv-hist-card__right { text-align: right; flex-shrink: 0; }
.lv-hist-card__total { font-size: 15px; font-weight: 700; color: #1D9E75; }
.lv-hist-card__count { font-size: 12px; color: var(--text-secondary); }
.lv-hist-card__bar { height: 3px; background: var(--divider); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.lv-hist-card__bar-fill { height: 100%; background: #1D9E75; transition: width .3s ease; }
.lv-hist-card__bar-label { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }

/* ── Detalhe ──────────────────────────────────────────────── */
.lv-detalhe { display: flex; flex-direction: column; height: 100%; }
.lv-detalhe__meta { display: flex; gap: 16px; padding: 10px 16px; border-bottom: 1px solid var(--divider); flex-wrap: wrap; }
.lv-detalhe__meta span { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-secondary); }
.lv-detalhe__meta i { font-size: 16px; }
.lv-detalhe__list { flex: 1; overflow-y: auto; padding: 8px 12px 80px; }
.lv-detalhe__item { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--divider); }
.lv-detalhe__check { color: #1D9E75; font-size: 22px; }
.lv-detalhe__check--vazio { color: var(--text-disabled); }
.lv-detalhe__nome { flex: 1; font-size: 14px; color: var(--text-primary); }
.lv-detalhe__preco { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
.lv-detalhe__sem-preco { font-size: 12px; color: var(--text-secondary); opacity: .7; }
.lv-detalhe__footer { position: sticky; bottom: 0; padding: 12px 16px; background: var(--bg-primary); border-top: 1px solid var(--divider); }
.lv-detalhe__btn-usar { width: 100%; padding: 14px; background: #1D9E75; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s; }
.lv-detalhe__btn-usar:hover { background: #178A65; }
.lv-detalhe__badge { background: #E1F5EE; color: #0F6E56; border-radius: 12px; padding: 2px 10px; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
.lv-header__title--truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }

/* ── Link histórico (Home) ────────────────────────────────── */
.lv-hist-link { font-size: 11px; color: #1D9E75; background: none; border: none; cursor: pointer; padding: 2px 0; text-decoration: none; display: inline-block; margin-top: 6px; }
```

---

## Passo 8 — `CardUltimoTemplate.jsx`

Adicionar duas props: `onVerItens` e `onVerHistorico`.

```jsx
// Botão Ver itens (dentro do card existente)
<button className="lv-card-ultimo__btn-ver" onClick={onVerItens}>
  Ver itens
</button>

// Link abaixo do card
<button className="lv-hist-link" onClick={onVerHistorico}>
  ver histórico completo →
</button>
```

No `ListVoice.jsx`, passar os handlers:

```jsx
<CardUltimoTemplate
  ...props existentes...
  onVerItens={() => { setDetalheId(ultimaCompraId); setView('detalhe'); }}
  onVerHistorico={() => setView('historico')}
/>
```

---

## Passo 9 — Ajustar `renderBottomNav` (4 ícones fixos)

- `view === 'historico'` e `view === 'detalhe'`: renderizar o rodapé normalmente (4 ícones, sem add-bar e sem summary)
- A lógica `{view === 'carrinho' && renderAddBar()}` e a linha de summary já são condicionais — nenhuma mudança estrutural necessária.

---

## Passo 10 — Testes

### 10.1 `useHistorico.test.js`

- Verificar que `salvarSnapshot` salva `templateNome`, `templateCategoria`, `totalItens`, `itensSemPreco`
- Verificar `limparHistorico` remove a chave do localStorage

### 10.2 Novos testes (opcional mas recomendado)

```
src/hooks/__tests__/useHistorico.historico.test.js
```

- snap sem templateNome → campo `null`
- snap com 3 itens, 2 sem preço → `itensSemPreco === 2`
- `limparHistorico` → `listarSnapshots()` retorna `[]`

---

## Ordem de Execução Sugerida

```
Passo 1 → Passo 2 → Passo 3 → Passo 7 (CSS)
  → Passo 4 (pós-Finalizar) → Passo 5 (renderHistorico) → Passo 6 (renderDetalhe)
  → Passo 8 (CardUltimoTemplate) → Passo 9 (footer) → Passo 10 (testes)
```

Cada passo pode ser implementado e verificado individualmente no browser antes de avançar.

---

## Checklist de Regressão

- [ ] Adicionar item via voz continua funcionando
- [ ] Finalizar compra → histórico → detalhe → usar de novo → carrinho populado
- [ ] Histórico vazio mostra estado correto
- [ ] Limpar histórico funciona
- [ ] Footer sempre mostra 4 ícones (Início · Listas · Carrinho · Loja)
- [ ] `localStorage` key `smart-list-items` inalterada
- [ ] ModalEstabelecimento não modificado
