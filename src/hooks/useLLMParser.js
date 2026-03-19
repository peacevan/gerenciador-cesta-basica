// useLLMParser.js — interpreta texto em comandos (sem React)
// PROVEDOR_ATIVO pode ser trocado facilmente
// logs temporários para diagnóstico de falha em import durante testes
try {
  // eslint-disable-next-line no-console
  console.log('[test-log] carregando useLLMParser.js');
} catch (e) {}
export const PROVEDOR_ATIVO = 'openrouter';
export let ultimoProvedorUsado = 'llm';

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

const parsearResposta = (text) => {
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return Array.isArray(parsed) ? parsed : [parsed];
};

// helpers para normalizar nomes usados no parser regex
const singularize = (word) => {
  if (!word || word.length <= 2) return word;
  if (word.endsWith('oes')) return word.slice(0, -3) + 'ao';
  if (word.endsWith('aes')) return word.slice(0, -3) + 'a';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
};

const normalizeProductName = (raw) => {
  if (!raw) return '';
  const cleaned = raw.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z\s-]/g,'').trim();
  return cleaned.split(/\s+/).map(t => singularize(t)).filter(Boolean).join(' ');
};

// Providers
const interpretarComOpenRouter = async (input) => {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OpenRouter API key ausente');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || data.output?.[0]?.content?.[0]?.text?.trim();
  if (!text) throw new Error('Resposta vazia do OpenRouter');
  return parsearResposta(text);
};

const interpretarComGemini = async (input) => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY?.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nComando: "${input}"` }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 400 },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message ?? `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Resposta vazia do Gemini');
  return parsearResposta(text);
};

const interpretarComAnthropic = async (input) => {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY?.trim();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Comando: "${input}"` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message ?? `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error('Resposta vazia do Anthropic');
  return parsearResposta(text);
};

