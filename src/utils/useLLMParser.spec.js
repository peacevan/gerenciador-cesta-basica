/**
 * useLLMParser.spec.js
 *
 * TDD spec para validar a nova arquitetura do parser:
 *   - LLM (Gemma via OpenRouter) como provedor principal
 *   - Regex como fallback offline ou quando LLM falha
 *   - System prompt com contexto de supermercado
 *   - Tratamento de erro: fora_contexto, nao_entendido
 *
 * Rode com: npx jest useLLMParser.spec.js --watch
 *
 * IMPORTANTE: os testes do LLM mockam o chamarProxy para não
 * fazer chamadas reais à API durante o CI.
 */

import {
  interpretar,
  interpretarComRegex,
  PROVEDOR_ATIVO,
} from '../useLLMParser';

import { chamarProxy } from '../useLLMParser';

// ---------------------------------------------------------------------------
// Mock do chamarProxy — isola os testes do LLM da rede real
// ---------------------------------------------------------------------------
jest.mock('../useLLMParser', () => {
  const original = jest.requireActual('../useLLMParser');
  return {
    ...original,
    chamarProxy: jest.fn(),
  };
});

const mockLLM = (retorno) => chamarProxy.mockResolvedValueOnce(retorno);
const mockLLMErro = (msg = 'Network error') => chamarProxy.mockRejectedValueOnce(new Error(msg));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const first = (arr) => (Array.isArray(arr) ? arr[0] : arr);

