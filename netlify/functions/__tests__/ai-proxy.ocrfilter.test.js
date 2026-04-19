const { filterOCRText } = require('../ai-proxy-lib');

describe('OCR text filter', () => {
  test('keeps lines with quantities and units and strips totals', () => {
    const raw = `Arroz 5 kg\nSubtotal: R$ 50,00\nFeijão 2 kg\nTotal: R$ 70,00\nObservações: entrega em 24h`;
    const out = filterOCRText(raw, { maxLines: 10, maxChars: 500 });
    expect(out).toContain('Arroz 5 kg');
    expect(out).toContain('Feijão 2 kg');
    expect(out).not.toContain('Subtotal');
    expect(out).not.toContain('Total');
  });

  test('limits number of lines and characters', () => {
    const lines = new Array(60).fill(0).map((_,i) => `produto${i} ${i+1} kg`).join('\n');
    const out = filterOCRText(lines, { maxLines: 20, maxChars: 200 });
    const outLines = out.split('\n');
    expect(outLines.length).toBeLessThanOrEqual(20);
    expect(out.length).toBeLessThanOrEqual(200);
  });
});
