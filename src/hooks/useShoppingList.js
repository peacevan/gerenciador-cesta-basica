import { useState, useEffect, useCallback } from 'react';
import { normalizeProductName, singularize, generateDescricao } from '../utils/normalizeProduct.js';

const STORAGE_KEY = 'smart-list-items';

const carregarLista = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Normaliza itens legados que não tinham o campo comprado
    return parsed.map(item => ({ ...item, comprado: item.comprado === true }));
  } catch { return []; }
};

const salvarLista = (itens) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(itens)); } catch (e) { console.warn('Erro ao salvar lista:', e); }
};

export const calcularTotalMarcados = (itens = []) => itens
  .filter(item => !!item.comprado)
  .reduce((acc, item) => {
    const preco = parseFloat(item.preco) || 0;
    const qtd = parseFloat(item.quantidade) || 1;
    return acc + preco * qtd;
  }, 0);

export const calcularTotalGeral = (itens = []) => itens
  .reduce((acc, item) => {
    const preco = parseFloat(item.preco) || 0;
    const qtd = parseFloat(item.quantidade) || 1;
    return acc + preco * qtd;
  }, 0);

// Normalização de nomes de produto extraída para `src/utils/normalizeProduct.js`

export default function useShoppingList() {
  const [itens, setItens] = useState(carregarLista);

  useEffect(() => { salvarLista(itens); }, [itens]);

  const adicionarItens = useCallback((novos) => {
    setItens(prev => {
      const next = [...prev];
      for (const item of novos) {
        const nome = item.nome || '';
        const nomeNorm = normalizeProductName(nome);
        const unidade = item.unidade ?? 'un';
        const qtd = parseFloat(item.quantidade) || 1;
        const preco = item.preco ?? '';

        const idx = next.findIndex(i => normalizeProductName(i.nome) === nomeNorm && i.unidade === unidade);
        if (idx !== -1) {
          const existing = next[idx];
          const existingQtd = parseFloat(existing.quantidade) || 1;
          next[idx] = { ...existing, quantidade: existingQtd + qtd, preco: preco || existing.preco };
        } else {
          const precoUnitario = (item.preco != null && item.preco !== '') ? parseFloat(item.preco) : null;
          const precoTotal = precoUnitario ? +(precoUnitario * qtd) : null;
          next.push({
            id: crypto.randomUUID(),
            nome: nomeNorm || item.nome,
            descricao: item.descricao || (nome ? nome.charAt(0).toUpperCase() + nome.slice(1) : generateDescricao(nomeNorm || item.nome)),
            quantidade: qtd,
            unidade,
            preco: preco ?? '',
            comprado: false,
            marcado: false,
            precoUnitario: precoUnitario,
            precoTotal: precoTotal,
            atualizadoEm: item.atualizadoEm || null,
          });
        }
      }
      return next;
    });
  }, []);

  const removerItem = useCallback((id) => setItens(prev => prev.filter(i => i.id !== id)), []);

  const removerPorNome = useCallback((nome, quantidade = 1) => {
    setItens(prev => {
      const nomeNorm = normalizeProductName(nome);
      const idx = prev.findIndex(i => normalizeProductName(i.nome) === nomeNorm);
      if (idx === -1) return prev;
      const item = prev[idx];
      const currentQtd = parseFloat(item.quantidade) || 1;
      if (quantidade >= currentQtd) return prev.filter((_, i) => i !== idx);
      return prev.map((it, i) => i === idx ? { ...it, quantidade: currentQtd - quantidade } : it);
    });
  }, []);

  const atualizarPreco = useCallback((id, novoPreco) => setItens(prev => prev.map(i => i.id === id ? { ...i, preco: novoPreco } : i)), []);

  const atualizarItem = useCallback((id, updates) => setItens(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i)), []);

  const atualizarPrecoPorNome = useCallback((nome, novoPreco) => {
    // Atualiza o preço apenas se o produto existir. Retorna boolean indicando sucesso.
    let updated = false;
    setItens(prev => {
      const nomeNorm = normalizeProductName(nome);
      const found = prev.some(i => normalizeProductName(i.nome) === nomeNorm);
      if (found) {
        updated = true;
        return prev.map(i => normalizeProductName(i.nome) === nomeNorm ? { ...i, preco: novoPreco } : i);
      }
      return prev;
    });
    return updated;
  }, []);

  const marcarItem = useCallback((id) => setItens(prev => prev.map(i => {
    if (i.id !== id) return i;
    const novoComprado = !i.comprado;
    const precoUnit = i.precoUnitario != null ? parseFloat(i.precoUnitario) : (i.preco ? parseFloat(i.preco) : null);
    const qtd = parseFloat(i.quantidade) || 1;
    return {
      ...i,
      comprado: novoComprado,
      marcado: novoComprado,
      precoUnitario: precoUnit ?? null,
      precoTotal: precoUnit ? +(precoUnit * qtd) : (i.precoTotal ?? null),
      atualizadoEm: novoComprado ? new Date().toISOString() : i.atualizadoEm || null,
    };
  })), []);

  const marcarPorNome = useCallback((nome, comprado) => setItens(prev => prev.map(i => normalizeProductName(i.nome) === normalizeProductName(nome) ? { ...i, comprado } : i)), []);

  const limparLista = useCallback(() => setItens([]), []);

  const adicionarManual = useCallback((item) => adicionarItens([item]), [adicionarItens]);

  const total = calcularTotalMarcados(itens);
  const totalGeral = calcularTotalGeral(itens);

  const processarComandos = useCallback((comandos) => {
    const adicionados = [];
    const mensagens = [];
    for (const cmd of comandos) {
      switch (cmd.acao) {
        case 'adicionar': if (cmd.nome) { adicionados.push(cmd); mensagens.push(`"${cmd.nome}"`); } break;
        case 'remover': if (cmd.nome) { const qtd = cmd.quantidade ?? 1; removerPorNome(cmd.nome, qtd); mensagens.push(`removido "${cmd.nome}"`); } break;
        case 'atualizar_preco': if (cmd.nome && cmd.preco !== null) { const precoNum = typeof cmd.preco === 'string' ? parseFloat(cmd.preco.replace(/[^0-9.,]/g, '').replace(',', '.')) : cmd.preco; const ok = atualizarPrecoPorNome(cmd.nome, precoNum); if (ok) mensagens.push(`preço "${cmd.nome}" → R$${precoNum}`); else mensagens.push(`produto "${cmd.nome}" não encontrado para atualizar`); } break;
        case 'marcar': if (cmd.nome) { marcarPorNome(cmd.nome, true); mensagens.push(`marcado "${cmd.nome}"`); } break;
        case 'desmarcar': if (cmd.nome) { marcarPorNome(cmd.nome, false); mensagens.push(`desmarcado "${cmd.nome}"`); } break;
        default: break;
      }
    }
    if (adicionados.length > 0) adicionarItens(adicionados);
    return mensagens.join(' · ') || 'Nenhuma ação';
  }, [adicionarItens, removerPorNome, atualizarPrecoPorNome, marcarPorNome]);

  return {
    itens,
    total,
    totalGeral,
    adicionarItens,
    adicionarManual,
    removerItem,
    removerPorNome,
    atualizarPreco,
    atualizarItem,
    atualizarPrecoPorNome,
    marcarItem,
    marcarPorNome,
    limparLista,
    processarComandos,
  };
}

