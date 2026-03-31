import { chamarProxy } from '../useLLMParser';

describe('chamarProxy HTTP handling', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test('throws readable error when response is not ok and body is HTML', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '<html><body>Unauthorized</body></html>',
    });

    await expect(chamarProxy('openrouter', 'teste')).rejects.toThrow(/Proxy HTTP 401/);
  });

  test('throws error when JSON contains error field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'Invalid API key' }),
    });

    await expect(chamarProxy('openrouter', 'teste')).rejects.toThrow(/Invalid API key/);
  });

  test('returns parsed array when JSON text contains valid JSON array', async () => {
    const payload = { text: '[{"acao":"adicionar","nome":"arroz","quantidade":1}]' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const res = await chamarProxy('openrouter', 'comprar arroz');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].nome).toBe('arroz');
  });
});
