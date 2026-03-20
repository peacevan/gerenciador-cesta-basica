export default async (req) => {
  const { provider, input } = await req.json();

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

  try {
    let text = '';

    if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
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
      const data = await res.json();
      text = data.choices?.[0]?.message?.content?.trim();

    } else if (provider === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nComando: "${input}"` }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 400 },
        }),
      });
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    } else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Comando: "${input}"` }],
        }),
      });
      const data = await res.json();
      text = data.content?.[0]?.text?.trim();
    }

    if (!text) throw new Error('Resposta vazia');
    return Response.json({ text });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/ai-proxy' };