// Função pura para processar comandos sobre um array de itens (útil para testes).
export const processarComandosPure = (prevItems, comandos) => {
  const adicionados = [];
  const mensagens = [];
  let next = [...prevItems];
  const normalize = (n) => normalizeProductName(n || '');

  for (const cmd of comandos) {
    switch (cmd.acao) {
      case 'adicionar': if (cmd.nome) { adicionados.push(cmd); mensagens.push(`"${cmd.nome}"`); } break;
      case 'remover': if (cmd.nome) { const qtd = cmd.quantidade ?? 1; const nomeNorm = normalize(cmd.nome); const idx = next.findIndex(i => normalizeProductName(i.nome) === nomeNorm); if (idx !== -1) { const item = next[idx]; const currentQtd = parseFloat(item.quantidade) || 1; if (qtd >= currentQtd) next = next.filter((_, i) => i !== idx); else next = next.map((it, i) => i === idx ? { ...it, quantidade: currentQtd - qtd } : it); } mensagens.push(`removido "${cmd.nome}"`); } break;
      case 'atualizar_preco': if (cmd.nome && cmd.preco !== null) { const precoNum = typeof cmd.preco === 'string' ? parseFloat(cmd.preco.replace(/[^0-9.,]/g, '').replace(',', '.')) : cmd.preco; const nomeNorm = normalize(cmd.nome); const found = next.some(i => normalizeProductName(i.nome) === nomeNorm); if (found) next = next.map(i => normalizeProductName(i.nome) === nomeNorm ? { ...i, preco: precoNum } : i); if (found) mensagens.push(`preço "${cmd.nome}" → R$${precoNum}`); else mensagens.push(`produto "${cmd.nome}" não encontrado para atualizar`); } break;
      case 'marcar': if (cmd.nome) { const nomeNorm = normalize(cmd.nome); next = next.map(i => normalizeProductName(i.nome) === nomeNorm ? { ...i, comprado: true } : i); mensagens.push(`marcado "${cmd.nome}"`); } break;
      case 'desmarcar': if (cmd.nome) { const nomeNorm = normalize(cmd.nome); next = next.map(i => normalizeProductName(i.nome) === nomeNorm ? { ...i, comprado: false } : i); mensagens.push(`desmarcado "${cmd.nome}"`); } break;
      default: break;
    }
  }
    if (adicionados.length > 0) {
    // comportamento simplificado: append
    for (const it of adicionados) {
      const qtd = it.quantidade ?? 1;
      const precoUnitario = (it.preco != null && it.preco !== '') ? parseFloat(it.preco) : null;
      const precoTotal = precoUnitario ? +(precoUnitario * qtd) : null;
      next.push({
        id: crypto.randomUUID(),
        nome: normalizeProductName(it.nome) || it.nome,
        quantidade: qtd,
        unidade: it.unidade ?? 'un',
        preco: it.preco ?? '',
        comprado: false,
        marcado: false,
        precoUnitario: precoUnitario,
        precoTotal: precoTotal,
        atualizadoEm: null,
      });
    }
  }
  return { itens: next, mensagem: mensagens.join(' · ') || 'Nenhuma ação' };
};
