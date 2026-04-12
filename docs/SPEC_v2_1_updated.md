# Especificação de Implementação — MVP v2.1 (atualizado)

**Data:** 2026-04-12
**Repositório:** peacevan/gerenciador-cesta-basica

## Objetivo

Documentar a atualização da abordagem do MVP v2.1 para centralizar o fluxo em torno de templates pré-prontos e tornar a voz um complemento em vez da entrada principal.

O spec deve guiar a implementação dos ajustes solicitados, preservando o comportamento atual do app e reforçando a experiência "Template First".

---

## Visão Geral da Atualização

- A tela inicial vazia deve incentivar o usuário a começar por um template.
- Se o usuário já tiver histórico, o último template usado aparece em destaque para ser repetido com 1 clique.
- Templates do sistema são a base do workflow e podem ser editados através da criação de cópias do tipo usuário.
- A interface principal precisa ter uma toolbar fixa no rodapé com input de autocomplete e botões de ação para Templates, Texto, Voz e Foto.
- A edição de template deve ser suportada por um modal dedicado.
- Templates devem ser persistidos localmente no `localStorage` para sobreviver ao refresh.

---

## Requisitos Funcionais

### 1. Fluxo "Template First"

- Ao abrir o app com lista vazia, verificar se existe histórico de uso de templates.
- **Com histórico:** exibir card de destaque "Repetir última compra" antes da grade de templates (ver seção abaixo).
- **Sem histórico:** exibir banner ou CTA que direcione para seleção de templates.
- O usuário deve poder escolher um template pronto para popular a lista.
- Templates servem como ponto de partida e podem ser ajustados depois.

### 2. Card "Último Template em Destaque" ← NOVO

Premissa: **compras mensais e semanais se repetem**. O menor atrito possível para o caso mais comum é o maior diferencial de UX do app.

**Comportamento:**
- Ao finalizar uma compra (salvar snapshot) → gravar `templateId`, `templateNome`, `templateIcone` e `usadoEm` em `smart-list:ultimo-template`.
- Na próxima abertura com lista vazia → verificar essa chave.
- Se existir → exibir card de destaque acima da grade de templates.
- Se não existir → exibir grade normal (primeiro acesso).

**Layout do card:**
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

- Card usa visual diferenciado: borda colorida e fundo suave.
- "Usar de novo" → aplica o template direto, sem abrir nenhum modal.
- "Ver itens" → abre `ModalTemplates` já posicionado naquele template.

### 3. Perfil Familiar ← NOVO

Onboarding com 3 perguntas rápidas exibidas na primeira vez que o usuário abre o app. Salvo em `smart-list:perfil` e não perguntado novamente a menos que o usuário redefina.

```
1. Quantas pessoas na sua casa?
   [ 1 ]  [ 2 ]  [ 3-4 ]  [ 5+ ]

2. Tem criança ou bebê?
   [ Sim ]  [ Não ]

3. Como você costuma comprar?
   [ 💰 Econômico ]  [ ⚖️ Equilibrado ]  [ 🌿 Premium ]
```

**Impacto ao aplicar template:**
- Multiplica quantidades proporcionalmente ao número de pessoas (base: 2 pessoas = x1, 4 = x1.8, 5+ = x2.5).
- Perfil econômico prioriza unidades maiores (ex: arroz 5kg em vez de 1kg).
- "Tem bebê: Sim" sinaliza ou remove itens impróprios (ex: bebidas alcoólicas).

### 4. Sugestões Automáticas por Correlação ← NOVO

Ao adicionar um item com correlação conhecida, exibir um chip discreto sugerindo o próximo item. Não forçar — sugerir uma vez. Se recusado, não repetir na sessão.

```
┌─────────────────────────────────────────┐
│  💡 Adicionar açúcar?    [Sim] [Não]    │
└─────────────────────────────────────────┘
```

- Auto-dismiss em 5 segundos sem interação.
- "Sim" adiciona o item com `fonte: 'sugestao'`.
- "Não" descarta e não repete o par na sessão atual.

**Correlações hardcoded (MVP):**
```javascript
const CORRELACOES = {
  'café':         ['açúcar', 'leite'],
  'macarrão':     ['molho de tomate', 'queijo parmesão'],
  'frango':       ['tempero', 'limão', 'alho'],
  'pão de forma': ['manteiga', 'requeijão'],
  'arroz':        ['feijão', 'óleo'],
  'picanha':      ['sal grosso', 'carvão'],
  'ovo':          ['sal', 'óleo'],
  'leite':        ['café', 'achocolatado'],
}
```

### 5. Templates do sistema x templates do usuário

- Templates de sistema são entregues pelo app com `sistema: true`.
- Quando o usuário desejar editar um template de sistema, o app deve duplicá-lo como um novo template com `sistema: false`.
- O template duplicado recebe nome `Cópia de <nome>` e mantém relação com o original.
- Templates do usuário podem ser atualizados e salvos no `localStorage`.

### 6. Modal de edição de template

- Deve permitir editar nome, ícone e itens do template.
- Deve listar itens atuais com campos de quantidade, unidade e remoção.
- Deve incluir `AutocompleteInput` para adicionar itens novos diretamente no modal.
- Deve ter botões "Cancelar" e "Salvar Template".

