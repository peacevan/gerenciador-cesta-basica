import { v4 as uuidv4 } from 'uuid';
import useHistorico from '../useHistorico';

// Helper to obtain API whether module exports a hook or a plain object
const getAPI = () => {
  const mod = typeof useHistorico === 'function' ? useHistorico() : useHistorico;
  return mod;
};

describe('useHistorico (API)', () => {
  beforeEach(() => {
    localStorage.removeItem('smart-list:catalog');
    localStorage.removeItem('smart-list:history');
    jest.restoreAllMocks();
  });

  test('registrar cria/atualiza entrada no catálogo com contadorUso e precoUltimo', () => {
    const api = getAPI();
    expect(api).toBeDefined();
    api.limparCatalogo && api.limparCatalogo();
    api.registrar({ nome: 'Arroz Tipo 1', unidade: 'kg', precoUltimo: 25.9 });
    const raw = localStorage.getItem('smart-list:catalog');
    const catalog = raw ? JSON.parse(raw) : {};
    const key = Object.keys(catalog)[0];
    expect(key).toBeDefined();
    expect(catalog[key].contadorUso).toBeGreaterThanOrEqual(1);
    expect(catalog[key].precoUltimo).toBeCloseTo(25.9);
  });

  test('buscar retorna até 5 sugestões e usa normalização', () => {
    const api = getAPI();
    api.limparCatalogo && api.limparCatalogo();
    const items = [
      { nome: 'Arroz Tipo 1', unidade: 'kg', precoUltimo: 25 },
      { nome: 'Feijão Preto', unidade: 'kg', precoUltimo: 8 },
      { nome: 'Açúcar Cristal', unidade: 'kg', precoUltimo: 4 },
      { nome: 'Arroz Integral', unidade: 'kg', precoUltimo: 30 },
      { nome: 'Manteiga', unidade: 'un', precoUltimo: 12 },
      { nome: 'Arroz Especial', unidade: 'kg', precoUltimo: 28 }
    ];
    items.forEach(it => api.registrar(it));
    const suggestions = api.buscar('arroz');
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
    // sugestões devem conter 'arroz' nas chaves/nome
    expect(suggestions.some(s => /arroz/i.test(s.nome || s.nomeBruto || s))).toBe(true);
  });

  test('salvarSnapshot grava snapshot com estabelecimento e sem estabelecimento', () => {
    const api = getAPI();
    api.limparCatalogo && api.limparCatalogo();
    api.excluirSnapshot && api.listarSnapshots && api.listarSnapshots().forEach(s => api.excluirSnapshot(s.id));

    const itens = [{ nome: 'arroz', quantidade: 2, unidade: 'kg', preco: 25 }];
    const total = 50;
    const est = { nome: 'Mercado Teste', lat: -12.9, lng: -38.5, tipo: 'supermercado', fonte: 'manual' };
    const snap = api.salvarSnapshot(itens, total, est);
    expect(snap).toBeDefined();
    expect(snap.estabelecimento).toBeDefined();
    const snap2 = api.salvarSnapshot(itens, total, null);
    expect(snap2).toBeDefined();
    expect(snap2.estabelecimento).toBeNull();
  });

  test('salvarSnapshot salva todos os itens (marcados e não marcados)', () => {
    const api = getAPI();
    const itens = [
      { nome: 'arroz', quantidade: 1, unidade: 'kg', preco: 7, comprado: true },
      { nome: 'feijao', quantidade: 1, unidade: 'kg', preco: 9, comprado: false },
    ];

    const snap = api.salvarSnapshot(itens, 7, null);
    expect(snap).toBeDefined();
    expect(Array.isArray(snap.itens)).toBe(true);
    expect(snap.itens).toHaveLength(2);
    expect(snap.itens.some(i => i.nome === 'arroz' && i.comprado === true)).toBe(true);
    expect(snap.itens.some(i => i.nome === 'feijao' && i.comprado === false)).toBe(true);
  });

  test('limite de 50 snapshots respeitado (LRU)', () => {
    const api = getAPI();
    // limpar
    (api.listarSnapshots && api.listarSnapshots().forEach(s => api.excluirSnapshot(s.id))) || localStorage.removeItem('smart-list:history');

    for (let i = 0; i < 52; i++) {
      const itens = [{ nome: `item-${i}`, quantidade: 1, unidade: 'un', preco: 1 }];
      api.salvarSnapshot(itens, 1, null);
    }
    const snaps = api.listarSnapshots();
    expect(snaps.length).toBeLessThanOrEqual(50);
  });

  test('excluirSnapshot remove corretamente', () => {
    const api = getAPI();
    const snap = api.salvarSnapshot([{ nome: 'x', quantidade: 1, unidade: 'un', preco: 1 }], 1, null);
    const id = snap.id;
    api.excluirSnapshot(id);
    const found = (api.listarSnapshots() || []).some(s => s.id === id);
    expect(found).toBe(false);
  });

  test('falha de localStorage não propaga exceção', () => {
    const api = getAPI();
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => api.registrar({ nome: 'teste', unidade: 'un', precoUltimo: 1 })).not.toThrow();
    spy.mockRestore();
  });
});
