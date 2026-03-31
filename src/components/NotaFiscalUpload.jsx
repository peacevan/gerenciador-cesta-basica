import React, { useState } from 'react';
import { extractTextFromImageFile, sendOcrToProxy } from '../utils/ocrClient';

const NotaFiscalUpload = ({ isOpen, onClose, onResult }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFile = (f) => {
    setError('');
    if (!f) return;
    if (f.size && f.size > MAX_SIZE) {
      setFile(null);
      setPreview(null);
      setError('Arquivo muito grande. Limite 5 MB.');
      return;
    }
    setFile(f);
    try { setPreview(URL.createObjectURL(f)); } catch (_) { setPreview(null); }
  };

  const handleProcess = async () => {
    if (!file) return alert('Escolha uma imagem');
    setLoading(true);
    setProgress(10);
    try {
      // If extractTextFromImageFile provides progress callbacks in future,
      // we can hook them. For now, show an indeterminate-like progression.
      const ocrText = await extractTextFromImageFile(file);
      setProgress(70);
      // send to proxy which prefers ocrText
      const res = await sendOcrToProxy(ocrText);
      setProgress(100);
      // res.text is expected (string) — pass to caller
      if (onResult) onResult(res.text);
    } catch (err) {
      console.error('OCR/process error', err);
      alert('Erro ao processar imagem');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h5>Importar Nota Fiscal (imagem)</h5>
          <button aria-label="Fechar" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <input type="file" accept="image/*" onChange={e => handleFile(e.target.files && e.target.files[0])} />
          {error && <p className="upload-error" style={{ color: 'crimson' }}>{error}</p>}

          {preview ? (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: '0 0 160px' }}>
                <img src={preview} alt="preview" style={{ width: '160px', height: 'auto', borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{file && file.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{file && (file.size ? `${(file.size/1024).toFixed(1)} KB` : '')}</div>
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => { setPreview(null); setFile(null); }} className="btn-cancel">Remover</button>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 8, color: '#444' }}>Selecione uma imagem da nota fiscal (máx 5 MB).</p>
          )}

          {loading && (
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 8, background: '#eee', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', transition: 'width 300ms ease' }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancelar</button>
          <button onClick={handleProcess} className="btn-interpret" disabled={loading}>{loading ? 'Processando...' : 'Processar Nota'}</button>
        </div>
      </div>
    </div>
  );
};

export default NotaFiscalUpload;
