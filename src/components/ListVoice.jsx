import React, { useState, useEffect, useCallback } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import useLocalStorage from '../hooks/useLocalStorage';
import ShoppingItem from './ShoppingItem';
import VoiceFeedback from './VoiceFeedback';
import '../styles/ListVoice.css';

const ListVoice = () => {
  const [items, setItems] = useLocalStorage('listaComprasVoz', []);
  const [newItem, setNewItem] = useState({
    nome: '',
    quantidade: '',
    unidade: 'kg',
    precoUn: ''
  });

  // Adicionar item (manual ou por voz)
  const addItem = useCallback((itemData) => {
    const item = {
      id: Date.now(),
      nome: itemData.nome,
      quantidade: parseFloat(itemData.quantidade),
      unidade: itemData.unidade,
      precoUn: parseFloat(itemData.preco || itemData.precoUn),
      marcado: true
    };

    item.totalProduto = item.quantidade * item.precoUn;
    setItems(prevItems => [...prevItems, item]);
  }, [setItems]);

  // Callback quando item é reconhecido por voz
  const onVoiceItemRecognized = useCallback((parsedItem) => {
    addItem(parsedItem);
  }, [addItem]);

  const {
    isListening,
    transcript,
    feedback,
    startListening,
    stopListening
  } = useVoiceRecognition(onVoiceItemRecognized);

  // Adicionar item manual
  const handleAddItem = (e) => {
    e.preventDefault();

    if (!newItem.nome || !newItem.quantidade || !newItem.precoUn) {
      alert('Preencha todos os campos');
      return;
    }

    addItem({
      nome: newItem.nome,
      quantidade: newItem.quantidade,
      unidade: newItem.unidade,
      precoUn: newItem.precoUn
    });

    // Limpar formulário
    setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
  };

  // Remover item
  const removeItem = useCallback((id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, [setItems]);

  // Toggle checkbox
  const toggleItem = useCallback((id) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, marcado: !item.marcado } : item
      )
    );
  }, [setItems]);

  // Limpar lista
  const clearList = () => {
    if (window.confirm('Deseja realmente limpar toda a lista?')) {
      setItems([]);
    }
  };

  // Calcular totais
  const calcularTotais = useCallback(() => {
    const itensMarcados = items.filter(item => item.marcado !== false);
    const total = itensMarcados.reduce((acc, item) =>
      acc + (item.quantidade * item.precoUn), 0
    );
    return {
      total,
      qtdMarcados: itensMarcados.length,
      qtdTotal: items.length
    };
  }, [items]);

  const { total, qtdMarcados, qtdTotal } = calcularTotais();

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Esc = limpar campos
      if (e.key === 'Escape') {
        setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
      }
      // Espaço = toggle microfone (se não estiver em input)
      if (e.key === ' ' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        isListening ? stopListening() : startListening();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isListening, startListening, stopListening]);

  return (
    <div className="list-voice-container">
      {/* Header */}
      <div className="card-panel teal lighten-2">
        <h4 className="white-text center-align">
          🎤 Lista de Compras com Voz
        </h4>
      </div>

      {/* Formulário de adição manual */}
      <div className="container">
        <form onSubmit={handleAddItem} className="add-item-form">
          <div className="row">
            <div className="input-field col s12 m3">
              <input
                type="text"
                id="item-nome"
                value={newItem.nome}
                onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                placeholder="Ex: Arroz"
              />
              <label htmlFor="item-nome" className={newItem.nome ? 'active' : ''}>
                Produto
              </label>
            </div>

            <div className="input-field col s6 m2">
              <input
                type="number"
                id="item-quantidade"
                step="0.01"
                value={newItem.quantidade}
                onChange={(e) => setNewItem({...newItem, quantidade: e.target.value})}
                placeholder="5"
              />
              <label htmlFor="item-quantidade" className={newItem.quantidade ? 'active' : ''}>
                Quantidade
              </label>
            </div>

            <div className="input-field col s6 m2">
              <select
                id="item-unidade"
                className="browser-default"
                value={newItem.unidade}
                onChange={(e) => setNewItem({...newItem, unidade: e.target.value})}
              >
                <option value="kg">kg</option>
                <option value="lt">lt</option>
                <option value="un">un</option>
                <option value="dúz">dúz</option>
              </select>
            </div>

            <div className="input-field col s8 m3">
              <input
                type="number"
                id="item-preco"
                step="0.01"
                value={newItem.precoUn}
                onChange={(e) => setNewItem({...newItem, precoUn: e.target.value})}
                placeholder="25.00"
              />
              <label htmlFor="item-preco" className={newItem.precoUn ? 'active' : ''}>
                Preço (R$)
              </label>
            </div>

            <div className="col s4 m2">
              <button type="submit" className="btn waves-effect waves-light teal btn-add-manual">
                <i className="material-icons">add</i>
              </button>
            </div>
          </div>
        </form>

        {/* Cabeçalho da lista */}
        <div className="card-panel teal lighten-3">
          <div className="row valign-wrapper white-text" style={{marginBottom: 0}}>
            <div className="col s1 center-align"><strong>✓</strong></div>
            <div className="col s4"><strong>Produto</strong></div>
            <div className="col s2 center-align"><strong>Qtd</strong></div>
            <div className="col s2 center-align"><strong>Preço Un.</strong></div>
            <div className="col s2 center-align"><strong>Total</strong></div>
            <div className="col s1"></div>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="items-list">
          {items.length === 0 ? (
            <div className="center-align grey-text" style={{padding: '40px 0'}}>
              <i className="material-icons" style={{fontSize: '64px'}}>shopping_cart</i>
              <p>Nenhum item na lista</p>
              <p>Use o microfone ou adicione manualmente</p>
            </div>
          ) : (
            items.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Botão limpar lista */}
        {items.length > 0 && (
          <div className="center-align" style={{marginTop: '20px'}}>
            <button
              onClick={clearList}
              className="btn waves-effect waves-light red"
            >
              <i className="material-icons left">delete_sweep</i>
              Limpar Lista
            </button>
          </div>
        )}
      </div>

      {/* Footer com total */}
      <footer className="page-footer teal lighten-2">
        <div className="container">
          <div className="row" style={{marginBottom: 0}}>
            <div className="col s12 center-align white-text">
              <h5>
                Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h5>
              <p>
                {qtdMarcados} / {qtdTotal} itens selecionados
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Botão flutuante de microfone */}
      <button
        className={`btn-floating btn-large mic-button ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        title="Clique para falar"
      >
        <i className="material-icons">mic</i>
      </button>

      {/* Feedback de voz */}
      <VoiceFeedback
        isListening={isListening}
        transcript={transcript}
        feedback={feedback}
      />
    </div>
  );
};

export default ListVoice;
