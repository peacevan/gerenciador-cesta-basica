# SPEC — Refatoração de Layout e Navegação SmartList v2.3

> Data: 2026-04-18
> Branch: feat/MVP_V2_1_implementation

---

## 1. NAVEGAÇÃO GLOBAL (BottomNav)

Substituir a navegação atual por **4 ícones fixos** em todas as telas:

| Posição | Ícone     | Label    | Destino                 |
|---------|-----------|----------|-------------------------|
| 1       | Home      | Início   | Tela home / empty state |
| 2       | Grid 2x2  | Listas   | Tela ListasProntas      |
| 3       | Carrinho  | Carrinho | Tela Carrinho           |
| 4       | Loja      | Loja     | ModalEstabelecimento    |

**Regras visuais:**
- Ícone ativo: fundo `#E1F5EE`, cor `#1D9E75`
- Ícone "Carrinho": badge vermelho (`#E24B4A`) com número de itens quando `> 0`; badge some quando carrinho estiver vazio
- Remover completamente o ícone de Buscar e Voz do rodapé global

---

## 2. TELA HOME — EMPTY STATE

Exibida quando não há lista ativa:

- Ícone da sacola dentro de círculo com fundo `#E1F5EE`
- Título: `"Pronto pra montar a compra do mês?"`
- Subtítulo: `"Escolha um template e ajuste pro que você precisa."`
- Botão primário verde `"Ver Listas Prontas"` → navega para tela ListasProntas
- Chips de sugestão rápida abaixo do botão:
  - Gerados dinamicamente a partir dos nomes em `templatesDefault.js` (primeiros 3 templates)
  - Ao tocar em um chip → abre direto o preview daquele template

---

## 3. TELA LISTAS PRONTAS

Substituir o modal atual por uma **tela completa** (rota/página):

- Header com título `"Listas Prontas"` e botão voltar (`←`)
- Grid de **2 colunas** com cards de template
- Cada card exibe:
  - Ícone colorido por categoria (usando `bg` e `stroke` do objeto de categoria)
  - Nome do template
  - Quantidade de itens
  - Botão de editar (lápis ✏️) no canto superior direito
- **Templates já adicionados** na sessão atual:
  - Fundo `var(--color-background-secondary)` com opacidade `0.5`
  - Badge `"✓ adicionado"` no canto superior direito (fundo `#E1F5EE`, texto `#0F6E56`)
  - Não são clicáveis
- Último card do grid: botão `"+"` com label `"Criar lista"` → abre fluxo de criação de template do zero
- Rodapé global presente (ícone Carrinho ativo com badge)

**Controle de estado "adicionado":**
- Lista de IDs de templates já mesclados/substituídos na sessão atual
- Resetar ao finalizar compra ou ao limpar o carrinho

---

## 4. TELA PREVIEW DE TEMPLATE

Exibida ao tocar em um card de template disponível:

- Header: nome do template + contagem de itens + botão voltar
- Lista scrollável com todos os itens do template (nome + unidade)
- **Barra fixa inferior** com pergunta e dois botões:
  - `"Substituir"` (borda, fundo branco): limpa carrinho atual e carrega itens do template
  - `"Mesclar"` (fundo `#1D9E75`, texto branco): adiciona itens do template sem remover os existentes
- Após qualquer ação:
  - Marcar o template como "adicionado" na sessão
  - Navegar para tela Carrinho
  - Exibir toast/snackbar: `"X itens adicionados ao carrinho"`

---

## 5. TELA CARRINHO

Tela principal de execução da compra:

- Header: `"Carrinho"` + progresso `"X / Y itens"`
- Lista scrollável de itens:
  - Checkbox à esquerda para marcar como comprado
  - Itens marcados: texto riscado + opacidade `0.4` + movem para o final da lista
  - Nome do item + preço (editável ao toque)
- **Barra fixa** acima do rodapé global:
  - Input de texto `"adicionar item..."` (`flex: 1`)
  - Botão circular `#1D9E75` com ícone de microfone
  - Microfone aciona Web Speech API (`lang: pt-BR`)
  - Resultado do reconhecimento preenche o input e submete automaticamente após `1.5s` sem fala
  - Input também permite busca/filtro nos produtos do histórico
- Rodapé global com ícone Carrinho ativo

---

## 6. ÍCONE LOJA NO RODAPÉ

- Tocar em `"Loja"` abre o `ModalEstabelecimento` já existente
- O modal permanece como está (não converter para tela)
- Após selecionar estabelecimento: fechar modal e retornar para a tela anterior
- Ícone Loja com destaque ativo (`#E1F5EE` / `#1D9E75`) enquanto o modal estiver aberto

---

## 7. CATEGORIAS DE TEMPLATE

Adicionar campo `categoria` e `cor` em cada objeto de `templatesDefault.js`:

```js
const CATEGORIAS = {
  compras:   { bg: '#E1F5EE', stroke: '#1D9E75' },
  cafe:      { bg: '#FEF3E2', stroke: '#BA7517' },
  feira:     { bg: '#EAF3DE', stroke: '#3B6D11' },
  limpeza:   { bg: '#FAEEDA', stroke: '#854F0B' },
  proteinas: { bg: '#FAECE7', stroke: '#993C1D' },
  churrasco: { bg: '#FCEBEB', stroke: '#A32D2D' },
  dieese:    { bg: '#E6F1FB', stroke: '#185FA5' },
}
```

- Mapear cada template existente para uma categoria
- Novos templates criados pelo usuário herdam categoria `"compras"` por padrão, podendo alterar

---

## 8. RESTRIÇÕES — NÃO ALTERAR

- Manter toda lógica de `localStorage` intacta
- Manter `normalizeProductName` sem alterações
- Manter `ModalEstabelecimento` sem alterações estruturais
- Manter estrutura de arquivos: `src/data/templatesDefault.js`, `src/data/unidades.js`
- Não introduzir novas dependências externas
