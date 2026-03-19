import { interpretar } from '../useLLMParser';

describe('useLLMParser — OpenRouter provider (mock)', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.REACT_APP_OPENROUTER_API_KEY = 'test-key';
  });

  afterAll(() => {
    process.env.REACT_APP_OPENROUTER_API_KEY = '';
    global.fetch = originalFetch;
  });

  test('interpreta resposta válida do OpenRouter', async () => {
    const mockContent = '[{"acao":"remover","nome":"arroz","quantidade":1,"unidade":"un","preco":null}]';
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: mockContent } }] }),
    }));

    const res = await interpretar('remova arroz');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].acao).toBe('remover');
    expect(res[0].nome).toBe('arroz');
  });

  test('quando OpenRouter retorna vazio, cai para regex', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }) }));
    const res = await interpretar('adicionar banana');
    expect(Array.isArray(res)).toBe(true);
    // regex fallback should return at least one item (action adicionar)
    expect(res[0].acao).toBeDefined();
  });
});