### 7. Toolbar de ação fixa no rodapé

- Linha 1: `AutocompleteInput` + botão `+` para adicionar item rápido.
- Linha 2: botões principais ordenados: `[Templates] [Texto] [Voz] [Foto]`.
- O botão de templates deve abrir o modal de seleção de templates.
- A entrada por voz permanece disponível, mas não mais como fluxo principal exclusivo.

### 8. Persistência

- `smart-list:templates` — templates criados/editados pelo usuário.
- `smart-list:perfil` — perfil familiar (novo).
- `smart-list:ultimo-template` — último template usado com data (novo).
- O app deve carregar templates do sistema e do usuário ao iniciar.
- As alterações de template devem atualizar `atualizadoEm`.

### 9. Compatibilidade e escopo

- Não modificar funcionalidades de backend (Netlify functions) ou outros módulos fora do MVP central.
- Manter `useShoppingList.js`, `useVoiceRecognition.js`, `useHistorico.js` e outros módulos existentes funcionando.

---

## Arquivos a Criar

- `src/hooks/useTemplates.js`
- `src/hooks/usePerfilFamiliar.js`          ← novo
- `src/components/ModalTemplates.jsx`
- `src/components/ModalEditarTemplate.jsx`
- `src/components/ModalPerfilFamiliar.jsx`  ← novo
- `src/components/CardUltimoTemplate.jsx`   ← novo
- `src/components/ChipSugestao.jsx`         ← novo

## Arquivos a Modificar

- `src/components/ListVoice.jsx`
- `src/styles/ListVoice.css`

---

## Modelos de Dados

### Último template usado
```javascript
// localStorage key: smart-list:ultimo-template
{
  templateId: String,     // id do template usado
  templateNome: String,   // "Compra do Mês"
  templateIcone: String,  // "🛒"
  usadoEm: String,        // ISO date — para calcular "há X dias"
  snapshotId: String      // referência ao snapshot (opcional)
}
```

### Perfil familiar
```javascript
// localStorage key: smart-list:perfil
{
  pessoas: Number,          // 1 | 2 | 3 | 4 | 5 (5 = 5+)
  temBebe: Boolean,
  perfilEconomico: String   // 'economico' | 'equilibrado' | 'premium'
}
```

### Template
```javascript
// localStorage key: smart-list:templates
{
  id: String,
  nome: String,
  icone: String,
  itens: [
    {
      nome: String,
      quantidade: Number,
      unidade: String,        // 'kg'|'lt'|'g'|'ml'|'un'|'duzia'
      precoSugerido: Number | null
    }
  ],
  editavel: Boolean,
  sistema: Boolean,
  criadoEm: String,
  atualizadoEm: String
}
```

### Item de lista
```javascript
// localStorage key: smart-list-items
{
  id: String,
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number | '',
  comprado: Boolean,
  fonte: String   // 'template'|'autocomplete'|'voz'|'texto'|'foto'|'manual'|'sugestao'
}
```

---

## Comportamento Esperado

- Ao abrir com lista vazia **e com histórico**: exibir card "Repetir última compra" com o último template usado e opção de aplicar com 1 clique.
- Ao abrir com lista vazia **sem histórico**: exibir banner "Comece por um template →" com acesso à grade de templates.
- Ao selecionar um template: aplicar perfil familiar para ajustar quantidades antes de popular a lista.
- Se o usuário editar um template do sistema: criar novo template de usuário em vez de alterar o original.
- Ao adicionar um item com correlação: exibir chip de sugestão discreto com auto-dismiss de 5s.
- A toolbar fixa no rodapé deve manter as ações à mão sem bloquear a área principal da lista.

---

## Critérios de Aceitação

- [ ] Estado vazio sem histórico exibe CTA de templates.
- [ ] Estado vazio com histórico exibe card "Repetir última compra" com nome e "há X dias".
- [ ] "Usar de novo" aplica o template sem abrir modal.
- [ ] Perfil familiar é perguntado no primeiro acesso e salvo no localStorage.
- [ ] Quantidades do template são ajustadas proporcionalmente ao perfil.
- [ ] A seleção de template funciona e popula a lista corretamente.
- [ ] A edição de um template de sistema cria uma cópia editável.
- [ ] Templates do usuário salvos persistem após refresh.
- [ ] Chip de sugestão aparece ao adicionar item com correlação e desaparece em 5s.
- [ ] A toolbar fixa no rodapé está visível e funcional em mobile e desktop.
- [ ] A integração de voz continua disponível como ação secundária.

---

## Pontos de Validação

- Testar abertura do app pela primeira vez (sem histórico).
- Testar abertura após salvar snapshot de compra (com histórico).
- Testar "Usar de novo" e verificar lista populada com quantidades ajustadas.
- Testar seleção e uso de templates prontos.
- Testar edição de template de sistema e verificar novo template salvo.
- Verificar persistência em `localStorage` nas chaves relevantes.
- Testar chips de sugestão: aceitar, recusar, e auto-dismiss.
- Testar a experiência da toolbar no rodapé em desktop e mobile.
