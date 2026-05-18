import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { parseVoiceInput } from '../utils/voiceParser.js';
import { parseIntent } from '../utils/intentParser.js';

// US-023/024: categorias padronizadas
const CATEGORIAS_PRODUTO = ['Grãos', 'Proteínas', 'Laticínios', 'Hortifruti', 'Limpeza', 'Higiene', 'Bebidas', 'Outros'];

// US-021: formata lista para WhatsApp
const formatarListaWhatsApp = (itens, total) => {
  const linhas = itens.map(item => {
    const totalItem = ((parseFloat(item.preco) || 0) * (parseFloat(item.quantidade) || 1)).toFixed(2);
    const marcado = item.comprado ? '☑' : '☐';
    return `${marcado} ${item.descricao || item.nome} — ${item.quantidade}${item.unidade} — R$ ${totalItem}`;
  });
  const qtdMarcados = itens.filter(i => i.comprado).length;
  return `🛒 *Lista de Compras SmartList*\n\n${linhas.join('\n')}\n\n💰 *Total marcado: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n📦 ${qtdMarcados}/${itens.length} itens`;
};

// US-022: parser simples de texto WhatsApp colado (interpreta o formato de exportação)
const parsarTextoWhatsApp = (texto) => {
  const linhas = texto.split(/\n/).map(l => l.trim()).filter(Boolean);
  const itens = [];
  for (const linha of linhas) {
    // Remove marcadores de checkbox e asteriscos de negrito
    const limpa = linha.replace(/^[☑☐✓✗•\-*]+\s*/, '').replace(/\*/g, '').trim();
    if (!limpa || limpa.startsWith('Total') || limpa.startsWith('💰')) continue;
    // Tenta extrair "nome — qty unidade — R$ preço"
    const partes = limpa.split(/\s*[—\-]\s*/);
    const nome = (partes[0] || '').trim().toLowerCase();
    let quantidade = 1, unidade = 'un', preco = null;
    if (partes[1]) {
      const m = partes[1].match(/(\d+[.,]?\d*)\s*(kg|g|lt|ml|un|dz)?/);
      if (m) { quantidade = parseFloat(m[1].replace(',', '.')) || 1; unidade = m[2] || 'un'; }
    }
    if (partes[2]) {
      const mp = partes[2].match(/R\$\s*([\d.,]+)/);
      if (mp) { preco = parseFloat(mp[1].replace(',', '.')) || null; }
    }
    if (nome.length >= 2) itens.push({ nome, quantidade, unidade, preco });
  }
  return itens;
};

