# 🛒 SMART LIST — MVP v2.0
**Data:** 2026-03-31  
**Repositório:** peacevan/gerenciador-cesta-basica  
**Stack:** React + Netlify Functions (ai-proxy.mjs)

---

## VISÃO DO PRODUTO

**Fase 1 (este MVP):** App de lista de compras com múltiplas formas de entrada, focado em facilidade de preenchimento.

**Fase 2 (futura):** Wizard de Preço — backend que determina a cesta básica mais barata por localização. O cadastro de produtos feito aqui alimentará essa base de dados.

> ⚠️ Por isso o input de produto deve ser caprichado: nome, unidade e preço são dados que a Fase 2 vai consumir.

---

## ESTADO ATUAL DO PROJETO

### O que já existe e funciona
- `ListVoice.jsx` — componente principal do MVP ✅
- `useVoiceRecognition.js` — integra voz + LLM ✅
- `useShoppingList.js` — estado, localStorage, processarComandos ✅
- `useLLMParser.js` — OpenRouter → Regex fallback ✅ (com fix necessário)
- `netlify/functions/ai-proxy.mjs` — OpenRouter, Gemini, Anthropic ✅
- `VoiceFeedback.jsx` — feedback visual de voz ✅
- `OCRProductInput.jsx` — parcial (usa Tesseract, substituir por Vision API)

### Fora do MVP (não tocar agora — Fase 2+)
Cart, History, ChartPage, ProductRegistration, CategoryRegistration,
UnitRegistration, ProductList, ProductCrud, PurchaseHistory, ListCreation,
CreateFromVoice, db/db.js

---

## ROTA PRINCIPAL DO MVP

/list-voice → ListVoice.jsx ← foco total aqui

---

## FIX URGENTE — useLLMParser.js

O chamarProxy não verifica res.ok antes de res.json(). Quando o proxy
retorna HTML de erro (401, 429 etc), estoura "Unexpected token '<'".

```javascript
const chamarProxy = async (provider, input) => {
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, input }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Proxy HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return parsearResposta(data.text);
};
```

---

## 5 MODOS DE ENTRADA

### MODO 1 — Voz (já existe, manter)
Funcionando com LLM (OpenRouter) + fallback regex. Passa a ser uma opção
no toolbar em vez do único modo de entrada.

### MODO 2 — Autocomplete com histórico (PRIORIDADE 1)

Zero dependência de API. Funciona offline. Cobre 80% dos casos de uso
(lista recorrente semanal).

Novo hook useHistorico.js:
- Salva cada item adicionado (nome, unidade, quantidade, precoUltimo, contadorUso, ultimoUso)
- buscar(query) retorna top 5 sugestões ordenadas por frequência + recência
- registrar(item) chamado toda vez que um item é adicionado (por qualquer modo)

Novo componente AutocompleteInput.jsx:
- Input com debounce 300ms
- Dropdown com sugestões do histórico
- Clique preenche nome + quantidade + unidade + último preço
- Enter ou botão [+] adiciona direto à lista
- Funciona completamente offline

### MODO 3 — Colar texto livre (PRIORIDADE 2)

Reutiliza 100% do ai-proxy.mjs — só adiciona novo system prompt e provider.

Novo provider 'texto-livre' no ai-proxy.mjs com SYSTEM_PROMPT_TEXTO:
```
Você é um interpretador de listas de compras em português brasileiro.
O usuário vai colar um texto livre — WhatsApp, anotação, qualquer formato.
Extraia TODOS os produtos. Responda SOMENTE com array JSON:
[{"nome": string, "quantidade": number, "unidade": "un"|"kg"|"g"|"lt"|"ml"|"duzia", "preco": number|null}]
```

Novo componente ModalTextoLivre.jsx:
- Textarea para colar o texto
- Botão "Interpretar com IA"
- Resultado passa por ModalConfirmacao antes de adicionar

### MODO 4 — Templates (PRIORIDADE 3)

Sem API. Apenas localStorage.

Templates pré-definidos (hardcoded):
- Churrasco: picanha, frango, linguiça, carvão, cerveja, refrigerante, pão de alho, sal grosso
- Café da manhã: café, leite, pão de forma, manteiga, ovos, queijo mussarela
- Limpeza: detergente, sabão em pó, amaciante, desinfetante, esponja, papel higiênico

Templates do usuário: salvar lista atual como template, excluir templates.

Ao selecionar template — 3 opções: Substituir lista / Adicionar à lista / Cancelar.

