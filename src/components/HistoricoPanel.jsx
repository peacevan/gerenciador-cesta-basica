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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Histórico de listas</h3>
        <button onClick={onClose}>Fechar</button>
      </div>
      {snapshots.length === 0 ? (
        <div>Nenhuma lista salva ainda.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {snapshots.map(s => (
            <li key={s.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.label} <span style={{ color: '#666', fontWeight: 400 }}>· {formatDate(s.savedAt)}</span></div>
                <div style={{ fontSize: 13, color: '#444' }}>{s.itens.length} itens · R$ {Number(s.totalGasto || 0).toFixed(2)}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{s.estabelecimento ? `${s.estabelecimento.nome || ''} ${s.estabelecimento.lat && s.estabelecimento.lng ? '📍' : ''}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { onCarregarSnapshot(s); }}>Carregar</button>
                <button onClick={() => handleDelete(s.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* delete confirmation handled via window.confirm in handleDelete */}
    </div>
  );
}
