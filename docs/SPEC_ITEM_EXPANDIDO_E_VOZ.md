# SPEC — Item Expandido e Reconhecimento de Voz (Carrinho)

**Componente alvo:** `src/components/ListVoice.jsx` → `renderCarrinho()`  
**Utilitário:** `src/utils/voiceParser.js`  
**Status:** Pendente de implementação

---

## [BL-001] Tela Carrinho — Refatoração de Layout

**Origem:** Spec de refatoração da tela Carrinho (abril/2026)  
**Prioridade:** Alta (próxima sprint após estabilização da Home)

### Itens pendentes

#### Header
- Substituir header genérico por: `"Carrinho"` à esquerda + `"X / Y itens"` + menu `⋮` à direita
- **Remover botão "Salvar"** do header
- Implementar **auto-save no localStorage** a cada alteração de item (sem ação manual do usuário)
- Barra de progresso fina (`3px`, cor `#1D9E75`) abaixo do header representando `marcados / total`

#### Lista de itens
- `text-transform: capitalize` na exibição dos nomes (não alterar dado salvo)
- **Itens marcados:** checkbox verde preenchido + texto riscado + `opacity: 0.35` + movem para o final da lista
- **Itens não marcados:** checkbox vazio com borda

#### Item expandido (ao tocar)
Ao tocar num item não marcado, ele expande inline exibindo:

**a) Bloco de voz:**
- Mic com estados visuais:
  - Repouso: fundo `#E1F5EE`, ícone mic verde
  - Escutando: fundo `#1D9E75`, ícone mic branco, texto `"Escutando... fale '2 unidades 7 reais e 90'"`
  - Processado: mostra o reconhecido e preenche campos
- Badge `"via regex"` (fundo `#9FE1CB`, texto `#0F6E56`) quando parser regex teve sucesso

**b) Campos quantidade + preço:**
- Grid 2 colunas
- Quantidade: stepper `−` / número / `+` (mínimo 1)
- Preço unitário: campo editável com prefixo `R$`
- Subtotal: `"= R$ X,XX neste item"` em verde
- Botão `"Confirmar"` fecha e salva

**c) Comportamento:**
- Só um item expandido por vez
- Tocar em outro fecha o atual e abre o novo
- Tocar no item expandido fecha sem salvar (cancelar)

---

## [BL-002] Parser de Voz — Regex (Gratuito)

**Origem:** Spec de reconhecimento de voz no item expandido (abril/2026)  
**Prioridade:** Alta — bloqueador do BL-001 item expandido

### Tarefa
Verificar se `src/utils/voiceParser.js` já existe.

- **Se existir:** ler conteúdo, reaproveitar lógica existente, apenas adicionar o que faltar (números por extenso, `normalizeUnidade`, padrões lata/saco/cx, campo `sucesso: boolean`)
- **Se não existir:** criar conforme spec abaixo

### Spec do utilitário `src/utils/voiceParser.js`

```javascript
export function parseVoiceInput(texto) {
  const t = texto.toLowerCase().trim()

  const numerais = {
    'um': 1, 'uma': 1, 'dois': 2, 'duas': 2,
    'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5,
    'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10
  }
  let texto_norm = t
  Object.entries(numerais).forEach(([palavra, num]) => {
    texto_norm = texto_norm.replace(new RegExp(`\\b${palavra}\\b`, 'g'), num)
  })

  texto_norm = texto_norm
    .replace(/(\d+)\s+reais?\s+e\s+(\d+)/g, '$1.$2')
    .replace(/(\d+)\s+reais?/g, '$1')
    .replace(/(\d+),(\d+)/g, '$1.$2')

  const qtdMatch = texto_norm.match(
    /(\d+(?:\.\d+)?)\s*(kg|kilo(?:s|gramas?)?|g(?:rama)?s?|l(?:itro)?s?|ml|und(?:idades?)?|unidades?|pct|pacotes?|cx|caixas?|latas?|sacos?)/
  )
  const precoMatch = texto_norm.match(
    /(?:a\s+|por\s+|r\$\s*)?(\d+(?:\.\d+)?)\s*(?:reais?|R\$)?(?!\s*(?:kg|g|ml|l\b|und|pct|cx))/
  )
  const soNumero = texto_norm.match(/^(\d+(?:\.\d+)?)$/)

  const resultado = { quantidade: null, unidade: null, preco: null, sucesso: false }

  if (qtdMatch) {
    resultado.quantidade = parseFloat(qtdMatch[1])
    resultado.unidade = normalizeUnidade(qtdMatch[2])
  }
  if (precoMatch) {
    resultado.preco = parseFloat(precoMatch[1])
  } else if (soNumero && !qtdMatch) {
    resultado.preco = parseFloat(soNumero[1])
  }

  resultado.sucesso = resultado.quantidade !== null || resultado.preco !== null
  return resultado
}

function normalizeUnidade(raw) {
  const r = raw.toLowerCase()
  if (/^kg|kilo/.test(r)) return 'kg'
  if (/^g/.test(r)) return 'g'
  if (/^ml/.test(r)) return 'ml'
  if (/^l/.test(r)) return 'l'
  if (/^pct|pac/.test(r)) return 'pct'
  if (/^cx|cai/.test(r)) return 'cx'
  if (/^lat/.test(r)) return 'lata'
  if (/^sac/.test(r)) return 'saco'
  return 'und'
}
```

