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
const ALLOWED_PROVIDERS = ['openrouter', 'gemini', 'anthropic', 'texto-livre', 'nota-fiscal'];

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

const SYSTEM_PROMPT_NOTA = `Você é um interpretador de notas fiscais brasileiras.\nReceberá uma imagem de nota fiscal em base64. Extraia todos os itens de compra e normalize nomes (lowercase), quantidades e unidades quando possível. Responda SOMENTE com array JSON no formato: [{"nome": string, "quantidade": number, "unidade": "un"|"kg"|"g"|"lt"|"ml"|"duzia", "preco": number|null}]`;

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

const callOpenRouterNota = async (input) => {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getEnv('OPENROUTER_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_NOTA },
        { role: 'user', content: `Texto OCR: "${input}"` },
      ],
      max_tokens: 600,
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
};

// Simple OCR text filter to reduce LLM payload and cost.
const filterOCRText = (rawText, opts = {}) => {
  if (!rawText || typeof rawText !== 'string') return '';
  const maxLines = opts.maxLines || 40;
  const maxChars = opts.maxChars || 1200;
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && l.length < 400);

  const rejectKeywords = [/^subtotal/i, /^total/i, /^troco/i, /^cpf/i, /Página/i];
  const unitRegex = /\b(kg|g|gr|grs|lt|ml|un|dúz|duzia|dúzia|dúzias|kg)\b/i;
  const qtyRegex = /\b\d+[.,]?\d*\b/;

  const useful = lines.filter(l => {
    if (rejectKeywords.some(rx => rx.test(l))) return false;
    if (unitRegex.test(l) || /R\$/.test(l) || qtyRegex.test(l)) return true;
    if (l.split(/\s+/).length <= 3 && /^[\p{L}0-9 .,-]+$/u.test(l)) return true;
    return false;
  });

  const dedup = [...new Set(useful)];
  const limited = dedup.slice(0, maxLines);
  let out = limited.join('\n');
  if (out.length > maxChars) out = out.slice(0, maxChars);
  return out;
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

const callAnthropicNotaFiscal = async (imagePayload) => {
  // imagePayload should be { imageData: base64, mediaType: 'image/jpeg' }
  const res = await fetch('https://api.anthropic.com/v1/vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getEnv('ANTHROPIC_API_KEY'),
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      system: SYSTEM_PROMPT_NOTA,
      image: imagePayload,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    let txt = '';
    try { txt = await res.text(); } catch (e) { txt = ''; }
    throw new Error(`Anthropic HTTP ${res.status}: ${txt.slice(0,200)}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || data.candidates?.[0]?.text?.trim();
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

  // For most providers we expect `input` to be a non-empty string.
  // For `nota-fiscal` the input is an object ({ ocrText } or { imageData, mediaType }).
  if (provider !== 'nota-fiscal') {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return Response.json({ error: 'Campo "input" obrigatório' }, { status: 400 });
    }
    if (input.length > 500) {
      return Response.json({ error: 'Input muito longo (máx 500 chars)' }, { status: 400 });
    }
  }

  try {
    let text;

    if (provider === 'openrouter') text = await callOpenRouter(input);
    else if (provider === 'gemini')  text = await callGemini(input);
    else if (provider === 'anthropic') text = await callAnthropic(input);
    else if (provider === 'texto-livre') text = await callOpenRouterTexto(input);
    else if (provider === 'nota-fiscal') {
      // Prefer OCR text provided by the client (Tesseract) to avoid sending images to LLM
      // Accepted shapes:
      //  - { ocrText: "..." }
      //  - legacy: { imageData: 'base64...', mediaType: 'image/jpeg' } (will call vision provider)
      if (!input || typeof input !== 'object') {
        throw new Error('Input inválido para nota-fiscal: espere { ocrText } ou { imageData, mediaType }');
      }

      if (typeof input.ocrText === 'string') {
        // Send OCR-extracted text to LLM to parse and normalize products (apply filter first)
        const filtered = filterOCRText(input.ocrText, { maxLines: 40, maxChars: 1200 });
        text = await callOpenRouterNota(filtered);
      } else if (input.imageData) {
        // Backwards-compatible: call vision endpoint (deprecated for large images)
        text = await callAnthropicNotaFiscal(input);
      } else {
        throw new Error('Input inválido para nota-fiscal: forneça { ocrText } ou { imageData }');
      }
    }

    if (!text) throw new Error('Resposta vazia do provider');

    return Response.json({ text });

  } catch (err) {
    // Improved logging: sanitize input and avoid leaking secrets to responses
    try {
      const safeInputSnippet = (() => {
        try {
          if (typeof input === 'string') return input.slice(0, 200);
          if (input && input.imageData) return `<image ${input.mediaType || ''} size=${String((input.imageData||'').length).slice(0,6)}>`;
          return JSON.stringify(input).slice(0, 200);
        } catch (e) { return '<unavailable>'; }
      })();

      console.error(JSON.stringify({
        service: 'ai-proxy',
        provider: provider || 'unknown',
        message: err.message,
        stack: err.stack ? err.stack.split('\n').slice(0,5).join(' | ') : undefined,
        input: safeInputSnippet,
        ts: new Date().toISOString()
      }));
    } catch (logErr) {
      console.error('[ai-proxy] logging failed', logErr && logErr.message);
    }

    // Return a safe error message to the client
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const config = { path: '/api/ai-proxy' };