import { processarComandosPure } from '../useShoppingList';

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
