import { processarComandosPure, calcularTotalMarcados, calcularTotalGeral } from '../useShoppingList';

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

  test('itens com comprado=undefined (legados) não entram no total', () => {
    const itens = [
      { nome: 'arroz', quantidade: 2, preco: 10, comprado: undefined },
      { nome: 'feijao', quantidade: 1, preco: 8, comprado: true },
    ];
    expect(calcularTotalMarcados(itens)).toBeCloseTo(8);
  });

  test('processarComandosPure marca e desmarca itens e total reflete mudanças', () => {
    const prev = [
      { id: '1', nome: 'arroz', quantidade: 2, preco: 10, comprado: false },
      { id: '2', nome: 'feijao', quantidade: 1, preco: 8, comprado: false },
    ];
    const { itens: afterMark } = processarComandosPure(prev, [{ acao: 'marcar', nome: 'arroz' }]);
    expect(afterMark.find(i => i.nome === 'arroz').comprado).toBe(true);
    const totalAfterMark = calcularTotalMarcados(afterMark);
    expect(totalAfterMark).toBeCloseTo(20);

    const { itens: afterUnmark } = processarComandosPure(afterMark, [{ acao: 'desmarcar', nome: 'arroz' }]);
    expect(afterUnmark.find(i => i.nome === 'arroz').comprado).toBe(false);
    const totalAfterUnmark = calcularTotalMarcados(afterUnmark);
    expect(totalAfterUnmark).toBeCloseTo(0);
  });
});

describe('calcularTotalGeral', () => {
  test('soma todos os itens independente de comprado', () => {
    const itens = [
      { nome: 'arroz', quantidade: 2, preco: 10, comprado: true },
      { nome: 'feijao', quantidade: 1, preco: 8, comprado: false },
    ];
    expect(calcularTotalGeral(itens)).toBeCloseTo(28);
  });

  test('itens sem preco contam como 0', () => {
    const itens = [
      { nome: 'arroz', quantidade: 2, preco: '', comprado: false },
      { nome: 'leite', quantidade: 1, preco: 5, comprado: false },
    ];
    expect(calcularTotalGeral(itens)).toBeCloseTo(5);
  });

  test('lista vazia retorna 0', () => {
    expect(calcularTotalGeral([])).toBe(0);
  });
});
