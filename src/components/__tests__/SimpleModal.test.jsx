import React from 'react';
import { renderToString } from 'react-dom/server';
import SimpleModal from '../SimpleModal';

describe('SimpleModal', () => {
  test('renders nothing when closed', () => {
    const html = renderToString(<SimpleModal isOpen={false}>Conteúdo</SimpleModal>);
    expect(html).toBe('');
  });

  test('renders dialog and footer when open', () => {
    const html = renderToString(
      <SimpleModal isOpen={true} footer={<button type="button">Fechar</button>}>
        Conteúdo nativo
      </SimpleModal>
    );

    expect(html).toContain('Conteúdo nativo');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Fechar');
  });
});
