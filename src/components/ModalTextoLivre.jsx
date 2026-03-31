import React, { useState } from 'react';

const ModalTextoLivre = ({ isOpen, onClose, onInterpret }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInterpret = async () => {
    setLoading(true);
    try {
      await onInterpret(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h5>Interpretar Texto Livre</h5>
          <button aria-label="Fechar" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <textarea
            aria-label="texto-livre"
            placeholder="Cole aqui o texto (WhatsApp, nota, etc.)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
          />
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancelar</button>
          <button onClick={handleInterpret} className="btn-interpret" disabled={loading}>
            {loading ? 'Interpretando...' : 'Interpretar com IA'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTextoLivre;
