# Processo de Desenvolvimento — SmartList
> Documento vivo. Atualizar a cada retrospectiva.
> Versão 1.0 — baseado em XP + AI Pair Programming

---

## Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. HISTÓRIA    2. SPEC      3. CENÁRIOS            │
│  DO USUÁRIO  →  PARA IA   →  DE TESTE              │
│                                                     │
│  4. TESTES   5. CODIFICAÇÃO  6. REFATORAÇÃO         │
│  (RED)     →  (GREEN)      →  (REFACTOR)            │
│                                                     │
│  7. DEPLOY CONTÍNUO (CI/CD)                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Cada etapa tem entradas, saídas e responsável definidos.
**Dev** = Ivan | **IA** = Copilot / Claude

---

## ETAPA 1 — HISTÓRIA DO USUÁRIO

### Quem faz
Dev

### Quando
No início de cada ciclo (Planning Game).
Antes de qualquer código.

### Como fazer
Pegar item do BACKLOG.md e transformar em User Story
usando o formato padrão:

```
Como [tipo de usuário],
quero [ação ou funcionalidade],
para que [benefício ou resultado].
```

### Regras
- Máximo 3 pontos por ciclo de 1 dia
- Máximo 6 pontos por ciclo de 2-3 dias
- Se estimativa > 3pt: quebrar em stories menores
- Critério de aceite obrigatório antes de avançar

### Template de User Story

```markdown
## US-[número] — [título curto]

**Como** [usuário de baixa renda fazendo compras],
**quero** [ação],
**para que** [benefício].

**Estimativa:** [1|2|3] pontos
**Prioridade:** [crítico|importante|backlog]

**Critérios de aceite:**
- [ ] [critério 1]
- [ ] [critério 2]
- [ ] [critério 3]

**Fora do escopo:**
- [o que NÃO será feito nessa story]
```

### Exemplo real — SmartList

```markdown
## US-003 — Parser de voz salva preço

**Como** usuário fazendo compras no mercado,
**quero** falar "pasta de dente 5 reais"
**para que** o preço seja salvo automaticamente
sem precisar digitar.

**Estimativa:** 2 pontos
**Prioridade:** crítico

**Critérios de aceite:**
- [ ] "pasta de dente 5 reais" → preco: 5.00
- [ ] "pasta de dente R$ 5,50" → preco: 5.50
- [ ] "pasta de dente $5" → preco: 5.00
- [ ] Item atualizado no localStorage após fala
- [ ] Total do carrinho recalculado

**Fora do escopo:**
- Não usar LLM (apenas regex)
- Não criar novo arquivo — estender voiceParser.js
```

### Saída da etapa
User Story completa adicionada em docs2/xp/USER_STORIES.md
com status `[ ]` (pendente).

---

## ETAPA 2 — SPEC PARA IA

### Quem faz
Dev (com ajuda da IA para revisar)

### Quando
Após a User Story estar completa e aprovada.
Antes de escrever qualquer teste.

### Por que existe
A spec para IA é o contrato entre o dev e o par
de programação (IA). Sem ela, a IA age sem contexto
e gera retrabalho.

### Template de Spec para IA

```markdown
# Spec: [título da US]
> Baseado em: US-[número]
> Leia antes de qualquer ação: [arquivos relevantes]

## CONTEXTO
[O que já existe no projeto relacionado a essa feature.
Quais arquivos tocar. O que NÃO tocar.]

## LEITURA OBRIGATÓRIA
Antes de qualquer ação, ler:
- [arquivo 1]
- [arquivo 2]
- [arquivo 3]

NÃO criar nenhum arquivo ainda. Apenas ler.

## O QUE IMPLEMENTAR
[Descrição clara e objetiva do que deve ser feito.
Sem ambiguidade. Com exemplos concretos.]

## COMPORTAMENTO ESPERADO

Entrada: [exemplo de entrada]
Saída esperada: [exemplo de saída]

Entrada: [outro exemplo]
Saída esperada: [outra saída]

## RESTRIÇÕES — NÃO FAZER
- NÃO recriar [arquivo] do zero
- NÃO alterar [função] sem testes
- NÃO adicionar dependências externas
- NÃO alterar schema do localStorage

## DEFINITION OF DONE
- [ ] Todos os testes passando (npm test)
- [ ] Sem erros no console
- [ ] Testado no celular
- [ ] localStorage íntegro
```

