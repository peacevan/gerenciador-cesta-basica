import React, { useState, useCallback, useEffect } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import useTheme from '../hooks/useTheme';
import VoiceFeedback from './VoiceFeedback';
import '../styles/ListVoice.css';

// ─────────────────────────────────────────────────────────────
// useLocalStorage e useState de items removidos —
// o hook useVoiceRecognition agora gerencia a lista e o localStorage.
// ─────────────────────────────────────────────────────────────

const ListVoice = () => {
  const { toggleTheme, isDark } = useTheme();

  // Tudo que é lista vem do hook agora
  const {
    itens,
    total,
    isListening,
    isProcessing,
    transcript,
    feedback,
    startListening,
    stopListening,
    removerItem,
    atualizarPreco,
    marcarItem,
    limparLista,
    adicionarManual,
  } = useVoiceRecognition();

  // Estado local apenas de UI
  const [newItem, setNewItem] = useState({
    nome: '', quantidade: '', unidade: 'kg', precoUn: ''
  });
  const [formError, setFormError]   = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen]   = useState(false);

  // ── Modal ───────────────────────────────────────────────────

  const openModal  = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
    setFormError('');
  };

  // Adicionar manualmente pelo modal
  // Mapeia precoUn → preco para compatibilidade com o hook
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.nome || !newItem.quantidade || !newItem.precoUn) {
      setFormError('Preencha todos os campos obrigatórios');
      return;
    }
    setFormError('');

    // O hook espera { nome, quantidade, unidade, preco }
    // O componente chama adicionarItens internamente via processarComandos,
    // mas para adição manual podemos usar o mesmo caminho via startListening
    // ou expor uma função adicionarManual no hook.
    // Por ora, adicionamos diretamente via setItems — exposta abaixo como
    // "adicionarManual" no hook (adicione ao return do hook se necessário).
    //
    // Alternativa mais simples: o hook já exporta removerItem/marcarItem,
    // mas não adicionarManual ainda. Vamos usar um dispatch local aqui
    // e sugerir adicionar ao hook na próxima iteração.
    //
    // ✅ Solução imediata: chame processarComandos com acao: 'adicionar'
    // simulando o que o Gemini retornaria:
    adicionarManual({
      nome:       newItem.nome,
      quantidade: parseFloat(newItem.quantidade) || 1,
      unidade:    newItem.unidade,
      preco:      parseFloat(newItem.precoUn) || 0,
    });
    closeModal();
  };

  // ── Menu ───────────────────────────────────────────────────

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu  = () => setIsMenuOpen(false);

  // ── Compartilhar ───────────────────────────────────────────

  const formatarLista = () => {
    const linhas = itens.map(item => {
      const totalItem = ((parseFloat(item.preco) || 0) * (parseFloat(item.quantidade) || 1)).toFixed(2);
      return `${item.comprado ? '☑' : '☐'} ${item.nome} - ${item.quantidade}${item.unidade} - R$ ${totalItem}`;
    });
    const qtdMarcados = itens.filter(i => i.comprado).length;
    return `📝 Lista de Compras\n\n${linhas.join('\n')}\n\n💰 Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n📦 ${qtdMarcados}/${itens.length} itens`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Lista copiada!'))
      .catch(() => alert('Não foi possível copiar.'));
  };

  const shareList = async () => {
    const text = formatarLista();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lista de Compras', text });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  const handleClearList = () => {
    if (window.confirm('Deseja realmente limpar toda a lista?')) limparLista();
  };

  // ── Teclado ────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
      }
      if (
        e.key === ' ' &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        isListening ? stopListening() : startListening();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isListening, startListening, stopListening, isModalOpen]);

  // ── Totais ─────────────────────────────────────────────────

  const qtdTotal    = itens.length;
  const qtdMarcados = itens.filter(i => i.comprado).length;

  // ── Ações de export/backup ─────────────────────────────────

  const handleSaveList = () => {
    try {
      const data = { itens, total, savedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const name = `lista-compras-${now.toISOString().replace(/[:.]/g, '-')}.json`;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert('Lista salva (download iniciado).');
    } catch (err) {
      console.error('Erro ao salvar lista:', err);
      alert('Erro ao salvar lista.');
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="list-voice-container">

      {/* Header */}
      <div className="list-voice-header">
        <h4 className="header-title">
          <i className="material-icons">mic</i>
          Lista de Compras
        </h4>
        <button className="btn-config" onClick={toggleMenu} aria-label="Configurações">
          <i className="material-icons">more_vert</i>
        </button>

        {isMenuOpen && (
          <>
            <div className="menu-overlay" onClick={closeMenu} />
            <div className="config-menu">
              <button onClick={() => { toggleTheme(); closeMenu(); }} className="menu-item">
                <i className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</i>
                <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>
              {itens.length > 0 && (
                <>
                  <button onClick={() => { shareList(); closeMenu(); }} className="menu-item">
                    <i className="material-icons">share</i>
                    <span>Compartilhar Lista</span>
                  </button>
                  <button onClick={() => { handleClearList(); closeMenu(); }} className="menu-item menu-item-danger">
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Adicionar Item</h5>
              <button className="btn-close-modal" onClick={closeModal} aria-label="Fechar">
                <i className="material-icons">close</i>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="modal-form">
              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-form-grid">
                <div className="form-field">
                  <label htmlFor="modal-nome">Produto</label>
                  <input
                    type="text" id="modal-nome" autoFocus
                    value={newItem.nome}
                    onChange={e => setNewItem({ ...newItem, nome: e.target.value })}
                    placeholder="Ex: Arroz"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="modal-quantidade">Quantidade</label>
                  <input
                    type="number" id="modal-quantidade" step="0.01" min="0"
                    value={newItem.quantidade}
                    onChange={e => setNewItem({ ...newItem, quantidade: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="modal-unidade">Unidade</label>
                  <select
                    id="modal-unidade"
                    value={newItem.unidade}
                    onChange={e => setNewItem({ ...newItem, unidade: e.target.value })}
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
                    type="number" id="modal-preco" step="0.01" min="0"
                    value={newItem.precoUn}
                    onChange={e => setNewItem({ ...newItem, precoUn: e.target.value })}
                    placeholder="25.00"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-submit">
                  <i className="material-icons">add</i> Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="items-list">
        {itens.length === 0 ? (
          <div className="empty-state">
            <i className="material-icons">shopping_cart</i>
            <p><strong>Nenhum item na lista</strong></p>
            <p>Use o microfone ou adicione manualmente</p>
          </div>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-check">✓</th>
                <th className="col-produto">Produto</th>
                <th className="col-qtd">Qtd</th>
                <th className="col-un">Un</th>
                <th className="col-preco">Preço</th>
                <th className="col-total">Total</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => {
                const preco      = parseFloat(item.preco) || 0;
                const quantidade = parseFloat(item.quantidade) || 1;
                return (
                  <tr key={item.id} className={item.comprado ? 'checked' : 'unchecked'}>
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={item.comprado}
                        onChange={() => marcarItem(item.id)}
                        aria-label={`Marcar ${item.nome}`}
                      />
                    </td>
                    <td className="col-produto">
                      <span className={item.comprado ? 'strikethrough' : ''}>
                        {item.nome}
                      </span>
                    </td>
                    <td className="col-qtd">{item.quantidade}</td>
                    <td className="col-un">{item.unidade}</td>

                    {/* Preço editável inline — clique para editar */}
                    <td className="col-preco">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={preco === 0 ? '' : preco}
                        onChange={e => atualizarPreco(item.id, e.target.value)}
                        placeholder="0.00"
                        className="preco-inline"
                        aria-label={`Preço de ${item.nome}`}
                      />
                    </td>

                    <td className="col-total">
                      R$ {(preco * quantidade).toFixed(2)}
                    </td>
                    <td className="col-actions">
                      <button
                        onClick={() => removerItem(item.id)}
                        className="btn-delete"
                        aria-label={`Remover ${item.nome}`}
                      >
                        <i className="material-icons">delete</i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <footer className="list-voice-footer">
        <div className="footer-left">
          <h5 className="footer-total">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h5>
          <p className="footer-items-count">
            {qtdMarcados} / {qtdTotal} itens selecionados
          </p>
        </div>

        <div className="footer-actions">
          <button
            className="footer-action-button"
            onClick={openModal}
            title="Adicionar item manualmente"
            aria-label="Adicionar item"
          >
            <i className="material-icons">add</i>
            <span className="sr-only">Adicionar</span>
          </button>

          <button
            className={`footer-action-button footer-mic ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={isListening ? stopListening : startListening}
            title="Clique para falar (ou pressione Espaço)"
            aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
            disabled={isProcessing}
          >
            <i className="material-icons">{isProcessing ? 'hourglass_top' : 'mic'}</i>
            <span className="sr-only">Microfone</span>
          </button>

          <button
            className="footer-action-button footer-save"
            onClick={handleSaveList}
            title="Salvar lista"
            aria-label="Salvar lista"
          >
            <i className="material-icons">save</i>
            <span className="sr-only">Salvar</span>
          </button>
        </div>
      </footer>

      {/* FABs removidos: ações agora no rodapé */}

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
