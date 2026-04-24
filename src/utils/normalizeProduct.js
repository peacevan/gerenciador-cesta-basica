// Normalização de nomes de produto: remover acentos, lower case, trim, remover artigos e unidades comuns
const removeDiacritics = (str) => (str && str.normalize) ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '') : String(str || '').replace(/[\u0300-\u036f]/g, '');

// Dicionário para restaurar label visual a partir de chave normalizada
const ACENTOS = {
  'acucar': 'Açúcar',
  'cafe': 'Café',
  'oleo': 'Óleo',
  'feijao': 'Feijão',
  'macarrao': 'Macarrão',
  'pao': 'Pão',
  'frango': 'Frango',
  'limao': 'Limão',
  'arroz': 'Arroz',
  'farinha': 'Farinha',
  'mandioca': 'Mandioca',
  'carne': 'Carne',
  'bovina': 'Bovina',
  'sardinha': 'Sardinha',
  'margarina': 'Margarina',
  'leite': 'Leite',
  'ovos': 'Ovos',
  'ovo': 'Ovo',
  'sal': 'Sal',
  'vinagre': 'Vinagre',
  'alho': 'Alho',
  'cebola': 'Cebola',
  'tomate': 'Tomate',
  'batata': 'Batata',
  'banana': 'Banana',
  'cafe em po': 'Café em Pó',
  'leite em po': 'Leite em Pó',
  'carne bovina primeira': 'Carne Bovina 1ª',
  'oleo de soja': 'Óleo de Soja',
  'farinha de mandioca': 'Farinha de Mandioca',
  'detergente': 'Detergente',
  'sabao em po': 'Sabão em Pó',
  'agua sanitaria': 'Água Sanitária',
  'carne de primeira': 'Carne de 1ª',
  'leite integral': 'Leite Integral',
  'manteiga': 'Manteiga',
  'batata': 'Batata',
  'banana': 'Banana',
};

/**
 * Converte chave interna normalizada para label visual com acentos.
 * Faz lookup no dicionário ACENTOS; fallback: capitaliza cada palavra.
 */
export const generateDescricao = (nome = '') => {
  const s = String(nome).toLowerCase().trim();
  const descricao = ACENTOS[s]
    ? ACENTOS[s]
    : s.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ');
  return descricao.replace(/[()]/g, '').trim();
};

export const singularize = (word) => {
  if (!word || word.length <= 2) return word;
  const w = word.toLowerCase();
  // special Portuguese plural forms
  if (w.endsWith('ães')) return w.replace(/ães$/, 'ã');
  if (w.endsWith('aes')) return w.replace(/aes$/, 'ao');
  if (w.endsWith('ões') || w.endsWith('oes')) return w.replace(/(ões|oes)$/, 'ao');
  if (w.endsWith('ais')) return w.replace(/ais$/, 'al');
  if (w.endsWith('es')) return w.replace(/es$/, '');
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
};

export const normalizeProductName = (raw = '') => {
  if (!raw) return '';
  let s = String(raw).trim().toLowerCase();
  s = removeDiacritics(s);
  s = s.replace(/\b(o|a|os|as|um|uma|uns|umas|e)\b/g, ' ');
  s = s.replace(/\b(kgs?|kilos?|kg|l|lt|ml|g|gr|grs|un|unidade|pacote|pacotes|cx|caixa)\b/g, ' ');
  s = s.replace(/[^a-z0-9 ]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.split(' ').map(p => singularize(p)).filter(Boolean).join(' ');
};

export default normalizeProductName;
