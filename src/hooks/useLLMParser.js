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
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    // se o proxy retornar um objeto com field 'commands' ou 'comandos'
    if (parsed.commands) return parsed.commands;
    if (parsed.comandos) return parsed.comandos;
  } catch (err) {
    // não JSON — tentar extrair JSON entre colchetes
    const m = text.match(/\[.*\]/s);
    if (m) {
      try { const p = JSON.parse(m[0]); if (Array.isArray(p)) return p; } catch (e) { /* ignore */ }
    }
  }
  return [];
};

const PROVEDOR_ATIVO = { LLM: 'llm', REGEX: 'regex' };
let ultimoProvedorUsado = PROVEDOR_ATIVO.LLM;

const interpretar = async (input) => {
  // primeiro tenta LLM via OpenRouter
  try {
    const res = await interpretarComOpenRouter(input);
    if (Array.isArray(res) && res.length > 0) {
      ultimoProvedorUsado = PROVEDOR_ATIVO.LLM;
      return res;
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