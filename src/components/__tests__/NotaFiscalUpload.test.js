import React from 'react';
import { renderToString } from 'react-dom/server';
import NotaFiscalUpload from '../NotaFiscalUpload';

describe('NotaFiscalUpload', () => {
  test('renders null when closed', () => {
    const html = renderToString(<NotaFiscalUpload isOpen={false} />);
    expect(html).toBe('');
  });

  test('renders modal when open', () => {
    const html = renderToString(<NotaFiscalUpload isOpen={true} onClose={() => {}} onResult={() => {}} />);
    expect(html).toContain('Importar Nota Fiscal');
    expect(html).toContain('Processar Nota');
  });
});
