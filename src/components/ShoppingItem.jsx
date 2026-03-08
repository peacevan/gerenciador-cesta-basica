import React from 'react';

const ShoppingItem = ({ item, onToggle, onRemove }) => {
  const formatPrice = (value) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className={`shopping-item-card ${!item.marcado ? 'unchecked' : ''}`}>
      <div className="row valign-wrapper" style={{marginBottom: 0}}>
        {/* Checkbox */}
        <div className="col s1 center-align">
          <label>
            <input
              type="checkbox"
              className="filled-in"
              checked={item.marcado !== false}
              onChange={() => onToggle(item.id)}
            />
            <span></span>
          </label>
        </div>

        {/* Nome */}
        <div className="col s4">
          <span className={`item-name ${!item.marcado ? 'strikethrough' : ''}`}>
            {item.nome}
          </span>
        </div>

        {/* Quantidade */}
        <div className="col s2 center-align">
          <span className="item-detail">
            {item.quantidade} {item.unidade}
          </span>
        </div>

        {/* Preço Unitário */}
        <div className="col s2 center-align">
          <span className="item-detail">
            {formatPrice(item.precoUn)}
          </span>
        </div>

        {/* Total */}
        <div className="col s2 center-align">
          <span className="item-total">
            {formatPrice(item.totalProduto)}
          </span>
        </div>

        {/* Botão Delete */}
        <div className="col s1 center-align">
          <button
            className="btn-flat btn-small waves-effect waves-red"
            onClick={() => onRemove(item.id)}
            title="Remover item"
          >
            <i className="material-icons red-text">delete</i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingItem;
