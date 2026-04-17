const PERFIL_KEY = 'smart-list:perfil';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('usePerfilFamiliar readJSON', key, e);
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('usePerfilFamiliar writeJSON', key, e);
  }
};

// Fator de multiplicação por número de pessoas (base = 2 pessoas = x1)
const FATORES = { 1: 0.6, 2: 1, 3: 1.4, 4: 1.8, 5: 2.5 };

export function createPerfilFamiliarAPI() {
  const carregarPerfil = () => readJSON(PERFIL_KEY, null);

  const salvarPerfil = (perfil) => {
    writeJSON(PERFIL_KEY, perfil);
    return perfil;
  };

  const resetarPerfil = () => {
    try {
      localStorage.removeItem(PERFIL_KEY);
    } catch (e) {
      console.warn('usePerfilFamiliar resetarPerfil', e);
    }
  };

  /**
   * Retorna o fator multiplicador baseado no número de pessoas.
   * pessoas: 1 | 2 | 3 | 4 | 5 (5 significa 5+)
   */
  const calcularFator = (pessoas) => {
    const n = Math.min(Math.max(Number(pessoas) || 2, 1), 5);
    return FATORES[n] ?? 1;
  };

  /**
   * Aplica o perfil familiar a um array de itens de template,
   * ajustando quantidades e removendo itens inadequados se necessário.
   */
  const aplicarPerfil = (itens, perfil) => {
    if (!perfil || !Array.isArray(itens)) return itens;

    const fator = calcularFator(perfil.pessoas ?? 2);

    return itens
      .filter((it) => {
        // Se tem bebê, sinaliza/remove itens impróprios (bebidas alcoólicas)
        if (perfil.temBebe) {
          const nomeNorm = (it.nome || '').toLowerCase();
          const listaNegra = ['cerveja', 'vinho', 'cachaça', 'vodka', 'whisky', 'gin', 'rum', 'bebida alcoólica'];
          if (listaNegra.some((p) => nomeNorm.includes(p))) return false;
        }
        return true;
      })
      .map((it) => {
        let quantidade = (it.quantidade || 1) * fator;

        // Perfil econômico: preferir pacotes maiores (sem alterar quantidade, apenas sugestão de contexto)
        // Arredondamento inteligente
        if (it.unidade === 'kg' || it.unidade === 'lt') {
          quantidade = Math.round(quantidade * 2) / 2; // múltiplos de 0.5
        } else {
          quantidade = Math.round(quantidade);
        }

        // Mínimo de 1 unidade
        if (quantidade < 1 && (it.unidade === 'un' || it.unidade === 'dúz')) {
          quantidade = 1;
        } else if (quantidade < 0.5) {
          quantidade = 0.5;
        }

        return { ...it, quantidade };
      });
  };

  return {
    carregarPerfil,
    salvarPerfil,
    resetarPerfil,
    calcularFator,
    aplicarPerfil,
    FATORES,
  };
}

export default function usePerfilFamiliar() {
  return createPerfilFamiliarAPI();
}
