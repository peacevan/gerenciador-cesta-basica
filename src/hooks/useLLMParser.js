const PROXY_SECRET = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_PROXY_SECRET) ||
  (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.REACT_APP_PROXY_SECRET) || null;

const chamarProxy = async (provider, input) => {
  const headers = { 'Content-Type': 'application/json' };
  if (PROXY_SECRET) headers['x-proxy-secret'] = PROXY_SECRET;
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers,
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

// Fallback/parser baseado em regras para uso offline — mais robusto que um único regex
const parseNumber = (s) => {
  if (s == null) return null;
  const str = String(s).replace(/\s/g, '').replace(/R\$|\$/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
};

// small number words map (pt-BR)
const NUMBER_WORDS = {
  'zero':0,'um':1,'uma':1,'dois':2,'duas':2,'tres':3,'três':3,'quatro':4,'cinco':5,'seis':6,'sete':7,'oito':8,'nove':9,'dez':10,
  'onze':11,'doze':12,'treze':13,'quatorze':14,'catorze':14,'quinze':15,'dezesseis':16,'dezassete':17,'dezessete':17,'dezoito':18,'dezenove':19,'vinte':20,
  'meia':0.5,'meia-dúzia':6,'meia duzia':6,'duzia':12,'dúzia':12
};

const replaceNumberWords = (text) => {
  if (!text || typeof text !== 'string') return text;
  let s = text.toLowerCase();
  // replace 'meia dúzia' first
  s = s.replace(/meia\s*d[uú]zia/gi, '6');
  s = s.replace(/d[uú]zia/gi, '12');
  // replace common words
  Object.keys(NUMBER_WORDS).forEach(w => {
    const val = NUMBER_WORDS[w];
    if (w === 'meia-dúzia' || w === 'meia duzia' || w === 'duzia' || w === 'dúzia') return;
    const re = new RegExp('\\b' + w + '\\b', 'gi');
    s = s.replace(re, String(val));
  });
  return s;
};

const UNIT_MAP = {
  kg: 'kg', kilo: 'kg', quilo: 'kg', quilos: 'kg', g: 'g', gramas: 'g', lt: 'lt', l: 'lt', ml: 'ml', un: 'un', unidade: 'un', unidades: 'un', dúz: 'dz', dz: 'dz'
};

// Regras ordenadas: cada regra tem um regex e um handler que retorna um objeto de comando
const RULES = [
  {
    name: 'update_price',
    re: /(?:atualiz(?:ar|e)|atualiza|pre[çc]o)\s+(?:do|do\s+produto\s+)?(.+?)\s+(?:para|pra|por)\s*(R?\$?\s*\d+[.,]?\d*)$/i,
    handler: (m, origInput) => {
      const nome = (m[1] || '').trim();
      const precoStr = m[2] || ((origInput || '').match(/(?:por|pra|para)\s*(R?\$?\s*\d+[.,]?\d*)/i) || [null, null])[1] || null;
      const preco = precoStr ? parseNumber(precoStr) : null;
      return { acao: 'atualizar_preco', nome, preco };
    }
  },
  {
    name: 'remove_with_qty',
    re: /(?:remov(?:a|e|er)?|exclu(?:ir|a)?|tirar)\s+(?:o\s+)?(.+?)(?:\s+(\d+(?:[.,]\d+)?))?$/i,
    handler: (m) => {
      let nome = (m[1] || '').trim();
      let quantidade = parseNumber(m[2]) || 1;
      // se o número vier antes do nome: 'remova 2 feijao'
      const leading = nome.match(/^(\d+[.,]?\d*)\s+(.+)$/);
      if (leading) {
        quantidade = parseNumber(leading[1]) || quantidade;
        nome = (leading[2] || nome).trim();
      }
      // também remover número residual no final
      nome = nome.replace(/\b(\d+[.,]?\d*)\b$/, '').trim();
      return { acao: 'remover', nome, quantidade };
    }
  },
  {
    name: 'add_qty_unit_price',
    re: /(?:adiciona(?:r)?|coloca|inclui(?:r)?|põe|pone)\s+(.+?)(?:\s+por\s*(R?\$?\s*\d+[.,]?\d*))?$/i,
    handler: (m, origInput) => {
      const full = (m[1] || '').trim();
      // extrair quantidade e unidade no início
      const qMatch = full.match(/^(\d+[.,]?\d*)\s*(kg|kilos?|quilo?s?|g|ml|lt|l|unidades?|un|dúz|dz)?\s*(?:de\s+)?(.+)$/i);
      let quantidade = 1; let unidade = 'un'; let nome = full;
      if (qMatch) {
        quantidade = parseNumber(qMatch[1]) || 1;
        const uRaw = (qMatch[2] || 'un').toLowerCase();
        unidade = UNIT_MAP[uRaw] || 'un';
        nome = (qMatch[3] || '').trim();
      } else {
        // também tentar extrair quantidade no meio do texto
        const qMid = full.match(/(\d+[.,]?\d*)\s*(kg|kilos?|quilo?s?|g|ml|lt|l|unidades?|un|dúz|dz)/i);
        if (qMid) {
          quantidade = parseNumber(qMid[1]) || 1;
          unidade = UNIT_MAP[(qMid[2] || 'un').toLowerCase()] || 'un';
          nome = full.replace(qMid[0], '').trim();
        }
      }
      // price may be in the second capture or present in the original input after 'por'
      const precoStr = m[2] || ((origInput || '').match(/por\s*(R?\$?\s*\d+[.,]?\d*)/i) || [null, null])[1] || null;
      const preco = precoStr ? parseNumber(precoStr) : null;
      return { acao: 'adicionar', nome: nome || full, quantidade, unidade, preco };
    }
  },
  {
    name: 'mark',
    re: /(?:marc(?:ar)?|concluir|check)\s+(.+)/i,
    handler: (m) => ({ acao: 'marcar', nome: (m[1] || '').trim() })
  }
];

const interpretarComRegex = (input) => {
  if (!input || typeof input !== 'string') return [];
  // normalize numerals written as words
  const txt = replaceNumberWords(String(input)).trim();
  for (const rule of RULES) {
    const m = txt.match(rule.re);
    if (m) {
      try {
        const res = rule.handler(m, input);
        // se handler não forneceu preço, tentar extrair do input original (por/pra/para R$...)
        if (res && (res.preco === null || res.preco === undefined) && input) {
          const priceMatch = (input.match(/(?:por|pra|para)\s*(R?\$?\s*\d+[.,]?\d*)/i) || [null, null]);
          if (priceMatch[1]) {
            const p = parseNumber(priceMatch[1]);
            if (p != null) res.preco = p;
          }
        }
        // normalizar resultado mínimo
        if (res && res.nome) res.nome = res.nome.trim();
        // default confidence for rule matches
        if (res && typeof res.confidence !== 'number') res.confidence = 0.9;
        return [res];
      } catch (e) {
        // se handler falhar, continuar para próxima regra
        // eslint-disable-next-line no-console
        console.debug('rule handler error', rule.name, e);
      }
    }
  }
  // fallback genérico: extrai número e usa resto como nome
  const fallbackQtd = (txt.match(/(\d+[.,]?\d*)/) || [null, null])[1];
  const quantidade = parseNumber(fallbackQtd) || 1;
  const nome = txt.replace(/(\d+[.,]?\d*)/g, '').replace(/por\s*R?\$?\s*\d+[.,]?\d*/i, '').replace(/adiciona(?:r)?|adiciona/i, '').trim();
  return [{ acao: 'adicionar', nome: nome || txt, quantidade, unidade: 'un', confidence: 0.5 }];
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
      const confidence = typeof it.confidence === 'number' ? it.confidence : null;
      if (!nome) return null;
      const out = { acao, nome, quantidade, unidade, preco };
      if (confidence != null) out.confidence = confidence;
      return out;
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