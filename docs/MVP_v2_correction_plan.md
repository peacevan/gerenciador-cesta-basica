# Plano curto de correção — MVP v2.1

**Data:** 2026-04-16

Este documento resume o plano curto para alinhar a implementação com a especificação `MVP v2.1`, incluindo uso do CSV `src/data/produtos.csv` para montar os templates padrão.

## Objetivo

- Remover gaps entre especificação e código; gerar templates padrão a partir do CSV; alinhar chaves de persistência e atualizar testes e UI mínimos para aceitação.

## Passos (curto prazo)

1. Alinhar chaves localStorage
   - Mudar `TEMPLATES_KEY` em `src/hooks/useTemplates.js` para `smart-list:templates`.
   - Atualizar docs/SDD/ROADMAP se necessário.

2. Gerar templates padrão do CSV
   - Ler `src/data/produtos.csv` e indexar produtos por `nome`/`categoria`/`unidade`.
   - Montar templates padrão (Compra do Mês, Compra da Semana, Café da Manhã, Churrasco, Limpeza, Casa com Bebê) usando itens do CSV.
   - Quantidades iniciais: heurísticas (ex.: Compra do Mês — arroz 5kg, feijão 2kg; Compra da Semana — leite 2lt, ovos 1 dúzia). Ajustáveis pelo `perfil`.

3. Atualizar `useTemplates`
   - Ao inicializar, carregar templates hardcoded + templates gerados do CSV, e também os templates do usuário salvos em `localStorage` (`smart-list:templates`).
   - Manter API atual (listarTemplates, salvarTemplate, duplicarTemplate, excluirTemplate, salvarComoTemplate).

4. Ajustar UI mínima
   - Em `src/components/ListVoice.jsx`, garantir ordem dos botões no rodapé: `[Templates] [Texto] [Voz] [Foto]`.
   - Conferir que o `CardUltimoTemplate` permanece exibido quando existir `smart-list:ultimo-template`.

5. Atualizar testes
   - Atualizar `src/components/__tests__/ListVoice.test.js` para refletir strings/estado reais do componente (texto do footer, botões, comportamento do mic).

6. Executar testes e corrigir falhas
   - Rodar os testes afetados e iterar nas correções até passarem.

## Templates padrão (itens extraídos do CSV)

Observação: nomes e unidades vêm de `src/data/produtos.csv`. Quantidades são heurísticas.

- Compra do Mês
  - Arroz branco — 5 kg
  - Feijão carioca — 2 kg
  - Macarrão espaguete — 1 pacote
  - Óleo de soja — 900 ml
  - Açúcar refinado — 1 kg
  - Café em pó — 500 g
  - Leite integral — 6 lt
  - Papel higiênico — 4 pacotes
  - Sabão em pó — 1 kg
  - De  tergente — 2 un

- Compra da Semana
  - Pão de forma — 1 un
  - Leite integral — 2 lt
  - Ovos — 1 dúzia
  - Frango peito — 1 kg
  - Tomate — 1 kg
  - Batata — 2 kg
  - Queijo mussarela — 0.5 kg
  - Presunto — 200 g

- Café da Manhã
  - Café em pó — 1 pacote
  - Leite integral — 2 lt
  - Pão de forma — 1 un
  - Manteiga — 200 g
  - Ovos — 1 dúzia
  - Requeijão cremoso — 1 un

- Churrasco
  - Picanha — 1 kg
  - Frango coxa e sobrecoxa — 1 kg
  - Linguiça toscana — 1 kg
  - Sal grosso — 1 kg
  - Cerveja lata — 12 un

- Limpeza
  - Detergente — 2 un
  - Sabão em pó — 1 kg
  - Amaciante — 1 lt
  - Desinfetante — 1 lt
  - Esponja de louça — 2 un
  - Papel toalha — 1 pacote
  - Papel higiênico — 4 pacotes

- Casa com Bebê
  - Fórmula infantil — 1 un
  - Fralda descartável — 1 pacote
  - Lenço umedecido — 1 pacote
  - Pomada para assaduras — 1 un
  - Papinha industrializada — 3 un

## Notas técnicas

- Implementação preferível: gerar templates a partir do CSV em tempo de inicialização do hook `useTemplates` (função pura que constrói os objetos de template). Assim mantemos testes simples e API estável.
- Se um item do spec não existir no CSV, adicionar como string fallback (ex.: `carvão`).
- Manter `sistema: true` para templates gerados automaticamente; `editavel: true` para permitir cópia/edição pelo usuário.

## Comandos úteis

Instalar dependências (se necessário):

```bash
npm install
```

Rodar testes relevantes (exemplo):

```bash
# rodar testes específicos (use o padrão do projeto)
npm test -- --runInBand --watchAll=false --testPathPattern "useTemplates.test.js|ListVoice.test.js"
```

## Próximo passo sugerido

- Confirmar se quer que eu implemente agora as alterações: 1) renomear a chave `TEMPLATES_KEY`, 2) gerar templates do CSV e 3) atualizar `useTemplates` e `ListVoice.jsx`. Posso abrir um PR local com as mudanças e executar os testes.
