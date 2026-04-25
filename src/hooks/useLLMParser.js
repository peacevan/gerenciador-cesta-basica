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
  const str = String(s).replace(/\s/g, '').replace(/[Rr]\$|\$/g, '').replace(/\./g, '').replace(',', '.');
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
  kg: 'kg', kilo: 'kg', kilos: 'kg', quilo: 'kg', quilos: 'kg',
  g: 'g', grama: 'g', gramas: 'g',
  lt: 'lt', l: 'lt', litro: 'lt', litros: 'lt',
  ml: 'ml',
  un: 'un', unidade: 'un', unidades: 'un',
  'dúz': 'dz', dz: 'dz',
};

// Regex que captura preço inline — ex: "10 reais", "R$10", "$5", "R$ 7,50"
// Retorna o valor numérico ou null se o texto não contiver preço válido
const PRECO_INLINE_RE = /(?:(?:R?\$\s*(\d+(?:[.,]\d+)?))|(?:(\d+(?:[.,]\d+)?)\s*reais?))/i;

const extrairPrecoInline = (text) => {
  if (!text) return null;
  const m = text.match(PRECO_INLINE_RE);
  if (!m) return null;
  const raw = m[1] || m[2];
  return raw ? parseNumber(raw) : null;
};

// Remove tokens de preço do texto para obter nome limpo
const removerPrecoDoTexto = (text) =>
  text
    .replace(/R?\$\s*\d+(?:[.,]\d+)?/gi, '')
    .replace(/\d+(?:[.,]\d+)?\s*reais?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

// Verbos de ADD (pt-BR coloquial expandido)
const ADD_VERBS = 'adiciona(?:r)?|coloca(?:r)?|inclui(?:r)?|põe|poe|insira|insere|inserir|bote|botar|lança(?:r)?|lanca(?:r)?|acrescenta(?:r)?';
// Verbos de REMOVE (pt-BR coloquial expandido)
const REM_VERBS = 'remov(?:a|e|er|er)?|exclu(?:ir|a|i)?|tira(?:r)?|tire|abate(?:r)?|abata|abater|apaga(?:r)?|deleta(?:r)?|delete|retira(?:r)?|retire';

// ─── Shared helper: parse the body of an ADD command ─────────────────────────
// body  = texto após retirar o verbo de add
// orig  = input original (para fallback de preço)
const _parseAddBody = (body, orig) => {
  // Regex de unidades aceitas
  const UNIT_RE = 'kg|kilos?|quilo?s?|gramas?|g|ml|lt|l|unidades?|un|d[uú]z|dz';

  let quantidade = null;
  let unidade = null;
  let nome = body;

  // 1) Qty + unit no início: "1 kg de arroz", "500 gramas de macarrão"
  const qStart = body.match(
    new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*(' + UNIT_RE + ')\\s*(?:de\\s+)?(.*)$', 'i')
  );
  if (qStart) {
    quantidade = parseNumber(qStart[1]);
    const uRaw = qStart[2].toLowerCase();
    unidade = UNIT_MAP[uRaw] || uRaw;
    nome = qStart[3].trim();
  } else {
    // 2) Qty only no início (sem unidade): "1 feijão"
    const qOnly = body.match(/^(\d+(?:[.,]\d+)?)\s+(?!(reais?|R?\$))(.+)$/);
    if (qOnly) {
      quantidade = parseNumber(qOnly[1]);
      nome = qOnly[3].trim();
    } else {
      // 3) Qty + unit em qualquer posição (meio do texto)
      const qMid = body.match(
        new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(' + UNIT_RE + ')', 'i')
      );
      if (qMid) {
        quantidade = parseNumber(qMid[1]);
        const uRaw = qMid[2].toLowerCase();
        unidade = UNIT_MAP[uRaw] || uRaw;
        nome = body.replace(qMid[0], '').replace(/\s{2,}/g, ' ').trim();
      }
    }
  }

  // Remover tokens de preço do nome antes de usar como produto
  nome = removerPrecoDoTexto(nome || body);

  // Extrair preço: prioridade → "por R$X" → inline no body original
  const porMatch = (orig || body).match(/(?:por|pra|para)\s*(R?\$?\s*\d+(?:[.,]\d+)?)/i);
  const preco = porMatch
    ? parseNumber(porMatch[1])
    : extrairPrecoInline(body);

  return { acao: 'adicionar', nome: nome || body, quantidade, unidade, preco: preco ?? null };
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
    re: new RegExp(
      '(?:' + REM_VERBS + ')\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+)?(.+?)' +
      '(?:\\s+(?:(\\d+(?:[.,]\\d+)?)\\s*(kg|kilos?|quilo?s?|gramas?|g|ml|lt|l|unidades?|un)?))?$',
      'i'
    ),
    handler: (m) => {
      let nome = (m[1] || '').trim();
      let quantidade = parseNumber(m[2]) || null;
      const uRaw = (m[3] || '').toLowerCase();
      let unidade = uRaw ? (UNIT_MAP[uRaw] || uRaw) : null;

      // Padrão "N unit de nome" logo no início do capturado: ex "1 kg de arroz"
      const UNIT_RE_STR = 'kg|kilos?|quilo?s?|gramas?|g|ml|lt|l|unidades?|un';
      const leadingUnit = nome.match(
        new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*(' + UNIT_RE_STR + ')\\s*(?:de\\s+)?(.+)$', 'i')
      );
      if (leadingUnit) {
        quantidade = parseNumber(leadingUnit[1]) ?? quantidade;
        const u = leadingUnit[2].toLowerCase();
        unidade = UNIT_MAP[u] || u;
        nome = leadingUnit[3].trim();
      } else {
        // Padrão "N nome" (número sem unidade antes do nome): ex "1 arroz"
        const leadingQty = nome.match(/^(\d+[.,]?\d*)\s+(.+)$/);
        if (leadingQty) {
          quantidade = parseNumber(leadingQty[1]) ?? quantidade;
          nome = (leadingQty[2] || nome).trim();
        }
      }

      // remover "nome N unit" no meio: ex "arroz 1 kg"
      const midUnit = nome.match(/^(.+?)\s+(\d+[.,]?\d*)\s*(kg|kilos?|quilo?s?|gramas?|g|ml|lt|l|unidades?|un)\s*(.*)$/i);
      if (midUnit) {
        quantidade = parseNumber(midUnit[2]) ?? quantidade;
        const u = (midUnit[3] || '').toLowerCase();
        nome = (midUnit[1] + (midUnit[4] ? ' ' + midUnit[4] : '')).trim();
        if (!unidade && u) unidade = UNIT_MAP[u] || u;
      }

      // limpar número residual no final do nome se ainda presente
      nome = nome.replace(/\b(\d+[.,]?\d*)\b$/, '').trim();
      const result = { acao: 'remover', nome, quantidade };
      if (unidade) result.unidade = unidade;
      return result;
    }
  },
  {
    name: 'add_with_verbs',
    re: new RegExp(
      '^(?:' + ADD_VERBS + ')\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+|um\\s+|uma\\s+)?(.+)$',
      'i'
    ),
    handler: (m, origInput) => {
      return _parseAddBody((m[1] || '').trim(), origInput);
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
        // normalizar resultado mínimo
        if (res && res.nome) res.nome = res.nome.trim().toLowerCase();
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

  // ── Fallback genérico ─────────────────────────────────────────────────────
  // Tenta o _parseAddBody no texto completo (sem verbo reconhecido)
  try {
    const res = _parseAddBody(txt, input);
    if (res && res.nome) {
      res.nome = res.nome.trim().toLowerCase();
      res.confidence = 0.5;
      return [res];
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('fallback _parseAddBody error', e);
  }

  // último recurso: tudo como nome, sem preço
  return [{ acao: 'adicionar', nome: txt.toLowerCase(), quantidade: null, unidade: null, preco: null, confidence: 0.3 }];
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