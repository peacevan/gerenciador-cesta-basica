import { processarComandosPure, calcularTotalMarcados } from '../useShoppingList';

describe('processarComandosPure', () => {
  test('atualizar preço de produto inexistente retorna mensagem de não encontrado e não cria item', () => {
    const prev = [];
    const comandos = [{ acao: 'atualizar_preco', nome: 'produto inexistente', preco: 9.9 }];
    const { itens, mensagem } = processarComandosPure(prev, comandos);
    expect(mensagem).toMatch(/não encontrado/i);
    expect(itens.length).toBe(0);
  });

  test('atualizar preço de produto existente atualiza o preço e retorna mensagem de sucesso', () => {
    const prev = [{ id: '1', nome: 'arroz', quantidade: 1, unidade: 'un', preco: 2.5, comprado: false }];
    const comandos = [{ acao: 'atualizar_preco', nome: 'arroz', preco: 5.5 }];
    const { itens, mensagem } = processarComandosPure(prev, comandos);
    expect(mensagem).toMatch(/preço .* → R\$/i);
    expect(itens.length).toBe(1);
    expect(parseFloat(itens[0].preco)).toBeCloseTo(5.5);
  });
});

describe('calcularTotalMarcados', () => {
  test('soma apenas itens com comprado=true', () => {
    const itens = [
      { nome: 'arroz', quantidade: 2, preco: 10, comprado: true },
      { nome: 'feijao', quantidade: 1, preco: 8, comprado: false },
      { nome: 'leite', quantidade: 3, preco: 4.5, comprado: true },
    ];

    const total = calcularTotalMarcados(itens);
    expect(total).toBeCloseTo(33.5);
  });

  test('retorna 0 quando nenhum item está marcado', () => {
    const itens = [
      { nome: 'arroz', quantidade: 2, preco: 10, comprado: false },
      { nome: 'feijao', quantidade: 1, preco: 8, comprado: false },
    ];

    const total = calcularTotalMarcados(itens);
    expect(total).toBe(0);
  });
});
