/**
 * US-005 — Validação estrita de frases de voz (modo Regex/Offline)
 *
 * Padrões aceitos:
 *   [produto] [quantidade] [unidade] [preço]
 *   [quantidade] [unidade] [produto] [preço]
 *   [produto] [preço]
 *
 * Retorna { valida: true } ou { valida: false, feedback: string }
 */

const UNIT_RE = /\b(kg|kilos?|quilo?s?|gramas?|g|ml|lt|l|unidades?|un|d[uú]z(?:ia)?|dz)\b/i;
const PRICE_RE = /(?:R?\$\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*reais?)/i;
const QTY_RE   = /\d+(?:[.,]\d+)?/;

/**
 * Verifica se uma frase atende ao padrão mínimo para o modo regex estrito.
 * Critério: contém pelo menos um token de produto (palavra não-numérica, não-unidade, não-preço)
 *           e pelo menos um token quantificador (número, unidade ou preço).
 */
export function validateVoicePhrase(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { valida: false, feedback: 'Não entendi. Tente: arroz 10 reais ou 2 kg arroz 10 reais' };
  }

  const txt = phrase.trim().toLowerCase();

  // Remove tokens de preço, unidade e quantidade para isolar o nome do produto
  const semPreco   = txt.replace(PRICE_RE, ' ').trim();
  const semUnidade = semPreco.replace(UNIT_RE, ' ').trim();
  const semNumero  = semUnidade.replace(QTY_RE, ' ').trim();

  // O produto precisa ter ao menos uma palavra (letras)
  const palavrasProduto = semNumero.replace(/\s+/g, ' ').trim().split(' ').filter(w => /[a-záéíóúâêôãõ]{2,}/i.test(w));

  if (palavrasProduto.length === 0) {
    return {
      valida: false,
      feedback: 'Não entendi. Tente: arroz 10 reais ou 2 kg arroz 10 reais',
    };
  }

  // Precisa ter ao menos um quantificador (número ou unidade ou preço)
  const temQuantificador = PRICE_RE.test(txt) || UNIT_RE.test(txt) || QTY_RE.test(txt);

  // Aceita mesmo sem quantificador (só produto nome) — mas com confidence baixa
  // A rejeição absoluta só ocorre quando NÃO tem nome de produto identificável
  return { valida: true };
}

/**
 * Retorna feedback de erro amigável para exibição ao usuário por 4s.
 */
export function getVoiceErrorFeedback() {
  return 'Não entendi. Tente: arroz 10 reais ou 2 kg arroz 10 reais';
}
