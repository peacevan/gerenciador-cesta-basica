# 🛒 SMART LIST — MVP v2.1
**Data:** 2026-04-02  
**Repositório:** peacevan/gerenciador-cesta-basica  
**Stack:** React + Netlify Functions (ai-proxy.mjs)

---

## VISÃO DO PRODUTO

**Fase 1 (este MVP):** App de lista de compras onde o usuário parte de um
template pré-pronto e ajusta o que precisa. Templates são o caminho principal.
Voz e texto livre existem como entrada complementar para itens fora do padrão.

**Fase 2 (futura):** Wizard de Preço — backend que determina a cesta básica
mais barata por localização. O cadastro de produtos feito aqui alimentará
essa base de dados.

> ⚠️ Nome, unidade e preço são dados que a Fase 2 vai consumir — manter
> qualidade nesses campos desde o MVP.

---

## POR QUE TEMPLATES PRIMEIRO

Voz foi testada como entrada principal e apresentou imprecisão inaceitável
com o Web Speech API em português brasileiro — nomes de produtos, marcas e
quantidades geram erros frequentes mesmo com LLM por baixo.

Templates resolvem o problema na raiz: o usuário não cria a lista, ele
**confirma** a lista. Para 80% das compras do dia a dia (compra semanal
recorrente) isso é mais rápido e confiável do que qualquer outro fluxo.

Voz permanece no app como entrada complementar para itens pontuais fora
do template ("hoje tem churrasco, adiciona picanha").

---

## ESTADO ATUAL DO PROJETO

### O que já existe e funciona
- `ListVoice.jsx` — componente principal do MVP ✅
- `useVoiceRecognition.js` — integra voz + LLM ✅
- `useShoppingList.js` — estado, localStorage, processarComandos ✅
- `useLLMParser.js` — OpenRouter → Regex fallback ✅
- `netlify/functions/ai-proxy.mjs` — OpenRouter, Gemini, Anthropic ✅
- `useHistorico.js` — catálogo de produtos + snapshots de lista ✅
- `AutocompleteInput.jsx` — autocomplete offline com debounce ✅
- `HistoricoPanel.jsx` — painel de snapshots com carregar/excluir ✅
- `ModalTextoLivre.jsx` — entrada por texto livre ✅
- `ModalConfirmacao.jsx` — confirmação universal de itens ✅
- `NotaFiscalUpload.jsx` — OCR-first com tesseract + ai-proxy ✅ (80%)

### Fora do MVP (não tocar — Fase 2+)
Cart, History, ChartPage, ProductRegistration, CategoryRegistration,
UnitRegistration, ProductList, ProductCrud, PurchaseHistory, ListCreation,
CreateFromVoice, db/db.js

---

## ROTA PRINCIPAL DO MVP

/list-voice → ListVoice.jsx ← foco total aqui

---

## FLUXO PRINCIPAL — TEMPLATE FIRST

```
Usuário abre o app
        ↓
[ Escolher template ]  ← tela inicial se lista estiver vazia
        ↓
Lista pré-populada com itens do template
        ↓
Usuário marca / desmarca / ajusta quantidade e preço
        ↓
Vai às compras ✓
```

Itens fora do template → AutocompleteInput ou voz como complemento.

---

## TEMPLATES PRONTOS (hardcoded — editáveis pelo usuário)

Todos os templates entregues com `editavel: true` — o usuário pode
adicionar, remover e alterar itens. O template original é preservado
(o usuário edita uma cópia local salva no localStorage).

### 🛒 Compra do Mês
arroz 5kg · feijão 2kg · macarrão 500g · óleo 900ml · farinha de trigo 1kg
açúcar 1kg · sal 500g · café 500g · extrato de tomate · leite 1lt (x6)
papel higiênico (x4) · sabão em pó · detergente · desinfetante

### 🗓️ Compra da Semana
pão de forma · leite · ovos · queijo · presunto · frutas da estação
legumes (cenoura, batata, cebola, alho) · frango · carne moída

### ☕ Café da Manhã
café · leite · pão de forma · manteiga · ovos · queijo mussarela
requeijão · suco · frutas

### 🔥 Churrasco
picanha 1kg · frango 1kg · linguiça 500g · carvão 3kg · cerveja (x12)
refrigerante · pão de alho · sal grosso · vinagrete (tomate, cebola, pimentão)

### 🧹 Limpeza
detergente · sabão em pó · amaciante · desinfetante · esponja
papel higiênico · papel toalha · água sanitária · limpador multiuso

---

## SCHEMA DE DADOS

### Template
```javascript
{
  id: String,              // crypto.randomUUID() ou slug fixo para os prontos
  nome: String,            // "Compra da Semana"
  icone: String,           // emoji: "🛒", "☕", "🔥", "🧹"
  itens: [
    {
      nome: String,        // normalizado lowercase
      quantidade: Number,
      unidade: String,     // 'kg'|'lt'|'g'|'ml'|'un'|'duzia'
      precoSugerido: null  // null nos templates prontos, preenchido pelo histórico
    }
  ],
  editavel: true,          // sempre true — usuário pode editar qualquer template
  sistema: Boolean,        // true = template padrão do app, false = criado pelo usuário
  criadoEm: String,        // ISO date
  atualizadoEm: String     // ISO date — importante para futura sincronização
}
```

### Item na lista (compatível com useShoppingList existente)
```javascript
{
  id: String,
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number | '',
  comprado: Boolean,
  fonte: String,   // 'template'|'autocomplete'|'voz'|'texto'|'foto'|'manual'
}
```

