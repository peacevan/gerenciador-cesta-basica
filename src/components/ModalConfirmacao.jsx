import React from 'react';

const ModalConfirmacao = ({ isOpen, itens = [], onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h5>Confirmar Itens</h5>
          <button aria-label="Fechar" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {itens.length === 0 ? (
            <p>Nenhum item para confirmar.</p>
          ) : (
            <ul>
              {itens.map((it, idx) => (
                <li key={idx}>{it.nome} — {it.quantidade}{it.unidade || 'un'}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn-cancel">Cancelar</button>
          <button onClick={() => onConfirm(itens)} className="btn-confirm">{`Adicionar ${itens.length}`}</button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;
