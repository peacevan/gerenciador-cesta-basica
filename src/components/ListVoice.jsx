import React, { useState, useCallback, useEffect } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import useLocalStorage from '../hooks/useLocalStorage';
import useTheme from '../hooks/useTheme';
import ShoppingItem from './ShoppingItem';
import VoiceFeedback from './VoiceFeedback';
import ThemeToggle from './ThemeToggle';
import '../styles/ListVoice.css';

const ListVoice = () => {
  const [items, setItems] = useLocalStorage('listaComprasVoz', []);
  const { theme, toggleTheme, isDark } = useTheme();
  const [newItem, setNewItem] = useState({
    nome: '',
    quantidade: '',
    unidade: 'kg',
    precoUn: ''
  });

  const [formError, setFormError] = useState('');

  const addItem = useCallback((itemData) => {
    const quantidade = parseFloat(itemData.quantidade) || 1;
    const precoUn = parseFloat(itemData.preco || itemData.precoUn) || 0;
    const item = {
      id: Date.now(),
      nome: itemData.nome,
      quantidade,
      unidade: itemData.unidade || 'un',
      precoUn,
      marcado: true
    };
    setItems(prevItems => [...prevItems, item]);
  }, [setItems]);

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

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.nome || !newItem.quantidade || !newItem.precoUn) {
      setFormError('Preencha todos os campos obrigatórios');
      return;
    }
    setFormError('');
    addItem({
      nome: newItem.nome,
      quantidade: newItem.quantidade,
      unidade: newItem.unidade,
      precoUn: newItem.precoUn
    });
    setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
  };

  const removeItem = useCallback((id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, [setItems]);

  const toggleItem = useCallback((id) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, marcado: !item.marcado } : item
      )
    );
  }, [setItems]);

  const clearList = () => {
    if (window.confirm('Deseja realmente limpar toda a lista?')) {
      setItems([]);
    }
  };

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

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
      }
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        isListening ? stopListening() : startListening();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isListening, startListening, stopListening]);

  return (
    <div className="list-voice-container">
      {/* Header com toggle de tema */}
      <div className="list-voice-header">
        <h4 className="header-title">
          <i className="material-icons">mic</i>
          Lista de Compras
        </h4>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Formulário de adição manual */}
      <form onSubmit={handleAddItem} className="add-item-form">
        {formError && (
          <p style={{ color: 'var(--error)', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
            {formError}
          </p>
        )}
        <div className="form-grid">
          <div className="form-field form-field-name">
            <label htmlFor="lv-nome">Produto</label>
            <input
              type="text"
              id="lv-nome"
              value={newItem.nome}
              onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
              placeholder="Ex: Arroz"
            />
          </div>

          <div className="form-field">
            <label htmlFor="lv-quantidade">Qtd</label>
            <input
              type="number"
              id="lv-quantidade"
              step="0.01"
              min="0"
              value={newItem.quantidade}
              onChange={(e) => setNewItem({ ...newItem, quantidade: e.target.value })}
              placeholder="5"
            />
          </div>

          <div className="form-field">
            <label htmlFor="lv-unidade">Un.</label>
            <select
              id="lv-unidade"
              value={newItem.unidade}
              onChange={(e) => setNewItem({ ...newItem, unidade: e.target.value })}
            >
              <option value="kg">kg</option>
              <option value="lt">lt</option>
              <option value="un">un</option>
              <option value="dúz">dúz</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="lv-preco">Preço (R$)</label>
            <input
              type="number"
              id="lv-preco"
              step="0.01"
              min="0"
              value={newItem.precoUn}
              onChange={(e) => setNewItem({ ...newItem, precoUn: e.target.value })}
              placeholder="25.00"
            />
          </div>

          <div className="form-field form-field-submit">
            <label>&nbsp;</label>
            <button type="submit" className="btn-add-manual" aria-label="Adicionar item">
              <i className="material-icons" style={{ color: 'white' }}>add</i>
            </button>
          </div>
        </div>
      </form>

      {/* Cabeçalho da lista */}
      {items.length > 0 && (
        <div className="list-header">
          <div className="list-header-row">
            <span>✓</span>
            <span>Produto</span>
            <span style={{ textAlign: 'center' }}>Qtd</span>
            <span style={{ textAlign: 'center' }}>Preço Un.</span>
            <span style={{ textAlign: 'right' }}>Total</span>
            <span></span>
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="items-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <i className="material-icons">shopping_cart</i>
            <p><strong>Nenhum item na lista</strong></p>
            <p>Use o microfone {isDark ? '🌙' : '☀️'} ou adicione manualmente</p>
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
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={clearList} className="btn-clear-list">
            <i className="material-icons">delete_sweep</i>
            Limpar Lista
          </button>
        </div>
      )}

      {/* Footer com total */}
      <footer className="list-voice-footer">
        <div style={{ textAlign: 'center' }}>
          <h5 className="footer-total">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h5>
          <p className="footer-items-count">
            {qtdMarcados} / {qtdTotal} itens selecionados
          </p>
        </div>
      </footer>

      {/* Botão flutuante de microfone */}
      <button
        className={`mic-button ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        title="Clique para falar (ou pressione Espaço)"
        aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
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
