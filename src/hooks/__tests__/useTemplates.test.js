import { createTemplatesAPI, TEMPLATES_HARDCODED } from '../useTemplates';

describe('useTemplates (API)', () => {
  beforeEach(() => {
    localStorage.removeItem('smartlist_templates');
    jest.restoreAllMocks();
  });

  // ── Templates hardcoded ────────────────────────────────────

  test('TEMPLATES_HARDCODED contém 3 templates pré-definidos', () => {
    expect(Array.isArray(TEMPLATES_HARDCODED)).toBe(true);
    expect(TEMPLATES_HARDCODED.length).toBe(3);
    const nomes = TEMPLATES_HARDCODED.map((t) => t.nome);
    expect(nomes).toContain('Churrasco');
    expect(nomes).toContain('Café da Manhã');
    expect(nomes).toContain('Limpeza');
  });

  test('cada template hardcoded tem id, nome, icone e itens não-vazios', () => {
    TEMPLATES_HARDCODED.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.nome).toBeTruthy();
      expect(t.icone).toBeTruthy();
      expect(Array.isArray(t.itens)).toBe(true);
      expect(t.itens.length).toBeGreaterThan(0);
      t.itens.forEach((it) => {
        expect(it.nome).toBeTruthy();
        expect(typeof it.quantidade).toBe('number');
        expect(it.unidade).toBeTruthy();
      });
    });
  });

  // ── listarUsuario ──────────────────────────────────────────

  test('listarUsuario retorna array vazio quando não há templates salvos', () => {
    const api = createTemplatesAPI();
    const lista = api.listarUsuario();
    expect(Array.isArray(lista)).toBe(true);
    expect(lista.length).toBe(0);
  });

  // ── salvarComoTemplate ─────────────────────────────────────

  test('salvarComoTemplate persiste template e retorna objeto com id', () => {
    const api = createTemplatesAPI();
    const itens = [{ nome: 'arroz', quantidade: 2, unidade: 'kg' }];
    const tpl = api.salvarComoTemplate('Minha Lista', itens);
    expect(tpl).not.toBeNull();
    expect(tpl.id).toBeTruthy();
    expect(tpl.nome).toBe('Minha Lista');
    expect(tpl.itens.length).toBe(1);
    expect(tpl.itens[0].nome).toBe('arroz');
    // verificar localStorage
    const raw = localStorage.getItem('smartlist_templates');
    const stored = JSON.parse(raw);
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe(tpl.id);
  });

  test('salvarComoTemplate retorna null para nome vazio', () => {
    const api = createTemplatesAPI();
    const itens = [{ nome: 'arroz', quantidade: 1, unidade: 'kg' }];
    expect(api.salvarComoTemplate('', itens)).toBeNull();
    expect(api.salvarComoTemplate('  ', itens)).toBeNull();
  });

  test('salvarComoTemplate retorna null para lista de itens vazia', () => {
    const api = createTemplatesAPI();
    expect(api.salvarComoTemplate('Template Vazio', [])).toBeNull();
    expect(api.salvarComoTemplate('Template Vazio', null)).toBeNull();
  });

  test('salvarComoTemplate acumula múltiplos templates', () => {
    const api = createTemplatesAPI();
    api.salvarComoTemplate('Lista A', [{ nome: 'feijão', quantidade: 1, unidade: 'kg' }]);
    api.salvarComoTemplate('Lista B', [{ nome: 'macarrão', quantidade: 2, unidade: 'un' }]);
    const lista = api.listarUsuario();
    expect(lista.length).toBe(2);
  });

  // ── excluirTemplate ────────────────────────────────────────

  test('excluirTemplate remove template pelo id', () => {
    const api = createTemplatesAPI();
    const tpl = api.salvarComoTemplate('Para excluir', [{ nome: 'salt', quantidade: 1, unidade: 'un' }]);
    api.excluirTemplate(tpl.id);
    const lista = api.listarUsuario();
    expect(lista.find((t) => t.id === tpl.id)).toBeUndefined();
  });

  test('excluirTemplate com id inexistente não lança erro', () => {
    const api = createTemplatesAPI();
    expect(() => api.excluirTemplate('id-que-nao-existe')).not.toThrow();
  });

  test('excluirTemplate não remove outros templates', () => {
    const api = createTemplatesAPI();
    const tpl1 = api.salvarComoTemplate('Lista 1', [{ nome: 'a', quantidade: 1, unidade: 'un' }]);
    const tpl2 = api.salvarComoTemplate('Lista 2', [{ nome: 'b', quantidade: 1, unidade: 'un' }]);
    api.excluirTemplate(tpl1.id);
    const lista = api.listarUsuario();
    expect(lista.length).toBe(1);
    expect(lista[0].id).toBe(tpl2.id);
  });

  // ── Resiliência ────────────────────────────────────────────

  test('falha de localStorage não propaga exceção em salvarComoTemplate', () => {
    const api = createTemplatesAPI();
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() =>
      api.salvarComoTemplate('Teste', [{ nome: 'x', quantidade: 1, unidade: 'un' }])
    ).not.toThrow();
    spy.mockRestore();
  });

  test('falha de localStorage não propaga exceção em listarUsuario', () => {
    const api = createTemplatesAPI();
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage error');
    });
    expect(() => api.listarUsuario()).not.toThrow();
    const lista = api.listarUsuario();
    // mock ainda ativo — deve retornar fallback vazio
    spy.mockRestore();
    expect(Array.isArray(lista)).toBe(true);
  });
});
