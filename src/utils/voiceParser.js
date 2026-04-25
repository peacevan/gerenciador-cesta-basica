import { normalizeProductName, generateDescricao } from './normalizeProduct.js';

export { generateDescricao };

const NUMERAIS = {
  'um': 1, 'uma': 1, 'dois': 2, 'duas': 2,
  'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5,
  'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
  'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'quinze': 15,
  'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19,
  'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
  'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
  'cem': 100, 'cento': 100,
};

function normalizeUnidade(raw) {
  const r = raw.toLowerCase();
  if (/^kg|kilo/.test(r)) return 'kg';
  if (/^g(?!al)/.test(r)) return 'g';
  if (/^ml/.test(r)) return 'ml';
  if (/^l(?!a)/.test(r)) return 'l';
  if (/^pct|pac/.test(r)) return 'pct';
  if (/^cx|cai/.test(r)) return 'cx';
  if (/^lat/.test(r)) return 'lata';
  if (/^sac/.test(r)) return 'saco';
  return 'und';
}

const CONECTIVOS_INICIO = /^(de|da|do|dos|das|com|e|a|o)\s+/i;
const CONECTIVOS_FIM    = /\s+(de|da|do|dos|das|com|e|a|o)$/i;

export function parseVoiceInput(texto) {
  if (!texto || !texto.trim()) {
    return { produto: null, descricao: null, quantidade: null, unidade: null, preco: null, sucesso: false };
  }

  let t = texto.toLowerCase().trim();

  // substituir números por extenso
  Object.entries(NUMERAIS).forEach(([palavra, num]) => {
    t = t.replace(new RegExp(`\\b${palavra}\\b`, 'g'), String(num));
  });

  // remover símbolos monetários antes de normalizar
  t = t.replace(/r\$\s*/g, '').replace(/\$\s*/g, '');

  // normalizar decimal: "7 reais e 90" → "7.90", "7 reais" → "7", "7,50" → "7.50"
  t = t
    .replace(/(\d+)\s+reais?\s+e\s+(\d+)/g, '$1.$2')
    .replace(/(\d+)\s+reais?/g, '$1')
    .replace(/(\d+),(\d+)/g, '$1.$2');

  // quantidade + unidade
  const qtdMatch = t.match(
    /(\d+(?:\.\d+)?)\s*(kg|kilo(?:s|gramas?)?|ml|g(?:rama)?s?|latas?|sacos?|pacotes?|caixas?|unidades?|und|cx|pct|l(?:itro)?s?)/i
  );

  // string sem a quantidade+unidade (para extração de preço e produto)
  let semQtd = t;
  if (qtdMatch) semQtd = semQtd.replace(qtdMatch[0], ' ').replace(/\s+/g, ' ').trim();

  // preço — número não seguido de unidade
  const precoMatch = semQtd.match(
    /(\d+(?:\.\d+)?)(?!\s*(?:kg|g\b|ml|l\b|und|pct|cx|unidade|pacote|caixa|lata|saco))/i
  );

  const soNumero = !qtdMatch ? t.match(/^(\d+(?:\.\d+)?)$/) : null;

  const resultado = { produto: null, descricao: null, quantidade: null, unidade: null, preco: null, sucesso: false };

  if (qtdMatch) {
    resultado.quantidade = parseFloat(qtdMatch[1]);
    resultado.unidade = normalizeUnidade(qtdMatch[2]);
  }

  if (precoMatch) {
    const candidato = parseFloat(precoMatch[1]);
    if (!qtdMatch || candidato !== resultado.quantidade) {
      resultado.preco = candidato;
    }
  } else if (soNumero) {
    resultado.preco = parseFloat(soNumero[1]);
  }

  // extrair produto: remover preço de semQtd, limpar conectivos
  let semPreco = semQtd;
  if (resultado.preco !== null && precoMatch) {
    semPreco = semPreco.replace(precoMatch[0], ' ').replace(/\s+/g, ' ').trim();
  } else if (resultado.preco !== null && soNumero) {
    semPreco = semPreco.replace(soNumero[0], ' ').replace(/\s+/g, ' ').trim();
  }

  semPreco = semPreco
    .replace(CONECTIVOS_INICIO, '')
    .replace(CONECTIVOS_FIM, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (semPreco) {
    resultado.descricao = semPreco;
    resultado.produto = normalizeProductName(semPreco);
  }

  resultado.sucesso = resultado.quantidade !== null || resultado.preco !== null;
  return resultado;
}