### Exemplo real — SmartList

```markdown
# Spec: Parser de voz salva preço
> Baseado em: US-003
> Leia antes: src/utils/voiceParser.js,
>             src/utils/voiceParser.test.js

## CONTEXTO
O voiceParser.js já existe e faz parse de quantidade,
unidade e preço via regex. O bug é que quando o usuário
fala apenas o nome do produto + preço sem quantidade
("pasta de dente 5 reais"), o preço não é extraído
corretamente.

## LEITURA OBRIGATÓRIA
- src/utils/voiceParser.js (ler completo)
- src/utils/voiceParser.test.js (ler os casos existentes)
- src/utils/normalizeProductName.js

NÃO criar nenhum arquivo ainda.

## O QUE IMPLEMENTAR
Corrigir o regex de extração de preço no voiceParser.js
para capturar corretamente quando:
1. Não há quantidade na fala
2. O produto tem nome composto (pasta de dente)
3. O preço vem com símbolo $

## COMPORTAMENTO ESPERADO

"pasta de dente 5 reais" → { preco: 5.00, produto: 'pasta de dente' }
"pasta de dente R$ 5,50" → { preco: 5.50 }
"pasta de dente $5"      → { preco: 5.00 }
"feijão"                 → { produto: 'feijao', preco: null }

## RESTRIÇÕES
- NÃO recriar voiceParser.js do zero
- NÃO alterar a assinatura da função parseVoiceInput()
- NÃO chamar LLM (apenas regex)
- NÃO alterar normalizeProductName

## DEFINITION OF DONE
- [ ] npm test passando (incluindo casos novos)
- [ ] Sem erros no console
- [ ] Testado com Web Speech API no celular
```

### Saída da etapa
Arquivo de spec salvo em docs2/specs/US-[numero]-[titulo].md

---

## ETAPA 3 — CENÁRIOS DE TESTE

### Quem faz
Dev

### Quando
Após a spec estar pronta.
ANTES de passar para a IA implementar.

### Por que o dev escreve os testes
Escrever o teste força o dev a pensar nos casos
extremos antes de ver o código. A IA não escreve
testes — isso é responsabilidade do dev.

### Formato — Gherkin simplificado

```
Dado que [contexto/estado inicial]
Quando [ação do usuário ou entrada]
Então [resultado esperado]
```

### Como transformar cenário em teste Jest

```javascript
// Cenário:
// Dado que o usuário fala no mercado
// Quando diz "pasta de dente 5 reais"
// Então o preço 5.00 deve ser extraído

test('extrai preço de fala com produto composto', () => {
  const resultado = parseVoiceInput('pasta de dente 5 reais')
  expect(resultado.preco).toBe(5.00)
  expect(resultado.produto).toBe('pasta de dente')
  expect(resultado.sucesso).toBe(true)
})
```

### Cenários obrigatórios por tipo de feature

**Para parser/utilitário:**
- Caso feliz (entrada válida esperada)
- Variações de entrada (sinônimos, formatos diferentes)
- Caso de falha (entrada inválida)
- Caso extremo (vazio, null, caracteres especiais)

**Para componente de UI:**
- Estado inicial (vazio)
- Estado com dados
- Interação do usuário (tocar, digitar)
- Estado de erro

**Para fluxo completo:**
- Fluxo feliz (tudo funciona)
- Fluxo com dados faltando
- Fluxo com erro de rede/permissão

### Exemplo real — SmartList

