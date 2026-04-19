# Especificação — Histórico de Compras & Detalhe de Compra

**Versão:** 1.0  
**Data:** 2026-04-18  
**Branch:** feat/MVP_V2_1_implementation  
**Arquivo de referência visual:** mockup anexado na issue / chat

---

## 1. Visão Geral

Implementar duas novas telas navegáveis dentro de `ListVoice.jsx`:

| View key | Descrição |
|---|---|
| `historico` | Lista de todas as compras finalizadas, mais recente primeiro |
| `detalhe` | Detalhe somente-leitura de uma compra específica |

Acesso ao **rodapé global** permanece com exatamente 4 ícones: Início · Listas · Carrinho · Loja.  
Histórico **não entra** no rodapé; é acessado pelos fluxos descritos abaixo.

---

## 2. Estrutura do Snapshot (localStorage)

**Key:** `smart-list:history` (já existente — apenas adicionar novos campos)

```jsonc
{
  "id": "uuid",
  // campos já existentes
  "savedAt": "ISO8601",           // alias finalizadaEm
  "label": "Compra 18/04",
  "totalGasto": 187.50,           // alias totalEstimado
  "estabelecimento": {
    "nome": "Atacadão",
    "endereco": "Av. Paralela, 100",
    "lat": null,
    "lng": null
  } | null,
  // campos NOVOS a adicionar
  "templateNome": "string | null",
  "templateCategoria": "string | null",
  "totalItens": 13,
  "itensSemPreco": 2,
  "itens": [
    {
      "nome": "arroz",
      "quantidade": 5,
      "unidade": "kg",
      "precoUnitario": 25.90,     // campo novo (era só preco)
      "precoTotal": 129.50,       // campo novo
      "marcado": true             // campo novo (era comprado)
    }
  ]
}
```

> **Regra de compatibilidade:** campos antigos (`preco`, `comprado`) são mantidos. Os novos campos são **adicionados** ao lado dos existentes. `salvarSnapshot` calcula automaticamente `totalItens` e `itensSemPreco`.

---

## 3. Fluxo: Redirecionamento pós-Finalizar

```
[Tela Carrinho] → toca "Finalizar"
   ↓
Abre ModalEstabelecimento (existente)
   ↓
handleConfirmSave(estabelecimento):
  1. salvarSnapshot(itens, total, estabelecimento)   ← enriquecido
  2. limparLista()
  3. setView('historico')
  4. showToast('Compra salva no histórico!')         ← 3 s
```

**Toast:** `role="status"`, `aria-live="polite"`, visível 3 s, depois some.

---

## 4. Tela Histórico (`view === 'historico'`)

### 4.1 Header

```
← (voltar a 'home')     Histórico de Compras     ⋮
```

Menu ⋮ exibe: **Limpar histórico** (com confirmação `window.confirm`).

### 4.2 Cards de resumo — 2 colunas

| Campo | Valor |
|---|---|
| `total de compras` | `listarSnapshots().length` |
| `média por compra` | média dos `totalGasto` formatada como `R$ XXX` |

### 4.3 Lista de cards (mais recente primeiro)

Cada card exibe:

```
[ícone categoria]  Nome do template         R$ 187,50
                   🏪 Atacadão · 15/04/2025   13 itens
                   ████████████░░  11/13 com preço
```

- **Ícone categoria:** mapa de `templateCategoria → emoji` (ver seção 4.4)
- **Barra de progresso:** altura 3 px, cor `#1D9E75`, `(totalItens - itensSemPreco) / totalItens * 100`%
- **Label barra:** `"X/Y com preço"` em `font-size: 10px; color: var(--text-secondary)`
- **Toque no card:** `setDetalheId(snap.id); setView('detalhe')`

### 4.4 Mapa de ícones por categoria

```js
const CATEGORIA_ICONE = {
  'mercado':    '🛒',
  'feira':      '🟡',
  'açougue':    '🥩',
  'padaria':    '🥖',
  'limpeza':    '🧹',
  'higiene':    '🧴',
  'bebidas':    '🥤',
  'hortifruti': '🥦',
  default:      '🛍️',
};
```

### 4.5 Estado vazio

```
[ícone receipt_long]
Nenhuma compra registrada ainda.
Finalize uma compra para ela aparecer aqui.
```

---

## 5. Tela Detalhe (`view === 'detalhe'`)

### 5.1 Header

```
← (volta a 'historico')   Nome do template   [R$ 187,50]
```

Badge total: fundo `#E1F5EE`, texto `#0F6E56`, `border-radius: 12px`, `padding: 2px 10px`.

### 5.2 Metadados (linha abaixo do header)

```
🏪 Atacadão Paralela   📅 15/04/2025   🛒 13 itens
```

### 5.3 Lista somente-leitura

- **Item marcado:** `check_box` (verde) · nome · `"Nx R$ X,XX"`
- **Item não marcado:** `check_box_outline_blank` (cinza) · nome · `"sem preço"` em `var(--text-secondary)`
- Sem `onClick` — apenas visualização

### 5.4 Botão fixo

```
[ Usar esta lista de novo ]   ← largura 100%, fundo #1D9E75
```

Fluxo ao tocar:
1. Se `itens.length > 0`: apresentar `window.confirm('Substituir lista atual?')`; se recusar, mesclar
2. Carregar itens no carrinho (`adicionarManual` para cada item, preco=0)
3. `setView('carrinho')`

---

## 6. Acesso pela Home

No card "Repetir última compra" (`CardUltimoTemplate`):
- Botão **"Ver itens"** → `setDetalheId(ultimaCompraId); setView('detalhe')`
- Link discreto abaixo do card:  
  `"ver histórico completo →"` — `font-size: 11px; color: #1D9E75; cursor: pointer`  
  → `setView('historico')`

---

## 7. Rodapé Global — Definitivo

Manter exatamente **4 ícones** em todas as telas:

| Ícone | View |
|---|---|
| `home` | `home` |
| `grid_view` | `listas` |
| `shopping_cart` | `carrinho` |
| `store` | (abre ModalEstabelecimento) |

Histórico **não** ganha ícone no rodapé.

---

## 8. Restrições

| Restrição | Ação |
|---|---|
| `localStorage` intacto | Apenas **adicionar** novos campos aos snapshots |
| `normalizeProductName` | Sem alterações |
| `ModalEstabelecimento` | Sem alterações |
| Sem novas dependências | Usar apenas APIs nativas + React já instalado |

---

## 9. Componentes e Hooks Afetados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useHistorico.js` | Enriquecer `salvarSnapshot`; adicionar `limparHistorico` |
| `src/components/ListVoice.jsx` | Adicionar views `historico` e `detalhe`; novo estado `detalheId`; wiring do pós-finalizar |
| `src/styles/ListVoice.css` | Estilos das novas views (cards, barra, badge, botão) |
| `src/components/CardUltimoTemplate.jsx` | Adicionar botão "Ver itens" e link "ver histórico completo" |

---

## 10. Testes Necessários

- `useHistorico.test.js`: novos campos em `salvarSnapshot`; `limparHistorico`
- `ListVoice.historico.test.jsx`: render da view histórico vazio / com dados
- Manual: fluxo completo finalizar → histórico → detalhe → usar de novo
