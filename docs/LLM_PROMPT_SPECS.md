# LLM Prompt Specs — Copilot-style (chat) and Claude (Anthropic)

Data: 2026-03-31
Repositório: peacevan/gerenciador-cesta-basica
Objetivo: especificar prompts, payloads e saída JSON esperada para os providers usados em `netlify/functions/ai-proxy.mjs` (modo `texto-livre`, `nota-fiscal`, e `voz`).

---

## 1. Resumo
Criar prompts padronizados para dois perfis de LLM:
- "Copilot-style" (chat-completion APIs que seguem formato role/message: OpenAI, OpenRouter, etc.)
- "Claude" (Anthropic): usa campo `system` + `messages`/`content` variantes

Regras comuns:
- Responder SOMENTE com JSON array válido, sem texto extra, sem markdown.
- JSON schema definido abaixo.
- Determinar parâmetros de geração: temperatura 0, max tokens ~400.

---

## 2. JSON de saída esperado (schema)
Todos os providers devem retornar um array JSON com objetos no formato abaixo:

[
  {
    "acao": "adicionar" | "remover" | "atualizar_preco" | "marcar" | "desmarcar", // quando aplicável
    "nome": string,                // produto em lowercase, sem acentos/abreviações ambíguas
    "quantidade": number,          // inteiro ou float (padrão 1)
    "unidade": "un"|"kg"|"g"|"lt"|"ml"|"duzia",
    "preco": number | null         // preço numérico ou null
  }
]

Notas:
- Campos extras podem ser ignorados pelo frontend.
- Se não houver preço, `preco` deve ser `null`.

---

## 3. Padrão: Copilot-style (chat)
Uso: `openrouter`, `openai` ou APIs compatíveis.

System prompt (template):
```
Você é um interpretador de comandos de voz e textos para lista de compras em português brasileiro.
Responda SOMENTE com um array JSON válido, sem texto extra, sem markdown, sem blocos de código.
Cada item do array deve ter este formato:
{
  "acao": "adicionar" | "remover" | "atualizar_preco" | "marcar" | "desmarcar",
  "nome": "nome do produto em letras minúsculas",
  "quantidade": número (padrão 1),
  "unidade": "un" | "kg" | "g" | "lt" | "ml" | "duzia" (padrão "un"),
  "preco": número ou null
}
Se o prompt for 'texto-livre', extraia todos os produtos do texto colado.
Se o prompt for 'nota-fiscal', normalize abreviações (ex: 5KG -> 5 kg, ARR -> arroz).
Sempre retorne JSON puro.
```

Example request body to ai-proxy:
```json
{ "provider": "openrouter", "input": "uma nota com arroz 5kg, leite 1lt" }
```

Generation settings (recommended):
- `temperature`: 0
- `max_tokens`: 400
- `top_p`: 1

Response handling:
- Receber `data.choices[0].message.content` e extrair texto.
- Validar: tentar `JSON.parse(text)`; se falhar, retornar erro legível ao frontend.

---

## 4. Padrão: Claude (Anthropic)
Uso: Anthropic API (claude-haiku family). Claude pode aceitar `system` + `messages` ou `system` + `user` depending on API version.

System prompt (template):
```
Você é um interpretador de comandos de voz e textos para lista de compras em português brasileiro. Você deve responder SOMENTE com um array JSON válido (sem texto adicional), onde cada elemento tem os campos: acao, nome (lowercase), quantidade, unidade, preco.
Siga o mesmo schema descrito no spec.
```

Request structure (example for ai-proxy):
```json
{ "model": "claude-haiku-4-5-20251001", "messages": [{ "role": "system", "content": "..." }, { "role": "user", "content": "Comando: \"texto colado aqui\"" }], "max_tokens": 400 }
```

Generation settings:
- `temperature` / `maxTokens` equivalentes: temperatura 0, max 400 tokens.

Response handling:
- Claude responses may be in `data.content[0].text` (older) or nested `candidates` arrays (newer); ai-proxy must detect and extract the textual content.
- Em caso de resposta vazia ou HTML, ai-proxy devolve erro com status e corpo curto.

---

## 5. Providers específicos

### 5.1 `texto-livre`
- Input: texto livre (WhatsApp, notas, listas com vírgulas, quebras de linha).
- System prompt: use a versão do System prompt indicando "texto-livre" e pedir para extrair TODOS os produtos.
- Saída: array JSON padronizado.
- Observações: instruir LLM a converter unidades (kg, KG, KGs -> kg), normalizar números e remover preços embutidos quando ambíguâncias ocorrem (retornar `preco: null` se não confiável).

### 5.2 `nota-fiscal`
- Input: `{ imageData: base64, mediaType: 'image/jpeg' }` (quando enviado do cliente).
- Flow: ai-proxy envia a imagem para o modelo de visão (Anthropic/Claude com visão) ou primeiro faz OCR (se usar OpenAI/GPT-vision).
- System prompt: foco em notas fiscais BR; normalizar nomes (remover siglas da rede, juntar marcas), ajustar peso/quantidade e inferir unidades.
- Saída: array JSON padronizado.
- Observações: reduzir imagem no cliente se necessário; validar tamanho antes do envio.

---

## 6. Regras de robustez e validação
- Sempre tentar `JSON.parse` da resposta; se falhar, tentar extrair trecho JSON com regex que detecta `\[\s*{` até `}\s*\]`.
- Se houver múltiplas ocorrências de JSON, escolher a primeira que valide contra o schema.
- Ao receber texto HTML, retornar erro com corpo curto (capturado no `useLLMParser.js` fix).
- Não confiar em campos livres: `nome` deve ser string; `quantidade` numeric coerced (parseFloat ou 1); `unidade` default `un` se ausente.

---

## 7. Exemplos

Input (texto-livre):
```
Compra semanal:\n- Arroz 5kg R$20\n- Leite integral 1L 2 unidades\n- Ovos 12\n```
Expected output (JSON):
```json
[
  {"acao":"adicionar","nome":"arroz","quantidade":5,"unidade":"kg","preco":20},
  {"acao":"adicionar","nome":"leite integral","quantidade":2,"unidade":"lt","preco":null},
  {"acao":"adicionar","nome":"ovos","quantidade":12,"unidade":"un","preco":null}
]
```

Input (nota-fiscal image): pipeline → vision → normalized list (sem preços irrelevantes)

---

## 8. Tarefas sugeridas (curto prazo)
- Implementar e testar `texto-livre` com Copilot-style e Claude.
- Implementar e testar `nota-fiscal` com Anthropic Vision (validação com imagens de exemplo).
- Adicionar logs no `ai-proxy.mjs` para inspecionar payloads em erro.

---

## 9. Onde salvar
Salvar este arquivo em `docs/LLM_PROMPT_SPECS.md` (já criado).


---

Fim da especificação.