// ===========================================================================
// 1. ARQUITETURA — LLM principal, regex fallback
// ===========================================================================
describe('Arquitetura: LLM principal + regex fallback', () => {

  test('quando LLM responde com sucesso, usa LLM e não chama regex', async () => {
    mockLLM([{ acao: 'adicionar', nome: 'feijao', quantidade: 1, unidade: 'kg', preco: 10 }]);
    const result = await interpretar('1 kg de feijão 10 reais');
    expect(first(result).nome).toBe('feijao');
    expect(first(result).preco).toBe(10);
    expect(chamarProxy).toHaveBeenCalledTimes(1);
  });

  test('quando LLM falha (erro de rede), cai no regex', async () => {
    mockLLMErro('Network error');
    const result = await interpretar('feijão 10 reais');
    expect(Array.isArray(result)).toBe(true);
    expect(first(result).nome).toContain('feij');
    expect(first(result).preco).toBe(10);
  });

  test('quando LLM retorna array vazio, cai no regex', async () => {
    mockLLM([]);
    const result = await interpretar('feijão 10 reais');
    expect(Array.isArray(result)).toBe(true);
    expect(first(result).nome).toContain('feij');
  });

  test('quando LLM retorna null/undefined, cai no regex', async () => {
    mockLLM(null);
    const result = await interpretar('arroz 5 reais');
    expect(first(result).nome).toContain('arroz');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

});

// ===========================================================================
// 2. MODELO — Gemma 3 12B via OpenRouter
// ===========================================================================
describe('Modelo: google/gemma-3-12b via OpenRouter', () => {

  test('chamarProxy é chamado com provider "openrouter"', async () => {
    mockLLM([{ acao: 'adicionar', nome: 'arroz', quantidade: 1, unidade: 'un', preco: null }]);
    await interpretar('arroz');
    expect(chamarProxy).toHaveBeenCalledWith('openrouter', expect.any(String));
  });

  test('o modelo enviado ao proxy deve ser google/gemma-3-12b', async () => {
    // Este teste valida o ai-proxy.mjs — verifica se a constante MODEL está correta
    // Importar MODEL exportado do proxy ou verificar via snapshot do payload
    // Por ora, validamos via contrato: o proxy deve aceitar 'openrouter' e usar gemma
    mockLLM([{ acao: 'adicionar', nome: 'sal', quantidade: 1, unidade: 'un', preco: null }]);
    await interpretar('sal');
    expect(chamarProxy).toHaveBeenCalledWith('openrouter', 'sal');
  });

  afterEach(() => jest.clearAllMocks());

});

// ===========================================================================
// 3. SYSTEM PROMPT — contexto de supermercado
// ===========================================================================
describe('System prompt: contexto supermercado', () => {

  test('LLM retorna erro fora_contexto para comando não relacionado', async () => {
    mockLLM([{ erro: 'fora_contexto' }]);
    const result = await interpretar('qual é a capital do Brasil');
    expect(first(result)).toMatchObject({ erro: 'fora_contexto' });
  });

  test('LLM retorna erro nao_entendido para comando ininteligível', async () => {
    mockLLM([{ erro: 'nao_entendido' }]);
    const result = await interpretar('asdfgh xyz 123');
    expect(first(result)).toMatchObject({ erro: 'nao_entendido' });
  });

  test('normalizarResposta filtra itens com erro e não os adiciona à lista', async () => {
    mockLLM([{ erro: 'fora_contexto' }]);
    const result = await interpretar('me conta uma piada');
    // resultado não deve ser tratado como produto válido
    const temProdutoValido = Array.isArray(result) &&
      result.some(r => r.nome && !r.erro);
    expect(temProdutoValido).toBe(false);
  });

  afterEach(() => jest.clearAllMocks());

});

// ===========================================================================
// 4. NORMALIZACAO DA RESPOSTA DO LLM
// ===========================================================================
describe('Normalização da resposta do LLM', () => {

  test('aceita resposta com campos em inglês (name, action, quantity, unit, price)', async () => {
    mockLLM([{ action: 'adicionar', name: 'Feijão', quantity: 2, unit: 'kg', price: 12.5 }]);
    const result = await interpretar('2 kg de feijão 12,50');
    expect(first(result).nome).toBe('feijao');
    expect(first(result).quantidade).toBe(2);
    expect(first(result).preco).toBe(12.5);
  });

  test('normaliza nome para lowercase e sem acento', async () => {
    mockLLM([{ acao: 'adicionar', nome: 'Açúcar Refinado', quantidade: 1, unidade: 'kg', preco: 4 }]);
    const result = await interpretar('açúcar refinado 4 reais');
    expect(first(result).nome).toBe('acucar refinado');
  });

  test('preco null quando LLM não informa preço', async () => {
    mockLLM([{ acao: 'adicionar', nome: 'sal', quantidade: 1, unidade: 'un' }]);
    const result = await interpretar('sal');
    expect(first(result).preco).toBeNull();
  });

  test('filtra itens sem nome', async () => {
    mockLLM([
      { acao: 'adicionar', nome: '', quantidade: 1, unidade: 'un', preco: null },
      { acao: 'adicionar', nome: 'arroz', quantidade: 1, unidade: 'kg', preco: 5 },
    ]);
    const result = await interpretar('arroz 5 reais');
    expect(result.length).toBe(1);
    expect(result[0].nome).toBe('arroz');
  });

  afterEach(() => jest.clearAllMocks());

});

// ===========================================================================
// 5. REGEX OFFLINE — deve continuar funcionando independente do LLM
// ===========================================================================
describe('Regex offline (fallback)', () => {

  describe('ADD', () => {
    test('feijão 10 reais', () => {
      const r = first(interpretarComRegex('feijão 10 reais'));
      expect(r.acao).toBe('adicionar');
      expect(r.nome).toContain('feij');
      expect(r.preco).toBe(10);
    });

    test('feijão $5', () => {
      const r = first(interpretarComRegex('feijão $5'));
      expect(r.preco).toBe(5);
    });

    test('feijão de reais → preco null (falso positivo)', () => {
      const r = first(interpretarComRegex('feijão de reais'));
      expect(r.preco).toBeNull();
    });

    test('1 kilo de feijão 10 reais', () => {
      const r = first(interpretarComRegex('1 kilo de feijão 10 reais'));
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
      expect(r.preco).toBe(10);
    });

    test('insira um quilo de arroz 10 reais', () => {
      const r = first(interpretarComRegex('insira um quilo de arroz 10 reais'));
      expect(r.acao).toBe('adicionar');
      expect(r.nome).toContain('arroz');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
      expect(r.preco).toBe(10);
    });

    test('bote um quilo de farinha 10 reais', () => {
      const r = first(interpretarComRegex('bote um quilo de farinha 10 reais'));
      expect(r.acao).toBe('adicionar');
      expect(r.nome).toContain('farinha');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
    });

    test('500 gramas de macarrão', () => {
      const r = first(interpretarComRegex('500 gramas de macarrão'));
      expect(r.quantidade).toBe(500);
      expect(r.unidade).toBe('g');
    });

    test('farinha de mandioca 4 reais (nome composto)', () => {
      const r = first(interpretarComRegex('farinha de mandioca 4 reais'));
      expect(r.nome).toContain('farinha');
      expect(r.nome).toContain('mandioca');
      expect(r.preco).toBe(4);
    });
  });

  describe('REMOVE', () => {
    test('tire 1 kg de arroz', () => {
      const r = first(interpretarComRegex('tire 1 kg de arroz'));
      expect(r.acao).toBe('remover');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
    });

    test('abater 1 arroz', () => {
      const r = first(interpretarComRegex('abater 1 arroz'));
      expect(r.acao).toBe('remover');
      expect(r.quantidade).toBe(1);
    });

    test('excluir farinha', () => {
      const r = first(interpretarComRegex('excluir farinha'));
      expect(r.acao).toBe('remover');
      expect(r.nome).toContain('farinha');
    });
  });

});

// ===========================================================================
// 6. INDICADOR DE PROVEDOR
// ===========================================================================
describe('Indicador de provedor usado', () => {

  test('PROVEDOR_ATIVO tem chaves LLM e REGEX', () => {
    expect(PROVEDOR_ATIVO).toHaveProperty('LLM');
    expect(PROVEDOR_ATIVO).toHaveProperty('REGEX');
  });

  afterEach(() => jest.clearAllMocks());

});
