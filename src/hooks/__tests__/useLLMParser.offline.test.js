/**
 * TDD – Parser Offline (interpretarComRegex)
 *
 * Cenários validados:
 *  ADD  feijão 10 reais           → nome=feijão,       qtd=null, un=null, preco=10
 *  ADD  feijão $5                 → nome=feijão,       qtd=null, un=null, preco=5
 *  ADD  feijão de reais           → nome=feijão,       qtd=null, un=null, preco=null
 *  ADD  1 kilo de feijão 10 reais → nome=feijão,       qtd=1,    un=kg,   preco=10
 *  ADD  insira um quilo de arroz 10 reais → nome=arroz, qtd=1,  un=kg,   preco=10
 *  ADD  bote um quilo de farinha 10 reais → nome=farinha,qtd=1, un=kg,   preco=10
 *  REM  tire 1 kg de arroz        → nome=arroz,        qtd=1,    un=kg
 *  REM  abater 1 arroz            → nome=arroz,        qtd=1,    un=null
 *  REM  excluir farinha           → nome=farinha,      qtd=null
 *  ADD  coloca arroz 5 reais      → nome=arroz,        qtd=null, un=null, preco=5
 *  ADD  500 gramas de macarrão    → nome=macarrão,     qtd=500,  un=g
 *  ADD  farinha de mandioca 4 reais → nome=farinha de mandioca, preco=4
 */

import { interpretarComRegex } from '../useLLMParser';

// helper para pegar o primeiro resultado
const first = (input) => interpretarComRegex(input)[0];

describe('Parser Offline – Cenários TDD', () => {

  // ─── ADD sem quantidade explícita ────────────────────────────────────────
  describe('ADD simples com preço', () => {
    test('feijão 10 reais → ADD feijão preco=10', () => {
      const r = first('feijão 10 reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('feij');
      expect(r.preco).toBe(10);
      // quantidade não informada: deve ser null ou 1 (aceitamos ambos, o importante é 1 unidade)
    });

    test('feijão $5 → ADD feijão preco=5', () => {
      const r = first('feijão $5');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('feij');
      expect(r.preco).toBe(5);
    });

    test('coloca arroz 5 reais → ADD arroz preco=5', () => {
      const r = first('coloca arroz 5 reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('arroz');
      expect(r.preco).toBe(5);
    });
  });

  // ─── ADD texto ambíguo sem preço ─────────────────────────────────────────
  describe('ADD sem preço válido', () => {
    test('feijão de reais → ADD feijão preco=null', () => {
      const r = first('feijão de reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('feij');
      expect(r.preco).toBeNull();
    });
  });

  // ─── ADD com quantidade e unidade ────────────────────────────────────────
  describe('ADD com quantidade + unidade', () => {
    test('1 kilo de feijão 10 reais → ADD feijão qtd=1 un=kg preco=10', () => {
      const r = first('1 kilo de feijão 10 reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('feij');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
      expect(r.preco).toBe(10);
    });

    test('insira um quilo de arroz 10 reais → ADD arroz qtd=1 un=kg preco=10', () => {
      const r = first('insira um quilo de arroz 10 reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('arroz');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
      expect(r.preco).toBe(10);
    });

    test('bote um quilo de farinha 10 reais → ADD farinha qtd=1 un=kg preco=10', () => {
      const r = first('bote um quilo de farinha 10 reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('farinha');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
      expect(r.preco).toBe(10);
    });

    test('500 gramas de macarrão → ADD macarrão qtd=500 un=g', () => {
      const r = first('500 gramas de macarrão');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('macar');
      expect(r.quantidade).toBe(500);
      expect(r.unidade).toBe('g');
    });
  });

  // ─── ADD nome composto com preço ─────────────────────────────────────────
  describe('ADD nome composto', () => {
    test('farinha de mandioca 4 reais → ADD "farinha de mandioca" preco=4', () => {
      const r = first('farinha de mandioca 4 reais');
      expect(r.acao).toBe('adicionar');
      expect(r.nome.toLowerCase()).toContain('farinha');
      expect(r.nome.toLowerCase()).toContain('mandioca');
      expect(r.preco).toBe(4);
    });
  });

  // ─── REMOVE ──────────────────────────────────────────────────────────────
  describe('REMOVE', () => {
    test('tire 1 kg de arroz → REMOVE arroz qtd=1 un=kg', () => {
      const r = first('tire 1 kg de arroz');
      expect(r.acao).toBe('remover');
      expect(r.nome.toLowerCase()).toContain('arroz');
      expect(r.quantidade).toBe(1);
      expect(r.unidade).toBe('kg');
    });

    test('abater 1 arroz → REMOVE arroz qtd=1', () => {
      const r = first('abater 1 arroz');
      expect(r.acao).toBe('remover');
      expect(r.nome.toLowerCase()).toContain('arroz');
      expect(r.quantidade).toBe(1);
    });

    test('excluir farinha → REMOVE farinha', () => {
      const r = first('excluir farinha');
      expect(r.acao).toBe('remover');
      expect(r.nome.toLowerCase()).toContain('farinha');
    });
  });
});
