import { normalizeProductName } from './normalizeProduct.js';

describe('normalizeProductName', () => {

  test('remove acentos', () => {
    expect(normalizeProductName('Açúcar')).toBe('acucar');
  });

  test('converte para minúsculo', () => {
    expect(normalizeProductName('ARROZ')).toBe('arroz');
  });

  test('remove acentos compostos', () => {
    expect(normalizeProductName('Café em Pó')).toBe('cafe em po');
  });

  test('mantém espaços entre palavras', () => {
    expect(normalizeProductName('Farinha de Mandioca')).toBe('farinha de mandioca');
  });

  test('remove caracteres especiais', () => {
    expect(normalizeProductName('Óleo de Soja!')).toBe('oleo de soja');
  });

  test('trim de espaços extras', () => {
    expect(normalizeProductName('  arroz  ')).toBe('arroz');
  });

  test('idempotente — já normalizado', () => {
    expect(normalizeProductName('acucar')).toBe('acucar');
  });

});
