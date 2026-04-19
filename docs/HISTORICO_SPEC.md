# Especificação: Histórico de listas de compras com Autocomplete + Estabelecimento

Versão: 1.0
Data: 2026-03-31
Autor: equipe MVP

## Visão geral

Objetivo: implementar um histórico local de listas de compras que forneça um catálogo offline para autocomplete de itens, além de snapshots (snapshots = listas salvas) com metadados de estabelecimento (nome, endereço, coordenadas, fonte). O recurso deve funcionar 100% offline (exceto reverse geocoding que é opcional) e manter compatibilidade com a persistência já existente: `smart-list-items` (localStorage) e IndexedDB (`SmartListDB`).

Diretórios/arquivos afetados (principais):
- `src/utils/normalizeProduct.js` (novo utilitário)
- `src/hooks/useHistorico.js` (novo hook)
- `src/components/ModalEstabelecimento.jsx` (novo componente)
- `src/components/AutocompleteInput.jsx` (novo componente)
- `src/components/HistoricoPanel.jsx` (novo componente)
- `src/components/ListVoice.jsx` (integração)
- `src/hooks/useShoppingList.js` (atualizar import de normalize)

## Especificação de dados

1) Catálogo (localStorage key: `smart-list:catalog`)

Formato (object map by nome normalizado):

```json
{
  "arroz": {
    "nome": "arroz",
    "nomeBruto": "Arroz Tipo 1",
    "unidade": "kg",
    "precoUltimo": 25.90,
    "contadorUso": 12,
    "ultimoUso": "2026-03-31T20:00:00Z"
  }
}
```

- `nome`: string (normalizado; usar `normalizeProductName`)
- `nomeBruto`: string (texto exibido ao inserir/manual)
- `unidade`: string (ex: `kg`, `un`, `l`)
- `precoUltimo`: number | null
- `contadorUso`: integer (incrementado via `registrar`)
- `ultimoUso`: ISO string

Implementação: gravar como JSON string em `localStorage.setItem('smart-list:catalog', JSON.stringify(obj))`.

2) Snapshots / Histórico (localStorage key: `smart-list:history`)

Formato (array de snapshots):

```json
[
  {
    "id": "uuid",
    "savedAt": "2026-03-31T20:00:00Z",
    "label": "Compra 31/03",
    "totalGasto": 287.50,
    "estabelecimento": {
      "nome": "Atacadão Paralela",
      "endereco": "Av. Luis Viana, 6462",
      "lat": -12.9714,
      "lng": -38.4106,
      "tipo": "atacado",
      "fonte": "gps"
    },
    "itens": [
      { "nome": "arroz", "quantidade": 5, "unidade": "kg", "preco": 25.90, "comprado": true }
    ]
  }
]
```

- `estabelecimento` pode ser `null` (quando salvo sem local)
- Limite: máximo 50 snapshots — política LRU (apagar o snapshot mais antigo além do limite)

## API pública do hook `useHistorico` (exports)

- `registrar(item: { nome, unidade?, precoUltimo? }) : void`
  - Atualiza/insere entrada no catálogo: incrementa `contadorUso`, atualiza `precoUltimo` se fornecido, atualiza `ultimoUso` = now.
  - `item.nome` deve ser normalizado com `normalizeProductName` internamente para chave do catálogo; `nomeBruto` armazena o valor de exibição original.

- `buscar(query: string, limit = 5) : Array<CatalogEntry>`
  - Retorna até `limit` sugestões ordenadas por score = `0.7 * rank(contadorUso) + 0.3 * rank(recência)` (ou cálculo direto: contadorUso * 0.7 + recencyScore * 0.3). Recency calculada como: `1 / (1 + daysSince(ultimoUso))` para dar peso decrescente.
  - Matching: aplicar `normalizeProductName` ao `query` e ao `nome` para prefix/fuzzy matching (match se `nome` contém `queryNorm`).

