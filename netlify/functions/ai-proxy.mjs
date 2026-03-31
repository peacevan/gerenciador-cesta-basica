// functions/ai-proxy.mjs  ← RENOMEAR para .mjs

const getEnv = (name) => {
  // Deno (Netlify Edge Functions)
  try {
    if (typeof Deno !== 'undefined' && Deno?.env?.get) {
      return (
        Deno.env.get(name) ||
        Deno.env.get(`APP_${name}`) ||
        Deno.env.get(`REACT_APP_${name}`)
      );
    }
  } catch (_) {}

  // Node (Netlify Functions padrão)
  try {
    if (typeof process !== 'undefined' && process?.env) {
      return (
        process.env[name] ||
        process.env[`APP_${name}`] ||
        process.env[`REACT_APP_${name}`]
      );
    }
  } catch (_) {}

  return undefined;
};

// ─── Validação de entrada ────────────────────────────────────────────────────
const ALLOWED_PROVIDERS = ['openrouter', 'gemini', 'anthropic', 'texto-livre'];

const SYSTEM_PROMPT = `Você é um interpretador de comandos de voz para lista de compras em português brasileiro.

Responda SOMENTE com um array JSON válido, sem texto extra, sem markdown, sem blocos de código.

Cada item do array deve ter este formato:
{
  "acao": "adicionar" | "remover" | "atualizar_preco" | "marcar" | "desmarcar",
  "nome": "nome do produto em letras minúsculas",
  "quantidade": número (padrão 1),
  "unidade": "un" | "kg" | "g" | "lt" | "ml" | "duzia" (padrão "un"),
  "preco": número ou null
}`;

const SYSTEM_PROMPT_TEXTO = `Você é um interpretador de listas de compras em português brasileiro.\nO usuário vai colar um texto livre — WhatsApp, anotação, qualquer formato.\nExtraia TODOS os produtos. Responda SOMENTE com array JSON onde cada item tem: {"nome": string, "quantidade": number, "unidade": "un"|"kg"|"g"|"lt"|"ml"|"duzia", "preco": number|null }`;

// ─── Parsers por provider ────────────────────────────────────────────────────
const callOpenRouter = async (input) => {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getEnv('OPENROUTER_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Comando: "${input}"` },
      ],
      max_tokens: 400,
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
};

const callOpenRouterTexto = async (input) => {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getEnv('OPENROUTER_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_TEXTO },
        { role: 'user', content: `Texto: "${input}"` },
      ],
      max_tokens: 400,
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
};

const callGemini = async (input) => {
  const apiKey = getEnv('GEMINI_API_KEY');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\nComando: "${input}"` }],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 400 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
};

const callAnthropic = async (input) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getEnv('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Comando: "${input}"` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text?.trim();
};

// ─── Handler principal ───────────────────────────────────────────────────────
export default async (req) => {
  // Só aceita POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let provider, input;
  try {
    ({ provider, input } = await req.json());
  } catch {
    return Response.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  // Validações básicas
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return Response.json(
      { error: `Provider inválido. Use: ${ALLOWED_PROVIDERS.join(', ')}` },
      { status: 400 }
    );
  }
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return Response.json({ error: 'Campo "input" obrigatório' }, { status: 400 });
  }
  if (input.length > 500) {
    return Response.json({ error: 'Input muito longo (máx 500 chars)' }, { status: 400 });
  }

  try {
    let text;

    if (provider === 'openrouter') text = await callOpenRouter(input);
    else if (provider === 'gemini')  text = await callGemini(input);
    else if (provider === 'anthropic') text = await callAnthropic(input);
    else if (provider === 'texto-livre') text = await callOpenRouterTexto(input);

    if (!text) throw new Error('Resposta vazia do provider');

    return Response.json({ text });

  } catch (err) {
    console.error(`[ai-proxy] provider=${provider} error:`, err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/ai-proxy' };