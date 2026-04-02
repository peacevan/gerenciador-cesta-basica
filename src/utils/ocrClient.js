import Tesseract from 'tesseract.js';

// Extract text from an image File-like object using Tesseract.js
export async function extractTextFromImageFile(file, lang = 'por') {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Invalid file');
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer], { type: file.type || 'image/jpeg' });
  const res = await Tesseract.recognize(blob, lang, { logger: () => {} });
  return res?.data?.text || '';
}

const _proxySecret = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_PROXY_SECRET) || null;

// Send OCR text to proxy endpoint (nota-fiscal path) — returns parsed JSON/text from proxy
export async function sendOcrToProxy(ocrText) {
  if (!ocrText || typeof ocrText !== 'string') throw new Error('Invalid ocrText');
  const headers = { 'Content-Type': 'application/json' };
  if (_proxySecret) headers['x-proxy-secret'] = _proxySecret;
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider: 'nota-fiscal', input: { ocrText } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Proxy error ${res.status}: ${body.slice(0,200)}`);
  }
  return res.json();
}

export default { extractTextFromImageFile, sendOcrToProxy };
