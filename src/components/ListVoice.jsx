import React, { useState, useCallback, useEffect } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import useLocalStorage from '../hooks/useLocalStorage';
import useTheme from '../hooks/useTheme';
import ShoppingItem from './ShoppingItem';
import VoiceFeedback from './VoiceFeedback';
import '../styles/ListVoice.css';

const ListVoice = () => {
  const [items, setItems] = useLocalStorage('listaComprasVoz', []);
  const { toggleTheme, isDark } = useTheme();
  const [newItem, setNewItem] = useState({
    nome: '',
    quantidade: '',
    unidade: 'kg',
    precoUn: ''
  });

  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
    setFormError('');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

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
    closeModal();
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Lista copiada para a área de transferência!');
    }).catch(() => {
      alert('Não foi possível copiar a lista. Tente novamente.');
    });
  };

  const shareList = async () => {
    const text = items
      .map(item => `${item.marcado ? '☑' : '☐'} ${item.nome} - ${item.quantidade}${item.unidade} - R$ ${(item.quantidade * item.precoUn).toFixed(2)}`)
      .join('\n');

    const shareText = `📝 Lista de Compras\n\n${text}\n\n💰 Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n📦 ${qtdMarcados}/${qtdTotal} itens`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de Compras',
          text: shareText
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
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
        if (isModalOpen) {
          closeModal();
        } else {
          setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
        }
      }
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        isListening ? stopListening() : startListening();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isListening, startListening, stopListening, isModalOpen]);

  return (
    <div className="list-voice-container">
      {/* Header com menu de configurações */}
      <div className="list-voice-header">
        <h4 className="header-title">
          <i className="material-icons">mic</i>
          Lista de Compras
        </h4>

        {/* Botão Config */}
        <button
          className="btn-config"
          onClick={toggleMenu}
          aria-label="Configurações"
        >
          <i className="material-icons">more_vert</i>
        </button>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <>
            <div className="menu-overlay" onClick={closeMenu}></div>
            <div className="config-menu">
              <button onClick={() => { toggleTheme(); closeMenu(); }} className="menu-item">
                <i className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</i>
                <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>

              {items.length > 0 && (
                <>
                  <button onClick={() => { shareList(); closeMenu(); }} className="menu-item">
                    <i className="material-icons">share</i>
                    <span>Compartilhar Lista</span>
                  </button>

                  <button onClick={() => { clearList(); closeMenu(); }} className="menu-item menu-item-danger">
                    <i className="material-icons">delete_sweep</i>
                    <span>Limpar Lista</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de adição manual */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Adicionar Item</h5>
              <button className="btn-close-modal" onClick={closeModal} aria-label="Fechar">
                <i className="material-icons">close</i>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="modal-form">
              {formError && (
                <p className="form-error">{formError}</p>
              )}

              <div className="modal-form-grid">
                <div className="form-field">
                  <label htmlFor="modal-nome">Produto</label>
                  <input
                    type="text"
                    id="modal-nome"
                    value={newItem.nome}
                    onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
                    placeholder="Ex: Arroz"
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="modal-quantidade">Quantidade</label>
                  <input
                    type="number"
                    id="modal-quantidade"
                    step="0.01"
                    min="0"
                    value={newItem.quantidade}
                    onChange={(e) => setNewItem({ ...newItem, quantidade: e.target.value })}
                    placeholder="5"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="modal-unidade">Unidade</label>
                  <select
                    id="modal-unidade"
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
                  <label htmlFor="modal-preco">Preço (R$)</label>
                  <input
                    type="number"
                    id="modal-preco"
                    step="0.01"
                    min="0"
                    value={newItem.precoUn}
                    onChange={(e) => setNewItem({ ...newItem, precoUn: e.target.value })}
                    placeholder="25.00"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  <i className="material-icons">add</i>
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Botão FAB Adicionar */}
      <button
        className="fab-add-button"
        onClick={openModal}
        title="Adicionar item manualmente"
        aria-label="Adicionar item"
      >
        <i className="material-icons">add</i>
      </button>

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
