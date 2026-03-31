import Tesseract from 'tesseract.js';

// Extract text from an image File-like object using Tesseract.js
export async function extractTextFromImageFile(file, lang = 'por') {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Invalid file');
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer], { type: file.type || 'image/jpeg' });
  const res = await Tesseract.recognize(blob, lang, { logger: () => {} });
  return res?.data?.text || '';
}

// Send OCR text to proxy endpoint (nota-fiscal path) — returns parsed JSON/text from proxy
export async function sendOcrToProxy(ocrText) {
  if (!ocrText || typeof ocrText !== 'string') throw new Error('Invalid ocrText');
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'nota-fiscal', input: { ocrText } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Proxy error ${res.status}: ${body.slice(0,200)}`);
  }
  return res.json();
}

export default { extractTextFromImageFile, sendOcrToProxy };
