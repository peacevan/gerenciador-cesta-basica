// CommonJS helper library for ai-proxy core logic (testable)
const ALLOWED_PROVIDERS = ['openrouter', 'gemini', 'anthropic', 'texto-livre'];

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

exports.handleProxy = async ({ provider, input } = {}, fetchFn = fetch, getEnv = () => '') => {
  if (!ALLOWED_PROVIDERS.includes(provider)) throw new Error('Provider inválido');
  if (!input || typeof input !== 'string' || input.trim().length === 0) throw new Error('Campo "input" obrigatório');
  if (input.length > 500) throw new Error('Input muito longo');

  if (provider === 'texto-livre') {
    const prompt = `Você é um interpretador de listas de compras em português brasileiro.\nO usuário vai colar um texto livre — WhatsApp, anotação, qualquer formato.\nExtraia TODOS os produtos. Responda SOMENTE com array JSON.`;
    const text = await callOpenRouterWithPrompt(fetchFn, prompt, input, getEnv);
    if (!text) throw new Error('Resposta vazia do provider');
    return { text };
  }

  // For other providers, delegate to OpenRouter default prompt for simplicity in this lib
  const text = await callOpenRouterWithPrompt(fetchFn, 'default prompt', input, getEnv);
  if (!text) throw new Error('Resposta vazia do provider');
  return { text };
};
