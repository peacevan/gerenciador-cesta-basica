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

  test('extracts JSON array when response contains extra text around JSON', async () => {
    const payload = { text: 'Some preamble text\n[{"acao":"adicionar","nome":"feijao","quantidade":2}]\nThanks' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload });

    const res = await chamarProxy('openrouter', 'comprar feijao');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].nome).toBe('feijao');
  });

  test('supports choices[0].message.content payloads', async () => {
    const payload = { choices: [{ message: { content: '[{"acao":"adicionar","nome":"leite","quantidade":1}]' } }] };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload });

    const res = await chamarProxy('openrouter', 'comprar leite');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].nome).toBe('leite');
  });

  test('supports candidates[0].text payloads', async () => {
    const payload = { candidates: [{ text: '[{"acao":"adicionar","nome":"ovo","quantidade":12}]' }] };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload });

    const res = await chamarProxy('openrouter', 'comprar ovo');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].nome).toBe('ovo');
  });

  test('interpretar normalizes fields like name/quantity into nome/quantidade', async () => {
    // interpretar() applies normalization after chamarProxy
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ text: '[{"action":"adicionar","name":"Arroz","quantity":"5"}]' }) });

    const { interpretar } = require('../useLLMParser');
    const res = await interpretar('comprar arroz');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].nome).toBe('arroz');
    expect(res[0].quantidade).toBe(5);
  });
});
