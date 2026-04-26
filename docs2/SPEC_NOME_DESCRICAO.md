# SmartList — Spec: Separação nome/descricao + voiceParser produto

## Problema

O campo `nome` dos itens do carrinho cumpria dois papéis conflitantes:
- **Chave interna** usada para deduplicação, regex e voz (normalizado, sem acentos)
- **Label visual** exibido na UI para o usuário

Isso causava UX ruim (usuário via "acucar" em vez de "Açúcar") e bug latente na
busca por voz (voz retornava produto parseado mas a UI não o aproveitava).

## Solução

Separar as responsabilidades em dois campos:
- `nome` → chave interna normalizada (sem acento, minúsculo). **Nunca exibido na UI.**
- `descricao` → label visual com acentos e capitalização. **Sempre exibido na UI.**

## Shape do Item (atualizado)

```json
{
  "id": "uuid",
  "nome": "acucar",
  "descricao": "Açúcar",
  "quantidade": 2,
  "unidade": "kg",
  "precoUnitario": null,
  "precoTotal": null,
  "preco": 0,
  "comprado": false,
  "marcado": false,
  "atualizadoEm": "2026-04-23T00:00:00.000Z"
}
```

## Regra de geração automática

| Origem | `descricao` | `nome` |
|--------|-------------|--------|
| Digitação manual | Texto original do usuário (1ª letra maiúscula) | `normalizeProductName(descricao)` |
| Voz | Trecho extraído da fala (lowercase) | `normalizeProductName(descricao)` |
| Template | Definido explicitamente no template | `normalizeProductName(descricao)` |
| Item legado (sem descricao) | `generateDescricao(nome)` gerado na leitura | — (mantido) |

## Função generateDescricao(nome)

Localização: `src/utils/normalizeProduct.js`

Converte uma chave interna normalizada no label visual:
1. Faz lookup em `ACENTOS` (dicionário de restauração de acentos)
2. Se não encontrar, capitaliza primeira letra de cada palavra

```js
generateDescricao('acucar')           // → 'Açúcar'
generateDescricao('cafe em po')        // → 'Café em Pó'
generateDescricao('pasta de dente')    // → 'Pasta De Dente'
generateDescricao('sardinha')          // → 'Sardinha'
```

## voiceParser.js — campo produto

`parseVoiceInput(texto)` agora retorna:

```json
{
  "produto": "acucar",
  "descricao": "açúcar",
  "quantidade": 2,
  "unidade": "kg",
  "preco": 10.00,
  "sucesso": true
}
```

`sucesso` continua sendo `true` somente se `quantidade !== null || preco !== null`
(mesma regra anterior). O campo `produto` é bônus — nunca influi em `sucesso`.

### Estratégia de extração do produto

1. Normalizar números por extenso (`dois → 2`, `noventa → 90`, etc.)
2. Normalizar padrões de preço (`5 reais e 90 → 5.90`, `R$ 5,50 → 5.50`)
3. Extrair e remover `quantidade + unidade` do texto
4. Extrair e remover `preço` do texto restante
5. O que sobrar = nome bruto do produto
6. Remover conectivos iniciais/finais: `de da do dos das com e a o`
7. `produto = normalizeProductName(restoBruto)`
8. `descricao = restoBruto` (lowercase, como veio da fala)

## Localais alterados na UI

- `ListVoice.jsx`: todos os `item.nome` visíveis substituídos por `item.descricao || item.nome`
- Preview de template: `item.descricao || item.nome`
- Detalhe do histórico: `it.descricao || it.nome`
- Item do carrinho (pendentes e comprados): `item.descricao || item.nome`

## Migração de dados existentes

- Itens em localStorage sem `descricao` continuam funcionando via fallback `item.descricao || item.nome`
- Templates em `TEMPLATES_HARDCODED` recebem `descricao` explícita
- Novos itens criados por `adicionarItens` sempre geram `descricao`

## O que NÃO foi alterado

- Shape do localStorage (apenas adicionado `descricao`)
- Lógica de geolocalização / ModalEstabelecimento
- Rodapé global e navegação
- Integração com histórico de compras

## Testes

- `src/utils/voiceParser.test.js` — parseVoiceInput + generateDescricao
- `src/utils/normalizeProductName.test.js` — normalizeProductName

## normalizeProduct.js — breaking change mínima

Removido `de|do|da|dos|das` do regex de remoção de artigos para que nomes compostos
como `'farinha de mandioca'` sejam normalizados como `'farinha de mandioca'` e não
`'farinha mandioca'`. O efeito é que buscas por nomes compostos passam a funcionar
corretamente. Itens legados no localStorage podem não ser deduplicados com novos se
contiverem `de/do/da`, mas isso é aceitável nesta versão.
