import React, { useState, useCallback, useEffect } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import useTheme from '../hooks/useTheme';
import VoiceFeedback from './VoiceFeedback';
import ModalTextoLivre from './ModalTextoLivre';
import ModalConfirmacao from './ModalConfirmacao';
import { interpretar } from '../hooks/useLLMParser';
import NotaFiscalUpload from './NotaFiscalUpload';
import '../styles/ListVoice.css';
import useHistorico from '../hooks/useHistorico.js';
import ModalEstabelecimento from './ModalEstabelecimento.jsx';
import AutocompleteInput from './AutocompleteInput.jsx';
import HistoricoPanel from './HistoricoPanel.jsx';
import ModalTemplates from './ModalTemplates.jsx';

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
    ambiguousCommands,
    clearAmbiguous,
  } = useVoiceRecognition();
  
  const { registrar, buscar, salvarSnapshot, listarSnapshots, excluirSnapshot, carregarSnapshot } = useHistorico();

  // Estado local apenas de UI
  const [newItem, setNewItem] = useState({
    nome: '', quantidade: '', unidade: 'kg', precoUn: ''
  });
  const [formError, setFormError]   = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTextoModalOpen, setIsTextoModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [interpretedItems, setInterpretedItems] = useState([]);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [isEstabelecimentoOpen, setIsEstabelecimentoOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isConfirmSubstituirOpen, setIsConfirmSubstituirOpen] = useState(false);
  const [pendingSnapshot, setPendingSnapshot] = useState(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // ── Modal ───────────────────────────────────────────────────

  const openModal  = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
    setFormError('');
  };

  const openTextoModal = () => setIsTextoModalOpen(true);
  const closeTextoModal = () => setIsTextoModalOpen(false);

  const openNotaModal = () => setIsNotaModalOpen(true);
  const closeNotaModal = () => setIsNotaModalOpen(false);

  const handleInterpretText = async (text) => {
    try {
      const resultado = await interpretar(text);
      if (!Array.isArray(resultado) || resultado.length === 0) {
        alert('Nenhum item reconhecido no texto.');
        return;
      }
      setInterpretedItems(resultado);
      setIsConfirmOpen(true);
    } catch (err) {
      console.error('Erro ao interpretar texto livre:', err);
      alert('Erro ao interpretar o texto.');
    }
  };

  const handleConfirmItems = (items) => {
    if (!items || items.length === 0) return;
    items.forEach(i => adicionarManual({
      nome: i.nome,
      quantidade: i.quantidade || 1,
      unidade: i.unidade || 'un',
      preco: i.preco || 0,
    }));
    // registrar cada item no catálogo
    try { items.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: i.preco || null })); } catch (e) { console.warn(e); }
    setIsConfirmOpen(false);
    setIsTextoModalOpen(false);
    // clear ambiguous commands if they came from voice
    try { clearAmbiguous(); } catch (e) {}
  };

  useEffect(() => {
    if (Array.isArray(ambiguousCommands) && ambiguousCommands.length > 0) {
      setInterpretedItems(ambiguousCommands);
      setIsConfirmOpen(true);
    }
  }, [ambiguousCommands]);

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
    // registrar no catálogo
    try { registrar({ nome: newItem.nome, unidade: newItem.unidade, precoUltimo: parseFloat(newItem.precoUn) || null }); } catch (e) { console.warn(e); }
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
    if (itens.length === 0) { alert('Lista vazia.'); return; }
    setIsEstabelecimentoOpen(true);
  };

  const handleConfirmSave = (estabelecimento) => {
    const snapshot = salvarSnapshot(itens, total, estabelecimento);
    setIsEstabelecimentoOpen(false);
    alert(`Lista salva: ${snapshot ? snapshot.label : 'erro'}`);
  };

  // ── Templates ───────────────────────────────────────────

  const handleTemplatesSubstituir = (itens) => {
    limparLista();
    setTimeout(() => {
      itens.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
      try { itens.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
    }, 50);
  };

  const handleTemplatesAdicionar = (itens) => {
    itens.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
    try { itens.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
  };

  const carregarListaDoSnapshot = (snapshot) => {
    limparLista();
    setTimeout(() => {
      snapshot.itens.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco }));
    }, 50);
  };

  const handleCarregarSnapshot = (snapshot) => {
    if (itens.length > 0) {
      setPendingSnapshot(snapshot);
      setIsConfirmSubstituirOpen(true);
    } else {
      carregarListaDoSnapshot(snapshot);
    }
    setIsHistoricoOpen(false);
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
              <button onClick={() => { setIsHistoricoOpen(true); closeMenu(); }} className="menu-item">
                <i className="material-icons">history</i>
                <span>Histórico de listas</span>
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
                  <AutocompleteInput
                    value={newItem.nome}
                    onChange={val => setNewItem({ ...newItem, nome: val })}
                    onSelect={sug => setNewItem({
                      nome: sug.nomeBruto || sug.nome,
                      quantidade: newItem.quantidade,
                      unidade: sug.unidade || newItem.unidade,
                      precoUn: sug.precoUltimo != null ? String(sug.precoUltimo) : newItem.precoUn
                    })}
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
            className="footer-action-button footer-texto"
            onClick={openTextoModal}
            title="Interpretar texto livre"
            aria-label="Interpretar texto livre"
          >
            <i className="material-icons">article</i>
            <span className="sr-only">Interpretar texto</span>
          </button>

          <button
            className="footer-action-button footer-nota"
            onClick={openNotaModal}
            title="Importar nota fiscal (imagem)"
            aria-label="Importar nota fiscal"
          >
            <i className="material-icons">receipt_long</i>
            <span className="sr-only">Importar nota</span>
          </button>

          <button
            className="footer-action-button footer-templates"
            onClick={() => setIsTemplatesOpen(true)}
            title="Templates de lista"
            aria-label="Abrir templates"
          >
            <i className="material-icons">folder</i>
            <span className="sr-only">Templates</span>
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
      {/* Modal Texto Livre */}
      <ModalTextoLivre
        isOpen={isTextoModalOpen}
        onClose={closeTextoModal}
        onInterpret={handleInterpretText}
      />

      {/* Nota fiscal upload modal */}
      <NotaFiscalUpload
        isOpen={isNotaModalOpen}
        onClose={closeNotaModal}
        onResult={async (text) => {
          try {
            // text is expected to be parsed JSON string from the proxy
            const arr = JSON.parse(text);
            if (Array.isArray(arr)) {
              setInterpretedItems(arr);
              setIsConfirmOpen(true);
            } else {
              alert('Resposta inválida do proxy');
            }
          } catch (err) {
            console.error('parse error', err);
            alert('Erro ao interpretar resposta do proxy');
          }
        }}
      />

      {/* Modal de confirmação de itens interpretados */}
      <ModalConfirmacao
        isOpen={isConfirmOpen}
        itens={interpretedItems}
        onConfirm={handleConfirmItems}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ModalEstabelecimento isOpen={isEstabelecimentoOpen} onClose={() => setIsEstabelecimentoOpen(false)} onConfirm={handleConfirmSave} />

      <HistoricoPanel isOpen={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} onCarregarSnapshot={handleCarregarSnapshot} />

      <ModalTemplates
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSubstituir={handleTemplatesSubstituir}
        onAdicionar={handleTemplatesAdicionar}
        listaAtual={itens}
      />

      <ModalConfirmacao isOpen={isConfirmSubstituirOpen} itens={pendingSnapshot ? pendingSnapshot.itens : []} onConfirm={() => { if (pendingSnapshot) { carregarListaDoSnapshot(pendingSnapshot); setPendingSnapshot(null); } setIsConfirmSubstituirOpen(false); }} onCancel={() => { setPendingSnapshot(null); setIsConfirmSubstituirOpen(false); }} />

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
