/**
 * US-009 — IA com maior liberdade para frases naturais
 * Testa o fallback regex (interpretarComRegex) com os 5 exemplos do critério de aceite.
 */
import { interpretarComRegex } from '../useLLMParser';

describe('US-009 — frases naturais (modo regex)', () => {
  test('"2 arroz 10 reais" → adicionar arroz qty=2 preco=10', () => {
    const [r] = interpretarComRegex('2 arroz 10 reais', false);
    expect(r.acao).toBe('adicionar');
    expect(r.nome).toContain('arroz');
    expect(r.quantidade).toBe(2);
    expect(r.preco).toBeCloseTo(10);
  });

  test('"arroz 10 reais" → adicionar arroz preco=10', () => {
    const [r] = interpretarComRegex('arroz 10 reais', false);
    expect(r.acao).toBe('adicionar');
    expect(r.nome).toContain('arroz');
    expect(r.preco).toBeCloseTo(10);
  });

  test('"3 leite" → adicionar leite qty=3', () => {
    const [r] = interpretarComRegex('3 leite', false);
    expect(r.acao).toBe('adicionar');
    expect(r.nome).toContain('leite');
    expect(r.quantidade).toBe(3);
  });

  test('"feijão" → adicionar feijão (sem qty, sem preco)', () => {
    const [r] = interpretarComRegex('feijão', false);
    expect(r.acao).toBe('adicionar');
    expect(r.nome.toLowerCase()).toContain('feij');
  });

  test('"dois quilos de arroz por dez reais" → adicionar arroz qty=2 unidade=kg preco=10', () => {
    const [r] = interpretarComRegex('dois quilos de arroz por dez reais', false);
    expect(r.acao).toBe('adicionar');
    expect(r.nome).toContain('arroz');
    expect(r.quantidade).toBe(2);
    expect(r.unidade).toBe('kg');
    expect(r.preco).toBeCloseTo(10);
  });
});