### localStorage keys
- `smart-list-items`       — lista atual (já existe)
- `smart-list:history`     — snapshots com estabelecimento (já existe)
- `smart-list:catalog`     — catálogo de produtos do histórico (já existe)
- `smart-list:templates`   — templates do usuário (novo)

---

## ARQUIVOS A CRIAR E MODIFICAR

### Criar (novos)
- `src/hooks/useTemplates.js`
- `src/components/ModalTemplates.jsx`
- `src/components/ModalEditarTemplate.jsx`

### Modificar (existentes)
- `src/components/ListVoice.jsx` — toolbar reordenado + tela inicial de template
- `src/styles/ListVoice.css`     — estilos do seletor de templates

### Não tocar
- `src/hooks/useVoiceRecognition.js`
- `src/hooks/useShoppingList.js`
- `src/hooks/useHistorico.js`
- `src/hooks/useLLMParser.js`
- `src/components/VoiceFeedback.jsx`
- `src/components/AutocompleteInput.jsx`
- `src/components/ModalConfirmacao.jsx`
- `src/components/ModalTextoLivre.jsx`
- `netlify/functions/ai-proxy.mjs`

---

## DETALHAMENTO DOS NOVOS ARQUIVOS

### `src/hooks/useTemplates.js`

```javascript
// Funções a exportar:

listarTemplates()
// Retorna templates do sistema (hardcoded) + templates do usuário (localStorage)
// ordenados: sistema primeiro, depois por atualizadoEm desc

salvarTemplate(template)
// Cria ou atualiza template no localStorage (smart-list:templates)
// Atualiza atualizadoEm automaticamente

excluirTemplate(id)
// Só permite excluir templates com sistema: false
// Templates do sistema são invioláveis

duplicarTemplate(id)
// Cria cópia com sistema: false e nome "Cópia de X"
// Útil para o usuário personalizar a partir de um template pronto

aplicarTemplate(template, modo)
// modo: 'substituir' | 'adicionar'
// Retorna array de itens no formato do useShoppingList
// Cruza com useHistorico para preencher precoSugerido quando disponível
```

### `src/components/ModalTemplates.jsx`

Tela de seleção de template. Exibida:
- Ao abrir o app com lista vazia (sugestão automática)
- Ao clicar em "Templates" no toolbar

Layout:
```
[ Templates ]                              [X]

  🛒 Compra do Mês        [ Usar ] [ Editar ]
  🗓️ Compra da Semana     [ Usar ] [ Editar ]
  ☕ Café da Manhã        [ Usar ] [ Editar ]
  🔥 Churrasco            [ Usar ] [ Editar ]
  🧹 Limpeza              [ Usar ] [ Editar ]
  ─────────────────────────────────────────
  Meus templates
  📋 Minha lista padrão   [ Usar ] [ Editar ] [ 🗑 ]

  [ + Criar template a partir da lista atual ]
```

Ao clicar em "Usar":
- Se lista atual estiver vazia → aplica direto
- Se lista tiver itens → ModalConfirmacao com opções:
  "Substituir lista atual" / "Adicionar à lista" / "Cancelar"

Props: `isOpen`, `onClose`, `onAplicar(itens)`

### `src/components/ModalEditarTemplate.jsx`

Edição de template. Acessado via botão "Editar" no ModalTemplates.

Funcionalidades:
- Editar nome e ícone do template
- Adicionar item (via AutocompleteInput — já existe)
- Remover item
- Ajustar quantidade e unidade de cada item
- Botão "Salvar template"
- Botão "Cancelar"

Nota: editar um template do sistema (`sistema: true`) cria automaticamente
uma cópia com `sistema: false` antes de salvar — o original nunca é alterado.

---

## TOOLBAR REORDENADO EM ListVoice.jsx

Templates em destaque, voz discreto:

```
[🔍 Digite produto...  ] [+]     ← AutocompleteInput (linha 1)

[📋 Templates] [📝 Texto] [🎙️ Voz] [📷 Foto]   ← linha 2, templates primeiro
```

Comportamento da tela inicial (lista vazia):
- Exibir banner de sugestão: "Comece por um template →" com botão de atalho
- Não forçar modal automático — apenas sugerir

---

## ORDEM DE IMPLEMENTAÇÃO

### Sprint 1 — Templates (prioridade máxima)
1. `useTemplates.js` com templates hardcoded + CRUD no localStorage (1h)
2. `ModalTemplates.jsx` — seleção e aplicação (1.5h)
3. `ModalEditarTemplate.jsx` — edição de itens (1.5h)
4. Integrar em `ListVoice.jsx` — toolbar + banner tela inicial (1h)

### Sprint 2 — Polimento
5. Cruzar `aplicarTemplate` com `useHistorico` para sugerir últimos preços (30min)
6. Ajustar CSS — seletor de templates mobile-first (1h)
7. Testes em dispositivo real (Android/iOS)

### Sprint 3 — Features complementares (já implementadas, revisar)
8. Revisar AutocompleteInput integrado ao novo toolbar
9. Revisar fluxo de voz como entrada secundária
10. Finalizar pipeline nota-fiscal (rate-limit, logs)

---

## PREPARAÇÃO PARA FASE 2 (Wizard de Preço)

Os campos `fonte`, `estabelecimento` (com lat/lng) e `precoUltimo` no
`useHistorico` são os dados que vão alimentar o Wizard de Preço.

Templates do sistema podem futuramente ser sincronizados do backend —
o campo `sistema: true` já sinaliza essa origem. A migração será:
localStorage → POST /api/templates na primeira vez que o usuário logar.

Os campos `criadoEm` e `atualizadoEm` resolvem conflitos de sincronização.
