import React, { useEffect, useState } from 'react';
import useHistorico from '../hooks/useHistorico.js';

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch { return iso; }
};

export default function HistoricoPanel({ isOpen, onClose, onCarregarSnapshot }) {
  const { listarSnapshots, excluirSnapshot } = useHistorico();
  const [snapshots, setSnapshots] = useState([]);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { if (isOpen) setSnapshots(listarSnapshots()); }, [isOpen, listarSnapshots]);

  if (!isOpen) return null;

  const handleDelete = (id) => {
    if (window.confirm('Excluir esta lista?')) {
      excluirSnapshot(id);
      setSnapshots(listarSnapshots());
    }
  };

  return (
    <div className="panel-historico">
      <div className="panel-historico__header">
        <h3>
          <i className="material-icons" aria-hidden="true">history</i>
          Histórico de listas
        </h3>
        <button className="btn-close-modal" onClick={onClose} aria-label="Fechar histórico">
          <i className="material-icons">close</i>
        </button>
      </div>

      {snapshots.length === 0 ? (
        <div className="panel-historico__empty">Nenhuma lista salva ainda.</div>
      ) : (
        <ul>
          {snapshots.map(s => (
            <li key={s.id}>
              <div>
                <span className="snap-label">{s.label}</span>
                <span className="snap-meta">· {formatDate(s.savedAt)}</span>
                <div className="snap-meta">
                  {s.itens.length} {s.itens.length === 1 ? 'item' : 'itens'}
                  {' · '}
                  R$ {Number(s.totalGasto || 0).toFixed(2)}
                </div>
                {s.estabelecimento && (
                  <div className="snap-meta snap-estabelecimento">
                    {s.estabelecimento.lat && s.estabelecimento.lng ? '📍 ' : ''}
                    {s.estabelecimento.nome || ''}
                  </div>
                )}
              </div>
              <div className="panel-historico__actions">
                <button className="btn-load" onClick={() => onCarregarSnapshot(s)} aria-label={`Carregar ${s.label}`}>
                  <i className="material-icons">upload</i>
                </button>
                <button className="btn-delete" onClick={() => handleDelete(s.id)} aria-label={`Excluir ${s.label}`}>
                  <i className="material-icons">delete</i>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
