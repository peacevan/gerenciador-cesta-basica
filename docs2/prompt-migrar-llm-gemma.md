# Prompt — Migrar parser para Gemma 3 12B como LLM principal

## Contexto

Projeto SmartList — app de lista de compras React + Netlify Functions.
O parser de voz/texto já existe e funciona. A mudança é:

- **Antes:** LLM via OpenRouter usando `openai/gpt-3.5-turbo`
- **Depois:** LLM via OpenRouter usando `google/gemma-3-12b` (gratuito)
- **Regex:** continua existindo como fallback offline e quando LLM falha

O spec com todos os testes está em:
  `src/utils/useLLMParser.spec.js`

## Arquivos a ler ANTES de qualquer ação

1. `functions/ai-proxy.mjs` — proxy Netlify (onde fica o model)
2. `src/utils/useLLMParser.js` — parser frontend
3. `src/utils/useLLMParser.spec.js` — spec TDD (NÃO modificar)

NÃO criar nenhum arquivo novo ainda. Apenas ler os três.

---

## Mudança 1 — ai-proxy.mjs

### O que mudar

No `callOpenRouter`, trocar o modelo:

```js
// DE:
model: 'openai/gpt-3.5-turbo',

// PARA:
model: 'google/gemma-3-12b',
```

### Atualizar o SYSTEM_PROMPT para incluir contexto de supermercado e tratamento de erro

Substituir o `SYSTEM_PROMPT` atual por:

```js
const SYSTEM_PROMPT = `Você é um assistente de lista de compras de supermercado brasileiro.

Sua única função é interpretar comandos de voz ou texto e retornar um array JSON.

Contexto aceito: produtos de supermercado — alimentos, bebidas, limpeza, higiene pessoal.
Exemplos válidos: feijão, arroz, óleo, sabão em pó, macarrão, frango, leite, farinha.

Responda SOMENTE com um array JSON válido, sem texto extra, sem markdown, sem blocos de código.

Se o comando for sobre qualquer outro assunto (clima, política, piadas, perguntas gerais):
Retorne exatamente: [{"erro": "fora_contexto"}]

Se não conseguir identificar nenhum produto de supermercado no comando:
Retorne exatamente: [{"erro": "nao_entendido"}]

Formato de cada item válido:
{
  "acao": "adicionar" | "remover" | "atualizar_preco" | "marcar" | "desmarcar",
  "nome": "nome do produto em letras minúsculas sem acento",
  "quantidade": número (padrão 1),
  "unidade": "un" | "kg" | "g" | "lt" | "ml" | "duzia" (padrão "un"),
  "preco": número ou null
}`;
```

### NÃO alterar

- Lógica de rate limiting
- Validação de PROXY_SECRET
- Outros providers (gemini, anthropic, texto-livre, nota-fiscal)
- Estrutura do handler principal
- Nada mais além do model e do SYSTEM_PROMPT

---

## Mudança 2 — useLLMParser.js

### O que mudar

#### 2a. normalizarResposta — suportar campo `erro`

A função `normalizarResposta` atualmente filtra itens sem `nome`.
Adicionar tratamento para itens com campo `erro`:

```js
// Se o item tem campo "erro", retornar o objeto de erro intacto
// (não descartar — o app precisa saber que foi fora_contexto ou nao_entendido)
if (it.erro) return { erro: it.erro };
```

O map deve retornar o objeto de erro antes de tentar extrair nome/quantidade/etc.

#### 2b. normalizarResposta — normalizar nome sem acento

O nome deve ser normalizado removendo acentos:

```js
const nome = nomeRaw
  ? nomeRaw
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  : '';
```

#### 2c. interpretar — não cair no regex quando LLM retorna erro de contexto

Atualmente, se `normalizarResposta` retornar array vazio, cai no regex.
Mas se o LLM retornar `[{"erro": "fora_contexto"}]` ou `[{"erro": "nao_entendido"}]`,
o resultado não deve ir para o regex — deve retornar o erro para o app tratar.

Lógica nova:

```js
const interpretar = async (input) => {
  try {
    const res = await interpretarComOpenRouter(input);
    const norm = normalizarResposta(res);

    // Se LLM retornou erro de contexto, retornar direto (não ir pro regex)
    if (Array.isArray(norm) && norm.length > 0 && norm[0].erro) {
      ultimoProvedorUsado = PROVEDOR_ATIVO.LLM;
      return norm;
    }

    // Se LLM retornou produtos válidos, usar
    if (Array.isArray(norm) && norm.length > 0) {
      ultimoProvedorUsado = PROVEDOR_ATIVO.LLM;
      return norm;
    }
  } catch (err) {
    console.debug('useLLMParser: openrouter erro', err);
  }

  // Fallback regex (offline ou LLM sem resultado)
  ultimoProvedorUsado = PROVEDOR_ATIVO.REGEX;
  return interpretarComRegex(input);
};
```

### NÃO alterar

- `interpretarComRegex` e todas as RULES — não tocar
- `parsearResposta`
- `chamarProxy`
- Exports existentes
- Nada mais além do especificado acima

---

## Ciclo TDD — ordem de implementação

```
1. Fazer as mudanças acima
2. Rodar: npx jest useLLMParser.spec.js --watchAll=false
3. Ver quais testes passam e quais falham
4. Corrigir apenas o que está falhando
5. Repetir até todos os testes estarem verdes
6. Rodar npm test para garantir que nenhum teste existente quebrou
```

---

## Definition of Done

- [ ] `npx jest useLLMParser.spec.js` — todos os testes passando
- [ ] `npm test` — nenhum teste existente quebrado
- [ ] `ai-proxy.mjs` usando `google/gemma-3-12b`
- [ ] SYSTEM_PROMPT com contexto de supermercado e retorno de erro
- [ ] `normalizarResposta` trata campo `erro` sem descartar
- [ ] `interpretar` não cai no regex quando LLM retorna erro de contexto
- [ ] Sem `console.log` de debug esquecido
- [ ] Sem dependências novas adicionadas
