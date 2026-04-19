const { handleProxy } = require('../ai-proxy-lib');

describe('ai-proxy nota-fiscal provider', () => {
  test('returns text when provider nota-fiscal succeeds', async () => {
    // prefer OCR text path (client provides ocrText extracted by Tesseract)
    const payload = { ocrText: 'arroz 5 kg\nfeijão 2 kg' };
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '[{"nome":"arroz","quantidade":5}]' } }] }) });
    const res = await handleProxy({ provider: 'nota-fiscal', input: payload }, mockFetch, () => '');
    expect(res).toHaveProperty('text');
    expect(res.text).toContain('arroz');
  });

  test('invalid input throws', async () => {
    await expect(handleProxy({ provider: 'nota-fiscal', input: 'not-an-object' }, () => {}, () => '')).rejects.toThrow(/Input inválido/);
  });

  test('empty provider response yields error', async () => {
    const payload = { ocrText: '   ' };
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '' } }] }) });
    await expect(handleProxy({ provider: 'nota-fiscal', input: payload }, mockFetch, () => '')).rejects.toThrow(/Resposta vazia/);
  });
});
