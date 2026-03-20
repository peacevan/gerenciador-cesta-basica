const chamarProxy = async (provider, input) => {
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, input }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return parsearResposta(data.text);
};

const interpretarComOpenRouter = (input) => chamarProxy('openrouter', input);
//const interpretarComGemini     = (input) => chamarProxy('gemini', input);
//const interpretarComAnthropic  = (input) => chamarProxy('anthropic', input);