// regex fallback
export const interpretarComRegex = (input) => {
  const txt = (input || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const numberWords = {
    'um':1,'uma':1,'dois':2,'duas':2,'tres':3,'três':3,'quatro':4,'cinco':5,'seis':6,'sete':7,'oito':8,'nove':9,'dez':10,
    'onze':11,'doze':12,'treze':13,'catorze':14,'quatorze':14,'quinze':15,'dezesseis':16,'dezassete':17,'dezoito':18,'dezenove':19,'vinte':20,
    'cinquenta':50,'cem':100
  };

  const unitMap = {
    'kg':'kg','quilo':'kg','quilos':'kg','quilograma':'kg','quilogramas':'kg',
    'g':'g','grama':'g','gramas':'g',
    'lt':'lt','litro':'lt','litros':'lt','liter':'lt',
    'ml':'ml','mililitro':'ml','mililitros':'ml',
    'duzia':'duzia','duzias':'duzia','duzia':'duzia','duziao':'duzia'
  };

  const actionKeywords = {
    remover: ['tira','remove','retira','apaga','cancela','tire','remova','retire'],
    marcar: ['marca','marque','comprei'],
    desmarcar: ['desmarca','nao comprei'],
    atualizar_preco: ['muda o preco','muda o preço','atualiza o preco','preco do','preco da','custa','custou','muda o preco do','muda o preco da']
  };

  const splitSegments = txt.split(/,| e (?=[a-zç])/g).map(s => s.trim()).filter(Boolean);

  const results = [];

    for (let seg of splitSegments) {
    let acao = 'adicionar';
    for (const [act, kws] of Object.entries(actionKeywords)) {
      for (const kw of kws) { if (seg.includes(kw)) { acao = act; break; } }
      if (acao !== 'adicionar' && acao === act) break;
    }
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line no-console
      console.log('[test-log] action for segment:', JSON.stringify(seg), '->', acao);
    }

    let preco = null;
    // detectar preços explícitos: 'R$ 12' ou '12 reais' — não considerar números avulsos
    const priceMatch1 = seg.match(/r\$\s?(\d+[.,]?\d*)/);
    const priceMatch2 = seg.match(/(\d+[.,]?\d*)\s*(?:reais|real)/);
    if (priceMatch1) { preco = parseFloat(priceMatch1[1].replace(',', '.')); seg = seg.replace(priceMatch1[0], ''); }
    else if (priceMatch2) { preco = parseFloat(priceMatch2[1].replace(',', '.')); seg = seg.replace(priceMatch2[0], ''); }
    else {
      const wordPrice = seg.match(/((?:\w+\s?)+)\s+reais?/);
      if (wordPrice) {
        const parts = wordPrice[1].trim().split(/\s+e\s+/);
        const reais = numberWords[parts[0]] ?? NaN;
        let cents = 0;
        if (parts[1]) { const c = numberWords[parts[1]] ?? NaN; if (!isNaN(c) && c < 100) cents = c/100; }
        if (!isNaN(reais)) preco = reais + cents;
        seg = seg.replace(wordPrice[0], '');
      }
    }

    let quantidade = null; let unidade = 'un';

    // detectar expressões "item N" (por índice) — ex: "remova o item 2"
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line no-console
      console.log('[test-log] segment before item detection:', JSON.stringify(seg));
    }
    const itemIndexNum = seg.match(/\bitem\s+(\d+)\b/);
    if (itemIndexNum) {
      quantidade = parseInt(itemIndexNum[1], 10);
      if (process.env.NODE_ENV === 'test') {
        // eslint-disable-next-line no-console
        console.log('[test-log] itemIndexNum match:', itemIndexNum[0], quantidade);
      }
      seg = seg.replace(itemIndexNum[0], '');
    } else {
      const itemIndexWord = seg.match(/\bitem\s+(um|uma|dois|duas|tres|tres|tr[eé]s|quatro|cinco|seis|sete|oito|nove|dez)\b/);
      if (itemIndexWord) {
        const w = itemIndexWord[1].normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const nw = { 'um':1,'uma':1,'dois':2,'duas':2,'tres':3,'três':3,'quatro':4,'cinco':5,'seis':6,'sete':7,'oito':8,'nove':9,'dez':10 };
        quantidade = nw[w] || null;
        if (process.env.NODE_ENV === 'test') {
          // eslint-disable-next-line no-console
          console.log('[test-log] itemIndexWord match:', itemIndexWord[0], quantidade);
        }
        seg = seg.replace(itemIndexWord[0], '');
      }
    }

    const qtyUnit = seg.match(/(\d+[.,]?\d*)\s*(kg|g|lt|ml|duzia|duzias|quilos|quilo|gramas|litros|mililitros)?/);
    if (qtyUnit) {
      quantidade = parseFloat(qtyUnit[1].replace(',', '.'));
      const uraw = (qtyUnit[2] || '').replace(/s$/,''); if (uraw && unitMap[uraw]) unidade = unitMap[uraw];
      seg = seg.replace(qtyUnit[0], '');
    } else {
      const wordQty = seg.match(/\b(meio|meia)\s+(quilo|quilos|kg)|\b(meio|meia)\b/);
      if (wordQty) { if (wordQty[2]) { quantidade = 0.5; unidade = 'kg'; seg = seg.replace(wordQty[0],''); } else { quantidade = 0.5; seg = seg.replace(wordQty[0],''); } }
      else { const w = seg.match(/\b(um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez)\b/); if (w) { quantidade = numberWords[w[1]] || null; seg = seg.replace(w[0],''); } }
    }

    for (const [k,v] of Object.entries(unitMap)) { if (seg.includes(k)) { unidade = v; seg = seg.replace(new RegExp(k,'g'),''); break; } }
    if (quantidade === null) quantidade = 1;

    // remover verbos e palavras funcionais antes de extrair o nome
    seg = seg.replace(/\b(tira|tire|remove|remova|retira|retire|apaga|cancela|marca|marque|marcar|comprei|desmarca|nao comprei|meio|meia|muda o preco|muda o preço|atualiza o preco|preco do|preco da|custa|custou)\b/g,'');
    seg = seg.replace(/\b(o|a|os|as|um|uma|do|da|de|por|pra|para)\b/g,'');
    seg = seg.replace(/[\d\.,\$]/g,'');
    const rawNome = seg.replace(/[^a-z\s-]/g,'').trim();
    const nome = normalizeProductName(rawNome);
    if (!nome) {
      // se comando for de remoção por índice (ex: "remova o item 2"), aceitar resultado mesmo sem nome
      if (acao === 'remover' && quantidade) {
        results.push({ acao, nome: 'item', quantidade, unidade, preco: preco ?? null });
        continue;
      }
      continue;
    }

    results.push({ acao, nome, quantidade, unidade, preco: preco ?? null });
  }

  return results.length ? results : [{ acao: 'adicionar', nome: txt.trim(), quantidade:1, unidade:'un', preco: null }];
};

export { normalizeProductName };

const PROVEDORES = {
  openrouter: interpretarComOpenRouter,
  gemini: interpretarComGemini,
  anthropic: interpretarComAnthropic,
};

export const interpretar = async (input) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    ultimoProvedorUsado = 'regex';
    return interpretarComRegex(input);
  }

  try {
    ultimoProvedorUsado = 'llm';
    // tenta OpenRouter primeiro quando disponível
    if (PROVEDOR_ATIVO === 'openrouter' && PROVEDORES.openrouter) return await PROVEDORES.openrouter(input);
    const fn = PROVEDORES[PROVEDOR_ATIVO] || PROVEDORES.openrouter;
    if (!fn) throw new Error('Provedor LLM não configurado');
    return await fn(input);
  } catch (err) {
    console.warn('LLM falhou, usando regex:', err.message);
    ultimoProvedorUsado = 'regex';
    return interpretarComRegex(input);
  }
};