- `salvarSnapshot(itens: Array, total: number, estabelecimento: object | null) : Snapshot`
  - Cria snapshot com `id = crypto.randomUUID()`, `savedAt = new Date().toISOString()`, `label = 'Compra DD/MM'` (usar timezone local), `totalGasto = total`, `itens` e `estabelecimento` (pode ser null).
  - Persiste em `smart-list:history` e aplica LRU (limitar a 50). Retorna o snapshot criado.

- `listarSnapshots() : Array<Snapshot>`
  - Retorna snapshots ordenados por `savedAt` desc.

- `carregarSnapshot(id) : Snapshot | null`
  - Retorna snapshot por id.

- `excluirSnapshot(id) : void`
  - Remove snapshot por id.

- `limparCatalogo() : void`
  - Remove `smart-list:catalog` (para dev/debug).

Regras de resiliência:
- Todas as operações de leitura/escrita em localStorage devem estar dentro de `try/catch`. Em caso de erro, logar `console.warn` e falhar graciosamente (retornar array vazio ou `null`).

## Normalização

- Implementar `src/utils/normalizeProduct.js` exportando `normalizeProductName(str)` e `singularize(str)`.
- `useShoppingList.js` deve atualizar import para usar o utilitário.

## Componentes

### `ModalEstabelecimento.jsx`
- Props: `isOpen`, `onClose`, `onConfirm(estabelecimento|null)`
- Estado interno: `{ nome, endereco, lat, lng, tipo, fonte, loadingGeo, geoError }` conforme pedido.
- Comportamentos:
  - Botão `📍 Usar minha localização` chama `navigator.geolocation.getCurrentPosition`:
    - Em sucesso: set `lat`, `lng`, `fonte='gps'`, `loadingGeo=false` e inicia reverse-geocoding via Nominatim:
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    - Extrair `display_name` e/ou `address` do resultado para preencher `nome`/`endereco` quando possível.
    - Em falha (permissão/erro): set `geoError` e permitir salvar manualmente.
  - Botão `Salvar com local` valida (nome opcional) e chama `onConfirm(estabelecimento)` com objeto preenchido.
  - Botão `Salvar sem local` chama `onConfirm(null)`.
  - Botão `Cancelar` chama `onClose()`.

Implementar timeout/abordagem offline: se network fail no reverse geocoding, apenas usar lat/lng e `fonte='gps'`.

### `AutocompleteInput.jsx`
- Props: `value`, `onChange`, `onSelect`, `placeholder`.
- Funcionalidades:
  - Debounce 300ms ao digitar.
  - Ao digitar >= 2 chars, chamar `buscar(query)` e renderizar dropdown com até 5 itens.
  - Cada sugestão mostra `nomeBruto || nome`, `unidade`, `precoUltimo` formatado.
  - Seleção chama `onSelect(sugestao)` e fecha dropdown.
  - Fechar ao clicar fora (mousedown listener em document).
  - Navegação por teclado (arrow up/down, Enter para selecionar, Esc para fechar).

### `HistoricoPanel.jsx`
- Props: `isOpen`, `onClose`, `onCarregarSnapshot(snapshot)`
- Exibe lista (máx 50) com: label, data formatada `DD/MM/YYYY HH:mm`, `totalGasto`, `#itens`, `estabelecimento.nome`, ícone 📍 se lat/lng.
- Ações: `Carregar` (chama `onCarregarSnapshot`), `Excluir` (confirm via `ModalConfirmacao`).

## Integração com `ListVoice.jsx`

- Importar e usar hook:
```js
const { registrar, buscar, salvarSnapshot, listarSnapshots, excluirSnapshot } = useHistorico();
```
- Trocar campo de nome no modal de adição manual por `AutocompleteInput` (ver props no spec). Selecionar sugestão deve preencher nome, unidade e precoUn.
- `handleSaveList` abre `ModalEstabelecimento` antes de salvar; `handleConfirmSave` chama `salvarSnapshot`.
- Ao adicionar item por qualquer fluxo (manual, voz, texto-livre), chamar `registrar({ nome, unidade, precoUltimo })` imediatamente após a adição bem sucedida.
- Ao carregar snapshot: se lista atual não vazia, pedir confirmação (usar `ModalConfirmacao` já existente), caso contrário carregar diretamente (limpar lista e adicionar itens do snapshot).

