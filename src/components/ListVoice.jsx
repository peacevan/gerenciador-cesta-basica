import React, { useState, useEffect, useRef } from 'react';
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
import ModalEditarTemplate from './ModalEditarTemplate.jsx';
import ChipSugestao, { getSugestao } from './ChipSugestao.jsx';
import ModalPerfilFamiliar from './ModalPerfilFamiliar.jsx';
import usePerfilFamiliar from '../hooks/usePerfilFamiliar.js';
import useTemplates, { CATEGORIAS } from '../hooks/useTemplates.js';

const ULTIMO_TEMPLATE_KEY = 'smart-list:ultimo-template';
const SESSION_ADDED_IDS_KEY = 'smart-list:added-tpl-ids';

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

const getAddedIds = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_ADDED_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveAddedIdsToSession = (set) => {
  try { sessionStorage.setItem(SESSION_ADDED_IDS_KEY, JSON.stringify([...set])); } catch {}
};

const ListVoice = () => {
  const { toggleTheme, isDark } = useTheme();
  const { carregarPerfil, aplicarPerfil } = usePerfilFamiliar();
  const { listarTemplates, salvarTemplate } = useTemplates();

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

  const { registrar, salvarSnapshot, listarSnapshots } = useHistorico();

  // â”€â”€ View navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [view, setView] = useState(() => itens.length > 0 ? 'carrinho' : 'home');
  const [previewTpl, setPreviewTpl] = useState(null);
  const [addedIds, setAddedIds] = useState(getAddedIds);

  const prevLengthRef = useRef(itens.length);
  useEffect(() => {
    const prev = prevLengthRef.current;
    const curr = itens.length;
    prevLengthRef.current = curr;
    if (prev === 0 && curr > 0 && view === 'home') setView('carrinho');
    else if (prev > 0 && curr === 0 && view === 'carrinho') setView('home');
  }, [itens.length]);

  // â”€â”€ UI state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [newItem, setNewItem] = useState({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
  const [formError, setFormError]   = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTextoModalOpen, setIsTextoModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [interpretedItems, setInterpretedItems] = useState([]);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [isEstabelecimentoOpen, setIsEstabelecimentoOpen] = useState(false);
  const [isSavingEstab, setIsSavingEstab] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isConfirmSubstituirOpen, setIsConfirmSubstituirOpen] = useState(false);
  const [pendingSnapshot, setPendingSnapshot] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [chipSugestao, setChipSugestao] = useState(null);
  const recusadosSessao = useRef(new Set());
  const ultimoTemplateUsado = useRef(null);

  // â”€â”€ Add bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [addInput, setAddInput] = useState('');
  const [addMicActive, setAddMicActive] = useState(false);
  const addMicRef = useRef(null);
  const addMicTimeoutRef = useRef(null);

  // â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Verifica perfil no mount
  useEffect(() => {
    const perfil = carregarPerfil();
    if (!perfil) setIsPerfilOpen(true);
  }, []);

  // â”€â”€ Modal handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openModal  = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewItem({ nome: '', quantidade: '', unidade: 'kg', precoUn: '' });
    setFormError('');
  };
  const openTextoModal  = () => setIsTextoModalOpen(true);
  const closeTextoModal = () => setIsTextoModalOpen(false);
  const openNotaModal   = () => setIsNotaModalOpen(true);
  const closeNotaModal  = () => setIsNotaModalOpen(false);

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
    items.forEach(i => adicionarManual({ nome: i.nome, quantidade: i.quantidade || 1, unidade: i.unidade || 'un', preco: i.preco || 0 }));
    try { items.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: i.preco || null })); } catch (e) { console.warn(e); }
    setIsConfirmOpen(false);
    setIsTextoModalOpen(false);
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
    if (!newItem.nome) { setFormError('Preencha o nome do produto'); return; }
    setFormError('');
    adicionarManual({ nome: newItem.nome, quantidade: parseFloat(newItem.quantidade) || 1, unidade: newItem.unidade || 'un', preco: parseFloat(newItem.precoUn) || 0 });
    try { registrar({ nome: newItem.nome, unidade: newItem.unidade || 'un', precoUltimo: parseFloat(newItem.precoUn) || null }); } catch (e) { console.warn(e); }
    const sugestao = getSugestao(newItem.nome, recusadosSessao.current);
    if (sugestao) setChipSugestao({ nome: sugestao, itemOrigem: newItem.nome });
    setNewItem({ nome: '', quantidade: '', unidade: 'un', precoUn: '' });
    if (isModalOpen) closeModal();
  };

  // â”€â”€ Menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu  = () => setIsMenuOpen(false);

  // â”€â”€ Compartilhar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const formatarLista = () => {
    const linhas = itens.map(item => {
      const totalItem = ((parseFloat(item.preco) || 0) * (parseFloat(item.quantidade) || 1)).toFixed(2);
      return `${item.comprado ? '☑' : '☐'} ${item.nome} - ${item.quantidade}${item.unidade} - R$ ${totalItem}`;
    });
    const qtdMarcados = itens.filter(i => i.comprado).length;
    return `📝 Lista de Compras\n\n${linhas.join('\n')}\n\n💰 Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n📦 ${qtdMarcados}/${itens.length} itens`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Lista copiada!')).catch(() => showToast('Não foi possível copiar.'));
  };

  const shareList = async () => {
    const text = formatarLista();
    if (navigator.share) {
      try { await navigator.share({ title: 'Lista de Compras', text }); }
      catch (err) { if (err.name !== 'AbortError') copyToClipboard(text); }
    } else {
      copyToClipboard(text);
    }
  };

  const handleClearList = () => {
    if (window.confirm('Deseja realmente limpar toda a lista?')) limparLista();
  };

  // â”€â”€ Keyboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') { if (isModalOpen) closeModal(); }
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        isListening ? stopListening() : startListening();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isListening, startListening, stopListening, isModalOpen]);

  // â”€â”€ Derivados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const qtdTotal    = itens.length;
  const qtdMarcados = itens.filter(i => i.comprado).length;
  const todosTemplates     = listarTemplates();
  const templatesDoSistema = todosTemplates.filter(t => t.sistema);
  const templatesdoUsuario = todosTemplates.filter(t => !t.sistema);

  // â”€â”€ Save/Estabelecimento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveList = () => {
    if (itens.length === 0) { showToast('Lista vazia.'); return; }
    setIsSavingEstab(true);
    setIsEstabelecimentoOpen(true);
  };

  const handleLojaButton = () => {
    setIsSavingEstab(false);
    setIsEstabelecimentoOpen(true);
  };

  const handleConfirmSave = (estabelecimento) => {
    if (isSavingEstab) {
      const snapshot = salvarSnapshot(itens, total, estabelecimento);
      if (ultimoTemplateUsado.current) gravarUltimoTemplate(ultimoTemplateUsado.current);
      showToast(snapshot ? `Lista salva: ${snapshot.label}` : 'Erro ao salvar');
    } else {
      try { localStorage.setItem('smart-list:loja-atual', JSON.stringify(estabelecimento)); } catch {}
      showToast('Loja atualizada');
    }
    setIsEstabelecimentoOpen(false);
  };

  // â”€â”€ Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const aplicarItensComPerfil = (itensTemplate) => {
    const perfil = carregarPerfil();
    return aplicarPerfil(itensTemplate, perfil);
  };

  const markAdded = (tplId) => {
    setAddedIds(prev => {
      const next = new Set(prev);
      next.add(tplId);
      saveAddedIdsToSession(next);
      return next;
    });
  };

  const handlePreviewSubstituir = () => {
    if (!previewTpl) return;
    const itensAjustados = aplicarItensComPerfil(previewTpl.itens);
    ultimoTemplateUsado.current = previewTpl;
    limparLista();
    setTimeout(() => {
      itensAjustados.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
      try { itensAjustados.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
      markAdded(previewTpl.id);
      gravarUltimoTemplate(previewTpl);
      showToast(`${previewTpl.nome} adicionado`);
      setView('carrinho');
    }, 50);
  };

  const handlePreviewMesclar = () => {
    if (!previewTpl) return;
    const itensAjustados = aplicarItensComPerfil(previewTpl.itens);
    if (!ultimoTemplateUsado.current) ultimoTemplateUsado.current = previewTpl;
    itensAjustados.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
    try { itensAjustados.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
    markAdded(previewTpl.id);
    gravarUltimoTemplate(previewTpl);
    showToast(`${previewTpl.nome} mesclado`);
    setTimeout(() => setView('carrinho'), 300);
  };

  const handleUsarDeNovo = (dadosUltimo) => {
    const tpl = listarTemplates().find(t => t.id === dadosUltimo.templateId);
    if (!tpl) { showToast('Template não encontrado.'); return; }
    const itensAjustados = aplicarItensComPerfil(tpl.itens.map(it => ({ ...it, preco: 0 })));
    ultimoTemplateUsado.current = tpl;
    limparLista();
    setTimeout(() => {
      itensAjustados.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 }));
      try { itensAjustados.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
      gravarUltimoTemplate(tpl);
    }, 50);
  };

  const handleVerItens = (dadosUltimo) => {
    const tpl = listarTemplates().find(t => t.id === dadosUltimo.templateId);
    if (!tpl) { showToast('Template não encontrado.'); return; }
    setPreviewTpl(tpl);
    setView('preview');
  };

  const handleUsarSnapshotDeNovo = (snapshot) => {
    limparLista();
    setTimeout(() => {
      snapshot.itens.forEach(item => adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: 0, fonte: 'historico' }));
    }, 50);
    setView('carrinho');
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

  // â”€â”€ Add bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddBarSubmit = (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : addInput).trim();
    if (!text) return;
    adicionarManual({ nome: text, quantidade: 1, unidade: 'un', preco: 0 });
    try { registrar({ nome: text, unidade: 'un', precoUltimo: null }); } catch {}
    setAddInput('');
    const sugestao = getSugestao(text, recusadosSessao.current);
    if (sugestao) setChipSugestao({ nome: sugestao, itemOrigem: text });
  };

  const handleAddMic = () => {
    if (addMicActive) {
      if (addMicRef.current) addMicRef.current.stop();
      clearTimeout(addMicTimeoutRef.current);
      setAddMicActive(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Voz não suportada neste navegador'); return; }
    const sr = new SR();
    sr.lang = 'pt-BR';
    sr.interimResults = false;
    sr.maxAlternatives = 1;
    addMicRef.current = sr;
    setAddMicActive(true);
    sr.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setAddInput(txt);
      addMicTimeoutRef.current = setTimeout(() => handleAddBarSubmit(txt), 1500);
    };
    sr.onerror = () => setAddMicActive(false);
    sr.onend   = () => setAddMicActive(false);
    try { sr.start(); } catch (e) { console.warn(e); setAddMicActive(false); }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // â”€â”€ Render helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const renderHeader = () => {
    if (view === 'listas') {
      return (
        <div className="lv-header">
          <button className="lv-header__back" onClick={() => setView(itens.length > 0 ? 'carrinho' : 'home')} aria-label="Voltar">
            <i className="material-icons">arrow_back</i>
          </button>
          <h1 className="lv-header__title">Listas Prontas</h1>
          <button className="lv-header__icon-btn" onClick={() => setView(itens.length > 0 ? 'carrinho' : 'home')} aria-label="Fechar">
            <i className="material-icons">close</i>
          </button>
        </div>
      );
    }
    if (view === 'preview' && previewTpl) {
      return (
        <div className="lv-header">
          <button className="lv-header__back" onClick={() => setView('listas')} aria-label="Voltar">
            <i className="material-icons">arrow_back</i>
          </button>
          <div className="lv-header__title-group">
            <h1 className="lv-header__title">{previewTpl.icone} {previewTpl.nome}</h1>
            <span className="lv-header__sub">{previewTpl.itens.length} itens</span>
          </div>
          <button className="lv-header__icon-btn" onClick={() => setView('listas')} aria-label="Fechar">
            <i className="material-icons">close</i>
          </button>
        </div>
      );
    }
    return (
      <div className="lv-header">
        <div className="lv-header__brand">
          <i className="material-icons lv-header__logo-icon">shopping_bag</i>
          <span className="lv-header__title">SmartList</span>
        </div>
        <div className="lv-header__actions">
          {view === 'carrinho' && itens.length > 0 && (
            <button className="lv-btn-save" onClick={handleSaveList} aria-label="Salvar lista">
              <i className="material-icons">save</i>
              <span>Salvar</span>
            </button>
          )}
          <button className="lv-header__icon-btn" onClick={toggleMenu} aria-label="Menu">
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
              <button onClick={() => { setIsPerfilOpen(true); closeMenu(); }} className="menu-item">
                <i className="material-icons">family_restroom</i>
                <span>Perfil Familiar</span>
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
    );
  };

  const renderHome = () => {
    const CHIP_PRIORITY = ['compra', 'feira', 'cafe', 'limpeza'];
    const chipsOrdenados = [...templatesDoSistema].sort((a, b) => {
      const getP = t => {
        const key = (t.id + t.nome).toLowerCase();
        const i = CHIP_PRIORITY.findIndex(p => key.includes(p));
        return i === -1 ? 99 : i;
      };
      return getP(a) - getP(b);
    });

    const ultimaCompra = listarSnapshots()[0] || null;
    const ultimoTpl = (() => {
      try { const raw = localStorage.getItem(ULTIMO_TEMPLATE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
    })();
    const nomeCompra = ultimoTpl?.templateNome || ultimaCompra?.label || '';
    const iconeCompra = ultimoTpl?.templateIcone || '🛒';
    const estabNome = ultimaCompra?.estabelecimento?.name || (typeof ultimaCompra?.estabelecimento === 'string' ? ultimaCompra.estabelecimento : null);
    const dataFormatada = ultimaCompra?.savedAt ? new Date(ultimaCompra.savedAt).toLocaleDateString('pt-BR') : '';
    const totalCompra = ultimaCompra?.totalGasto ?? 0;

    return (
      <div className="lv-home">
        <h2 className="lv-home__title">Pronto pra montar a compra do mês?</h2>
        <p className="lv-home__subtitle">Escolha um template e ajuste pro que você precisa.</p>

        <button className="lv-btn-primary lv-home__cta-full" onClick={() => setView('listas')}>
          <i className="material-icons">grid_view</i>
          Ver Listas Prontas
        </button>

        <div className="lv-home__chips">
          {chipsOrdenados.map(tpl => (
            <button
              key={tpl.id}
              className="lv-chip"
              onClick={() => { setPreviewTpl(tpl); setView('preview'); }}
            >
              <span className="lv-chip__icon">{tpl.icone}</span>
              <span className="lv-chip__label">{tpl.nome}</span>
            </button>
          ))}
        </div>

        {ultimaCompra && (
          <>
            <div className="lv-home__divider">
              <span className="lv-home__divider-line" />
              <span className="lv-home__divider-text">ou repita a última compra</span>
              <span className="lv-home__divider-line" />
            </div>
            <div className="lv-home__last-card">
              <div className="lv-home__last-card-top">
                <div className="lv-home__last-card-info">
                  <span className="lv-home__last-card-icon">{iconeCompra}</span>
                  <div>
                    <div className="lv-home__last-card-nome">{nomeCompra}</div>
                    <div className="lv-home__last-card-meta">
                      {estabNome && <><i className="material-icons lv-home__last-card-store-icon">storefront</i>{estabNome} · </>}
                      {dataFormatada}
                    </div>
                  </div>
                </div>
                <span className="lv-home__last-card-badge">
                  {totalCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="lv-home__last-card-btns">
                <button
                  className="lv-home__last-btn lv-home__last-btn--outline"
                  onClick={() => {
                    setPreviewTpl({ id: ultimaCompra.id, nome: nomeCompra, icone: iconeCompra, itens: ultimaCompra.itens || [] });
                    setView('preview');
                  }}
                >
                  Ver itens
                </button>
                <button
                  className="lv-home__last-btn lv-home__last-btn--primary"
                  onClick={() => handleUsarSnapshotDeNovo(ultimaCompra)}
                >
                  Usar de novo
                </button>
              </div>
            </div>
          </>
        )}

        <button className="lv-home__add-btn" onClick={openModal}>
          <i className="material-icons">add</i>
          Adicionar item manualmente
        </button>
      </div>
    );
  };

  const renderListas = () => {
    const renderCard = (tpl) => {
      const cat = CATEGORIAS[tpl.categoria] || CATEGORIAS.compras;
      const isAdded = addedIds.has(tpl.id);
      return (
        <div
          key={tpl.id}
          className="lv-tpl-card"
          style={{ '--tpl-bg': cat.bg, '--tpl-stroke': cat.stroke }}
          onClick={() => { setPreviewTpl(tpl); setView('preview'); }}
        >
          {isAdded && <span className="lv-tpl-card__badge">✓</span>}
          <span className="lv-tpl-card__icon">{tpl.icone}</span>
          <div className="lv-tpl-card__info">
            <div className="lv-tpl-card__name">{tpl.nome}</div>
            <div className="lv-tpl-card__count">{tpl.itens.length} itens</div>
          </div>
          <button
            className="lv-tpl-card__edit"
            onClick={e => { e.stopPropagation(); setEditingTemplate(tpl); }}
            aria-label={`Editar ${tpl.nome}`}
          >
            <i className="material-icons">edit</i>
          </button>
        </div>
      );
    };
    return (
      <div className="lv-listas">
        <p className="lv-section-label">LISTAS PRONTAS</p>
        <div className="lv-template-grid">
          {templatesDoSistema.map(renderCard)}
          <div className="lv-tpl-card lv-tpl-card--create" onClick={openModal}>
            <i className="material-icons lv-tpl-card__new-icon">add_circle_outline</i>
            <div className="lv-tpl-card__info">
              <div className="lv-tpl-card__name">Nova lista</div>
            </div>
          </div>
        </div>
        {templatesdoUsuario.length > 0 && (
          <>
            <p className="lv-section-label" style={{ marginTop: 20 }}>MEUS TEMPLATES</p>
            <div className="lv-template-grid">
              {templatesdoUsuario.map(renderCard)}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!previewTpl) return null;
    return (
      <div className="lv-preview">
        <div className="lv-preview__list">
          {previewTpl.itens.map((item, i) => (
            <div key={i} className="lv-preview__item">
              <span className="lv-preview__item-nome">{item.nome}</span>
              <span className="lv-preview__item-qtd">{item.quantidade} {item.unidade}</span>
            </div>
          ))}
        </div>
        <div className="lv-preview__footer">
          {itens.length > 0 && (
            <button className="lv-btn-outline lv-preview__btn" onClick={handlePreviewMesclar}>
              Mesclar
            </button>
          )}
          <button className="lv-btn-primary lv-preview__btn" onClick={handlePreviewSubstituir}>
            {itens.length > 0 ? 'Substituir' : 'Usar lista'}
          </button>
        </div>
      </div>
    );
  };

  const renderCarrinho = () => (
    <div className="lv-cart">
      <div className="items-table" role="table" aria-label="Lista de compras">
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
        <div className="items-table-body" role="rowgroup">
          {itens.map(item => {
            const preco      = parseFloat(item.preco) || 0;
            const quantidade = parseFloat(item.quantidade) || 1;
            return (
              <div key={item.id} className={`items-row${item.comprado ? ' checked' : ' unchecked'}`} role="row">
                <div className="col-check" role="cell">
                  <input type="checkbox" checked={item.comprado} onChange={() => marcarItem(item.id)} aria-label={`Marcar ${item.nome}`} />
                </div>
                <div className="col-produto" role="cell">
                  <span className={item.comprado ? 'strikethrough' : ''}>{item.nome}</span>
                </div>
                <div className="col-qtd-un" role="cell">
                  <span className="col-qtd">{item.quantidade}</span>
                  <span className="col-un">{item.unidade}</span>
                </div>
                <div className="col-preco" role="cell">
                  <div className="preco-wrapper">
                    <span className="preco-prefix">R$</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={preco === 0 ? '' : preco}
                      onChange={e => atualizarPreco(item.id, e.target.value)}
                      placeholder="0,00"
                      className="preco-inline"
                      aria-label={`Preço de ${item.nome}`}
                    />
                  </div>
                </div>
                <div className="col-total" role="cell">R$ {(preco * quantidade).toFixed(2)}</div>
                <div className="col-actions" role="cell">
                  <button onClick={() => removerItem(item.id)} className="btn-delete" aria-label={`Remover ${item.nome}`}>
                    <i className="material-icons">delete</i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAddBar = () => (
    <div className="lv-add-bar">
      <input
        className="lv-add-bar__input"
        type="text"
        placeholder="Adicionar item..."
        value={addInput}
        onChange={e => setAddInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAddBarSubmit(); }}
        aria-label="Adicionar item"
      />
      {addInput.trim() && (
        <button className="lv-add-bar__btn-confirm" onClick={() => handleAddBarSubmit()} aria-label="Confirmar adição">
          <i className="material-icons">check</i>
        </button>
      )}
      <button
        className={`lv-add-bar__mic${addMicActive ? ' active' : ''}`}
        onClick={handleAddMic}
        aria-label={addMicActive ? 'Parar gravação' : 'Adicionar por voz'}
      >
        <i className="material-icons">{addMicActive ? 'mic_off' : 'mic'}</i>
      </button>
    </div>
  );

  const renderBottomNav = () => (
    <nav className="lv-bottom-nav" aria-label="Navegação principal">
      <div className="lv-nav-summary">
        <span className="lv-nav-summary__total">
          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
        <span className="lv-nav-summary__count">
          {qtdTotal === 0 ? '0 itens no carrinho' : `${qtdTotal} iten${qtdTotal !== 1 ? 's' : ''}`}
        </span>
      </div>
      <button
        className={`lv-nav-btn${view === 'home' ? ' active' : ''}`}
        onClick={() => setView('home')}
        aria-label="Início"
      >
        <i className="material-icons">home</i>
        <span>Início</span>
      </button>
      <button
        className={`lv-nav-btn${view === 'listas' ? ' active' : ''}`}
        onClick={() => setView('listas')}
        aria-label="Listas"
      >
        <i className="material-icons">grid_view</i>
        <span>Listas</span>
      </button>
      <button
        className={`lv-nav-btn${view === 'carrinho' ? ' active' : ''}`}
        onClick={() => setView(itens.length > 0 ? 'carrinho' : 'home')}
        aria-label="Carrinho"
      >
        <div className="lv-nav-btn__icon-wrap">
          <i className="material-icons">shopping_cart</i>
          {qtdTotal > 0 && <span className="lv-nav-btn__badge">{qtdTotal}</span>}
        </div>
        <span>Carrinho</span>
      </button>
      <button
        className="lv-nav-btn"
        onClick={handleLojaButton}
        aria-label="Loja"
      >
        <i className="material-icons">storefront</i>
        <span>Loja</span>
      </button>
    </nav>
  );

  // â”€â”€ JSX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="list-voice-container">

      {/* Onboarding */}
      <ModalPerfilFamiliar isOpen={isPerfilOpen} onClose={() => setIsPerfilOpen(false)} />

      {/* Chip de SugestÃ£o */}
      {chipSugestao && (
        <ChipSugestao
          sugestao={chipSugestao.nome}
          onSim={() => {
            adicionarManual({ nome: chipSugestao.nome, quantidade: 1, unidade: 'un', preco: 0, fonte: 'sugestao' });
            try { registrar({ nome: chipSugestao.nome, unidade: 'un', precoUltimo: null }); } catch (e) { console.warn(e); }
            setChipSugestao(null);
          }}
          onNao={() => { recusadosSessao.current.add(chipSugestao.nome); setChipSugestao(null); }}
        />
      )}

      {/* Header */}
      {renderHeader()}

      {/* Main content */}
      <main className={`lv-main lv-main--${view}`}>
        {view === 'home'     && renderHome()}
        {view === 'listas'   && renderListas()}
        {view === 'preview'  && renderPreview()}
        {view === 'carrinho' && renderCarrinho()}
      </main>

      {/* Add bar — carrinho only */}
      {view === 'carrinho' && renderAddBar()}

      {/* Bottom nav — all views except preview */}
      {view === 'carrinho' && itens.length > 0 && (
        <div className="lv-cart-total-bar">
          <span className="lv-cart__total">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span className="lv-cart__count">{qtdMarcados}/{qtdTotal} itens</span>
        </div>
      )}
      {view !== 'preview' && renderBottomNav()}

      {/* Modal form â€” manual add */}
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
                      precoUn: sug.precoUltimo != null ? String(sug.precoUltimo) : newItem.precoUn,
                    })}
                    placeholder="Ex: Arroz"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="modal-quantidade">Quantidade</label>
                  <input type="number" id="modal-quantidade" step="0.01" min="0" value={newItem.quantidade} onChange={e => setNewItem({ ...newItem, quantidade: e.target.value })} placeholder="5" />
                </div>
                <div className="form-field">
                  <label htmlFor="modal-unidade">Unidade</label>
                  <select id="modal-unidade" value={newItem.unidade} onChange={e => setNewItem({ ...newItem, unidade: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="lt">lt</option>
                    <option value="un">un</option>
                    <option value="dz">dz</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="modal-preco">Preço (R$)</label>
                  <input type="number" id="modal-preco" step="0.01" min="0" value={newItem.precoUn} onChange={e => setNewItem({ ...newItem, precoUn: e.target.value })} placeholder="25.00" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-submit"><i className="material-icons">add</i> Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalTextoLivre isOpen={isTextoModalOpen} onClose={closeTextoModal} onInterpret={handleInterpretText} />
      <NotaFiscalUpload
        isOpen={isNotaModalOpen}
        onClose={closeNotaModal}
        onResult={async (text) => {
          try {
            const arr = JSON.parse(text);
            if (Array.isArray(arr)) { setInterpretedItems(arr); setIsConfirmOpen(true); }
            else alert('Resposta inválida do proxy');
          } catch (err) { console.error('parse error', err); alert('Erro ao interpretar resposta do proxy'); }
        }}
      />
      <ModalConfirmacao isOpen={isConfirmOpen} itens={interpretedItems} onConfirm={handleConfirmItems} onCancel={() => setIsConfirmOpen(false)} />
      <ModalEstabelecimento isOpen={isEstabelecimentoOpen} onClose={() => setIsEstabelecimentoOpen(false)} onConfirm={handleConfirmSave} />
      <HistoricoPanel isOpen={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} onCarregarSnapshot={handleCarregarSnapshot} />
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
      <ModalConfirmacao
        isOpen={isConfirmSubstituirOpen}
        itens={pendingSnapshot ? pendingSnapshot.itens : []}
        onConfirm={() => { if (pendingSnapshot) { carregarListaDoSnapshot(pendingSnapshot); setPendingSnapshot(null); } setIsConfirmSubstituirOpen(false); }}
        onCancel={() => { setPendingSnapshot(null); setIsConfirmSubstituirOpen(false); }}
      />

      {/* Toast */}
      {toastMsg && <div className="lv-toast lv-toast--visible">{toastMsg}</div>}

      {/* Voice feedback */}
      <VoiceFeedback isListening={isListening} transcript={transcript} feedback={feedback} />
    </div>
  );
};

export default ListVoice;
