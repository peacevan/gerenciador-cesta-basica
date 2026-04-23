# SmartList — Histórico de Compras (consolidado)

Fontes consolidadas:
- docs/HISTORICO.md
- docs/HISTORICO_SPEC.md
- docs/SPEC_HISTORICO_v1.md
- docs/EXECUTION_PLAN_HISTORICO_v1.md

## 1. Tela de listagem do histórico
Objetivo:
- Exibir compras finalizadas em ordem decrescente de data.

Estrutura:
- Header com voltar e menu de ações (inclui limpar histórico com confirmação).
- Cards de resumo:
  - total de compras
  - média por compra
- Lista de cards de compras:
  - template/categoria
  - estabelecimento + data
  - total da compra
  - total de itens
  - barra de progresso de itens com preço

Comportamentos:
- Toque no card abre detalhe da compra.
- Estado vazio: mensagem orientando finalizar uma compra para aparecer no histórico.

## 2. Tela de detalhe de compra
Objetivo:
- Exibir snapshot somente leitura e permitir reutilização da lista.

Estrutura:
- Header com voltar, nome do template e badge de total.
- Linha de metadados: estabelecimento, data, quantidade de itens.
- Lista de itens (somente leitura):
  - item marcado: check + resumo de preço
  - item sem preço: label "sem preço"
- Botão fixo "Usar esta lista de novo".

Comportamentos:
- Ao usar novamente:
  - se carrinho estiver vazio: carregar itens e ir para Carrinho
  - se carrinho tiver itens: permitir substituir ou mesclar
- Não permitir edição nesta tela.

## 3. Redirecionamento após finalizar
Fluxo oficial:
1. No Carrinho, usuário toca "Finalizar".
2. Modal Mercado (estabelecimento) coleta dados opcionais.
3. `salvarSnapshot(itens, total, estabelecimento, meta)` é executado.
4. Lista atual é limpa.
5. Navegação automática para `historico`.
6. Exibir feedback de sucesso (toast curto).

## 4. Shape dos dados no localStorage
Chaves:
- `smart-list:catalog`
- `smart-list:history`

### 4.1 Catálogo (`smart-list:catalog`)
```json
{
  "arroz": {
    "nome": "arroz",
    "nomeBruto": "Arroz Tipo 1",
    "unidade": "kg",
    "precoUltimo": 25.9,
    "contadorUso": 12,
    "ultimoUso": "2026-03-31T20:00:00Z"
  }
}
```

### 4.2 Snapshot (`smart-list:history`)
```json
{
  "id": "uuid",
  "savedAt": "ISO8601",
  "label": "Compra DD/MM",
  "totalGasto": 187.5,
  "totalItens": 13,
  "itensSemPreco": 2,
  "templateNome": "Compra do Mês",
  "templateCategoria": "compras",
  "estabelecimento": {
    "nome": "Atacadão",
    "endereco": "Av. X",
    "lat": -12.9,
    "lng": -38.4,
    "fonte": "gps"
  },
  "itens": [
    {
      "nome": "arroz",
      "quantidade": 5,
      "unidade": "kg",
      "preco": 25.9,
      "comprado": true,
      "precoUnitario": 25.9,
      "precoTotal": 129.5,
      "marcado": true
    }
  ]
}
```

Regras de compatibilidade:
- Preservar campos legados (`preco`, `comprado`) e adicionar novos (`precoUnitario`, `precoTotal`, `marcado`).
- Limite de 50 snapshots com política LRU.

## 5. Barra de progresso de preços nos cards
Objetivo:
- Mostrar qualidade de preenchimento de preços da compra.

Cálculo:
- `$comPreco = totalItens - itensSemPreco`
- `$progresso = (comPreco / totalItens) * 100` (quando `totalItens > 0`)

UI:
- Barra com altura de 3px.
- Fundo neutro + preenchimento verde.
- Label: `X/Y com preço`.

## 6. API consolidada do useHistorico
Funções principais:
- `registrar(item)`
- `buscar(query, limit)`
- `salvarSnapshot(itens, total, estabelecimento, meta?)`
- `listarSnapshots()`
- `carregarSnapshot(id)`
- `excluirSnapshot(id)`
- `limparHistorico()`
- `limparCatalogo()`

Regras:
- Envolver acesso a localStorage em `try/catch`.
- Falhar de forma graciosa (sem quebrar UX).
- Manter funcionamento offline; geocoding é opcional.

## 7. O que não fazer
- Não adicionar Histórico no rodapé global.
- Não remover compatibilidade com snapshots antigos.
- Não alterar normalizeProductName.
- Não mudar ModalEstabelecimento estruturalmente.
- Não adicionar dependências externas para esse fluxo.
