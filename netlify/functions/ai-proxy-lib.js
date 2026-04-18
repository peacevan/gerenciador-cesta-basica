// CommonJS helper library for ai-proxy core logic (testable)
const ALLOWED_PROVIDERS = ['openrouter', 'gemini', 'anthropic', 'texto-livre', 'nota-fiscal'];

const callOpenRouterWithPrompt = async (fetchFn, prompt, input, getEnv) => {
  const res = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getEnv ? getEnv('OPENROUTER_API_KEY') : ''}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
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

// Top-level OCR filter implementation and export so tests can require it directly
const _filterOCRText = (rawText, opts = {}) => {
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
exports.filterOCRText = _filterOCRText;

exports.handleProxy = async ({ provider, input } = {}, fetchFn = fetch, getEnv = () => '') => {
  if (!ALLOWED_PROVIDERS.includes(provider)) throw new Error('Provider inválido');
  if (provider !== 'nota-fiscal') {
    if (!input || typeof input !== 'string' || input.trim().length === 0) throw new Error('Campo "input" obrigatório');
    if (input.length > 500) throw new Error('Input muito longo');
  }

  if (provider === 'texto-livre') {
    const prompt = `Você é um interpretador de listas de compras em português brasileiro.\nO usuário vai colar um texto livre — WhatsApp, anotação, qualquer formato.\nExtraia TODOS os produtos. Responda SOMENTE com array JSON.`;
    const text = await callOpenRouterWithPrompt(fetchFn, prompt, input, getEnv);
    if (!text) throw new Error('Resposta vazia do provider');
    return { text };
  }

  // ensure filterOCRText is available (defined at module top-level)
  const filterOCRText = exports.filterOCRText || (text => text);

  if (provider === 'nota-fiscal') {
    // Accept OCR text from client (preferred) or fallback to image payload (legacy)
    if (!input || typeof input !== 'object') throw new Error('Input inválido para nota-fiscal');

    if (typeof input.ocrText === 'string') {
      // Send OCR text to LLM for parsing/normalization
      const prompt = `Você é um interpretador de notas fiscais brasileiras. Receberá o texto extraído por OCR. Extraia todos os itens de compra e normalize nomes (lowercase), quantidades e unidades quando possível. Responda SOMENTE com array JSON no formato: [{"nome": string, "quantidade": number, "unidade": "un"|"kg"|"g"|"lt"|"ml"|"duzia", "preco": number|null}]`;
      const filtered = exports.filterOCRText(input.ocrText, { maxLines: 40, maxChars: 1200 });
      const text = await callOpenRouterWithPrompt(fetchFn, prompt, filtered, getEnv);
      if (!text) throw new Error('Resposta vazia do provider');
      return { text };
    }

    if (input.imageData) {
      // legacy behavior: call vision endpoint (mocked in tests)
      const res = await fetchFn('https://api.anthropic.com/v1/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getEnv('ANTHROPIC_API_KEY') },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', system: 'nota-fiscal', image: input, max_tokens: 400 }),
      });
      if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text || data.candidates?.[0]?.text || '';
      if (!text) throw new Error('Resposta vazia do provider');
      return { text };
    }

    throw new Error('Input inválido para nota-fiscal');
  }

  // For other providers, delegate to OpenRouter default prompt for simplicity in this lib
  const text = await callOpenRouterWithPrompt(fetchFn, 'default prompt', input, getEnv);
  if (!text) throw new Error('Resposta vazia do provider');
  return { text };
};
