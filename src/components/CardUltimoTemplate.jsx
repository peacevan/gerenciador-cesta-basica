import React, { useState, useEffect, useCallback } from 'react';

const ULTIMO_TEMPLATE_KEY = 'smart-list:ultimo-template';

const readUltimoTemplate = () => {
  try {
    const raw = localStorage.getItem(ULTIMO_TEMPLATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const calcularDiasAtras = (isoDate) => {
  if (!isoDate) return null;
  const diff = Date.now() - new Date(isoDate).getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
};

/**
 * CardUltimoTemplate
 *
 * Props:
 *   onUsarDeNovo   {(templateId) => void}  — aplica o template direto
 *   onVerItens     {(templateId) => void}  — abre ModalTemplates naquele template
 */
const CardUltimoTemplate = ({ onUsarDeNovo, onVerItens }) => {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    setDados(readUltimoTemplate());
  }, []);

  if (!dados) return null;

  const diasAtras = calcularDiasAtras(dados.usadoEm);

  return (
    <div className="card-ultimo-template">
      <div className="card-ultimo-template__header">
        <span className="card-ultimo-template__icon-repeat">🔁</span>
        <span className="card-ultimo-template__titulo">Repetir última compra</span>
      </div>

      <div className="card-ultimo-template__info">
        <span className="card-ultimo-template__template-icon">{dados.templateIcone || '🛒'}</span>
        <span className="card-ultimo-template__template-nome">{dados.templateNome}</span>
        {diasAtras && (
          <span className="card-ultimo-template__quando">· {diasAtras}</span>
        )}
      </div>

      <div className="card-ultimo-template__acoes">
        <button
          className="card-ultimo-template__btn card-ultimo-template__btn--primary"
          onClick={() => onUsarDeNovo(dados)}
          id="btn-usar-de-novo"
        >
          ✓ Usar de novo
        </button>
        <button
          className="card-ultimo-template__btn card-ultimo-template__btn--secondary"
          onClick={() => onVerItens(dados)}
          id="btn-ver-itens-ultimo"
        >
          Ver itens
        </button>
      </div>
    </div>
  );
};

export default CardUltimoTemplate;
