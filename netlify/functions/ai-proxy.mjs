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

// Optional shared secret: set PROXY_SECRET env var in Netlify + REACT_APP_PROXY_SECRET in the app.
// When set, the proxy rejects requests that don't include the matching x-proxy-secret header.
// This is a lightweight deterrent against casual API key abuse — not a replacement for auth.
const PROXY_SECRET = getEnv('PROXY_SECRET') || null;

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
        model: 'google/gemma-3-12b',
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
        model: 'google/gemma-3-12b',
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
        model: 'google/gemma-3-12b',
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
// Simple in-memory rate limiter (instance-scoped)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window per IP
const _rateMap = new Map(); // ip -> { count, resetAt }

const jsonResponse = (payload, status = 200) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return Response.json(payload, { status, headers });
};

const getClientIp = (req) => {
  try {
    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
    if (forwarded) return forwarded.split(',')[0].trim();
  } catch (e) {}
  return 'unknown';
};

export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  }

  // Optional secret check — reject if PROXY_SECRET is configured and header is missing/wrong
  if (PROXY_SECRET) {
    const clientSecret = req.headers.get('x-proxy-secret');
    if (clientSecret !== PROXY_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  // Rate limiting (in-memory, per function instance)
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = _rateMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  _rateMap.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return jsonResponse({ error: 'Too many requests. Tente novamente em 1 minuto.' }, 429);
  }

  // Só aceita POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let provider, input;
  try {
    ({ provider, input } = await req.json());
  } catch {
    return jsonResponse({ error: 'Body JSON inválido' }, 400);
  }

  // Validações básicas
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return jsonResponse({ error: `Provider inválido. Use: ${ALLOWED_PROVIDERS.join(', ')}` }, 400);
  }

  // For most providers we expect `input` to be a non-empty string.
  // For `nota-fiscal` the input is an object ({ ocrText } or { imageData, mediaType }).
  if (provider !== 'nota-fiscal') {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return jsonResponse({ error: 'Campo "input" obrigatório' }, 400);
    }
    if (input.length > 500) {
      return jsonResponse({ error: 'Input muito longo (máx 500 chars)' }, 400);
    }
    // basic sanitization: reject suspicious control characters or script tags
    if (/\u0000|<script|\<\/?[a-z][\s\S]*>/i.test(input)) {
      return jsonResponse({ error: 'Input contém caracteres inválidos' }, 400);
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