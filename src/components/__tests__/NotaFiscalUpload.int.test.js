import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// Mock the OCR client helpers used by the component
jest.mock('../../utils/ocrClient', () => ({
  extractTextFromImageFile: jest.fn(),
  sendOcrToProxy: jest.fn(),
}));

import NotaFiscalUpload from '../NotaFiscalUpload';
import { extractTextFromImageFile, sendOcrToProxy } from '../../utils/ocrClient';

describe('NotaFiscalUpload integration', () => {
  let container = null;
  let root = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    jest.resetAllMocks();
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
      root = null;
    }
    container.remove();
    container = null;
  });

  test('selects file and processes OCR -> proxy, calls onResult', async () => {
    const fakeOcr = 'arroz 5 kg\nfeijão 2 kg';
    const proxyResp = { text: '[{"nome":"arroz","quantidade":5}]' };
    extractTextFromImageFile.mockResolvedValue(fakeOcr);
    sendOcrToProxy.mockResolvedValue(proxyResp);

    const onResult = jest.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(<NotaFiscalUpload isOpen={true} onClose={() => {}} onResult={onResult} />);
    });

    // Prepare a fake file-like object and set it on the input
    const input = container.querySelector('input[type="file"]');
    const fakeFile = { arrayBuffer: async () => Uint8Array.from([1,2,3]).buffer, type: 'image/jpeg', name: 'nota.jpg' };

    // Define files property (read-only) and dispatch change
    Object.defineProperty(input, 'files', { value: [fakeFile] });

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Click process button
    const btn = Array.from(container.querySelectorAll('button')).find(b => /Processar Nota/.test(b.textContent));
    expect(btn).toBeTruthy();

    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // wait for async handlers
    await act(async () => { await Promise.resolve(); });

    expect(extractTextFromImageFile).toHaveBeenCalled();
    expect(sendOcrToProxy).toHaveBeenCalledWith(fakeOcr);
    expect(onResult).toHaveBeenCalledWith(proxyResp.text);
  });
});