**Padrões suportados:**
| Entrada | Saída |
|---|---|
| `"2 kg 10 reais"` | `{ quantidade: 2, unidade: 'kg', preco: 10.00 }` |
| `"três unidades 5 reais e 50"` | `{ quantidade: 3, unidade: 'und', preco: 5.50 }` |
| `"um pacote oito reais"` | `{ quantidade: 1, unidade: 'pct', preco: 8.00 }` |
| `"10 reais"` | `{ quantidade: null, preco: 10.00 }` |
| `"duas unidades"` | `{ quantidade: 2, preco: null }` |

---

## [BL-003] Integração da Voz no Item Expandido

**Origem:** Spec de reconhecimento de voz no item expandido (abril/2026)  
**Depende de:** BL-001 (item expandido), BL-002 (voiceParser)

### Fluxo

1. Tocar no mic do item expandido → iniciar Web Speech API (`lang: 'pt-BR'`, `continuous: false`)
2. Exibir estado `"Escutando..."`
3. Ao receber resultado:
   - Tentar `parseVoiceInput(transcript)`
   - **Sucesso:** preencher campos, mostrar badge `"via regex"`, calcular subtotal
   - **Falha:** exibir `"Não entendi. Tente: '2 unidades 10 reais' ou preencha manualmente."` — **não chamar LLM**
4. Usuário revisa e toca `"Confirmar"`
5. Salvar `{ quantidade, unidade, precoUnitario }` no item no localStorage

---

## [BL-004] Shape de Dados do Item — Waze de Preço

**Origem:** Spec de reconhecimento de voz (abril/2026)  
**Prioridade:** Média — necessário para feature futura de ranking por localização

Ao confirmar um item, salvar no histórico com o shape:

```javascript
{
  id: "item_uuid",
  nome: "Óleo de soja",
  quantidade: 2,
  unidade: "l",
  precoUnitario: 7.90,
  precoTotal: 15.80,
  marcado: true,
  atualizadoEm: "2025-04-18T15:30:00"
}
```

---

## [BL-005] Parser de Voz Premium (LLM)

**Origem:** Spec de reconhecimento de voz (abril/2026)  
**Prioridade:** Baixa — somente após lançamento do plano premium  
**Depende de:** BL-002, BL-003, sistema de autenticação/planos

### Descrição
Quando `parserMode === "llm"` no perfil do usuário, substituir o fallback do regex por chamada ao `ai-proxy.mjs`:

```
System: Extraia quantidade, unidade e preço da frase em português.
        Responda APENAS em JSON sem markdown:
        {"quantidade": number|null, "unidade": string|null, "preco": number|null}

User: <frase reconhecida pelo Web Speech API>
```

**Configuração no localStorage do perfil:**
```javascript
parserMode: "regex"  // padrão, gratuito
parserMode: "llm"    // premium
```

**Comportamento premium:**
- LLM como parser **principal** (não fallback)
- Regex não é executado
- Badge muda de `"via regex"` para `"via IA"`
- Feature cobrada no plano pago

---

## [BL-006] Nudge Sutil de Preço — Incentivar sem Obrigar

**Origem:** Spec de UX de preço (abril/2026)  
**Prioridade:** Média — melhora adoção do Waze de Preço sem atritar o fluxo principal  
**Status:** ✅ Implementado

### Regra de negócio

| Ação | Comportamento |
|------|---------------|
| Marcar item | Sempre livre, sem obrigação de preço |
| Preço / quantidade | Opcional, incentivado sutilmente |
| Histórico sem preço | Salva normalmente; não contribui para o ranking de preços |

### UI — Indicador discreto

Quando o item está **marcado (`comprado = true`) e sem preço (`preco = 0`)**, exibir ao lado do nome:

```
✓ Óleo de soja  · adicionar preço
```

- Texto `· adicionar preço` em cinza pequeno (`font-size: 0.75rem`, `opacity: 0.55`, `font-style: italic`)
- Classe CSS: `.lv-cart-item__nudge`
- Ao tocar no nudge → abre o painel expandido do item para inserção de preço

Quando o item tem preço, exibe normalmente `2x R$ 7,90` (classe `.lv-cart-item__resumo`).

### Passo a passo de implementação

#### 1. JSX — `renderCarrinho()` em `ListVoice.jsx`
Após o bloco `{item.comprado && preco > 0 && ...}`, adicionar:

```jsx
{item.comprado && preco === 0 && (
  <span className="lv-cart-item__nudge">· adicionar preço</span>
)}
```

#### 2. CSS — `ListVoice.css`
Adicionar após `.lv-cart-item__resumo`:

```css
.lv-cart-item__nudge {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.55;
  white-space: nowrap;
  padding-right: 4px;
  font-style: italic;
  cursor: pointer;
}
```

#### 3. Sem alterações necessárias em:
- `useShoppingList.js` — lógica de salvar snapshots não muda
- `voiceParser.js` — não afetado
- Shape do item no localStorage — não muda

### Arquivos alterados
- `src/components/ListVoice.jsx` — nudge inline no item marcado sem preço
- `src/styles/ListVoice.css` — classe `.lv-cart-item__nudge`


**Restrições:**
- Manter `localStorage` intacto
- Manter `normalizeProductName` sem alterações
- Não introduzir novas dependências npm

---

## Restrições Globais

Aplicam-se a todos os itens deste backlog:
- Não alterar schema do objeto de histórico (`useHistorico`)
- Não alterar `normalizeProductName`
- Não alterar `ModalEstabelecimento`
- Sem novas dependências npm