## Testes unitários

Criar `src/hooks/__tests__/useHistorico.test.js` com os casos exigidos:
- `registrar` atualiza `contadorUso` e `precoUltimo`.
- `buscar` retorna sugestões ordenadas por relevância (contadorUso + recência).
- `buscar` faz matching com normalização.
- `salvarSnapshot` inclui `estabelecimento` (quando fornecido) e `null` quando não fornecido.
- `salvarSnapshot` respeita limite de 50 (LRU).
- `excluirSnapshot` remove snapshot corretamente.
- Simular erro de `localStorage` (mock que lança) e garantir que funções não lançam exceção.

Mocking/regras nos testes:
- Mockar `localStorage` nas rotinas de teste (limpar entre testes).
- Para `registrar`, use datas fixas (jest.useFakeTimers + setSystemTime) para testar `ultimoUso` e ordenação por recência.

## UX / Acessibilidade

- Dropdown de autocomplete deve ser acessível por teclado (aria attributes mínimos: `role="listbox"`, `role="option"`, `aria-selected`).
- Botões com labels claros e textos auxiliares para estados (ex.: `Localizando...`, `Permissão negada`).

## Critérios de aceitação (checklist)

- [ ] `Salvar lista` abre `ModalEstabelecimento` antes do snapshot.
- [ ] Geolocalização via `navigator.geolocation` captura lat/lng e tenta reverse geocoding (Nominatim).
- [ ] Snapshot salvo contém `estabelecimento` com `nome`, `lat`, `lng` e `fonte` quando aplicável.
- [ ] `Salvar sem local` grava snapshot com `estabelecimento: null`.
- [ ] Menu `Histórico` lista snapshots e mostra 📍 se coordenadas presentes.
- [ ] Carregar snapshot substitui a lista atual, solicitando confirmação se a lista não estiver vazia.
- [ ] Autocomplete sugere produtos do catálogo ao digitar e funciona offline.
- [ ] Seleção de sugestão preenche `nome`, `unidade` e `precoUn` no formulário de adição.
- [ ] Toda adição de item alimenta o catálogo via `registrar()`.
- [ ] Limite de 50 snapshots respeitado (LRU).
- [ ] Nominatim failure ou offline é tratado silenciosamente (salva sem nome/endereço se necessário).

## Ordem de implementação sugerida

1. `src/utils/normalizeProduct.js` (extrair) — atualizar imports em `useShoppingList.js`.
2. `src/hooks/useHistorico.js` + testes unitários.
3. `src/components/ModalEstabelecimento.jsx`.
4. `src/components/AutocompleteInput.jsx`.
5. `src/components/HistoricoPanel.jsx`.
6. Modificações em `ListVoice.jsx` (integração de UI e chamadas a `registrar`, `salvarSnapshot`, `listarSnapshots`).
7. Ajustes finais e testes de integração manual.

## Observações técnicas e riscos

- IndexedDB (`SmartListDB`) continuará sendo usado para catálogo persistente de produtos cadastrados. O `useHistorico` deve priorizar `smart-list:catalog` (localStorage) como fonte rápida para sugestões e pode complementar consultando IndexedDB para metadados quando disponível.
- Nominatim: respeitar política de uso (fazer requests com `User-Agent` adequado no backend se escalar). Para o MVP, chamar diretamente do cliente é aceitável, mas tratar timeouts/falhas.
- LRU simples: quando ultrapassar 50 snapshots, ordenar por `savedAt` asc e remover os mais antigos.

## Notas para revisão de PR

- Verificar que `smart-list:catalog` e `smart-list:history` não conflitam com chaves existentes.
- Confirmar que todos os usos de `normalizeProductName` agora importam de `src/utils/normalizeProduct.js`.
- Certificar que testes unitários rodem isoladamente e em `npm run test:unit`.

---
Arquivo gerado automaticamente a partir do prompt do PM; use-o como guia para implementação e review.
