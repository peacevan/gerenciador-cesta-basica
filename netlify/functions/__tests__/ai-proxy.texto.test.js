describe('ai-proxy texto-livre provider', () => {
  const { handleProxy } = require('../ai-proxy-lib');

  test('returns text when provider texto-livre succeeds', async () => {
    const content = '[{"nome":"arroz","quantidade":2}]';
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });
    const res = await handleProxy({ provider: 'texto-livre', input: 'Lista: arroz 2kg' }, mockFetch, () => '');
    expect(res).toHaveProperty('text');
    expect(res.text).toContain('arroz');
  });

  test('invalid provider throws', async () => {
    await expect(handleProxy({ provider: 'unknown', input: 'x' }, () => {}, () => '')).rejects.toThrow(/Provider inválido/);
  });

  test('empty provider response yields error', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '' } }] }) });
    await expect(handleProxy({ provider: 'texto-livre', input: 'qualquer' }, mockFetch, () => '')).rejects.toThrow(/Resposta vazia/);
  });
});