```javascript
// src/utils/voiceParser.test.js
// Cenários da US-003

describe('US-003 — Parser de voz salva preço', () => {

  // Caso feliz
  test('extrai preço simples', () => {
    expect(parseVoiceInput('pasta de dente 5 reais'))
      .toMatchObject({ preco: 5.00, sucesso: true })
  })

  // Variações de formato
  test('extrai preço com R$', () => {
    expect(parseVoiceInput('pasta de dente R$ 5,50'))
      .toMatchObject({ preco: 5.50, sucesso: true })
  })

  test('extrai preço com símbolo $', () => {
    expect(parseVoiceInput('pasta de dente $5'))
      .toMatchObject({ preco: 5.00, sucesso: true })
  })

  // Produto composto sem preço
  test('produto composto sem preço retorna preco null', () => {
    expect(parseVoiceInput('pasta de dente'))
      .toMatchObject({ preco: null, sucesso: true })
  })

  // Caso extremo
  test('string vazia retorna sucesso false', () => {
    expect(parseVoiceInput(''))
      .toMatchObject({ sucesso: false })
  })

})
```

### Saída da etapa
Testes escritos no arquivo .test.js correspondente.
Confirmar que TODOS falham antes de passar para etapa 4.
(Se algum passar sem implementação — o teste está errado.)

---

## ETAPA 4 — CRIAÇÃO DOS TESTES (RED)

### Quem faz
Dev

### O que fazer
1. Rodar os testes escritos na etapa 3
2. Confirmar que TODOS falham (RED)
3. Se algum passar inesperadamente → revisar o teste
4. Só avançar quando todos estiverem vermelhos

```bash
npm test -- --watchAll=false
```

### Saída da etapa
Screenshot ou log dos testes falhando.
Pronto para passar para a IA implementar.

---

## ETAPA 5 — CODIFICAÇÃO (GREEN)

### Quem faz
IA (Copilot / Claude) — Dev revisa

### Protocolo com a IA

```
1. Enviar para a IA:
   - A spec completa (docs2/specs/US-XXX.md)
   - O arquivo de teste com os casos falhando
   - Os arquivos que devem ser lidos antes

2. Pedir:
   "Implemente o mínimo necessário para os testes
    passarem. Não adicione nada além do que os
    testes exigem."

3. IA implementa e retorna o código

4. Dev copia o código para o projeto

5. Dev roda: npm test -- --watchAll=false

6. Se todos passarem → avançar para etapa 6
   Se algum falhar → mostrar o erro para a IA
   e pedir correção (não reescrever do zero)
```

### Regras para a IA nessa etapa
- Implementar o MÍNIMO para passar os testes
- Não adicionar features além do spec
- Não recriar arquivos existentes
- Reportar se encontrar conflito com código existente

### Saída da etapa
Todos os testes passando (GREEN).
Código implementado mas ainda não refatorado.

---

## ETAPA 6 — REFATORAÇÃO

### Quem faz
Dev (com sugestão da IA)

### Quando
Após todos os testes passarem (GREEN).
NUNCA durante o RED — refatorar só com testes verdes.

### O que refatorar

**Código:**
- Remover duplicação
- Melhorar nomes de variáveis e funções
- Simplificar lógica complexa
- Remover console.log de debug

**Testes:**
- Remover testes redundantes
- Melhorar descrições (describe/test)
- Agrupar casos relacionados

### Protocolo de refatoração com a IA

```
"Os testes estão passando. Revise o código
 implementado e sugira melhorias de legibilidade
 e simplicidade. NÃO altere o comportamento —
 os testes devem continuar passando."
```

### Validação após refatoração

```bash
npm test -- --watchAll=false
```

Todos devem continuar passando.
Se algum quebrar → a refatoração mudou o comportamento.
Reverter e tentar novamente.

### Saída da etapa
Código limpo + todos os testes passando.
Pronto para o commit.

### Mensagem de commit padrão

```bash
git add .
git commit -m "feat: [descrição curta da feature]

- [detalhe 1]
- [detalhe 2]

Closes US-[número]"
```

---

## ETAPA 7 — DEPLOY CONTÍNUO (CI/CD)

### Como funciona
Push no git → Netlify detecta → roda build → deploy automático

### Pipeline configurado em netlify.toml

