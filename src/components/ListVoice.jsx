import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import ModalEditarTemplate from './ModalEditarTemplate.jsx';
import CardUltimoTemplate from './CardUltimoTemplate.jsx';
import ChipSugestao, { getSugestao } from './ChipSugestao.jsx';
import ModalPerfilFamiliar from './ModalPerfilFamiliar.jsx';
import usePerfilFamiliar from '../hooks/usePerfilFamiliar.js';
import useTemplates from '../hooks/useTemplates.js';

// ─────────────────────────────────────────────────────────────
// useLocalStorage e useState de items removidos —
// o hook useVoiceRecognition agora gerencia a lista e o localStorage.
// ─────────────────────────────────────────────────────────────

const ULTIMO_TEMPLATE_KEY = 'smart-list:ultimo-template';

const gravarUltimoTemplate = (template) => {
  if (!template) return;
  try {
    localStorage.setItem(
      ULTIMO_TEMPLATE_KEY,
      JSON.stringify({
        templateId: template.id,
        templateNome: template.nome,
        templateIcone: template.icone || '🛍️',
        usadoEm: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('gravarUltimoTemplate', e);
  }
};

const ListVoice = () => {
  const { toggleTheme, isDark } = useTheme();
  const { carregarPerfil, aplicarPerfil } = usePerfilFamiliar();
  const { listarTemplates, salvarTemplate } = useTemplates();

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
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Novos estados v2.1
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [templateInicialModal, setTemplateInicialModal] = useState(null); // para "Ver itens" do card
  const [chipSugestao, setChipSugestao] = useState(null); // { nome: string, itemOrigem: string }
  const recusadosSessao = useRef(new Set()); // pares recusados na sessão atual
  const ultimoTemplateUsado = useRef(null); // guarda o template selecionado para gravar ao salvar

  // Verifica perfil no mount: se não existe, abre onboarding
  useEffect(() => {
    const perfil = carregarPerfil();
    if (!perfil) {
      setIsPerfilOpen(true);
    }
  }, []);

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

  const handleAddItem = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newItem.nome) {
      setFormError('Preencha o nome do produto');
      return;
    }
    setFormError('');

    adicionarManual({
      nome:       newItem.nome,
      quantidade: parseFloat(newItem.quantidade) || 1,
      unidade:    newItem.unidade || 'un',
      preco:      parseFloat(newItem.precoUn) || 0,
    });
    try { registrar({ nome: newItem.nome, unidade: newItem.unidade || 'un', precoUltimo: parseFloat(newItem.precoUn) || null }); } catch (e) { console.warn(e); }

    // Verifica correlações para chip de sugestão
    const sugestao = getSugestao(newItem.nome, recusadosSessao.current);
    if (sugestao) {
      setChipSugestao({ nome: sugestao, itemOrigem: newItem.nome });
    }

    // Reset e fecha modal se tiver aberto
    setNewItem({ nome: '', quantidade: '', unidade: 'un', precoUn: '' });
    if (isModalOpen) closeModal();
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
  // Derivar listas de templates para o painel fullscreen
  const todosTemplates     = listarTemplates();
  const templatesDoSistema = todosTemplates.filter(t => t.sistema);
  const templatesdoUsuario = todosTemplates.filter(t => !t.sistema);
  // ── Ações de export/backup ─────────────────────────────────

  const handleSaveList = () => {
    if (itens.length === 0) { alert('Lista vazia.'); return; }
    setIsEstabelecimentoOpen(true);
  };

  const handleConfirmSave = (estabelecimento) => {
    const snapshot = salvarSnapshot(itens, total, estabelecimento);
    // Grava o último template usado se houver
    if (ultimoTemplateUsado.current) {
      gravarUltimoTemplate(ultimoTemplateUsado.current);
    }
    setIsEstabelecimentoOpen(false);
    alert(`Lista salva: ${snapshot ? snapshot.label : 'erro'}`);
  };

  // ── Templates ─────────────────────────────────────────────

  const aplicarItensComPerfil = (itensTemplate) => {
    const perfil = carregarPerfil();
    return aplicarPerfil(itensTemplate, perfil);
  };

  const handleTemplatesSubstituir = (itensTemplate, template) => {
    const itensAjustados = aplicarItensComPerfil(itensTemplate);
    limparLista();
    if (template) ultimoTemplateUsado.current = template;
    setTimeout(() => {
      itensAjustados.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
      try { itensAjustados.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
    }, 50);
  };

  const handleTemplatesAdicionar = (itensTemplate, template) => {
    const itensAjustados = aplicarItensComPerfil(itensTemplate);
    if (template && !ultimoTemplateUsado.current) ultimoTemplateUsado.current = template;
    itensAjustados.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
    try { itensAjustados.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
  };

  // Aplicar template selecionado no painel fullscreen
  const aplicarTemplateSelecionado = () => {
    if (!templateSelecionado) return;
    if (itens.length > 0) {
      handleTemplatesSubstituir(templateSelecionado.itens, templateSelecionado);
    } else {
      handleTemplatesAdicionar(templateSelecionado.itens, templateSelecionado);
    }
    setIsTemplatesOpen(false);
    setTemplateSelecionado(null);
  };

  // Abrir edição de template no painel fullscreen
  const abrirEdicaoTemplate = (template) => {
    setEditingTemplate(template);
  };

  // Handler para "Usar de novo" do CardUltimoTemplate
  const handleUsarDeNovo = (dadosUltimo) => {
    const todos = listarTemplates();
    const tpl = todos.find((t) => t.id === dadosUltimo.templateId);
    if (!tpl) {
      alert('Template não encontrado. Ele pode ter sido removido.');
      return;
    }
    handleTemplatesSubstituir(tpl.itens.map((it) => ({ ...it, preco: 0 })), tpl);
    gravarUltimoTemplate(tpl);
  };

  // Handler para "Ver itens" do CardUltimoTemplate
  const handleVerItens = (dadosUltimo) => {
    setTemplateInicialModal(dadosUltimo);
    setIsTemplatesOpen(true);
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

      {/* Onboarding de Perfil Familiar */}
      <ModalPerfilFamiliar
        isOpen={isPerfilOpen}
        onClose={() => setIsPerfilOpen(false)}
      />

      {/* Chip de Sugestão */}
      {chipSugestao && (
        <ChipSugestao
          sugestao={chipSugestao.nome}
          onSim={() => {
            adicionarManual({ nome: chipSugestao.nome, quantidade: 1, unidade: 'un', preco: 0, fonte: 'sugestao' });
            try { registrar({ nome: chipSugestao.nome, unidade: 'un', precoUltimo: null }); } catch (e) { console.warn(e); }
            setChipSugestao(null);
          }}
          onNao={() => {
            recusadosSessao.current.add(chipSugestao.nome);
            setChipSugestao(null);
          }}
        />
      )}

      {/* Header */}
      <div className="list-voice-header">
        <h4 className="header-title">
          <i className="material-icons">mic</i>
          Lista de Compras
        </h4>
        <div className="header-right">
          {itens.length > 0 && (
            <button className="btn-salvar" onClick={handleSaveList}>
              <i className="material-icons">save</i>
              Salvar
            </button>
          )}
          <button className="btn-config" onClick={toggleMenu} aria-label="Menu">
            <i className="material-icons">more_vert</i>
          </button>
        </div>

        {isMenuOpen && (
          <>
            <div className="menu-overlay" onClick={closeMenu} />
            <div className="config-menu">
              <button onClick={() => { openNotaModal(); closeMenu(); }} className="menu-item">
                <i className="material-icons">photo_camera</i>
                <span>Importar foto de nota</span>
              </button>
              <button onClick={() => { openTextoModal(); closeMenu(); }} className="menu-item">
                <i className="material-icons">article</i>
                <span>Importar texto livre</span>
              </button>
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
            <i className="material-icons" style={{ color: 'var(--accent-secondary)' }}>local_mall</i>
            <p><strong>Sua lista de compras está vazia!</strong></p>

            {/* Card do último template — aparece se houver histórico */}
            <CardUltimoTemplate
              onUsarDeNovo={handleUsarDeNovo}
              onVerItens={handleVerItens}
            />

            <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              ou escolha outro template:
            </div>

            <button
              className="btn-submit"
              style={{ borderRadius: '24px', padding: '12px 24px', background: 'var(--accent-primary)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setTemplateInicialModal(null); setIsTemplatesOpen(true); }}
            >
              <i className="material-icons" style={{ color: '#fff', fontSize: '20px', margin: 0, opacity: 1, display: 'inline' }}>grid_view</i>
              Listas Prontas →
            </button>
          </div>
        ) : (
          <div className="items-table" role="table" aria-label="Lista de compras">
            {/* Cabeçalho */}
            <div className="items-table-head" role="rowgroup">
              <div className="items-row" role="row">
                <div className="col-check" role="columnheader">✓</div>
                <div className="col-produto" role="columnheader">Produto</div>
                <div className="col-qtd-un" role="columnheader">Qtd/Un</div>
                <div className="col-preco" role="columnheader">Preço unit.</div>
                <div className="col-total" role="columnheader">Total</div>
                <div className="col-actions" role="columnheader"></div>
              </div>
            </div>
            {/* Corpo */}
            <div className="items-table-body" role="rowgroup">
              {itens.map(item => {
                const preco      = parseFloat(item.preco) || 0;
                const quantidade = parseFloat(item.quantidade) || 1;
                return (
                  <div key={item.id} className={`items-row${item.comprado ? ' checked' : ' unchecked'}`} role="row">
                    <div className="col-check" role="cell">
                      <input
                        type="checkbox"
                        checked={item.comprado}
                        onChange={() => marcarItem(item.id)}
                        aria-label={`Marcar ${item.nome}`}
                      />
                    </div>
                    <div className="col-produto" role="cell">
                      <span className={item.comprado ? 'strikethrough' : ''}>
                        {item.nome}
                      </span>
                    </div>
                    <div className="col-qtd-un" role="cell">
                      <span className="col-qtd">{item.quantidade}</span>
                      <span className="col-un">{item.unidade}</span>
                    </div>
                    {/* Preço unitário editável com prefixo R$ */}
                    <div className="col-preco" role="cell">
                      <div className="preco-wrapper">
                        <span className="preco-prefix">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={preco === 0 ? '' : preco}
                          onChange={e => atualizarPreco(item.id, e.target.value)}
                          placeholder="0,00"
                          className="preco-inline"
                          aria-label={`Preço de ${item.nome}`}
                        />
                      </div>
                    </div>
                    <div className="col-total" role="cell">
                      R$ {(preco * quantidade).toFixed(2)}
                    </div>
                    <div className="col-actions" role="cell">
                      <button
                        onClick={() => removerItem(item.id)}
                        className="btn-delete"
                        aria-label={`Remover ${item.nome}`}
                      >
                        <i className="material-icons">delete</i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Painel Fullscreen — Listas Prontas */}
      {isTemplatesOpen && (
        <div className="modal-fullscreen">
          <div className="modal-fullscreen-header">
            <div className="modal-fullscreen-title">
              <i className="material-icons">grid_view</i>
              Listas Prontas
            </div>
            <button
              className="btn-close-modal"
              onClick={() => { setIsTemplatesOpen(false); setTemplateSelecionado(null); }}
            >
              <i className="material-icons">close</i>
            </button>
          </div>

          <div className="modal-fullscreen-body">
            <p className="section-label">LISTAS PRONTAS</p>
            <div className="templates-grid">
              {templatesDoSistema.map(t => (
                <div
                  key={t.id}
                  className={`template-card${templateSelecionado?.id === t.id ? ' selected' : ''}`}
                  onClick={() => setTemplateSelecionado(t)}
                >
                  <span className="template-icon">{t.icone}</span>
                  <div className="template-info">
                    <div className="template-name">
                      {t.nome.replace('Cesta Básica', 'Cesta')}
                    </div>
                    <div className="template-count">{t.itens.length} itens</div>
                  </div>
                  <button
                    className="template-edit-btn"
                    onClick={e => { e.stopPropagation(); abrirEdicaoTemplate(t); }}
                    aria-label={`Editar ${t.nome}`}
                  >
                    <i className="material-icons">edit</i>
                  </button>
                </div>
              ))}
            </div>

            {templatesdoUsuario.length > 0 && (
              <>
                <p className="section-label" style={{ marginTop: 16 }}>MEUS TEMPLATES</p>
                <div className="templates-grid">
                  {templatesdoUsuario.map(t => (
                    <div
                      key={t.id}
                      className={`template-card${templateSelecionado?.id === t.id ? ' selected' : ''}`}
                      onClick={() => setTemplateSelecionado(t)}
                    >
                      <span className="template-icon">{t.icone}</span>
                      <div className="template-info">
                        <div className="template-name">{t.nome}</div>
                        <div className="template-count">{t.itens.length} itens</div>
                      </div>
                      <button
                        className="template-edit-btn"
                        onClick={e => { e.stopPropagation(); abrirEdicaoTemplate(t); }}
                        aria-label={`Editar ${t.nome}`}
                      >
                        <i className="material-icons">edit</i>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              className="btn-criar-template"
              onClick={() => {
                if (itens.length === 0) return;
                setIsTemplatesOpen(false);
                // reusar fluxo de salvar como template via ModalTemplates legado não mais disponível
                // abrir painel de histórico como alternativa
                alert('Funcionalidade: salve a lista atual pelo histórico e nomeie como template.');
              }}
              disabled={itens.length === 0}
            >
              <i className="material-icons">add</i>
              Criar lista a partir da lista atual
            </button>
          </div>

          <div className="modal-fullscreen-footer">
            <button
              className="btn-cancel"
              onClick={() => { setIsTemplatesOpen(false); setTemplateSelecionado(null); }}
            >
              Cancelar
            </button>

            {itens.length > 0 ? (
              /* Lista já tem itens: mostrar Adicionar + Substituir */
              <>
                <button
                  className="btn-adicionar-template"
                  onClick={() => {
                    if (!templateSelecionado) return;
                    handleTemplatesAdicionar(templateSelecionado.itens, templateSelecionado);
                    setIsTemplatesOpen(false);
                    setTemplateSelecionado(null);
                  }}
                  disabled={!templateSelecionado}
                >
                  + Adicionar
                </button>
                <button
                  className="btn-usar-template"
                  onClick={() => {
                    if (!templateSelecionado) return;
                    handleTemplatesSubstituir(templateSelecionado.itens, templateSelecionado);
                    setIsTemplatesOpen(false);
                    setTemplateSelecionado(null);
                  }}
                  disabled={!templateSelecionado}
                >
                  Substituir lista
                </button>
              </>
            ) : (
              /* Lista vazia: botão único */
              <button
                className="btn-usar-template"
                onClick={aplicarTemplateSelecionado}
                disabled={!templateSelecionado}
              >
                Usar lista selecionada
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar Template (aberto a partir do painel fullscreen) */}
      {editingTemplate && (
        <ModalEditarTemplate
          isOpen={true}
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={(tplEditado) => {
            try { salvarTemplate(tplEditado); } catch (e) { console.warn('salvarTemplate', e); }
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Footer — nav-bar 3 botões */}
      <footer className="list-voice-footer">
        <div className="footer-left">
          <h5 className="footer-total" aria-label="Total dos itens marcados">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h5>
          <p className="footer-items-count">
            {qtdMarcados} / {qtdTotal} itens
          </p>
        </div>

        <div className="footer-nav">
          <button
            className={`nav-btn${isTemplatesOpen ? ' active' : ''}`}
            onClick={() => setIsTemplatesOpen(true)}
          >
            <i className="material-icons">grid_view</i>
            <span>Listas Prontas</span>
          </button>

          <button
            className="nav-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="material-icons">search</i>
            <span>Adicionar</span>
          </button>

          <button
            className={`nav-btn${isListening ? ' active' : ''}${isProcessing ? ' processing' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            <i className="material-icons">
              {isProcessing ? 'hourglass_top' : 'mic'}
            </i>
            <span>Voz</span>
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

      {/* ModalTemplates substituído pelo painel fullscreen acima */}

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
