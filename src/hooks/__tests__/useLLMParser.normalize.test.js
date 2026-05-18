import { interpretar } from '../useLLMParser';

describe('useLLMParser normalization edge cases', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test('normalizes price/price string into preco number and lowercase nome', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '[{"acao":"adicionar","name":"Arroz","price":"12.50","quantity":"2"}]' })
    });

    const res = await interpretar('comprar arroz');
    expect(Array.isArray(res)).toBe(true);
    const item = res[0];
    expect(item.nome).toBe('arroz');
    expect(typeof item.preco).toBe('number');
    expect(item.preco).toBeCloseTo(12.5);
    expect(item.quantidade).toBe(2);
  });

  test('handles missing numeric values gracefully (preco null)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '[{"acao":"adicionar","name":"Feijão","price":"---","quantity":"x"}]' })
    });

    const res = await interpretar('comprar feijão');
    expect(Array.isArray(res)).toBe(true);
    const item = res[0];
    expect(item.nome).toBe('feijao');
    expect(item.preco === null || typeof item.preco === 'number').toBeTruthy();
    expect(typeof item.quantidade).toBe('number');
  });
});
