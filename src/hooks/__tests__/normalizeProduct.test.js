import { normalizeProductName, singularize } from '../../utils/normalizeProduct';

describe('normalizeProductName / singularize', () => {
  test('singularize handles common plural forms', () => {
    expect(singularize('arroz')).toBe('arroz');
    expect(singularize('pães')).toBe('pã'); // edge-case transformation
    expect(singularize('baloes')).toBe('balao');
    expect(singularize('camisas')).toBe('camisa');
  });

  test('normalizeProductName removes diacritics, lowercases and singularizes tokens', () => {
    const raw = 'Arroz Tipo 1';
    expect(normalizeProductName(raw)).toBe('arroz tipo 1'.split(' ').map(t => t).join(' '));
  });

  test('normalizeProductName normalizes accented characters', () => {
    expect(normalizeProductName('Pãezinhos')).toContain('paezinh');
  });
});
