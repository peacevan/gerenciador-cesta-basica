import { parseVoiceInput } from '../voiceParser.js';

describe('parseVoiceInput', () => {
  test('parses quantity, unit, product and price (decimal comma)', () => {
    const r = parseVoiceInput('2 kg arroz 7,50');
    expect(r.quantidade).toBe(2);
    expect(r.unidade).toBe('kg');
    expect(r.produto).toBe('arroz');
    expect(r.preco).toBeCloseTo(7.5);
    expect(r.sucesso).toBe(true);
  });

  test('parses product with composed name (farinha de mandioca)', () => {
    const r = parseVoiceInput('3 kg farinha de mandioca');
    expect(r.quantidade).toBe(3);
    expect(r.produto).toMatch(/mandioca/);
    expect(r.unidade).toBe('kg');
  });
});
