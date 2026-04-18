import React from 'react';
import { renderToString } from 'react-dom/server';
import ModalConfirmacao from '../ModalConfirmacao';

describe('ModalConfirmacao', () => {
  test('renders null when closed', () => {
    const html = renderToString(<ModalConfirmacao isOpen={false} />);
    expect(html).toBe('');
  });

  test('renders items when open', () => {
    const itens = [{ nome: 'arroz', quantidade: 5, unidade: 'kg' }];
    const html = renderToString(<ModalConfirmacao isOpen={true} itens={itens} onConfirm={()=>{}} onCancel={()=>{}} />);
    expect(html).toContain('Confirmar Itens');
    expect(html).toContain('arroz');
    expect(html).toContain('Adicionar 1');
  });
});
