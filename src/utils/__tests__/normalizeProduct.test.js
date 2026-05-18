import { normalizeProductName, generateDescricao } from '../normalizeProduct.js';

describe('normalizeProductName', () => {
  test('distinguishes farinha and farinha de mandioca', () => {
    const a = normalizeProductName('farinha');
    const b = normalizeProductName('farinha de mandioca');
    expect(a).not.toBe(b);
    expect(a).toBe('farinha');
    expect(b).toMatch(/mandioca/);
  });

  test('removes diacritics and lowercases', () => {
    expect(normalizeProductName('Açúcar Refinado')).toBe('acucar refinado');
  });
});

describe('generateDescricao', () => {
  test('restores accented label when available', () => {
    expect(generateDescricao('farinha de mandioca')).toBe('Farinha de Mandioca');
  });
});
