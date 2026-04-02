const TEMPLATES_KEY = 'smartlist_templates';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('useTemplates readJSON', key, e);
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('useTemplates writeJSON', key, e);
  }
};

// Templates pré-definidos (hardcoded) — não são editados pelo usuário
export const TEMPLATES_HARDCODED = [
  {
    id: 'tpl-churrasco',
    nome: 'Churrasco',
    icone: '🥩',
    itens: [
      { nome: 'picanha', quantidade: 2, unidade: 'kg' },
      { nome: 'frango', quantidade: 1, unidade: 'kg' },
      { nome: 'linguiça', quantidade: 1, unidade: 'kg' },
      { nome: 'carvão', quantidade: 2, unidade: 'un' },
      { nome: 'cerveja', quantidade: 12, unidade: 'un' },
      { nome: 'refrigerante', quantidade: 2, unidade: 'lt' },
      { nome: 'pão de alho', quantidade: 2, unidade: 'un' },
      { nome: 'sal grosso', quantidade: 1, unidade: 'kg' },
    ],
  },
  {
    id: 'tpl-cafe-manha',
    nome: 'Café da Manhã',
    icone: '☕',
    itens: [
      { nome: 'café', quantidade: 1, unidade: 'un' },
      { nome: 'leite', quantidade: 2, unidade: 'lt' },
      { nome: 'pão de forma', quantidade: 1, unidade: 'un' },
      { nome: 'manteiga', quantidade: 1, unidade: 'un' },
      { nome: 'ovos', quantidade: 1, unidade: 'dúz' },
      { nome: 'queijo mussarela', quantidade: 0.5, unidade: 'kg' },
    ],
  },
  {
    id: 'tpl-limpeza',
    nome: 'Limpeza',
    icone: '🧹',
    itens: [
      { nome: 'detergente', quantidade: 2, unidade: 'un' },
      { nome: 'sabão em pó', quantidade: 1, unidade: 'un' },
      { nome: 'amaciante', quantidade: 1, unidade: 'lt' },
      { nome: 'desinfetante', quantidade: 1, unidade: 'lt' },
      { nome: 'esponja', quantidade: 2, unidade: 'un' },
      { nome: 'papel higiênico', quantidade: 4, unidade: 'un' },
    ],
  },
];

// API pura (testável sem React)
export function createTemplatesAPI() {
  const listarUsuario = () => {
    return readJSON(TEMPLATES_KEY, []);
  };

  const salvarComoTemplate = (nome, itens) => {
    if (!nome || !nome.trim()) return null;
    if (!Array.isArray(itens) || itens.length === 0) return null;
    const templates = listarUsuario();
    const baseId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'tpl-usr-' + Date.now();
    const existingIds = new Set(templates.map((t) => t.id));
    let id = baseId;
    let suffix = 1;
    while (existingIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    const template = {
      id,
      nome: nome.trim(),
      icone: '📋',
      criadoEm: new Date().toISOString(),
      itens: itens.map((it) => ({
        nome: it.nome || '',
        quantidade: it.quantidade || 1,
        unidade: it.unidade || 'un',
      })),
    };
    templates.push(template);
    writeJSON(TEMPLATES_KEY, templates);
    return template;
  };

  const excluirTemplate = (id) => {
    const templates = listarUsuario();
    const next = templates.filter((t) => t.id !== id);
    writeJSON(TEMPLATES_KEY, next);
    return true;
  };

  const limpar = () => {
    try {
      localStorage.removeItem(TEMPLATES_KEY);
    } catch (e) {
      console.warn('useTemplates limpar', e);
    }
  };

  return {
    TEMPLATES_HARDCODED,
    listarUsuario,
    salvarComoTemplate,
    excluirTemplate,
    limpar,
  };
}

// Hook default para uso em componentes
export default function useTemplates() {
  return createTemplatesAPI();
}
