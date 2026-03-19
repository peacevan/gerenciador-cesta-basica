import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'smart-list-items';

const carregarLista = () => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};

const salvarLista = (itens) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(itens)); } catch (e) { console.warn('Erro ao salvar lista:', e); }
};

const calcularTotal = (itens) => itens.reduce((acc, item) => { const preco = parseFloat(item.preco) || 0; const qtd = parseFloat(item.quantidade) || 1; return acc + preco * qtd; }, 0);

const singularize = (word) => {
  if (!word || word.length <= 2) return word;
  if (word.endsWith('oes')) return word.slice(0, -3) + 'ao';
  if (word.endsWith('aes')) return word.slice(0, -3) + 'a';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
};

const normalizeProductName = (raw) => {
  if (!raw) return '';
  const cleaned = raw.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z\s-]/g,'').trim();
  return cleaned.split(/\s+/).map(t => singularize(t)).filter(Boolean).join(' ');
};

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
          next.push({ id: crypto.randomUUID(), nome: nomeNorm || item.nome, quantidade: qtd, unidade, preco: preco ?? '', comprado: false });
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

  const marcarItem = useCallback((id) => setItens(prev => prev.map(i => i.id === id ? { ...i, comprado: !i.comprado } : i)), []);

  const marcarPorNome = useCallback((nome, comprado) => setItens(prev => prev.map(i => normalizeProductName(i.nome) === normalizeProductName(nome) ? { ...i, comprado } : i)), []);

  const limparLista = useCallback(() => setItens([]), []);

  const adicionarManual = useCallback((item) => adicionarItens([item]), [adicionarItens]);

  const total = calcularTotal(itens);

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
    adicionarItens,
    adicionarManual,
    removerItem,
    removerPorNome,
    atualizarPreco,
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
      default: break;
    }
  }
  if (adicionados.length > 0) {
    // comportamento simplificado: append
    for (const it of adicionados) {
      next.push({ id: crypto.randomUUID(), nome: normalizeProductName(it.nome) || it.nome, quantidade: it.quantidade ?? 1, unidade: it.unidade ?? 'un', preco: it.preco ?? '', comprado: false });
    }
  }
  return { itens: next, mensagem: mensagens.join(' · ') || 'Nenhuma ação' };
};
