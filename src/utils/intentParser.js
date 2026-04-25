import { parseVoiceInput } from './voiceParser.js';

const REMOVER_RE = /\b(remover|tirar|excluir|deletar|apagar)\b/i;
const EDITAR_QTD_RE = /\b(mudar|alterar|quantidade|qtd)\b/i;
const EDITAR_PRECO_RE = /\b(pre[çc]o|valor|custo)\b/i;
const PRECO_INDICADORES_RE = /\b(reais|r\$|\$)\b/i;
const PESO_UNIDADES_RE = /\b(kg|kilo|gramas?|ml|litros?)\b/i;

/**
 * Interprets a natural language command and returns a structured intent.
 * Reuses parseVoiceInput() from voiceParser.js internally.
 *
 * @param {string} texto - Input text
 * @param {Array} itensNoCarrinho - Current cart items for disambiguation
 * @returns {{ intent: string, produto: string|null, descricao: string|null,
 *             quantidade: number|null, unidade: string|null,
 *             preco: number|null, confianca: 'alta'|'baixa' }}
 */
export function parseIntent(texto, itensNoCarrinho = []) {
  const vazio = {
    intent: 'desconhecido',
    produto: null,
    descricao: null,
    quantidade: null,
    unidade: null,
    preco: null,
    confianca: 'baixa',
  };

  if (!texto || !texto.trim()) return vazio;

  const t = texto.trim();
  const tLow = t.toLowerCase();

  // 1. Remove intent
  if (REMOVER_RE.test(tLow)) {
    // Strip remove keywords so voiceParser gets a clean product name
    const tStripped = t.replace(REMOVER_RE, '').replace(/\s+/g, ' ').trim();
    const p = parseVoiceInput(tStripped);
    return {
      ...vazio,
      intent: 'remover',
      produto: p.produto,
      descricao: p.descricao,
      confianca: p.produto ? 'alta' : 'baixa',
    };
  }

  // 2. Edit price intent (explicit keyword)
  if (EDITAR_PRECO_RE.test(tLow)) {
    const tStripped = t.replace(EDITAR_PRECO_RE, '').replace(/\s+/g, ' ').trim();
    const p = parseVoiceInput(tStripped);
    return {
      ...vazio,
      intent: 'editar_preco',
      produto: p.produto,
      descricao: p.descricao,
      preco: p.preco ?? p.quantidade,
      confianca: p.produto ? 'alta' : 'baixa',
    };
  }

  // 3. Edit quantity intent (explicit keyword)
  if (EDITAR_QTD_RE.test(tLow)) {
    // Strip edit-qty keywords so voiceParser gets clean input
    const tStripped = t.replace(EDITAR_QTD_RE, '').replace(/\s+/g, ' ').trim();
    const p = parseVoiceInput(tStripped);
    // voiceParser may put a bare number in preco (no unit) — use as qty fallback
    const qtd = p.quantidade !== null ? p.quantidade : p.preco;
    return {
      ...vazio,
      intent: 'editar_quantidade',
      produto: p.produto,
      descricao: p.descricao,
      quantidade: qtd,
      unidade: p.unidade,
      confianca: p.produto ? 'alta' : 'baixa',
    };
  }

  // 4. Parse via voiceParser
  const parsed = parseVoiceInput(t);

  // 5. Disambiguation when product is already in cart
  if (parsed.produto && itensNoCarrinho.length > 0) {
    const nomeLow = parsed.produto.toLowerCase();
    const noCarrinho = itensNoCarrinho.some(it =>
      (it.nome || '').toLowerCase().includes(nomeLow) ||
      nomeLow.includes((it.nome || '').toLowerCase())
    );

    if (noCarrinho) {
      // number + weight unit → editar_quantidade
      if (parsed.quantidade !== null && PESO_UNIDADES_RE.test(t) && parsed.preco === null) {
        return {
          ...vazio,
          intent: 'editar_quantidade',
          produto: parsed.produto,
          descricao: parsed.descricao,
          quantidade: parsed.quantidade,
          unidade: parsed.unidade,
          confianca: 'alta',
        };
      }
      // "reais" / "R$" / "$" present → editar_preco
      if (PRECO_INDICADORES_RE.test(tLow)) {
        return {
          ...vazio,
          intent: 'editar_preco',
          produto: parsed.produto,
          descricao: parsed.descricao,
          preco: parsed.preco,
          confianca: 'alta',
        };
      }
      // bare number without unit (or number put in preco by voiceParser) → treat as price
      if ((parsed.quantidade !== null && !parsed.unidade) ||
          (parsed.preco !== null && parsed.quantidade === null && !PESO_UNIDADES_RE.test(t))) {
        return {
          ...vazio,
          intent: 'editar_preco',
          produto: parsed.produto,
          descricao: parsed.descricao,
          preco: parsed.preco ?? parsed.quantidade,
          confianca: 'alta',
        };
      }
    }
  }

  // 6. Default: adicionar
  if (parsed.produto || parsed.sucesso) {
    return {
      ...vazio,
      intent: 'adicionar',
      produto: parsed.produto,
      descricao: parsed.descricao,
      quantidade: parsed.quantidade,
      unidade: parsed.unidade,
      preco: parsed.preco,
      confianca: parsed.produto ? 'alta' : 'baixa',
    };
  }

  return vazio;
}
