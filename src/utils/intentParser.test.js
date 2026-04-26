import { parseIntent } from './intentParser.js';

describe('parseIntent', () => {
  const carrinhoVazio = [];
  const carrinhoComFeijao = [{ id: '1', nome: 'feijao', quantidade: 1, unidade: 'kg' }];
  const carrinhoComArroz = [{ id: '2', nome: 'arroz', quantidade: 1, unidade: 'kg' }];

  test('1. adicionar produto simples com quantidade e unidade', () => {
    const r = parseIntent('feijão 2 kg', carrinhoVazio);
    expect(r.intent).toBe('adicionar');
    expect(r.produto).toBe('feijao');
    expect(r.quantidade).toBe(2);
    expect(r.unidade).toBe('kg');
  });

  test('2. remover produto por palavra-chave', () => {
    const r = parseIntent('remover arroz', carrinhoVazio);
    expect(r.intent).toBe('remover');
    expect(r.produto).toBe('arroz');
  });

  test('3. editar preço quando produto está no carrinho e tem "reais"', () => {
    const r = parseIntent('arroz 5 reais', carrinhoComArroz);
    expect(r.intent).toBe('editar_preco');
    expect(r.preco).toBe(5);
  });

  test('4. editar quantidade quando produto está no carrinho com unidade de peso', () => {
    const r = parseIntent('2 kg arroz', carrinhoComArroz);
    expect(r.intent).toBe('editar_quantidade');
    expect(r.quantidade).toBe(2);
    expect(r.unidade).toBe('kg');
  });

  test('5. número sem unidade quando produto está no carrinho → editar preço', () => {
    const r = parseIntent('feijão 8', carrinhoComFeijao);
    expect(r.intent).toBe('editar_preco');
    expect(r.preco).toBe(8);
  });

  test('6. editar quantidade com palavra-chave explícita', () => {
    const r = parseIntent('mudar quantidade arroz 3', carrinhoVazio);
    expect(r.intent).toBe('editar_quantidade');
    expect(r.quantidade).toBe(3);
  });

  test('7. adicionar produto com quantidade, unidade e preço completo', () => {
    const r = parseIntent('1 kg de feijão 8 reais', carrinhoVazio);
    expect(r.intent).toBe('adicionar');
    expect(r.quantidade).toBe(1);
    expect(r.unidade).toBe('kg');
    expect(r.preco).toBe(8);
  });
});
