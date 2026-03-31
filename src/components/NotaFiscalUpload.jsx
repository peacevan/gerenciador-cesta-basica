import React, { useState } from 'react';
import { extractTextFromImageFile, sendOcrToProxy } from '../utils/ocrClient';

const NotaFiscalUpload = ({ isOpen, onClose, onResult }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  if (!isOpen) return null;

  const handleFile = (f) => {
    setFile(f);
    try { setPreview(URL.createObjectURL(f)); } catch (_) { setPreview(null); }
  };

  const handleProcess = async () => {
    if (!file) return alert('Escolha uma imagem');
    setLoading(true);
    try {
      const ocrText = await extractTextFromImageFile(file);
      // send to proxy which prefers ocrText
      const res = await sendOcrToProxy(ocrText);
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
          {preview && <div style={{ marginTop: 8 }}><img src={preview} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} /></div>}
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