Novo hook useTemplates.js + componente ModalTemplates.jsx.

### MODO 5 — Foto de nota fiscal (PRIORIDADE 4)

Substitui OCRProductInput.jsx (que usa Tesseract local) por Anthropic Vision.

Novo provider 'nota-fiscal' no ai-proxy.mjs:
- Recebe { imageData: base64, mediaType: string } em vez de string
- Usa claude-haiku-4-5-20251001 com vision
- Normaliza nomes abreviados: "ARR TIO JOAO 5KG" → "arroz tio joão"
- System prompt focado em notas fiscais brasileiras

Novo componente ModalFotoNota.jsx:
- Botão "Tirar foto" (input file com capture="environment" para mobile)
- Botão "Escolher arquivo" para desktop
- Resultado passa por ModalConfirmacao

---

## COMPONENTE UNIVERSAL: ModalConfirmacao.jsx

Texto livre, templates e foto passam por aqui antes de adicionar à lista.

Props: itens[], onConfirmar(itens), onCancelar()

Mostra lista editável onde usuário pode:
- Desmarcar itens que não quer adicionar
- Ajustar quantidade e preço antes de confirmar
- Botão [Adicionar N itens] confirma e chama registrar() no useHistorico

---

## TOOLBAR UNIFICADO EM ListVoice.jsx

Substituir botão de microfone isolado por toolbar com todos os modos:

[🔍 Digite produto...  ] [+]   ← AutocompleteInput
[🎙️ Voz] [📋 Texto] [📁 Templates] [📷 Foto]

Estado local modoAtivo controla qual modal está aberto.

---

## ESTRUTURA DE DADOS v2

Item na lista (compatível com useShoppingList existente + campo fonte novo):
```javascript
{
  id: String,           // crypto.randomUUID()
  nome: String,         // normalizado (lowercase)
  quantidade: Number,
  unidade: String,      // 'kg' | 'lt' | 'g' | 'ml' | 'un' | 'duzia'
  preco: Number | '',
  comprado: Boolean,
  fonte: String,        // NOVO: 'voz'|'texto'|'template'|'foto'|'manual'|'autocomplete'
}
```

localStorage keys:
- 'smart-list-items'    — já existe
- 'smartlist_historico' — novo
- 'smartlist_templates' — novo

---

## ARQUIVOS A CRIAR E MODIFICAR

Criar (novos):
- src/hooks/useHistorico.js
- src/hooks/useTemplates.js
- src/components/AutocompleteInput.jsx
- src/components/ModalTextoLivre.jsx
- src/components/ModalTemplates.jsx
- src/components/ModalFotoNota.jsx
- src/components/ModalConfirmacao.jsx

Modificar (existentes):
- src/hooks/useLLMParser.js          ← fix res.ok
- src/hooks/useShoppingList.js       ← campo fonte no item
- src/components/ListVoice.jsx       ← toolbar unificado + modais
- netlify/functions/ai-proxy.mjs     ← providers texto-livre + nota-fiscal

Não tocar:
- src/hooks/useVoiceRecognition.js
- src/components/VoiceFeedback.jsx
- src/styles/ListVoice.css           ← apenas adicionar estilos do toolbar

---

## ORDEM DE IMPLEMENTAÇÃO

Sprint 1 — Base offline:
1. Fix useLLMParser.js (15 min)
2. useHistorico.js (30 min)
3. AutocompleteInput.jsx (1h)
4. Integrar autocomplete em ListVoice.jsx (30 min)

Sprint 2 — Entrada via texto:
5. ModalConfirmacao.jsx (1h)
6. Provider texto-livre em ai-proxy.mjs (30 min)
7. ModalTextoLivre.jsx (1h)

Sprint 3 — Templates:
8. useTemplates.js (30 min)
9. ModalTemplates.jsx (1h)

Sprint 4 — Foto de nota:
10. Provider nota-fiscal em ai-proxy.mjs (1h)
11. ModalFotoNota.jsx (1h)

Sprint 5 — Polimento:
12. Toolbar unificado em ListVoice.jsx (1h)
13. Campo fonte nos itens (30 min)
14. Testes em mobile

---

## PREPARAÇÃO PARA FASE 2 (Wizard de Preço)

O campo fonte e o histórico de preços (precoUltimo no useHistorico) são
dados valiosos para o Wizard de Preço.

Na Fase 2, useShoppingList.js pode expor exportarParaWizard() que envia
os itens com preços para o backend de comparação por localização.

A estrutura de dados já está preparada — sem breaking changes entre fases.
