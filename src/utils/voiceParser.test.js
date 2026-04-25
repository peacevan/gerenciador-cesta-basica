import { parseVoiceInput, generateDescricao } from './voiceParser.js';

describe('parseVoiceInput', () => {

  // ─── EXTRAÇÃO COMPLETA (4 campos) ───

  test('fala completa com todos os campos', () => {
    expect(parseVoiceInput('dois kg açúcar 10 reais')).toMatchObject({
      produto: 'acucar',
      descricao: 'açúcar',
      quantidade: 2,
      unidade: 'kg',
      preco: 10.00,
      sucesso: true,
    });
  });

  test('fala completa ordem diferente', () => {
    expect(parseVoiceInput('feijão dois pacotes 8 reais')).toMatchObject({
      produto: 'feijao',
      quantidade: 2,
      unidade: 'pct',
      preco: 8.00,
      sucesso: true,
    });
  });

  // ─── SÓ PRODUTO + PREÇO ───

  test('produto e preço sem quantidade', () => {
    expect(parseVoiceInput('café em pó 3 reais e 50')).toMatchObject({
      produto: 'cafe em po',
      descricao: 'café em pó',
      quantidade: null,
      unidade: null,
      preco: 3.50,
      sucesso: true,
    });
  });

  test('produto e preço com símbolo $', () => {
    expect(parseVoiceInput('óleo $7')).toMatchObject({
      produto: 'oleo',
      preco: 7.00,
      sucesso: true,
    });
  });

  test('produto e preço com R$', () => {
    expect(parseVoiceInput('sardinha R$ 5,50')).toMatchObject({
      produto: 'sardinha',
      preco: 5.50,
      sucesso: true,
    });
  });

  // ─── SÓ PRODUTO + QUANTIDADE ───

  test('produto e quantidade sem preço', () => {
    expect(parseVoiceInput('3 latas de sardinha')).toMatchObject({
      produto: 'sardinha',
      quantidade: 3,
      unidade: 'lata',
      preco: null,
      sucesso: true,
    });
  });

  test('produto com quantidade em kg', () => {
    expect(parseVoiceInput('5 kg de farinha de mandioca')).toMatchObject({
      produto: 'farinha de mandioca',
      quantidade: 5,
      unidade: 'kg',
      preco: null,
      sucesso: true,
    });
  });

  // ─── SÓ PREÇO ───

  test('apenas preço sem produto', () => {
    expect(parseVoiceInput('10 reais')).toMatchObject({
      produto: null,
      quantidade: null,
      preco: 10.00,
      sucesso: true,
    });
  });

  test('preço com centavos por extenso', () => {
    expect(parseVoiceInput('cinco reais e noventa')).toMatchObject({
      preco: 5.90,
      sucesso: true,
    });
  });

  test('preço com dez reais e cinquenta', () => {
    expect(parseVoiceInput('dez reais e cinquenta')).toMatchObject({
      preco: 10.50,
      sucesso: true,
    });
  });

  // ─── SÓ QUANTIDADE ───

  test('apenas quantidade sem produto', () => {
    expect(parseVoiceInput('duas unidades')).toMatchObject({
      quantidade: 2,
      unidade: 'und',
      preco: null,
      sucesso: true,
    });
  });

  // ─── NÚMEROS POR EXTENSO ───

  test('quantidade por extenso', () => {
    expect(parseVoiceInput('três pacotes de café')).toMatchObject({
      produto: 'cafe',
      quantidade: 3,
      unidade: 'pct',
      sucesso: true,
    });
  });

  test('quantidade feminina por extenso', () => {
    expect(parseVoiceInput('duas latas de sardinha')).toMatchObject({
      produto: 'sardinha',
      quantidade: 2,
      unidade: 'lata',
      sucesso: true,
    });
  });

  // ─── PRODUTO COMPOSTO ───

  test('produto com nome composto', () => {
    expect(parseVoiceInput('leite em pó 2 caixas')).toMatchObject({
      produto: 'leite em po',
      quantidade: 2,
      unidade: 'cx',
      sucesso: true,
    });
  });

  test('produto composto com preço', () => {
    expect(parseVoiceInput('água sanitária 3 reais')).toMatchObject({
      produto: 'agua sanitaria',
      preco: 3.00,
      sucesso: true,
    });
  });

  // ─── FALLBACK — REGEX NÃO RECONHECE ───

  test('fala não reconhecida retorna sucesso false', () => {
    expect(parseVoiceInput('blah blah blah')).toMatchObject({
      sucesso: false,
    });
  });

  test('string vazia retorna sucesso false', () => {
    expect(parseVoiceInput('')).toMatchObject({
      sucesso: false,
    });
  });

});

// ─── TESTES generateDescricao ───

describe('generateDescricao', () => {

  test('restaura acento simples', () => {
    expect(generateDescricao('acucar')).toBe('Açúcar');
  });

  test('restaura acento composto', () => {
    expect(generateDescricao('cafe em po')).toBe('Café em Pó');
  });

  test('capitaliza palavra sem acento mapeado', () => {
    expect(generateDescricao('sardinha')).toBe('Sardinha');
  });

  test('capitaliza produto composto não mapeado', () => {
    expect(generateDescricao('pasta de dente')).toBe('Pasta De Dente');
  });

  test('não duplica capitalização', () => {
    expect(generateDescricao('Arroz')).toBe('Arroz');
  });

  test('produto composto mapeado', () => {
    expect(generateDescricao('oleo de soja')).toBe('Óleo de Soja');
  });

  test('carne bovina primeira', () => {
    expect(generateDescricao('carne bovina primeira')).toBe('Carne Bovina 1ª');
  });

});
