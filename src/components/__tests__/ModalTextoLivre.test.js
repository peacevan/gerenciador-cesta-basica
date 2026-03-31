import React from 'react';
import { renderToString } from 'react-dom/server';
import ModalTextoLivre from '../ModalTextoLivre';

describe('ModalTextoLivre', () => {
  test('renders null when closed', () => {
    const html = renderToString(<ModalTextoLivre isOpen={false} />);
    expect(html).toBe('');
  });

  test('renders modal when open and shows placeholder', () => {
    const html = renderToString(<ModalTextoLivre isOpen={true} onClose={()=>{}} onInterpret={()=>{}} />);
    expect(html).toContain('Interpretar Texto Livre');
    expect(html).toContain('Cole aqui o texto');
  });
});