```toml
[build]
  command = "npm test -- --watchAll=false --passWithNoTests && npm run build"
  publish = "build"

[build.environment]
  CI = "true"
```

Se os testes falharem → build não sobe → deploy bloqueado.
Isso garante que código quebrado nunca vai para produção.

### Checklist antes do push

- [ ] npm test passando localmente
- [ ] Sem erros no console do browser
- [ ] Testado no celular (modo claro)
- [ ] localStorage não corrompido
- [ ] USER_STORIES.md atualizado
- [ ] BUGS.md atualizado se necessário

### Após o deploy

1. Abrir a URL de produção no celular
2. Testar o fluxo completo da feature
3. Se encontrar bug → registrar no BUGS.md
4. Se tudo ok → marcar story como concluída [x]

---

## RETROSPECTIVA — Ao final de cada ciclo

### Quando
Ao finalizar uma sprint (conjunto de stories) ou
a cada 3-5 dias de desenvolvimento.

### Formato (15 minutos)

**Keep** — o que funcionou e deve continuar
**Drop** — o que atrapalhou e deve parar
**Try** — uma mudança para o próximo ciclo

### Registrar em
docs2/xp/RETROSPECTIVA.md

---

## RESUMO DO FLUXO — Checklist por etapa

```
ETAPA 1 — HISTÓRIA DO USUÁRIO
  [ ] Story no formato padrão
  [ ] Critérios de aceite definidos
  [ ] Estimativa em pontos
  [ ] Adicionada em USER_STORIES.md

ETAPA 2 — SPEC PARA IA
  [ ] Contexto documentado
  [ ] Arquivos a ler listados
  [ ] Comportamento esperado com exemplos
  [ ] Restrições claras
  [ ] Salva em docs2/specs/

ETAPA 3 — CENÁRIOS DE TESTE
  [ ] Cenários em formato Dado/Quando/Então
  [ ] Transformados em testes Jest
  [ ] Arquivo .test.js criado/atualizado
  [ ] Casos extremos cobertos

ETAPA 4 — RED
  [ ] npm test rodado
  [ ] Todos os novos testes falhando
  [ ] Log de falha registrado

ETAPA 5 — GREEN
  [ ] Spec enviada para a IA
  [ ] IA implementou o mínimo
  [ ] npm test passando
  [ ] Dev revisou o código

ETAPA 6 — REFACTOR
  [ ] Código limpo (sem duplicação, sem console.log)
  [ ] npm test ainda passando
  [ ] Commit com mensagem semântica

ETAPA 7 — CI/CD
  [ ] Push realizado
  [ ] Build Netlify passou
  [ ] Testado no celular em produção
  [ ] Story marcada como [x] concluída
  [ ] BUGS.md atualizado
```

---

## ESTRUTURA DE PASTAS DO PROCESSO

```
docs2/
  xp/
    XP_OVERVIEW.md
    USER_STORIES.md      ← histórias do usuário
    DEFINITION_OF_DONE.md
    CODING_STANDARDS.md
    PLANNING_GAME.md
    RETROSPECTIVA.md
  specs/
    US-001-modo-claro.md          ← spec para IA
    US-002-icones-rodape.md
    US-003-parser-voz-preco.md
    ...
src/
  utils/
    voiceParser.js
    voiceParser.test.js           ← testes da etapa 3/4
    intentParser.js
    intentParser.test.js
    normalizeProductName.js
    normalizeProductName.test.js
```

---

## QUANDO USAR CADA FERRAMENTA

| Situação | Ferramenta |
|---|---|
| Escrever User Story | Dev (sem IA) |
| Escrever Spec para IA | Dev + IA para revisar |
| Escrever cenários de teste | Dev (sem IA) |
| Escrever código de teste | Dev (sem IA) |
| Implementar feature | IA (Copilot/Claude) |
| Revisar código da IA | Dev |
| Refatorar | Dev + IA para sugestões |
| Fazer commit | Dev (sem IA) |
| Decidir próxima story | Dev (sem IA) |
