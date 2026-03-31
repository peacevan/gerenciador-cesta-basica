const { handleProxy } = require('../ai-proxy-lib');

describe('ai-proxy nota-fiscal provider', () => {
  test('returns text when provider nota-fiscal succeeds', async () => {
    const payload = { imageData: 'base64data', mediaType: 'image/jpeg' };
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ text: '[{"nome":"arroz","quantidade":5}]' }] }) });
    const res = await handleProxy({ provider: 'nota-fiscal', input: payload }, mockFetch, () => '');
    expect(res).toHaveProperty('text');
    expect(res.text).toContain('arroz');
  });

  test('invalid input throws', async () => {
    await expect(handleProxy({ provider: 'nota-fiscal', input: 'not-an-object' }, () => {}, () => '')).rejects.toThrow(/Input inválido/);
  });

  test('empty provider response yields error', async () => {
    const payload = { imageData: 'base64data' };
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ text: '' }] }) });
    await expect(handleProxy({ provider: 'nota-fiscal', input: payload }, mockFetch, () => '')).rejects.toThrow(/Resposta vazia/);
  });
});