/* ── Chip SVG icons — one per categoria ──────────────────────── */
const CHIP_SVG = {
  compras:   (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  cafe:      (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  feira:     (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18l-2 9H5L3 6z"/><path d="M3 6L2 3H1"/><path d="M8 21h8"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  limpeza:   (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l6-6m4-4l4-4"/><path d="M14.5 6.5l3-3 1.5 1.5-3 3"/><path d="M3 21l5-5a2 2 0 013 3l-5 5"/></svg>,
  churrasco: (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z"/><path d="M10 14c.5.8 1.3 1 2 1s1.5-.2 2-1"/></svg>,
  proteinas: (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  dieese:    (s) => <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
};

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
    atualizarItem,
    marcarItem,
    limparLista,
    adicionarManual,
    ambiguousCommands,
    clearAmbiguous,
    // US-015
    lastVoiceAdded,
    clearVoiceAdded,
  } = useVoiceRecognition();

  const { registrar, salvarSnapshot, listarSnapshots, excluirSnapshot, limparHistorico } = useHistorico();

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

  // Histórico views
  const [detalheId, setDetalheId] = useState(null);
  const [isHistMenuOpen, setIsHistMenuOpen] = useState(false);

  // item expandido no carrinho
  const [expandedId, setExpandedId] = useState(null);
  const [expandedQtd, setExpandedQtd] = useState(1);
  const [compradosCollapsed, setCompradosCollapsed] = useState(false);
  const [expandedPreco, setExpandedPreco] = useState('');
  const [vozState, setVozState] = useState('idle'); // idle | listening | done | error
  const [vozTranscript, setVozTranscript] = useState('');
  const [vozBadge, setVozBadge] = useState(false);
  const vozSRRef = useRef(null);
  const [justToggledIds, setJustToggledIds] = useState(new Set());

  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedMode, setExpandedMode] = useState(null); // 'qtd' | 'preco' | 'categoria'

  // US-008: modo ativo do parser
  const [modoParser, setModoParser] = useState(() => navigator.onLine ? 'llm' : 'offline');
  useEffect(() => {
    const update = () => setModoParser(navigator.onLine ? 'llm' : 'offline');
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  // US-011: PWA install prompt
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPwaPrompt(e); setShowPwaBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // US-013: SW update
  const [swUpdateReady, setSwUpdateReady] = useState(false);
  const swRegRef = useRef(null);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        swRegRef.current = reg;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwUpdateReady(true);
              }
            });
          }
        });
      }).catch(() => {});
    }
  }, []);

  // US-010: painel debug
  const [showDebug, setShowDebug] = useState(false);

  // US-022: importar lista WhatsApp
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState([]);

  // US-024: categoria editável por item
  const [openCatItemId, setOpenCatItemId] = useState(null);

  // ── Store (loja atual) ───────────────────────────────────────────────────────────────────────
  const [lojaAtual, setLojaAtual] = useState(() => {
    try { const raw = localStorage.getItem('smart-list:loja-atual'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  // â”€â”€ Add bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [addInput, setAddInput] = useState('');
  const [addMicActive, setAddMicActive] = useState(false);
  const addMicRef = useRef(null);
  const addMicTimeoutRef = useRef(null);
  // filtro e ordenação (barra superior)
  const [filterText, setFilterText] = useState('');
  const [sortMode, setSortMode] = useState('none'); // 'none' | 'alpha' | 'category'

  // â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const renderFilterBar = () => (
    <div className="lv-filter-bar" role="region" aria-label="Filtro e ordenação" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '5px 10px', background: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
      <input
        className="lv-filter-bar__input"
        type="text"
        placeholder="Filtrar produto..."
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        aria-label="Filtrar produto"
        style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13, height: 30 }}
      />
      <div className="lv-filter-bar__actions" style={{ display: 'flex', gap: 4 }}>
        <button
          className={`lv-filter-bar__btn${sortMode === 'alpha' ? ' active' : ''}`}
          onClick={() => setSortMode(prev => prev === 'alpha' ? 'none' : 'alpha')}
          aria-pressed={sortMode === 'alpha'}
          aria-label="Ordenar A–Z"
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', background: sortMode === 'alpha' ? '#0066ff' : '#f0f0f0', color: sortMode === 'alpha' ? '#fff' : '#333', fontWeight: 600, cursor: 'pointer', fontSize: 12, height: 30 }}
        >
          A–Z
        </button>
        <button
          className={`lv-filter-bar__btn${sortMode === 'category' ? ' active' : ''}`}
          onClick={() => setSortMode(prev => prev === 'category' ? 'none' : 'category')}
          aria-pressed={sortMode === 'category'}
          aria-label="Ordenar por categoria"
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', background: sortMode === 'category' ? '#0066ff' : '#f0f0f0', color: sortMode === 'category' ? '#fff' : '#333', fontWeight: 600, cursor: 'pointer', fontSize: 12, height: 30 }}
        >
          Cat.
        </button>
      </div>
    </div>
  );
  const [lastRemoved, setLastRemoved] = useState(null);
  const lastRemovedTimerRef = useRef(null);

  const handleRemoveWithUndo = (item) => {
    try {
      // remove immediately
      removerItem(item.id);
      setLastRemoved(item);
      showToast('Item removido');
      // keep undo available for 4s
      if (lastRemovedTimerRef.current) clearTimeout(lastRemovedTimerRef.current);
      lastRemovedTimerRef.current = setTimeout(() => setLastRemoved(null), 4000);
    } catch (e) { console.warn('remove undo failed', e); }
  };

  // helper: toggle with a short visual flourish
  const handleMarkClick = (id) => {
    try {
      // add to justToggled set to trigger CSS animation
      setJustToggledIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      // remove highlight after 420ms
      setTimeout(() => setJustToggledIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 420);
      // mark/unmark with FLIP animation
      animateToggleFLIP(id);
    } catch (e) { console.warn('mark click', e); }
  };

  // FLIP-style animation: clone item, toggle state, animate clone to new position
  const animateToggleFLIP = async (id) => {
    try {
      const selector = `[data-lv-id="${id}"]`;
      const el = document.querySelector(selector);
      if (!el) { marcarItem(id); return; }
      const rect = el.getBoundingClientRect();
      const clone = el.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.margin = '0';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '1200';
      document.body.appendChild(clone);
      el.style.visibility = 'hidden';

      // toggle the state so DOM will move the real element
      marcarItem(id);

      // wait for DOM to update
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));

      const newEl = document.querySelector(selector);
      const newRect = newEl ? newEl.getBoundingClientRect() : rect;
      const dx = newRect.left - rect.left;
      const dy = newRect.top - rect.top;

      // animate clone to new position
      if (clone.animate) {
        clone.animate([
          { transform: 'translate(0px, 0px)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 1 }
        ], { duration: 360, easing: 'cubic-bezier(.2,.9,.2,1)' });
      } else {
        clone.style.transition = 'transform 360ms cubic-bezier(.2,.9,.2,1)';
        clone.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      setTimeout(() => {
        clone.remove();
        if (newEl) newEl.style.visibility = 'visible';
      }, 380);
    } catch (e) { console.warn('animate flip failed', e); marcarItem(id); }
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
      return `${item.comprado ? '☑' : '☐'} ${item.descricao || item.nome} - ${item.quantidade}${item.unidade} - R$ ${totalItem}`;
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
      const meta = {
        templateNome: ultimoTemplateUsado.current?.nome || null,
        templateCategoria: ultimoTemplateUsado.current?.categoria || null,
      };
      const snapshot = salvarSnapshot(itens, total, estabelecimento, meta);
      if (ultimoTemplateUsado.current) gravarUltimoTemplate(ultimoTemplateUsado.current);
      if (snapshot) {
        limparLista();
        setView('historico');
        showToast('✅ Compra salva no histórico!');
      } else {
        showToast('Erro ao salvar compra');
      }
    } else {
      try { localStorage.setItem('smart-list:loja-atual', JSON.stringify(estabelecimento)); } catch {}
      setLojaAtual(estabelecimento);
      showToast('Mercado atualizado');
    }
    setIsEstabelecimentoOpen(false);
  };

  // US-021: compartilhar lista ativa via WhatsApp
  const handleShareWhatsApp = () => {
    if (itens.length === 0) { showToast('Lista vazia.'); return; }
    const texto = formatarListaWhatsApp(itens, total);
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // US-020: compartilhar snapshot do histórico via WhatsApp
  const handleShareSnapshot = (snap) => {
    if (!snap || !snap.itens) return;
    const linhas = snap.itens.map(it => `• ${it.nome} — ${it.quantidade}${it.unidade}${it.precoUnitario ? ` — R$${parseFloat(it.precoUnitario).toFixed(2)}` : ''}`);
    const total = (snap.totalGasto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const texto = `🛒 *Compra ${snap.label || ''}*\n${snap.savedAt ? new Date(snap.savedAt).toLocaleDateString('pt-BR') : ''}\n\n${linhas.join('\n')}\n\n💰 *Total: ${total}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // US-022: processar texto colado do WhatsApp
  const handleImportTextChange = (txt) => {
    setImportText(txt);
    if (txt.trim().length > 5) {
      try { setImportPreview(parsarTextoWhatsApp(txt)); } catch { setImportPreview([]); }
    } else {
      setImportPreview([]);
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    importPreview.forEach(item => {
      adicionarManual({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0 });
      try { registrar({ nome: item.nome, unidade: item.unidade, precoUltimo: item.preco }); } catch {}
    });
    setShowImportModal(false);
    setImportText('');
    setImportPreview([]);
    showToast(`${importPreview.length} itens importados!`);
    if (view !== 'carrinho') setView('carrinho');
  };

  // US-024: salvar categoria editada no item
  const handleSaveCategoriaItem = (itemId, categoria) => {
    if (typeof atualizarItem === 'function') {
      atualizarItem(itemId, { categoria });
    }
    setOpenCatItemId(null);
    showToast(`Categoria alterada para ${categoria}`);
  };

  // US-013: aplicar atualização do SW
  const handleApplySwUpdate = () => {
    if (swRegRef.current && swRegRef.current.waiting) {
      swRegRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setSwUpdateReady(false);
    window.location.reload();
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
      itensAjustados.forEach(item => adicionarManual({ nome: item.nome, descricao: item.descricao, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0, categoria: previewTpl.categoria || null }));
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
    itensAjustados.forEach(item => adicionarManual({ nome: item.nome, descricao: item.descricao, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0, categoria: previewTpl.categoria || null }));
    try { itensAjustados.forEach(i => registrar({ nome: i.nome, unidade: i.unidade, precoUltimo: null })); } catch (e) { console.warn(e); }
    markAdded(previewTpl.id);
    gravarUltimoTemplate(previewTpl);
    showToast(`${previewTpl.nome} mesclado`);
    setTimeout(() => setView('carrinho'), 300);
  };

  const handleUsarDeNovo = (dadosUltimo) => {
    const tpl = listarTemplates().find(t => t.id === dadosUltimo.templateId);
    if (!tpl) { showToast('Template não encontrado.'); return; }
    const itensAjustados = aplicarItensComPerfil(tpl.itens.map(it => ({ ...it, preco: 0, categoria: tpl.categoria || null })));
    ultimoTemplateUsado.current = tpl;
    limparLista();
    setTimeout(() => {
      itensAjustados.forEach(item => adicionarManual({ nome: item.nome, descricao: item.descricao, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco || 0, categoria: item.categoria || null }));
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

    const resultado = parseIntent(text, itens);

    if (resultado.intent === 'remover' && resultado.produto) {
      const item = itens.find(it => (it.nome || '').toLowerCase().includes(resultado.produto.toLowerCase()));
      if (item) handleRemoveWithUndo(item);
      else showToast('Item não encontrado no carrinho');
    } else if (resultado.intent === 'editar_quantidade' && resultado.produto && resultado.quantidade !== null) {
      const item = itens.find(it => (it.nome || '').toLowerCase().includes(resultado.produto.toLowerCase()));
      if (item && typeof atualizarItem === 'function') {
        atualizarItem(item.id, { quantidade: resultado.quantidade, unidade: resultado.unidade || item.unidade, atualizadoEm: new Date().toISOString() });
        showToast('Quantidade atualizada');
      }
    } else if (resultado.intent === 'editar_preco' && resultado.produto && resultado.preco !== null) {
      const item = itens.find(it => (it.nome || '').toLowerCase().includes(resultado.produto.toLowerCase()));
      if (item && typeof atualizarItem === 'function') {
        const preco = resultado.preco;
        const qtd = parseFloat(item.quantidade) || 1;
        atualizarItem(item.id, { preco, precoUnitario: preco, precoTotal: +(preco * qtd), atualizadoEm: new Date().toISOString() });
        showToast('Preço atualizado');
      }
    } else {
      // adicionar ou desconhecido → adiciona o item
      const nome = resultado.produto || text;
      const descricao = resultado.descricao || null;
      adicionarManual({ nome, descricao, quantidade: resultado.quantidade || 1, unidade: resultado.unidade || 'un', preco: resultado.preco || 0 });
      try { registrar({ nome, unidade: resultado.unidade || 'un', precoUltimo: resultado.preco || null }); } catch {}
      const sugestao = getSugestao(nome, recusadosSessao.current);
      if (sugestao) setChipSugestao({ nome: sugestao, itemOrigem: nome });
    }

    setAddInput('');
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

  // item expandido — abrir/fechar
  const handleToggleExpanded = (item) => {
    if (expandedId === item.id) { setExpandedId(null); return; }
    if (vozSRRef.current) { try { vozSRRef.current.stop(); } catch (e) {} vozSRRef.current = null; }
    setExpandedId(item.id);
    setExpandedQtd(parseFloat(item.quantidade) || 1);
    setExpandedPreco(item.preco ? String(item.preco) : '');
    setVozState('idle');
    setVozTranscript('');
    setVozBadge(false);
  };

  const handleConfirmarExpanded = () => {
    if (!expandedId || !expandedMode) return;
    const item = itens.find(i => i.id === expandedId);
    if (!item) return;
    const now = new Date().toISOString();

    if (expandedMode === 'qtd') {
      const qtd = parseFloat(expandedQtd) || 1;
      const precoExistente = parseFloat(item.preco) || null;
      const precoTotal = precoExistente ? +(precoExistente * qtd) : null;
      if (typeof atualizarItem === 'function') {
        atualizarItem(expandedId, { quantidade: qtd, precoTotal, atualizadoEm: now });
      }
    } else if (expandedMode === 'preco') {
      const qtd = parseFloat(item.quantidade) || 1;
      const preco = parseFloat(expandedPreco);
      const precoUnitario = isNaN(preco) || preco === 0 ? null : preco;
      const precoTotal = precoUnitario ? +(precoUnitario * qtd) : null;
      if (typeof atualizarItem === 'function') {
        atualizarItem(expandedId, { preco: precoUnitario ?? '', precoUnitario, precoTotal, atualizadoEm: now });
      } else {
        atualizarPreco(expandedId, precoUnitario ?? 0);
      }
    }

    setExpandedId(null);
    setExpandedMode(null);
  };

  const handleVozItem = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Voz não suportada neste navegador'); return; }
    if (vozState === 'listening') {
      if (vozSRRef.current) { try { vozSRRef.current.stop(); } catch (e) {} }
      setVozState('idle'); return;
    }
    const sr = new SR();
    sr.lang = 'pt-BR'; sr.continuous = false; sr.interimResults = false;
    vozSRRef.current = sr;
    setVozState('listening'); setVozTranscript(''); setVozBadge(false);
    sr.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setVozTranscript(txt);
      const parsed = parseVoiceInput(txt);
      if (parsed.sucesso) {
        if (parsed.quantidade !== null) setExpandedQtd(parsed.quantidade);
        if (parsed.preco !== null) setExpandedPreco(String(parsed.preco));
        setVozBadge(true); setVozState('done');
      } else { setVozState('error'); }
    };
    sr.onerror = () => setVozState('error');
    sr.onend   = () => {};
    try { sr.start(); } catch (e) { console.warn(e); setVozState('idle'); }
  };

  const renderHeader = () => {
    if (view === 'carrinho') {
      const qtdMarcados = itens.filter(i => i.comprado).length;
      const pct = itens.length > 0 ? (qtdMarcados / itens.length) * 100 : 0;
      return (
        <>
        <div className="lv-header lv-header--carrinho">
          <div className="lv-header__carrinho-top">
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <h1 className="lv-header__title">Carrinho</h1>
              {lojaAtual?.nome && (
                <button
                  onClick={() => { setIsSavingEstab(false); setIsEstabelecimentoOpen(true); }}
                  aria-label="Mudar estabelecimento"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  📍 {lojaAtual.nome}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="lv-header__icon-btn" onClick={() => toggleTheme()} aria-label="Alternar tema" title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}>
                <i className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</i>
              </button>
              <button className="lv-header__icon-btn" onClick={toggleMenu} aria-label="Menu">
                <i className="material-icons">more_vert</i>
              </button>
            </div>
          </div>
          <div className="lv-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={`Progresso do carrinho ${Math.round(pct)}%`}>
            <div className="lv-progress-bar__fill" style={{ width: `${pct}%` }}>
              <span className="lv-sr-only">{Math.round(pct)}% comprado</span>
            </div>
          </div>
          {/* Filter bar placed inside header so it sits directly below header */}
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
                    <button onClick={() => { handleShareWhatsApp(); closeMenu(); }} className="menu-item">
                      <i className="material-icons">share</i>
                      <span>WhatsApp — compartilhar lista</span>
                    </button>
                    <button onClick={() => { shareList(); closeMenu(); }} className="menu-item">
                      <i className="material-icons">content_copy</i>
                      <span>Copiar lista</span>
                    </button>
                    <button onClick={() => { handleClearList(); closeMenu(); }} className="menu-item menu-item-danger">
                      <i className="material-icons">delete_sweep</i>
                      <span>Limpar Lista</span>
                    </button>
                  </>
                )}
                <button onClick={() => { setShowImportModal(true); closeMenu(); }} className="menu-item">
                  <i className="material-icons">download</i>
                  <span>Importar lista (WhatsApp)</span>
                </button>
                <button onClick={() => { setShowDebug(v => !v); closeMenu(); }} className="menu-item">
                  <i className="material-icons">bug_report</i>
                  <span>Debug</span>
                </button>
              </div>
            </>
          )}
        </div>
        </>
      );
    }
    if (view === 'listas') {
      return (
        <div className="lv-header lv-header--home">
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
        <div className="lv-header lv-header--home">
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
    if (view === 'historico') {
      return (
        <div className="lv-header lv-header--home">
          <button className="lv-header__back" onClick={() => setView('home')} aria-label="Voltar">
            <i className="material-icons">arrow_back</i>
          </button>
          <h1 className="lv-header__title">Histórico de Compras</h1>
          <button
            className="lv-header__icon-btn"
            onClick={() => { if (window.confirm('Apagar todo o histórico?')) limparHistorico(); }}
            aria-label="Limpar histórico"
          >
            <i className="material-icons">delete_sweep</i>
          </button>
        </div>
      );
    }
    if (view === 'ajuda') {
      return (
        <div className="lv-header lv-header--home">
          <button className="lv-header__back" onClick={() => setView('home')} aria-label="Voltar">
            <i className="material-icons">arrow_back</i>
          </button>
          <h1 className="lv-header__title">Ajuda — Comandos de Voz</h1>
          <div style={{ width: 40 }} />
        </div>
      );
    }
    if (view === 'detalhe') {
      const snap = listarSnapshots().find(s => s.id === detalheId);
      return (
        <div className="lv-header lv-header--home">
          <button className="lv-header__back" onClick={() => setView('historico')} aria-label="Voltar">
            <i className="material-icons">arrow_back</i>
          </button>
          <div className="lv-header__brand">
            <span className="lv-header__title">{snap?.templateNome || snap?.label || 'Compra'}</span>
            {snap?.savedAt && (
              <span className="lv-header__sub">{new Date(snap.savedAt).toLocaleDateString('pt-BR')}</span>
            )}
          </div>
          <span className="lv-header__total-detalhe">
            {(snap?.totalGasto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      );
    }
    return (
      <div className="lv-header lv-header--home">
        <div className="lv-header__brand">
          <i className="material-icons lv-header__logo-icon">shopping_bag</i>
          <span className="lv-header__title">SmartList</span>
        </div>
        <div className="lv-header__actions">
          <button className="lv-header__icon-btn" onClick={() => toggleTheme()} aria-label="Alternar tema" title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}>
            <i className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</i>
          </button>
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

    // quando a lista atual estiver vazia, mostrar estado convidando a criar nova lista
    if (itens.length === 0) {
      return (
        <div className="lv-home lv-home--empty">
          <h2 className="lv-home__title">Lista vazia</h2>
          <p className="lv-home__subtitle">Crie uma lista nova ou use a lista da última compra.</p>

          <div style={{ display: 'flex', gap: 8, margin: '18px 0' }}>
            <button className="lv-btn-primary" onClick={() => setView('carrinho')}>
              Criar nova lista
            </button>
            {ultimaCompra && (
              <button className="lv-btn-secondary" onClick={() => handleUsarSnapshotDeNovo(ultimaCompra)}>
                Usar última compra
              </button>
            )}
          </div>

          {ultimaCompra && (
            <div style={{ marginTop: 12 }}>
              <div className="lv-home__divider">
                <span className="lv-home__divider-line" />
                <span className="lv-home__divider-text">Última compra</span>
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
            </div>
          )}

          {/** Também exibimos chips e opções normais abaixo para criar a lista a partir de templates */}
          <div style={{ marginTop: 18 }}>
            <div className="lv-home__chips">
              {chipsOrdenados.map(tpl => {
                const cat = CATEGORIAS[tpl.categoria] || CATEGORIAS.compras;
                const renderIcon = CHIP_SVG[tpl.categoria] || CHIP_SVG.compras;
                return (
                  <button
                    key={tpl.id}
                    className="lv-chip"
                    onClick={() => { setPreviewTpl(tpl); setView('preview'); }}
                  >
                    <span className="lv-chip__icon-wrap" style={{ background: cat.bg }}>
                      {renderIcon(cat.stroke)}
                    </span>
                    <span className="lv-chip__label">{tpl.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // caso haja itens (modo não-vazio), renderiza a home padrão com opções de templates e última compra
    return (
      <div className="lv-home">
        <h2 className="lv-home__title">Pronto pra montar a compra do mês?</h2>
        <p className="lv-home__subtitle">Escolha um template e ajuste pro que você precisa.</p>

        <button className="lv-btn-primary lv-home__cta-full" onClick={() => setView('listas')}>
          <i className="material-icons">grid_view</i>
          Ver Listas Prontas
        </button>

        <div className="lv-home__chips">
          {chipsOrdenados.map(tpl => {
            const cat = CATEGORIAS[tpl.categoria] || CATEGORIAS.compras;
            const renderIcon = CHIP_SVG[tpl.categoria] || CHIP_SVG.compras;
            return (
              <button
                key={tpl.id}
                className="lv-chip"
                onClick={() => { setPreviewTpl(tpl); setView('preview'); }}
              >
                <span className="lv-chip__icon-wrap" style={{ background: cat.bg }}>
                  {renderIcon(cat.stroke)}
                </span>
                <span className="lv-chip__label">{tpl.nome}</span>
              </button>
            );
          })}
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
            <button className="lv-hist-link" onClick={() => setView('historico')}>
              ver histórico completo →
            </button>
          </>
        )}

      </div>
    );
  };

  // ── Histórico ───────────────────────────────────────────────────────────────
  const CATEGORIA_ICONE = {
    mercado: '🛒', feira: '🟡', açougue: '🥩', padaria: '🥖',
    limpeza: '🧹', higiene: '🧴', bebidas: '🥤', hortifruti: '🥦', default: '🛍️',
  };
  const getCatIcone = (cat) => CATEGORIA_ICONE[(cat || '').toLowerCase()] || CATEGORIA_ICONE.default;

  const renderHistorico = () => {
    const snaps = listarSnapshots();
    const totalCompras = snaps.length;
    const mediaCompra = totalCompras
      ? snaps.reduce((acc, s) => acc + (s.totalGasto || 0), 0) / totalCompras
      : 0;

    return (
      <div className="lv-historico">
        <div className="lv-hist-summary">
          <div className="lv-hist-summary__card">
            <span className="lv-hist-summary__label">total de compras</span>
            <span className="lv-hist-summary__value">{totalCompras}</span>
          </div>
          <div className="lv-hist-summary__card">
            <span className="lv-hist-summary__label">média por compra</span>
            <span className="lv-hist-summary__value">
              {mediaCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {snaps.length === 0 ? (
          <div className="lv-hist-empty">
            <i className="material-icons">receipt_long</i>
            <p>Nenhuma compra registrada ainda.</p>
            <span>Finalize uma compra para ela aparecer aqui.</span>
          </div>
        ) : (
          snaps.map(snap => {
            const comPreco = (snap.totalItens || snap.itens.length) - (snap.itensSemPreco || 0);
            const total = snap.totalItens || snap.itens.length;
            const pct = total > 0 ? (comPreco / total) * 100 : 0;
            const dataStr = snap.savedAt ? new Date(snap.savedAt).toLocaleDateString('pt-BR') : '';
            const estab = snap.estabelecimento?.nome || (typeof snap.estabelecimento === 'string' ? snap.estabelecimento : null);
            return (
              <div
                key={snap.id}
                className="lv-hist-card"
                onClick={() => { setDetalheId(snap.id); setView('detalhe'); }}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && (setDetalheId(snap.id), setView('detalhe'))}
                aria-label={`Ver detalhes: ${snap.templateNome || snap.label}`}
              >
                <div className="lv-hist-card__top">
                  <span className="lv-hist-card__icon">{getCatIcone(snap.templateCategoria)}</span>
                  <div className="lv-hist-card__info">
                    <div className="lv-hist-card__nome">{snap.templateNome || snap.label}</div>
                    <div className="lv-hist-card__meta">
                      {estab && <><i className="material-icons">storefront</i>{estab} · </>}
                      {dataStr}
                    </div>
                  </div>
                  <div className="lv-hist-card__right">
                    <div className="lv-hist-card__total">
                      {(snap.totalGasto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="lv-hist-card__count">{total} itens</div>
                  </div>
                </div>
                <div className="lv-hist-card__bar">
                  <div className="lv-hist-card__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="lv-hist-card__bar-label">{comPreco}/{total} com preço</div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ── Detalhe ─────────────────────────────────────────────────────────────────
  const renderDetalhe = () => {
    const snap = listarSnapshots().find(s => s.id === detalheId);
    if (!snap) return (
      <div className="lv-hist-empty">
        <i className="material-icons">receipt_long</i>
        <p>Compra não encontrada.</p>
      </div>
    );

    const handleUsarDeNovoDaCompra = () => {
      const carregar = () => {
        snap.itens.forEach(it =>
          adicionarManual({ nome: it.nome, quantidade: it.quantidade, unidade: it.unidade, preco: 0 })
        );
        setView('carrinho');
      };
      if (itens.length > 0) {
        if (window.confirm('Substituir lista atual?')) { limparLista(); setTimeout(carregar, 50); }
        else carregar();
      } else {
        carregar();
      }
    };

    return (
      <div className="lv-detalhe">
        <div className="lv-detalhe__meta">
          {snap.estabelecimento?.nome && (
            <span><i className="material-icons">store</i>{snap.estabelecimento.nome}</span>
          )}
          <span>
            <i className="material-icons">calendar_today</i>
            {new Date(snap.savedAt).toLocaleDateString('pt-BR')}
          </span>
          <span>
            <i className="material-icons">shopping_cart</i>
            {snap.totalItens ?? snap.itens.length} itens
          </span>
        </div>

        {/* US-020: compartilhar via WhatsApp */}
        <div style={{ padding: '8px 0 4px', display: 'flex', gap: 8 }}>
          <button className="lv-btn-whatsapp" onClick={() => handleShareSnapshot(snap)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Compartilhar via WhatsApp
          </button>
        </div>

        <div className="lv-detalhe__list">
          {snap.itens.map((it, idx) => {
            const temPreco = it.precoUnitario || it.preco;
            const nomeCap = it.descricao || (it.nome.charAt(0).toUpperCase() + it.nome.slice(1));
            const marcado = it.marcado || it.comprado;
            return (
              <div key={idx} className="lv-detalhe__item">
                <i className={`material-icons lv-detalhe__check${marcado ? '' : ' lv-detalhe__check--vazio'}`}>
                  {marcado ? 'check_box' : 'check_box_outline_blank'}
                </i>
                <span className="lv-detalhe__nome">{nomeCap}</span>
                {temPreco ? (
                  <span className="lv-detalhe__preco">
                    {it.quantidade}x R$ {parseFloat(temPreco).toFixed(2)}
                  </span>
                ) : (
                  <span className="lv-detalhe__sem-preco">sem preço</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="lv-detalhe__footer">
          <button className="lv-detalhe__btn-usar" onClick={handleUsarDeNovoDaCompra}>
            Usar esta lista de novo
          </button>
        </div>
      </div>
    );
  };

  const renderListas = () => {
    const renderCard = (tpl) => {
      const cat = CATEGORIAS[tpl.categoria] || CATEGORIAS.compras;
      const renderIcon = CHIP_SVG[tpl.categoria] || CHIP_SVG.compras;
      const isAdded = addedIds.has(tpl.id);
      return (
        <div
          key={tpl.id}
          className={`lv-tpl-card${isAdded ? ' lv-tpl-card--added' : ''}`}
          onClick={() => { if (!isAdded) { setPreviewTpl(tpl); setView('preview'); } }}
        >
          {isAdded && <span className="lv-tpl-card__badge">✓</span>}
          <span className="lv-tpl-card__icon-wrap" style={{ background: cat.bg }}>
            {renderIcon(cat.stroke)}
          </span>
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
          <div className="lv-template-grid">
          {templatesDoSistema.map(renderCard)}
          <div className="lv-tpl-card lv-tpl-card--create" onClick={() => { setView('carrinho'); openModal(); }}>
            <span className="lv-tpl-card__icon-wrap lv-tpl-card__icon-wrap--new">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span>
            <div className="lv-tpl-card__info">
              <div className="lv-tpl-card__name">Criar lista</div>
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
              <span className="lv-preview__item-nome">{item.descricao || item.nome}</span>
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

  const renderCarrinho = () => {
    // aplica filtro por nome em tempo real
    const normalizedFilter = (filterText || '').toString().toLowerCase().trim();
    const itemsFiltered = normalizedFilter
      ? itens.filter(i => ((i.nome || i.descricao) || '').toString().toLowerCase().includes(normalizedFilter))
      : [...itens];

    let pendentes = itemsFiltered.filter(i => !i.comprado);
    let comprados = itemsFiltered.filter(i => i.comprado);

    // ordenação A–Z
    if (sortMode === 'alpha') {
      const sortFn = (a, b) => ((a.nome || a.descricao) || '').toString().localeCompare((b.nome || b.descricao) || '', 'pt');
      pendentes = pendentes.slice().sort(sortFn);
      comprados = comprados.slice().sort(sortFn);
    }

    // Ícone de categoria baseado no último template usado
    const ultimoTplRaw = (() => { try { const raw = localStorage.getItem(ULTIMO_TEMPLATE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } })();
    const tplAtivo = todosTemplates.find(t => t.id === ultimoTplRaw?.templateId);
    const catKey = tplAtivo?.categoria || 'compras';
    const cat = CATEGORIAS[catKey] || CATEGORIAS.compras;
    const catIcon = CHIP_SVG[catKey] || CHIP_SVG.compras;

    const ItemIcon = ({ item: iconItem }) => {
      const itemCatKey = (iconItem && iconItem.categoria);
      if (!itemCatKey) return null; // não renderiza elemento vazio (remove espaço)
      const itemCat = CATEGORIAS[itemCatKey] || CATEGORIAS.compras;
      const itemCatIcon = CHIP_SVG[itemCatKey] || CHIP_SVG.compras;
      return (
        <div className="lv-cart-item__cat-icon" style={{ background: itemCat.bg }}>
          {itemCatIcon(itemCat.stroke)}
        </div>
      );
    };

    // renderiza um item (reaproveita estrutura para pendentes e agrupamentos)
    const renderCartItem = (item) => {
      const preco = parseFloat(item.preco) || 0;
      const qtd   = parseFloat(item.quantidade) || 1;
      const nomeCap = item.descricao || (item.nome.charAt(0).toUpperCase() + item.nome.slice(1).toLowerCase());
      const unStr = item.unidade && item.unidade !== 'und' ? item.unidade : '';
      const totalStr = preco > 0
        ? (preco * qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : '';
      const detalhes = unStr
        ? `${qtd} ${unStr}${preco > 0 ? ` · R$ ${preco.toFixed(2)}/un` : ' · — adicionar preço'}`
        : (preco > 0 ? `R$ ${preco.toFixed(2)}/un` : '— adicionar preço');
      const isMenuOpen = openMenuId === item.id;
      const isEditQtd  = expandedId === item.id && expandedMode === 'qtd';
      const isEditPreco = expandedId === item.id && expandedMode === 'preco';

      return (
        <div key={item.id} data-lv-id={item.id} className={`lv-cart-item${justToggledIds.has(item.id) ? ' lv-item-just-toggled' : ''}`}>
          <div className="lv-cart-item__row">
            <button
              className={`lv-cart-item__check${item.comprado ? ' lv-cart-item__check--marcado' : ''}`}
              onClick={e => { e.stopPropagation(); handleMarkClick(item.id); }}
              aria-label={item.comprado ? 'Desmarcar' : 'Marcar como comprado'}
            >
              {item.comprado && (
                <svg viewBox="0 0 12 10" width="12" height="10" aria-hidden="true">
                  <polyline points="1,5 4,8 11,1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <ItemIcon item={item} />
            <div className="lv-cart-item__col">
              <span className="lv-cart-item__nome">{nomeCap}</span>
              <span className="lv-cart-item__detalhes">{detalhes}</span>
            </div>
            <div className="lv-cart-item__right">
              <span className={`lv-cart-item__total${preco === 0 ? ' lv-cart-item__total--vazio' : ''}`}>
                {totalStr}
              </span>
              <button
                className="lv-cart-item__menu-btn"
                onClick={e => {
                  e.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : item.id);
                  setExpandedId(null);
                  setExpandedMode(null);
                }}
                aria-label="Opções do item"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#9CA3AF">
                  <circle cx="8" cy="3" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="8" cy="13" r="1.5"/>
                </svg>
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 1199 }} onClick={() => setOpenMenuId(null)} />
              <div style={{
                position: 'absolute', right: 8, zIndex: 1200,
                background: '#fff', border: '0.5px solid #E5E7EB',
                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                minWidth: 180, overflow: 'hidden',
              }}>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#E24B4A', textAlign: 'left' }}
                  onClick={() => { handleRemoveWithUndo(item); setOpenMenuId(null); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Excluir
                </button>
                <div style={{ height: '0.5px', background: '#E5E7EB' }} />
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#111827', textAlign: 'left' }}
                  onClick={() => {
                    setOpenMenuId(null);
                    setExpandedId(item.id);
                    setExpandedMode('qtd');
                    setExpandedQtd(parseFloat(item.quantidade) || 1);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Editar quantidade
                </button>
                <div style={{ height: '0.5px', background: '#E5E7EB' }} />
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#111827', textAlign: 'left' }}
                  onClick={() => {
                    setOpenMenuId(null);
                    setExpandedId(item.id);
                    setExpandedMode('preco');
                    setExpandedPreco(item.preco ? String(item.preco) : '');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Editar preço unitário
                </button>
              </div>
            </>
          )}

          {isEditQtd && (
            <div className="lv-cart-item__expand" style={{ paddingTop: 10 }}>
              <div className="lv-item-fields">
                <div className="lv-item-field">
                  <label className="lv-item-field__label">Quantidade</label>
                  <div className="lv-item-stepper">
                    <button className="lv-item-stepper__btn" onClick={() => setExpandedQtd(q => Math.max(1, (parseFloat(q) || 1) - 1))} aria-label="Diminuir">−</button>
                    <input className="lv-item-stepper__input" type="number" min="1" step="1" value={expandedQtd} onChange={e => setExpandedQtd(e.target.value)} aria-label="Quantidade" />
                    <button className="lv-item-stepper__btn" onClick={() => setExpandedQtd(q => (parseFloat(q) || 1) + 1)} aria-label="Aumentar">+</button>
                  </div>
                </div>
              </div>
              <div className="lv-item-expand-footer">
                <span />
                <button className="lv-item-confirmar" onClick={handleConfirmarExpanded}>Confirmar</button>
              </div>
            </div>
          )}

          {isEditPreco && (
            <div className="lv-cart-item__expand" style={{ paddingTop: 10 }}>
              <div className="lv-item-fields">
                <div className="lv-item-field">
                  <label className="lv-item-field__label">Preço unitário</label>
                  <div className="lv-item-preco">
                    <span className="lv-item-preco__prefix">R$</span>
                    <input className="lv-item-preco__input" type="number" min="0" step="0.01" value={expandedPreco} onChange={e => setExpandedPreco(e.target.value)} placeholder="0,00" aria-label="Preço unitário" autoFocus />
                  </div>
                </div>
              </div>
              <div className="lv-item-expand-footer">
                {parseFloat(expandedPreco) > 0 ? (
                  <span className="lv-item-subtotal">
                    = {(parseFloat(expandedPreco || 0) * (parseFloat(item.quantidade) || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} neste item
                  </span>
                ) : <span />}
                <button className="lv-item-confirmar" onClick={handleConfirmarExpanded}>Confirmar</button>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="lv-cart">

        {/* Seção Pendentes */}
        {sortMode === 'category' ? (
          (() => {
            const groups = {};
            pendentes.forEach(it => {
              const key = it.categoria || 'sem categoria';
              if (!groups[key]) groups[key] = [];
              groups[key].push(it);
            });
            return Object.keys(groups).map((catKey) => (
              <div key={catKey} className="lv-cat-group">
                <div className="lv-cat-sep">{(catKey || 'Sem categoria').toString().charAt(0).toUpperCase() + (catKey || 'Sem categoria').toString().slice(1)}</div>
                {groups[catKey].map(renderCartItem)}
              </div>
            ));
          })()
        ) : (
          pendentes.map(renderCartItem)
        )}

        {/* Seção Comprados (colapsável) */}
        {comprados.length > 0 && (
          <div className="lv-comprados">
            <button
              className="lv-comprados__header"
              onClick={() => setCompradosCollapsed(!compradosCollapsed)}
              aria-expanded={!compradosCollapsed}
              aria-controls="lv-comprados-list"
            >
              <span className="lv-comprados__title">
                <i className="material-icons">check_circle</i>
                Comprados ({comprados.length})
              </span>
              <i className="material-icons">{compradosCollapsed ? 'expand_more' : 'expand_less'}</i>
            </button>

            {!compradosCollapsed && (
              <div id="lv-comprados-list" className="lv-comprados__list">
                {comprados.map(item => {
                  const preco = parseFloat(item.preco) || 0;
                  const qtd   = parseFloat(item.quantidade) || 1;
                  const nomeCap = item.descricao || (item.nome.charAt(0).toUpperCase() + item.nome.slice(1).toLowerCase());
                  const unStr = item.unidade && item.unidade !== 'und' ? item.unidade : '';
                  const totalStr = preco > 0
                    ? (preco * qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—';
                  const detalhesComp = unStr
                    ? `${qtd} ${unStr}${preco > 0 ? ` · R$ ${preco.toFixed(2)}/un` : ''}`
                    : (preco > 0 ? `R$ ${preco.toFixed(2)}/un` : '');
                  const isMenuOpen = openMenuId === item.id;
                  const isEditQtd  = expandedId === item.id && expandedMode === 'qtd';
                  const isEditPreco = expandedId === item.id && expandedMode === 'preco';
                  return (
                    <div key={item.id} className="lv-cart-item lv-cart-item--comprado">
                      <div className="lv-cart-item__row">
                        <button
                          className="lv-cart-item__check lv-cart-item__check--marcado"
                          onClick={e => { e.stopPropagation(); marcarItem(item.id); }}
                          aria-label="Desmarcar"
                        >
                          <svg viewBox="0 0 12 10" width="12" height="10" aria-hidden="true">
                            <polyline points="1,5 4,8 11,1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <ItemIcon item={item} />
                        <div className="lv-cart-item__col">
                          <span className="lv-cart-item__nome lv-cart-item__nome--strike">{nomeCap}</span>
                          <span className="lv-cart-item__detalhes lv-cart-item__detalhes--strike">{detalhesComp}</span>
                        </div>
                        <div className="lv-cart-item__right">
                          <span className="lv-cart-item__total">{totalStr}</span>
                          {/* Mostrar botão ⋮ também para itens comprados */}
                          <button
                            className="lv-cart-item__menu-btn"
                            onClick={e => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : item.id);
                              setExpandedId(null);
                              setExpandedMode(null);
                            }}
                            aria-label="Opções do item"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="#9CA3AF">
                              <circle cx="8" cy="3" r="1.5"/>
                              <circle cx="8" cy="8" r="1.5"/>
                              <circle cx="8" cy="13" r="1.5"/>
                            </svg>
                          </button>
                        </div>

                        {/* Dropdown menu para itens comprados */}
                        {isMenuOpen && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 1199 }} onClick={() => setOpenMenuId(null)} />
                            <div style={{
                              position: 'absolute', right: 8, zIndex: 1200,
                              background: '#fff', border: '0.5px solid #E5E7EB',
                              borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                              minWidth: 180, overflow: 'hidden',
                            }}>
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#E24B4A', textAlign: 'left' }}
                                onClick={() => { handleRemoveWithUndo(item); setOpenMenuId(null); }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                Excluir
                              </button>
                              <div style={{ height: '0.5px', background: '#E5E7EB' }} />
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#111827', textAlign: 'left' }}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setExpandedId(item.id);
                                  setExpandedMode('qtd');
                                  setExpandedQtd(parseFloat(item.quantidade) || 1);
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Editar quantidade
                              </button>
                              <div style={{ height: '0.5px', background: '#E5E7EB' }} />
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#111827', textAlign: 'left' }}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setExpandedId(item.id);
                                  setExpandedMode('preco');
                                  setExpandedPreco(item.preco ? String(item.preco) : '');
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                Editar preço unitário
                              </button>
                            </div>
                          </>
                        )}

                        {/* Inline edit: quantidade (comprados) */}
                        {isEditQtd && (
                          <div className="lv-cart-item__expand" style={{ paddingTop: 10 }}>
                            <div className="lv-item-fields">
                              <div className="lv-item-field">
                                <label className="lv-item-field__label">Quantidade</label>
                                <div className="lv-item-stepper">
                                  <button className="lv-item-stepper__btn" onClick={() => setExpandedQtd(q => Math.max(1, (parseFloat(q) || 1) - 1))} aria-label="Diminuir">−</button>
                                  <input className="lv-item-stepper__input" type="number" min="1" step="1" value={expandedQtd} onChange={e => setExpandedQtd(e.target.value)} aria-label="Quantidade" />
                                  <button className="lv-item-stepper__btn" onClick={() => setExpandedQtd(q => (parseFloat(q) || 1) + 1)} aria-label="Aumentar">+</button>
                                </div>
                              </div>
                            </div>
                            <div className="lv-item-expand-footer">
                              <span />
                              <button className="lv-item-confirmar" onClick={handleConfirmarExpanded}>Confirmar</button>
                            </div>
                          </div>
                        )}

                        {/* Inline edit: preço (comprados) */}
                        {isEditPreco && (
                          <div className="lv-cart-item__expand" style={{ paddingTop: 10 }}>
                            <div className="lv-item-fields">
                              <div className="lv-item-field">
                                <label className="lv-item-field__label">Preço unitário</label>
                                <div className="lv-item-preco">
                                  <span className="lv-item-preco__prefix">R$</span>
                                  <input className="lv-item-preco__input" type="number" min="0" step="0.01" value={expandedPreco} onChange={e => setExpandedPreco(e.target.value)} placeholder="0,00" aria-label="Preço unitário" autoFocus />
                                </div>
                              </div>
                            </div>
                            <div className="lv-item-expand-footer">
                              {parseFloat(expandedPreco) > 0 ? (
                                <span className="lv-item-subtotal">
                                  = {(parseFloat(expandedPreco || 0) * (parseFloat(item.quantidade) || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} neste item
                                </span>
                              ) : <span />}
                              <button className="lv-item-confirmar" onClick={handleConfirmarExpanded}>Confirmar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {itens.length === 0 && (
          <div className="lv-cart__empty empty-state">
            <i className="material-icons">shopping_cart</i>
            <h2>Lista vazia</h2>
            <p>Fale ou digite o nome de um produto</p>
          </div>
        )}
      </div>
    );
  };

  const renderAddBar = () => (
    <div className="lv-add-bar">
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          className="lv-add-bar__input lv-add-bar__input--pill"
          type="text"
          placeholder="Digite ou fale: ex: 1 kg de feijão 10 reais"
          value={addInput}
          onChange={e => setAddInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddBarSubmit(); }}
          aria-label="Adicionar item"
        />
        <button
          onClick={handleAddMic}
          aria-label={addMicActive ? 'Parar gravação' : 'Adicionar por voz'}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: addMicActive ? '#E24B4A' : '#0066ff',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v7a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 8h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.92V21h4v2H9v-2h4v-2.08A7 7 0 0 1 5 11z"/>
          </svg>
        </button>
      </div>
      {addInput.trim() && (
        <button className="lv-add-bar__btn-confirm" onClick={() => handleAddBarSubmit()} aria-label="Confirmar adição">
          <i className="material-icons">check</i>
        </button>
      )}
    </div>
  );

  // ── Ajuda ───────────────────────────────────────────────────────────────────
  const renderAjuda = () => (
    <div style={{ padding: '20px 16px 32px', maxWidth: 560 }}>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
        Toque no microfone ou digite na barra de entrada e use os comandos abaixo para montar sua lista rapidamente.
      </p>

      {[
        { titulo: '➕ Adicionar item', exemplos: ['feijão 2 kg', '1 litro de leite', 'arroz 5 kg 25 reais', '3 latas de atum'] },
        { titulo: '🗑️ Remover item', exemplos: ['remover arroz', 'tirar feijão', 'excluir leite'] },
        { titulo: '✏️ Editar quantidade', exemplos: ['mudar quantidade arroz 3', '2 kg feijão', 'alterar qtd leite 2'] },
        { titulo: '💰 Editar preço', exemplos: ['arroz 8 reais', 'preço feijão 12', 'feijão R$ 10,50'] },
        { titulo: '🔢 Atalho (item no carrinho)', exemplos: ['feijão 8', 'arroz 2 kg'] },
      ].map(({ titulo, exemplos }) => (
        <div key={titulo} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>{titulo}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exemplos.map(ex => (
              <div key={ex} style={{ background: '#F3F4F6', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>
                "{ex}"
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: '#E6F0FF', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
        <p style={{ fontSize: 13, color: '#0052cc', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
          💡 <strong>Dica:</strong> Se o item já estiver no carrinho, um número solto vira preço. Com unidade de peso (kg, litro…), vira quantidade.
        </p>
      </div>
    </div>
  );

  const renderBottomNav = () => (
    <nav className="lv-bottom-nav" aria-label="Navegação principal">
      {/* Add bar inside footer when in carrinho */}
      {view === 'carrinho' && renderAddBar()}
      {/* Summary row — only in carrinho view */}
      {view === 'carrinho' && (
        <div className="lv-nav-summary">
          <div className="lv-nav-summary__left">
            <span className="lv-nav-summary__total">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="lv-nav-summary__count">
              {qtdMarcados}/{qtdTotal} itens
            </span>
          </div>
          <button
            className="lv-btn-finalizar"
            onClick={handleSaveList}
            aria-label="Finalizar compra"
            disabled={itens.length === 0}
          >
            <i className="material-icons">check</i>
            Finalizar
          </button>
        </div>
      )}
      {/* Nav icons — always visible */}
      <div className="lv-bottom-nav__icons">
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
          className={`lv-nav-btn${view === 'historico' ? ' active' : ''}`}
          onClick={() => setView('historico')}
          aria-label="Histórico"
        >
          <i className="material-icons">history</i>
          <span>Histórico</span>
        </button>
        <button
          className={`lv-nav-btn${view === 'ajuda' ? ' active' : ''}`}
          onClick={() => setView('ajuda')}
          aria-label="Ajuda"
        >
          <i className="material-icons">help_outline</i>
          <span>Ajuda</span>
        </button>
      </div>
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

      {/* Filter bar — only for carrinho, outside scroll */}
      {view === 'carrinho' && renderFilterBar()}

      {/* Main content */}
      <main className={`lv-main lv-main--${view}`}>
        {view === 'home'      && renderHome()}
        {view === 'listas'    && renderListas()}
        {view === 'preview'   && renderPreview()}
        {view === 'carrinho'  && renderCarrinho()}
        {view === 'historico' && renderHistorico()}
        {view === 'detalhe'   && renderDetalhe()}
        {view === 'ajuda'     && renderAjuda()}
      </main>

      {/* Bottom nav — all views except preview */}
      {view !== 'preview' && renderBottomNav()}

      {/* Add bar now rendered inside the footer via renderBottomNav() */}

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
      {toastMsg && (
        <div className="lv-toast lv-toast--visible" role="status" aria-live="polite" aria-atomic="true">
          {toastMsg}
        </div>
      )}
      {lastRemoved && (
        <div className="lv-toast lv-toast--visible" role="alert" aria-live="assertive" aria-atomic="true" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>Item removido</span>
          <button className="lv-toast-undo" onClick={() => {
            adicionarManual({ nome: lastRemoved.nome, quantidade: lastRemoved.quantidade, unidade: lastRemoved.unidade, preco: lastRemoved.preco });
            if (lastRemovedTimerRef.current) clearTimeout(lastRemovedTimerRef.current);
            setLastRemoved(null);
            showToast('Item restaurado');
          }}>Desfazer</button>
        </div>
      )}

      {/* Voice feedback */}
      <VoiceFeedback isListening={isListening} transcript={transcript} feedback={feedback} />
    </div>
  );
};

export default ListVoice;
