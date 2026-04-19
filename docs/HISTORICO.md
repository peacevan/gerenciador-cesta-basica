# Histórico de Listas (Feature Spec)

Descrição rápida
- Histórico de listas de compras com autocomplete baseado em catálogo local e registro de estabelecimento (opcional).

Chaves de armazenamento
- `smart-list:catalog` — catálogo de produtos (objeto por nome normalizado).
- `smart-list:history` — array de snapshots (máx 50, LRU).

Schema do catálogo
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

Schema de snapshot
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

Origem da localização (`estabelecimento.fonte`)
- `gps`: navigator.geolocation (mais confiável)
- `maps`: Google Places (futura)
- `manual`: usuário digitou
- `null`: não informado

API do hook `useHistorico` (resumo)
- `registrar(item)` — atualiza/insere entrada no catálogo (incrementa `contadorUso`, grava `precoUltimo` e `ultimoUso`).
- `buscar(query)` — retorna até 5 sugestões ordenadas por relevância (fórmula: contadorUso*0.7 + recência*0.3). Usa normalização para fuzzy match.
- `salvarSnapshot(itens, total, estabelecimento = null)` — salva snapshot com label `Compra DD/MM`. Mantém limite LRU 50.
- `listarSnapshots()` — retorna snapshots ordenados por `savedAt` desc.
- `carregarSnapshot(id)` — retorna snapshot pelo `id`.
- `excluirSnapshot(id)` — remove snapshot.
- `limparCatalogo()` — remove catálogo (dev/debug).

Regras operacionais
- Tratar erros de `localStorage` silenciosamente (try/catch, `console.warn`).
- Normalização: importar `normalizeProductName` de `src/utils/normalizeProduct.js`.
- As buscas devem funcionar offline; integração com Nominatim é apenas para reverse geocoding durante salvamento de estabelecimento e deve falhar silenciosamente se sem internet.

Casos de teste importantes
- `registrar` incrementa `contadorUso` e atualiza `precoUltimo`.
- `buscar` ordena por relevância e faz fuzzy matching via normalização.
- `salvarSnapshot` inclui `estabelecimento` ou aceita `null`.
- LRU: ao ultrapassar 50 snapshots, mais antigos são removidos.
- `excluirSnapshot` remove o snapshot correto.
- Falha de `localStorage` não quebra a app.

Critérios de aceitação (resumidos)
- Modal de estabelecimento antes de confirmar o salvamento.
- Geolocalização via `navigator.geolocation` + Nominatim (reverse) quando disponível.
- Snapshot contém dados de estabelecimento com `nome`, `lat`, `lng` e `fonte`.
- Autocomplete local com sugestões do catálogo e preenchimento automático.
- Todo item adicionado alimenta o catálogo.
- Limite de 50 snapshots (LRU).
- Funciona offline (Nominatim pode falhar — tratar silenciosamente).

Ordem sugerida de implementação
1. `src/utils/normalizeProduct.js`
2. `src/hooks/useHistorico.js` + testes
3. `src/components/ModalEstabelecimento.jsx`
4. `src/components/AutocompleteInput.jsx`
5. `src/components/HistoricoPanel.jsx`
6. Modificações em `src/components/ListVoice.jsx`
7. Atualizar `src/hooks/useShoppingList.js` imports

Notas para devs
- Evitar dependências externas para o autocomplete; manter CSS simples compatível com `ListVoice.css`.
- Fazer `buscar` e `registrar` resilientes a entradas faltantes (null/undefined).
