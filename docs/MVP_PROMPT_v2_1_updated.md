# 🛒 SMART LIST — MVP v2.1 (atualizado)
**Data:** 2026-04-12  
**Repositório:** peacevan/gerenciador-cesta-basica  
**Stack:** React + Netlify Functions (ai-proxy.mjs)

---

## VISÃO DO PRODUTO

**Tagline:** *"O usuário não monta a lista do zero — o app monta junto com ele."*

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
[ Lista vazia? ]
        ↓
┌─────────────────────────────────────────────┐
│  🔁 Tem histórico?  →  DESTAQUE: último     │
│                        template usado        │
│                        [ Usar de novo ]      │
│                        [ Ver todos ]         │
├─────────────────────────────────────────────┤
│  Sem histórico?     →  Grade de templates   │
│                        do sistema            │
└─────────────────────────────────────────────┘
        ↓
[ Configurar perfil familiar ]  ← onboarding ou por lista
        ↓
Lista pré-populada com itens do template (quantidades ajustadas pelo perfil)
        ↓
Usuário marca / desmarca / ajusta quantidade e preço
        ↓
[ Sugestões automáticas por correlação ]  ← chips discretos
        ↓
Vai às compras ✓  →  snapshot salvo no histórico com templateId
```

Itens fora do template → AutocompleteInput ou voz como complemento.

---

## ÚLTIMO TEMPLATE EM DESTAQUE  ← NOVO

### Conceito

Após qualquer compra finalizada (snapshot salvo), o app memoriza qual
template foi usado como base. Na próxima vez que o usuário abrir com a
lista vazia, esse template aparece em destaque — acima de tudo — com
um card especial de "repetir".

Premissa: **compras mensais e semanais se repetem**. O menor atrito
possível para o caso mais comum é o maior diferencial de UX do app.

### Comportamento

1. Ao salvar snapshot → gravar `templateId` e `templateNome` junto
2. Na abertura com lista vazia → verificar `smart-list:ultimo-template`
3. Se existir → exibir **card de destaque** antes da grade de templates
4. Se não existir → exibir grade normal (primeiro acesso)

### Layout da tela inicial com destaque

```
┌──────────────────────────────────────────────────────┐
│  🔁  Repetir última compra                           │
│      🛒 Compra do Mês  ·  usado há 28 dias           │
│                                                      │
│      [ ✓ Usar de novo ]      [ Ver itens ]           │
└──────────────────────────────────────────────────────┘

  ou escolha outro template:

  🗓️ Compra da Semana    ☕ Café da Manhã
  🔥 Churrasco           🧹 Limpeza
  🍼 Casa com Bebê       📋 Minha lista padrão
```

O card de destaque usa visual diferenciado (borda colorida, fundo suave)
para se destacar visualmente da grade abaixo.

### Schema — último template usado

```javascript
// localStorage key: smart-list:ultimo-template
{
  templateId: String,       // id do template usado
  templateNome: String,     // "Compra do Mês"
  templateIcone: String,    // "🛒"
  usadoEm: String,          // ISO date — para exibir "há X dias"
  snapshotId: String        // referência ao snapshot salvo (opcional)
}
```

### Mudanças em `useTemplates.js`

```javascript
// Funções adicionais:

salvarUltimoTemplate(templateId)
// Chamado ao finalizar compra (salvar snapshot)
// Grava smart-list:ultimo-template com data atual

getUltimoTemplate()
// Lê smart-list:ultimo-template
// Retorna null se não houver histórico
// Calcula e retorna também "diasDesdeUso" para exibição
```

### Mudanças em `ListVoice.jsx`

- Ao renderizar tela vazia: chamar `getUltimoTemplate()`
- Se retornar valor: exibir `CardUltimoTemplate` acima do botão "Templates"
- Botão "Usar de novo" → aplica direto com perfil familiar (sem abrir modal)
- Botão "Ver itens" → abre `ModalTemplates` já filtrado naquele template

---

## PERSONALIZAÇÃO POR PERFIL FAMILIAR  ← NOVO

Fluxo de 3 perguntas rápidas exibidas no onboarding (primeira vez)
ou ao aplicar qualquer template:

```
1. Quantas pessoas na sua casa?
   [ 1 ] [ 2 ] [ 3-4 ] [ 5+ ]

2. Tem criança ou bebê?
   [ Sim ] [ Não ]

3. Perfil de compra:
   [ 💰 Econômico ] [ ⚖️ Equilibrado ] [ 🌿 Premium ]
