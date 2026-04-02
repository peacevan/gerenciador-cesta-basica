// Normalização de nomes de produto: remover acentos, lower case, trim, remover artigos e unidades comuns
const removeDiacritics = (str) => (str && str.normalize) ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '') : String(str || '').replace(/[\u0300-\u036f]/g, '');

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
  s = s.replace(/\b(o|a|os|as|um|uma|uns|umas|de|do|da|dos|das|e)\b/g, ' ');
  s = s.replace(/\b(kgs?|kilos?|kg|l|lt|ml|g|gr|grs|un|unidade|pacote|pacotes|cx|caixa)\b/g, ' ');
  s = s.replace(/[^a-z0-9 ]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.split(' ').map(p => singularize(p)).filter(Boolean).join(' ');
};

export default normalizeProductName;
