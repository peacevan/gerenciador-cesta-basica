# 🐛 Bug Tracker — Gerenciador Cesta Básica

Documento para registro de bugs encontrados, status e resolução.

---

## Legenda de Status
| Status | Descrição |
|--------|-----------|
| 🔴 Aberto | Bug identificado, ainda não corrigido |
| 🟡 Em andamento | Correção em progresso |
| 🟢 Resolvido | Corrigido e verificado |
| 🔵 Won't Fix | Conhecido, não será corrigido |

---

## Bugs

### BUG-001 — Netlify Dev falha ao iniciar (timeout na porta 3000)
- **Status:** 🟢 Resolvido
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** `npx netlify-cli dev` encerrava com erro `Timed out waiting for port '3000' to be open`. O `react-scripts start` não subia a tempo ou tentava abrir o browser e ficava aguardando interação.
- **Causa raiz:** `react-scripts start` tenta abrir o browser automaticamente. No contexto do Netlify Dev (sem TTY interativo), isso pode bloquear ou atrasar o processo. O `startTimeout` padrão (120s) era insuficiente para a primeira compilação.
- **Resolução:**
  - Adicionado `BROWSER=none` no arquivo `.env` para suprimir a abertura do browser.
  - Aumentado `startTimeout` de `120` para `300` segundos no `netlify.toml`.
  - Garantir que nenhum processo node esteja ocupando a porta 3000 antes de iniciar (`Get-Process -Name node | Stop-Process -Force`).
- **Arquivos alterados:** `.env`, `netlify.toml`

---

### BUG-002 — Nome de função inválida: `ai-proxy.testable`
- **Status:** 🔴 Aberto
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** O arquivo `netlify/functions/ai-proxy.testable.js` tem ponto no nome, o que é inválido para funções Netlify. Aparece o warning: `Function name 'ai-proxy.testable' is invalid. It should consist only of alphanumeric characters, hyphen & underscores.`
- **Causa raiz:** Arquivo criado com ponto no nome para separar concerns de teste, mas o Netlify carrega todos os arquivos `.js` da pasta `functions/` como funções lambda.
- **Solução sugerida:** Mover `ai-proxy.testable.js` para fora da pasta `netlify/functions/` (ex: `netlify/functions/__tests__/`) ou renomear para `ai-proxy-testable.js`.
- **Arquivos afetados:** `netlify/functions/ai-proxy.testable.js`

---

### BUG-003 — Checkbox: total da lista não considerava apenas itens marcados
- **Status:** 🟢 Resolvido
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** O cálculo do total da lista somava todos os itens independentemente de estar marcado (`comprado === true`). O comportamento correto é: salvar todos os itens no snapshot, mas o total exibido deve refletir apenas os marcados.
- **Causa raiz:** `calcularTotal` em `useShoppingList.js` iterava sobre todos os itens sem filtrar por `comprado`.
- **Resolução:** Criada função `calcularTotalMarcados(itens)` que filtra por `comprado === true` antes de somar. O hook passa a usar essa função para expor o `total`. Testes unitários adicionados para validar o comportamento.
- **Arquivos alterados:** `src/hooks/useShoppingList.js`, `src/hooks/__tests__/useShoppingList.pure.test.js`

---

### BUG-004 — Teste `excluirTemplate` falhava intermitentemente (colisão de ID)
- **Status:** 🟢 Resolvido
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** O teste de exclusão de template falhava com contagem incorreta de itens após exclusão. O ID gerado para novos templates podia colidir com existentes, causando comportamento inesperado no `filter`.
- **Causa raiz:** Geração de ID não verificava unicidade antes de atribuir.
- **Resolução:** Lógica de geração de ID em `useTemplates.js` atualizada para detectar colisões e adicionar sufixo incremental até garantir unicidade.
- **Arquivos alterados:** `src/hooks/useTemplates.js`, `src/hooks/__tests__/useTemplates.test.js`

---

### BUG-005 — Checkbox de marcar/desmarcar produto não aparece ao lado do nome
- **Status:** 🔴 Aberto
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** O checkbox para marcar e desmarcar produtos não está visível na lista. Deve aparecer ao lado do nome de cada produto para que o usuário possa marcá-los como comprados.
- **Causa raiz:** A ser investigado — pode ser problema de CSS (visibilidade, z-index, cor sobre o tema atual) ou de renderização condicional no componente.
- **Arquivos suspeitos:** `src/components/ListVoice.jsx`, `src/styles/ListVoice.css`

---

### BUG-006 — Falta opção de editar nome, quantidade, unidade e preço do produto
- **Status:** 🔴 Aberto
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** Após um item ser adicionado à lista, não existe modo de edição inline. O usuário não consegue corrigir nome, alterar quantidade, unidade ou preço sem remover e readicionar o item.
- **Causa raiz:** Funcionalidade de edição inline não implementada nos componentes de lista.
- **Solução sugerida:** Adicionar botão de edição por item (ícone lápis) que abre um formulário inline ou modal com campos editáveis.
- **Arquivos suspeitos:** `src/components/ListVoice.jsx`, `src/hooks/useShoppingList.js`

---

### BUG-007 — Reconhecimento de voz não detecta preço corretamente no modo offline ("10 reais", "20 reais")
- **Status:** 🔴 Aberto
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** Ao falar o preço com sufixo "reais" (ex: "arroz 10 reais"), o modo offline (regex) não extrai o valor correto. O preço pode ser ignorado ou atribuído errado.
- **Causa raiz:** A regex do fallback offline pode não contemplar variações como `\d+ reais`, `\d+,\d+ reais`, `R$ \d+`.
- **Solução sugerida:** Ampliar os padrões de regex no parser offline para capturar variações de moeda falada.
- **Arquivos suspeitos:** `src/hooks/useVoiceRecognition.js`, `src/hooks/useLLMParser.js`

---

### BUG-008 — AutoComplete trava ao digitar manualmente outras informações do produto
- **Status:** 🔴 Aberto
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** Ao tentar adicionar um produto manualmente, o AutoComplete abre corretamente, mas ao tentar digitar outras informações (quantidade, unidade, preço) o componente trava ou interfere na digitação dos demais campos.
- **Causa raiz:** Provável conflito de foco ou event bubbling entre `AutocompleteInput` e os outros campos do formulário de adição.
- **Solução sugerida:** Isolar eventos de teclado do AutocompleteInput para não capturar input de outros campos; revisar lógica de `onBlur`/`onFocus`.
- **Arquivos suspeitos:** `src/components/AutocompleteInput.jsx`, `src/components/AdicionarItem.jsx`

---

### BUG-009 — Nomes de produtos devem ser normalizados para MAIÚSCULAS na lista
- **Status:** 🔴 Aberto
- **Data:** 2026-04-02
- **Branch:** feat/MVP_V2
- **Descrição:** Os nomes dos produtos são exibidos com capitalização mista (como foram digitados ou reconhecidos). A lista deve padronizar sempre em maiúsculas para manter consistência visual e facilitar leitura.
- **Causa raiz:** A função `normalizeProduct` em `src/utils/normalizeProduct.js` pode não estar aplicando `.toUpperCase()` no nome.
- **Solução sugerida:** Aplicar `.toUpperCase()` ao campo `nome` na normalização ou na camada de exibição.
- **Arquivos suspeitos:** `src/utils/normalizeProduct.js`, `src/hooks/useShoppingList.js`

---

*Adicione novos bugs abaixo seguindo o padrão BUG-NNN.*
