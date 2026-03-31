const chamarProxy = async (provider, input) => {
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, input }),
  });

  if (!res.ok) {
    // tentar ler corpo como texto para melhorar mensagem de erro
    let body = '';
    try { body = await res.text(); } catch (e) { body = ''; }
    const snippet = body ? body.slice(0, 200) : '';
    throw new Error(`Proxy HTTP ${res.status}: ${snippet}`);
  }

  const data = await res.json();
  if (data && data.error) throw new Error(data.error);

  // Extrair o texto útil do payload do proxy, suportando vários provedores
  const text =
    (data && (data.text || data.output_text || data.content)) ||
    (data && data.choices && data.choices[0] && (data.choices[0].message?.content || data.choices[0].text)) ||
    (data && data.candidates && data.candidates[0] && (data.candidates[0].message?.content || data.candidates[0].text)) ||
    (typeof data === 'string' ? data : '') || '';

  return parsearResposta(text);
};

// export para permitir testes unitários do chamado ao proxy
export { chamarProxy };

const interpretarComOpenRouter = (input) => chamarProxy('openrouter', input);

// Fallback/simple regex parser for offline or empty responses
const interpretarComRegex = (input) => {
  if (!input || typeof input !== 'string') return [];
  const txt = input.toLowerCase().trim();
  // detectar ações básicas
  if (/remov|exclu/i.test(txt)) {
    // quantidade se houver número
    const mNum = txt.match(/(\d+)/);
    const quantidade = mNum ? parseInt(mNum[1], 10) : 1;
    // nome: palavra após 'remova' ou última palavra
    const mName = txt.match(/remov(?:a|e|er)?\s+(?:o\s+ultim[oà]\s+item\s+adicionado|item\s+\d+|(.+))/i);
    let nome = '';
    if (mName) {
      nome = (mName[1] || '').trim();
    }
    if (!nome) {
      const parts = txt.split(/\s+/);
      nome = parts[parts.length - 1];
    }
    return [{ acao: 'remover', nome: nome || 'item', quantidade }];
  }

  if (/adicion|inclu|colocar|add\b/.test(txt)) {
    const mName = txt.match(/(?:adiciona?|adicionar|inclu(?:ir)?|colocar)\s+(.+)/i);
    const nome = mName ? mName[1].trim() : txt.replace(/adiciona?|adicionar/i, '').trim();
    // tenta extrair quantidade e unidade simples
    const mQtd = nome.match(/(\d+(?:[.,]\d+)?)/);
    const quantidade = mQtd ? parseFloat(mQtd[1].replace(',', '.')) : 1;
    return [{ acao: 'adicionar', nome: (nome || '').replace(/\d+/g, '').trim(), quantidade, unidade: 'un' }];
  }

  // tentar detectar marcar/desmarcar
  if (/marc|check|conclu/i.test(txt)) {
    const mName = txt.match(/(?:marc(?:ar)?|check)\s+(.+)/i);
    const nome = mName ? mName[1].trim() : '';
    return [{ acao: 'marcar', nome }];
  }

  // default: retorna ação adicionar com todo o texto como nome
  return [{ acao: 'adicionar', nome: txt, quantidade: 1, unidade: 'un' }];
};

// parsear resposta esperada do proxy (JSON ou texto contendo JSON)
const parsearResposta = (text) => {
  if (!text) return [];
  // tenta parse direto
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && parsed.commands) return parsed.commands;
    if (parsed && parsed.comandos) return parsed.comandos;
  } catch (err) {
    // ignora e tenta extrair um array JSON balanceado do texto
  }

  // procura o primeiro JSON array balanceado no texto
  const extractFirstJsonArray = (s) => {
    const start = s.indexOf('[');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < s.length; i += 1) {
      const ch = s[i];
      if (ch === '[') depth += 1;
      else if (ch === ']') {
        depth -= 1;
        if (depth === 0) {
          return s.slice(start, i + 1);
        }
      }
    }
    return null;
  };

  const arrText = extractFirstJsonArray(text);
  if (arrText) {
    try { const p = JSON.parse(arrText); if (Array.isArray(p)) return p; } catch (e) { /* ignore */ }
  }
  return [];
};

// normalizar e validar array resultante do LLM/proxy
const normalizarResposta = (items) => {
  if (!Array.isArray(items)) return [];
  const normalized = items
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const acao = (it.acao || it.action || 'adicionar').toString();
      const nomeRaw = (it.nome || it.name || '').toString();
      const nome = nomeRaw ? nomeRaw.trim().toLowerCase() : '';
      const quantidadeRaw = it.quantidade ?? it.quantity ?? 1;
      const quantidade = Number.isFinite(Number(quantidadeRaw)) ? Number(quantidadeRaw) : (parseFloat(String(quantidadeRaw).replace(',', '.')) || 1);
      const unidade = (it.unidade || it.unit || 'un').toString();
      const precoRaw = it.preco ?? it.price ?? null;
      const preco = precoRaw === null || precoRaw === undefined ? null : (Number(precoRaw) || null);
      if (!nome) return null;
      return { acao, nome, quantidade, unidade, preco };
    })
    .filter(Boolean);
  return normalized;
};

const PROVEDOR_ATIVO = { LLM: 'llm', REGEX: 'regex' };
let ultimoProvedorUsado = PROVEDOR_ATIVO.LLM;

const interpretar = async (input) => {
  // primeiro tenta LLM via OpenRouter
  try {
    const res = await interpretarComOpenRouter(input);
    const norm = normalizarResposta(res);
    if (Array.isArray(norm) && norm.length > 0) {
      ultimoProvedorUsado = PROVEDOR_ATIVO.LLM;
      return norm;
    }
  } catch (err) {
    // falha no proxy, continua para fallback
    console.debug('useLLMParser: openrouter erro', err);
  }
  // fallback para regex
  ultimoProvedorUsado = PROVEDOR_ATIVO.REGEX;
  return interpretarComRegex(input);
};

export { interpretar, interpretarComRegex, PROVEDOR_ATIVO, ultimoProvedorUsado };

// Debug: confirmar que o módulo foi carregado e o tipo de `interpretar`
try {
  // eslint-disable-next-line no-console
  console.debug('useLLMParser loaded', { interpretarType: typeof interpretar, exports: ['interpretar','interpretarComRegex','PROVEDOR_ATIVO','ultimoProvedorUsado'] });
} catch (e) {
  // ignore em ambientes sem console
}