import { interpretarComRegex } from '../useLLMParser';

describe('interpretarComRegex (rules-based fallback)', () => {
  test('adicionar com quantidade e unidade', () => {
    const res = interpretarComRegex('adicionar 2 kg de arroz');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].acao).toBe('adicionar');
    expect(res[0].nome.toLowerCase()).toContain('arroz');
    expect(res[0].quantidade).toBe(2);
    expect(res[0].unidade).toBe('kg');
  });

  test('adicionar com unidades e preço', () => {
    const res = interpretarComRegex('coloca 3 unidades de banana por R$ 5,50');
    expect(res[0].acao).toBe('adicionar');
    expect(res[0].nome.toLowerCase()).toContain('banana');
    expect(res[0].quantidade).toBe(3);
    expect(res[0].unidade).toBe('un');
    expect(res[0].preco).toBeCloseTo(5.5, 2);
  });

  test('remover com quantidade', () => {
    const res = interpretarComRegex('remova 2 feijao');
    expect(res[0].acao).toBe('remover');
    expect(res[0].nome.toLowerCase()).toContain('feijao');
    expect(res[0].quantidade).toBe(2);
  });

  test('atualizar preço', () => {
    const res = interpretarComRegex('atualiza o preço do leite para R$ 7,99');
    expect(res[0].acao).toBe('atualizar_preco');
    expect(res[0].nome.toLowerCase()).toContain('leite');
    expect(res[0].preco).toBeCloseTo(7.99, 2);
  });

  test('marcar item', () => {
    const res = interpretarComRegex('marcar arroz');
    expect(res[0].acao).toBe('marcar');
    expect(res[0].nome.toLowerCase()).toContain('arroz');
  });
});
