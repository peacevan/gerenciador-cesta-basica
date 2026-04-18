import { normalizeProductName } from '../utils/normalizeProduct.js';

const CATALOG_KEY = 'smart-list:catalog';
const HISTORY_KEY = 'smart-list:history';
const SNAPSHOT_LIMIT = 50;

const nowIso = () => new Date().toISOString();

const readJSON = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { console.warn('readJSON', key, e); return fallback; }
};

const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('writeJSON', key, e); }
};

// Pure implementation (usable from tests) returning API object
export function createHistoricoAPI() {
  const carregarCatalogo = () => readJSON(CATALOG_KEY, {});
  const salvarCatalogo = (catalog) => writeJSON(CATALOG_KEY, catalog);

  const carregarHistory = () => readJSON(HISTORY_KEY, []);
  const salvarHistory = (history) => writeJSON(HISTORY_KEY, history);

  const registrar = (item = {}) => {
    try {
      const catalog = carregarCatalogo();
      const rawName = item.nome || item.nomeBruto || '';
      const key = normalizeProductName(rawName) || rawName;
      const now = nowIso();
      const existing = catalog[key] || { nome: key, nomeBruto: rawName, unidade: item.unidade || null, precoUltimo: null, contadorUso: 0, ultimoUso: null };
      existing.nome = key;
      existing.nomeBruto = existing.nomeBruto || rawName;
      existing.unidade = item.unidade || existing.unidade || null;
      if (item.precoUltimo != null) existing.precoUltimo = item.precoUltimo;
      existing.contadorUso = (existing.contadorUso || 0) + 1;
      existing.ultimoUso = now;
      catalog[key] = existing;
      salvarCatalogo(catalog);
      return existing;
    } catch (e) { console.warn('registrar', e); }
  };

  const buscar = (query = '') => {
    try {
      const qNorm = normalizeProductName(query || '').trim();
      const catalog = Object.values(carregarCatalogo());
      const now = Date.now();
      const scored = catalog.map(item => {
        const contador = item.contadorUso || 0;
        const last = item.ultimoUso ? Date.parse(item.ultimoUso) : 0;
        const days = last ? Math.max(0, (now - last) / (1000 * 60 * 60 * 24)) : 365 * 5;
        const recency = Math.max(0, (365 - days) / 365); // 1..0
        const score = contador * 0.7 + recency * 0.3;
        return { item, score };
      });
      let filtered = scored;
      if (qNorm.length >= 2) {
        filtered = scored.filter(s => {
          const n = s.item.nome || '';
          const nb = (s.item.nomeBruto || '').toLowerCase();
          return n.includes(qNorm) || nb.includes(qNorm) || normalizeProductName(n).includes(qNorm);
        });
      }
      const sorted = filtered.sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.item);
      return sorted;
    } catch (e) { console.warn('buscar', e); return []; }
  };

  const salvarSnapshot = (itens = [], totalGasto = 0, estabelecimento = null) => {
    try {
      const history = carregarHistory() || [];
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('id-' + Date.now());
      const savedAt = nowIso();
      const label = `Compra ${new Date(savedAt).toLocaleDateString('pt-BR').slice(0,5)}`;
      const snapshot = { id, savedAt, label, totalGasto: totalGasto || 0, estabelecimento: estabelecimento || null, itens: itens.map(it => ({ nome: it.nome, quantidade: it.quantidade, unidade: it.unidade, preco: it.preco, comprado: !!it.comprado })) };
      // LRU: add to front
      history.unshift(snapshot);
      if (history.length > SNAPSHOT_LIMIT) history.splice(SNAPSHOT_LIMIT);
      salvarHistory(history);
      return snapshot;
    } catch (e) { console.warn('salvarSnapshot', e); return null; }
  };

  const listarSnapshots = () => {
    try { const h = carregarHistory() || []; return h.sort((a,b) => Date.parse(b.savedAt) - Date.parse(a.savedAt)); } catch (e) { console.warn('listarSnapshots', e); return []; }
  };

  const carregarSnapshot = (id) => {
    try { const list = carregarHistory() || []; return list.find(s => s.id === id) || null; } catch (e) { console.warn('carregarSnapshot', e); return null; }
  };

  const excluirSnapshot = (id) => {
    try {
      const list = carregarHistory() || [];
      const next = list.filter(s => s.id !== id);
      salvarHistory(next);
      return true;
    } catch (e) { console.warn('excluirSnapshot', e); return false; }
  };

  const limparCatalogo = () => { try { localStorage.removeItem(CATALOG_KEY); } catch (e) { console.warn('limparCatalogo', e); } };

  return { registrar, buscar, salvarSnapshot, listarSnapshots, carregarSnapshot, excluirSnapshot, limparCatalogo };
}

// Default export: hook wrapper for React usage
export default function useHistorico() {
  // Currently pure functions suffice; return API directly
  return createHistoricoAPI();
}

