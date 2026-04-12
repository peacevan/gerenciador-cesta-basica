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
  const _TEMPLATES_HARDCODED = TEMPLATES_HARDCODED.map(t => ({ ...t, sistema: true, editavel: true }));

  const listarUsuario = () => {
    return readJSON(TEMPLATES_KEY, []);
  };

  const listarTemplates = () => {
    return [..._TEMPLATES_HARDCODED, ...listarUsuario()];
  };

  const gerarId = () => {
    const baseId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tpl-usr-' + Date.now();
    let id = baseId; let suffix = 1;
    const ids = new Set(listarTemplates().map(t => t.id));
    while (ids.has(id)) { id = `${baseId}-${suffix++}`; }
    return id;
  };

  const salvarTemplate = (template) => {
    const templates = listarUsuario();
    const idx = templates.findIndex(t => t.id === template.id);
    const timestamp = new Date().toISOString();
    
    let templateSalvo;
    if (idx >= 0) {
      templateSalvo = { ...templates[idx], ...template, atualizadoEm: timestamp };
      templates[idx] = templateSalvo;
    } else {
      templateSalvo = { 
        ...template, 
        id: template.id || gerarId(), 
        sistema: false, 
        editavel: true, 
        criadoEm: timestamp, 
        atualizadoEm: timestamp 
      };
      templates.push(templateSalvo);
    }
    
    writeJSON(TEMPLATES_KEY, templates);
    return templateSalvo;
  };

  const salvarComoTemplate = (nome, itens) => {
    if (!nome || !nome.trim()) return null;
    if (!Array.isArray(itens) || itens.length === 0) return null;
    return salvarTemplate({
      nome: nome.trim(),
      icone: '📋',
      itens: itens.map((it) => ({
        nome: it.nome || '',
        quantidade: it.quantidade || 1,
        unidade: it.unidade || 'un',
      })),
    });
  };

  const excluirTemplate = (id) => {
    const templates = listarUsuario();
    const next = templates.filter((t) => t.id !== id);
    if (next.length !== templates.length) {
      writeJSON(TEMPLATES_KEY, next);
      return true;
    }
    return false;
  };

  const duplicarTemplate = (id) => {
    const templateOrigem = listarTemplates().find(t => t.id === id);
    if (!templateOrigem) return null;
    
    const novoTemplate = {
      ...templateOrigem,
      id: gerarId(),
      nome: `Cópia de ${templateOrigem.nome}`,
      sistema: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    return salvarTemplate(novoTemplate);
  };

  const limpar = () => {
    try {
      localStorage.removeItem(TEMPLATES_KEY);
    } catch (e) {
      console.warn('useTemplates limpar', e);
    }
  };

  return {
    TEMPLATES_HARDCODED: _TEMPLATES_HARDCODED,
    listarUsuario,
    listarTemplates,
    salvarTemplate,
    salvarComoTemplate,
    duplicarTemplate,
    excluirTemplate,
    limpar,
  };
}

// Hook default para uso em componentes
export default function useTemplates() {
  return createTemplatesAPI();
}