```

**Impacto no template aplicado:**
- Multiplica quantidades proporcionalmente ao número de pessoas
- Perfil econômico prioriza unidades maiores (ex: arroz 5kg em vez de 1kg)
- "Tem bebê" remove ou sinaliza itens impróprios (ex: bebidas alcoólicas)

**Persistência:** salvo em `smart-list:perfil` no localStorage.
Não perguntar novamente a menos que o usuário redefina manualmente.

### Schema do perfil
```javascript
// localStorage key: smart-list:perfil
{
  pessoas: Number,        // 1 | 2 | 3 | 4 | 5 (5 = 5+)
  temBebe: Boolean,
  perfilEconomico: String // 'economico' | 'equilibrado' | 'premium'
}
```

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

### 🍼 Casa com Bebê  ← NOVO
fórmula infantil · fraldas · lenço umedecido · pomada para assaduras
leite · frutas (banana, maçã, pera) · papinha (3x) · sabonete infantil

---

## SUGESTÕES AUTOMÁTICAS POR CORRELAÇÃO  ← NOVO

Ao adicionar um item, exibir chip discreto "Adicionar Y?".
Não forçar — apenas sugerir uma vez. Se recusado, não repetir na sessão.

**Mapa de correlações (hardcoded no MVP):**
```javascript
const CORRELACOES = {
  'café':       ['açúcar', 'leite', 'achocolatado'],
  'macarrão':   ['molho de tomate', 'queijo parmesão'],
  'frango':     ['tempero', 'limão', 'alho'],
  'pão de forma': ['manteiga', 'requeijão', 'queijo mussarela'],
  'arroz':      ['feijão', 'óleo'],
  'picanha':    ['sal grosso', 'carvão', 'cerveja'],
  'ovo':        ['sal', 'óleo'],
  'leite':      ['café', 'achocolatado', 'cereais'],
}
```

> Para o MVP, hardcoded. Fase 3 pode evoluir para modelo de co-ocorrência
> baseado no histórico real do usuário.

---

## SCHEMA DE DADOS

### Perfil Familiar (novo)
```javascript
// localStorage key: smart-list:perfil
{
  pessoas: Number,
  temBebe: Boolean,
  perfilEconomico: String  // 'economico' | 'equilibrado' | 'premium'
}
```

### Template
```javascript
{
  id: String,
  nome: String,
  icone: String,
  itens: [
    {
      nome: String,
      quantidade: Number,
      unidade: String,     // 'kg'|'lt'|'g'|'ml'|'un'|'duzia'
      precoSugerido: null
    }
  ],
  editavel: true,
  sistema: Boolean,
  criadoEm: String,
  atualizadoEm: String
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
- `smart-list:perfil`      — perfil familiar (novo)

---

## ARQUIVOS A CRIAR E MODIFICAR

### Criar (novos)
- `src/hooks/useTemplates.js`
- `src/hooks/usePerfilFamiliar.js`           ← novo
- `src/components/ModalTemplates.jsx`
- `src/components/ModalEditarTemplate.jsx`
- `src/components/ModalPerfilFamiliar.jsx`   ← novo
- `src/components/ChipSugestao.jsx`          ← novo (correlações)
- `src/components/CardUltimoTemplate.jsx`    ← novo (destaque tela inicial)

### Modificar (existentes)
- `src/components/ListVoice.jsx` — toolbar reordenado + tela inicial + chips
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

duplicarTemplate(id)
// Cria cópia com sistema: false e nome "Cópia de X"

aplicarTemplate(template, modo, perfil)
// modo: 'substituir' | 'adicionar'
// perfil: objeto do usePerfilFamiliar  ← novo parâmetro
// Ajusta quantidades pelo perfil antes de retornar
// Cruza com useHistorico para preencher precoSugerido quando disponível
```

### `src/hooks/usePerfilFamiliar.js`  ← NOVO

```javascript
// Funções a exportar:

getPerfil()
// Lê smart-list:perfil do localStorage
// Retorna null se não configurado ainda

salvarPerfil(perfil)
// Persiste no localStorage

ajustarQuantidades(itens, perfil)
// Recebe array de itens de template + perfil
// Retorna itens com quantidade ajustada proporcionalmente
// Regra base: 2 pessoas = x1, 4 pessoas = x1.8, 5+ = x2.5
// Perfil econômico: preferir unidades maiores quando disponível

precisaConfigurar()
// Retorna true se perfil ainda não foi definido (onboarding)
```

### `src/components/ModalPerfilFamiliar.jsx`  ← NOVO

Exibido automaticamente na primeira vez que o usuário abre o app
ou ao clicar em "Perfil" nas configurações.

```
[ Sobre sua casa ]

  Quantas pessoas?
  [ 1 ]  [ 2 ]  [ 3-4 ]  [ 5+ ]

  Tem criança ou bebê?
  [ ✓ Sim ]  [ Não ]

  Como você costuma comprar?
  [ 💰 Econômico ]  [ ⚖️ Equilibrado ]  [ 🌿 Premium ]

  [ Salvar ]
```

Props: `isOpen`, `onClose`, `onSalvar(perfil)`

### `src/components/ChipSugestao.jsx`  ← NOVO

Chip flutuante discreto exibido após adicionar item com correlação conhecida.

```
  ┌─────────────────────────────────────────┐
  │  💡 Adicionar açúcar?    [Sim] [Não]    │
  └─────────────────────────────────────────┘
```

- Auto-dismiss em 5 segundos se não interagir
- Ao clicar "Não", nunca exibir esse par na sessão atual
- Ao clicar "Sim", adiciona com fonte: 'sugestao'

Props: `item`, `sugestao`, `onAceitar`, `onRecusar`

### `src/components/ModalTemplates.jsx`

Tela de seleção de template. Exibida:
- Ao abrir o app com lista vazia (banner de sugestão)
- Ao clicar em "Templates" no toolbar

Layout:
```
[ Templates ]                              [X]

  🛒 Compra do Mês        [ Usar ] [ Editar ]
  🗓️ Compra da Semana     [ Usar ] [ Editar ]
  ☕ Café da Manhã        [ Usar ] [ Editar ]
  🔥 Churrasco            [ Usar ] [ Editar ]
  🧹 Limpeza              [ Usar ] [ Editar ]
  🍼 Casa com Bebê        [ Usar ] [ Editar ]
  ─────────────────────────────────────────
  Meus templates
  📋 Minha lista padrão   [ Usar ] [ Editar ] [ 🗑 ]

  [ + Criar template a partir da lista atual ]
```

Ao clicar em "Usar":
- Se lista atual estiver vazia → aplica direto (com ajuste de perfil)
- Se lista tiver itens → ModalConfirmacao com:
  "Substituir lista atual" / "Adicionar à lista" / "Cancelar"

Props: `isOpen`, `onClose`, `onAplicar(itens)`

### `src/components/ModalEditarTemplate.jsx`

Edição de template com AutocompleteInput (já existe).

- Editar nome e ícone
- Adicionar / remover itens
- Ajustar quantidade e unidade
- Editar template do sistema cria cópia automática (sistema: false)

---

## TOOLBAR REORDENADO EM ListVoice.jsx

```
[🔍 Digite produto...  ] [+]     ← AutocompleteInput (linha 1)

[📋 Templates] [📝 Texto] [🎙️ Voz] [📷 Foto]   ← linha 2, templates primeiro
```

Tela inicial (lista vazia):
- Banner: "Comece por um template →" com botão de atalho
- Não forçar modal automático — apenas sugerir

---

## ORDEM DE IMPLEMENTAÇÃO

### Sprint 1 — Templates + Perfil (prioridade máxima)
1. `useTemplates.js` com templates hardcoded + CRUD localStorage + `salvarUltimoTemplate` / `getUltimoTemplate` (1h)
2. `usePerfilFamiliar.js` com ajuste de quantidades (45min)
3. `ModalPerfilFamiliar.jsx` — onboarding 3 perguntas (45min)
4. `CardUltimoTemplate.jsx` — card de destaque tela inicial (30min)  ← novo
5. `ModalTemplates.jsx` — seleção e aplicação com perfil (1.5h)
6. `ModalEditarTemplate.jsx` — edição de itens (1.5h)
7. Integrar em `ListVoice.jsx` — toolbar + card destaque + onboarding (1h)

### Sprint 2 — Correlações + Polimento
7. `ChipSugestao.jsx` — sugestões por correlação (45min)  ← novo
8. Cruzar `aplicarTemplate` com `useHistorico` para sugerir últimos preços (30min)
9. Ajustar CSS — seletor de templates mobile-first (1h)
10. Testes em dispositivo real (Android/iOS)

### Sprint 3 — Features complementares (já implementadas, revisar)
11. Revisar AutocompleteInput integrado ao novo toolbar
12. Revisar fluxo de voz como entrada secundária
13. Finalizar pipeline nota-fiscal (rate-limit, logs)

---

## MÉTRICAS DE SUCESSO DO MVP v2.1  ← NOVO

| Métrica | Meta |
|---------|------|
| Tempo para criar primeira lista | < 2 minutos |
| Taxa de uso de templates | > 60% das sessões |
| Taxa de "repetir lista" | > 40% após 2ª compra |
| Sugestões por correlação aceitas | > 30% das exibidas |
| Usuários que completam perfil familiar | > 70% |

---

## DECISÕES EM ABERTO  ← NOVO

| Decisão | Opções | Recomendação |
|---------|--------|--------------|
| Base de produtos autocomplete | CSV local vs Open Food Facts API | CSV local ~200 itens (MVP) |
| Correlações | Hardcoded vs co-ocorrência do histórico | Hardcoded agora, migrar na Fase 3 |
| Perfil: sempre perguntar vs salvar | Salvar ou perguntar a cada lista | Salvar, com opção de redefinir |
| Template de bebê | Incluir no MVP ou Fase 2 | Incluir — diferencial para o público |

---

## PREPARAÇÃO PARA FASE 2 (Wizard de Preço)

Os campos `fonte`, `estabelecimento` (com lat/lng) e `precoUltimo` no
`useHistorico` são os dados que vão alimentar o Wizard de Preço.

O campo `perfilEconomico` do `usePerfilFamiliar` vai orientar o algoritmo
de otimização de custo — já coletando desde o MVP.

Templates do sistema podem futuramente ser sincronizados do backend —
o campo `sistema: true` já sinaliza essa origem. A migração será:
localStorage → POST /api/templates na primeira vez que o usuário logar.

Os campos `criadoEm` e `atualizadoEm` resolvem conflitos de sincronização.
