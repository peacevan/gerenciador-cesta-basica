# Especificação: Refatoração Tela Carrinho (UX)

Refatore a tela Carrinho implementando todas as melhorias de UX definidas abaixo.

---

## 1. LISTA DE ITENS — COMPORTAMENTO GERAL

- Capitalizar primeira letra dos nomes na exibição (text-transform: capitalize ou capitalizar via JS — não alterar dado salvo no localStorage).
- Remover ícone de lixo vermelho da linha padrão do item. O lixo só aparece quando o item estiver EXPANDIDO.
- Remover chevron (˅) dos itens já marcados como comprados.
- Checkbox: trocar círculo (radio style) por quadrado com border-radius: 4px — mais claro que é checklist.

---

## 2. SEPARAÇÃO PENDENTES / COMPRADOS

Implementar duas seções distintas na lista:

### SEÇÃO 1 — PENDENTES (topo, sempre visível)
- Todos os itens ainda não marcados.
- Ordenados como vieram do template.
- Sem cabeçalho — é a seção principal.

### SEÇÃO 2 — COMPRADOS (colapsável, abaixo dos pendentes)
- Cabeçalho clicável: `[✓ ícone] Comprados (N)   [chevron ˅/˄]`
  - Fundo: `var(--color-background-secondary)`
  - Borda topo: `0.5px solid var(--color-border-tertiary)`
  - Cor do texto e ícone: `#0F6E56`
- Estado padrão: EXPANDIDO (usuário pode ver o que já pegou).
- Ao clicar no cabeçalho: colapsa/expande a seção.
- Itens dentro da seção: `opacity: 0.4` + texto riscado.
- Quando não há itens comprados: ocultar seção inteira.

---

## 3. ITEM EXPANDIDO (tocar no nome do item)

Ao tocar no nome de um item PENDENTE, expandir inline com:

### a) BLOCO DE VOZ
- Área com fundo `#E1F5EE`, `border-radius: 8px`.
- Estado repouso: ícone `mic` + texto `Falar quantidade e preço`.
- Estado escutando: fundo `#1D9E75`, ícone mic branco, texto `Escutando... fale '2 unidades 7 reais e 90'`.
- Badge `via regex` (bg `#9FE1CB`, texto `#0F6E56`) após sucesso.
- Se regex falhar: mensagem cinza `Não entendi. Tente: '2 unidades 10 reais' ou preencha abaixo.`
- NÃO chamar LLM (reservado para premium — backlog).

### b) CAMPOS QUANTIDADE + PREÇO
- Grid 2 colunas.
- Quantidade: stepper − / valor / + (mínimo 1, padrão 1).
- Preço unitário: campo editável com prefixo `R$`.
- Subtotal: `= R$ X,XX neste item` em `#1D9E75`.
- Botão `Confirmar` fecha expandido e salva.

### c) ÍCONE LIXO
- Aparece APENAS no estado expandido.
- Cor `#E24B4A`, alinhado à direita no cabeçalho do expandido.
- Ao tocar: confirmar remoção com snackbar de desfazer `Item removido  [Desfazer]` por 4 segundos.

### d) REGRAS
- Só um item expandido por vez.
- Tocar em outro item fecha o atual sem salvar.
- Tocar no item expandido novamente fecha sem salvar.
- Itens comprados NÃO são expansíveis.

---

## 4. INDICADOR DE PREÇO NOS ITENS

- Item pendente sem preço:
  - exibir `— adicionar preço` em `var(--color-text-tertiary)` (font-size 11px).
- Item pendente com preço preenchido:
  - exibir `Nx R$ X,XX` em `var(--color-text-secondary)`.
- Item comprado com preço:
  - exibir `Nx R$ X,XX` riscado, `opacity: 0.4`.
- Item comprado sem preço:
  - exibir `—` simples (sem label `adicionar preço`).
- NÃO exibir `R$ 0,00` em vermelho em nenhuma situação.

---

## 5. BARRA DE PROGRESSO

- Altura: `3px`, logo abaixo do header, sem padding lateral.
- Fundo: `var(--color-border-tertiary)`.
- Preenchimento: `#1D9E75`.
- Largura: `(itens comprados / total) * 100%`.
- Transição suave: `transition: width 0.3s ease`.
- Atualiza em tempo real ao marcar/desmarcar itens.

---

## 6. MARCAR ITEM COMO COMPRADO

- Ao tocar no checkbox de um item pendente:
  - Marcar imediatamente (sem expandir).
  - Mover para seção `Comprados` com animação suave.
  - Atualizar barra de progresso e total.
  - NÃO obrigar preenchimento de preço para marcar.
- Ao tocar no checkbox de um item comprado:
  - Desmarcar e mover de volta para seção pendentes.
  - Manter quantidade e preço já preenchidos.

---

## 7. RODAPÉ

Layout do rodapé (da esquerda pra direita):
- Total: `R$ X,XX` em `font-size: 16px; font-weight: 500`.
- Contagem: `X / Y itens` em `font-size: 10px` abaixo do total.
- Botão `Finalizar` com ícone ✓ à direita:
  - Fundo `#1D9E75`, texto branco, `border-radius: 20px`.
  - Ao tocar: salvar snapshot no histórico com `{ itens, total, estabelecimento, data }` e navegar para tela de confirmação ou home.

Rodapé global abaixo (Início, Listas, Carrinho ativo, Loja).

---

## 8. SHAPE DO ITEM NO LOCALSTORAGE

Ao confirmar quantidade e preço de um item, salvar:

```
{
  id: string,
  nome: string,
  quantidade: number,          // padrão 1
  unidade: string,             // padrão 'und'
  precoUnitario: number|null,  // null se não informado
  precoTotal: number|null,     // quantidade * precoUnitario
  marcado: boolean,
  atualizadoEm: string         // ISO 8601
}
```

`precoTotal` contribui para o total estimado da compra e para o ranking de preço por estabelecimento.

---

## 9. RESTRIÇÕES — NÃO ALTERAR

- Manter `localStorage` intacto.
- Manter `normalizeProductName` sem alterações.
- Verificar e reaproveitar `voiceParser.js` se existir.
- Não introduzir novas dependências externas.
- Manter `ModalEstabelecimento` sem alterações estruturais.

---

## 10. BACKLOG — NÃO IMPLEMENTAR AGORA

- Parser Premium (quando regex falhar e usuário for premium): chamar `ai-proxy.mjs` e exibir badge `via IA`. (Backlog)

---

> Autor: especificação gerada a partir do prompt do produto.
