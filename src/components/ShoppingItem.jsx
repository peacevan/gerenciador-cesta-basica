import React from 'react';

const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ShoppingItem = ({ item, onToggle, onRemove }) => {
  const total = (item.quantidade || 0) * (item.precoUn || 0);

  return (
    <div className={`shopping-item-card ${item.marcado === false ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="item-checkbox"
        checked={item.marcado !== false}
        onChange={() => onToggle(item.id)}
        aria-label={`Marcar ${item.nome}`}
      />

      <span className={`item-name ${item.marcado === false ? 'strikethrough' : ''}`}>
        {item.nome}
      </span>

      <span className="item-detail">
        {item.quantidade} {item.unidade}
      </span>

      <span className="item-detail">
        {formatCurrency(item.precoUn)}
      </span>

      <span className="item-total">
        {formatCurrency(total)}
      </span>

      <button
        className="btn-delete-item"
        onClick={() => onRemove(item.id)}
        aria-label={`Remover ${item.nome}`}
        title="Remover item"
      >
        <i className="material-icons">delete</i>
      </button>
    </div>
  );
};

export default ShoppingItem;
