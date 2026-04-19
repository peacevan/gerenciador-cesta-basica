const NUMERAIS = {
  'um': 1, 'uma': 1, 'dois': 2, 'duas': 2,
  'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5,
  'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
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

export function parseVoiceInput(texto) {
  let t = texto.toLowerCase().trim();

  // substituir números por extenso
  Object.entries(NUMERAIS).forEach(([palavra, num]) => {
    t = t.replace(new RegExp(`\\b${palavra}\\b`, 'g'), String(num));
  });

  // normalizar decimal: "7 reais e 90" → "7.90"
  t = t
    .replace(/(\d+)\s+reais?\s+e\s+(\d+)/g, '$1.$2')
    .replace(/(\d+)\s+reais?/g, '$1')
    .replace(/(\d+),(\d+)/g, '$1.$2');

  // quantidade + unidade
  const qtdMatch = t.match(
    /(\d+(?:\.\d+)?)\s*(kg|kilo(?:s|gramas?)?|g(?:rama)?s?|l(?:itro)?s?|ml|und(?:idades?)?|unidades?|pct|pacotes?|cx|caixas?|latas?|sacos?)/
  );

  // preço (não seguido de unidade)
  const precoMatch = t.match(
    /(?:a\s+|por\s+|r\$\s*)?(\d+(?:\.\d+)?)(?!\s*(?:kg|g\b|ml|l\b|und|pct|cx|unidade|pacote|caixa|lata|saco))/
  );

  const soNumero = !qtdMatch ? t.match(/^(\d+(?:\.\d+)?)$/) : null;

  const resultado = { quantidade: null, unidade: null, preco: null, sucesso: false };

  if (qtdMatch) {
    resultado.quantidade = parseFloat(qtdMatch[1]);
    resultado.unidade = normalizeUnidade(qtdMatch[2]);
  }

  if (precoMatch) {
    const candidato = parseFloat(precoMatch[1]);
    // evitar confundir quantidade com preço
    if (!qtdMatch || candidato !== resultado.quantidade) {
      resultado.preco = candidato;
    }
  } else if (soNumero) {
    resultado.preco = parseFloat(soNumero[1]);
  }

  resultado.sucesso = resultado.quantidade !== null || resultado.preco !== null;
  return resultado;
}
