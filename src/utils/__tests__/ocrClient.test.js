import { extractTextFromImageFile, sendOcrToProxy } from '../ocrClient';
import Tesseract from 'tesseract.js';

jest.mock('tesseract.js');

describe('ocrClient helpers', () => {
  beforeEach(() => jest.resetAllMocks());

  test('extractTextFromImageFile calls Tesseract.recognize and returns text', async () => {
    const fakeText = 'arroz 5 kg\nfeijão 2 kg';
    Tesseract.recognize = jest.fn().mockResolvedValue({ data: { text: fakeText } });

    // minimal file-like object with arrayBuffer
    const fakeFile = { arrayBuffer: async () => Uint8Array.from([0,1,2,3]).buffer, type: 'image/jpeg' };
    const out = await extractTextFromImageFile(fakeFile);
    expect(Tesseract.recognize).toHaveBeenCalled();
    expect(out).toBe(fakeText);
  });

  test('sendOcrToProxy posts to /api/ai-proxy and returns json', async () => {
    const fakeResp = { text: '[{"nome":"arroz","quantidade":5}]' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fakeResp });

    const res = await sendOcrToProxy('arroz 5 kg');
    expect(global.fetch).toHaveBeenCalledWith('/api/ai-proxy', expect.objectContaining({ method: 'POST' }));
    expect(res).toBe(fakeResp);
  });

  test('sendOcrToProxy throws readable error when proxy returns non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' });
    await expect(sendOcrToProxy('x')).rejects.toThrow(/Proxy error 500/);
  });
});
