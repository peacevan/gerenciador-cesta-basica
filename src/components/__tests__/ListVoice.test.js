import React from 'react';
import { renderToString } from 'react-dom/server';

// Provide a mocked implementation for the voice hook used by ListVoice
jest.mock('../../hooks/useVoiceRecognition', () => {
  return jest.fn();
});

import useVoiceRecognition from '../../hooks/useVoiceRecognition';

// mock CSS imports to avoid Jest parsing errors for plain CSS
jest.mock('../../styles/ListVoice.css', () => ({}));

import ListVoice from '../ListVoice';

describe('ListVoice integration (footer & texto modal)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('renders footer with Interpretar texto button and mic (not listening)', () => {
    useVoiceRecognition.mockReturnValue({
      itens: [],
      total: 0,
      isListening: false,
      isProcessing: false,
      transcript: '',
      feedback: null,
      startListening: () => {},
      stopListening: () => {},
      removerItem: () => {},
      atualizarPreco: () => {},
      marcarItem: () => {},
      limparLista: () => {},
      adicionarManual: () => {},
      processarComandos: () => (''),
    });

    const html = renderToString(<ListVoice />);
    expect(html).toContain('Lista vazia');
    // article e quick-add migrados: foto/texto estão no menu ⋮ agora
  });

  test('renders mic as stopping when listening', () => {
    useVoiceRecognition.mockReturnValue({
      itens: [],
      total: 0,
      isListening: true,
      isProcessing: false,
      transcript: '',
      feedback: null,
      startListening: () => {},
      stopListening: () => {},
      removerItem: () => {},
      atualizarPreco: () => {},
      marcarItem: () => {},
      limparLista: () => {},
      adicionarManual: () => {},
      processarComandos: () => (''),
    });

    const html = renderToString(<ListVoice />);
    expect(html).toContain('Ouvindo');
  });

  test('renders provided items in the table', () => {
    useVoiceRecognition.mockReturnValue({
      itens: [{ id: '1', nome: 'feijão', quantidade: 2, unidade: 'kg', preco: 10, comprado: false }],
      total: 20,
      isListening: false,
      isProcessing: false,
      transcript: '',
      feedback: null,
      startListening: () => {},
      stopListening: () => {},
      removerItem: () => {},
      atualizarPreco: () => {},
      marcarItem: () => {},
      limparLista: () => {},
      adicionarManual: () => {},
      processarComandos: () => (''),
    });

    const html = renderToString(<ListVoice />);
    expect(html.toLowerCase()).toContain('feijão');
    expect(html).toContain('R$');
  });
});
