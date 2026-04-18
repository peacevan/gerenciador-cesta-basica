const TEMPLATES_KEY = 'smart-list:templates';
const GENERATED_KEY = 'smart-list:templates-generated';

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
  {
    id: 'tpl-cesta-dieese',
    nome: 'Cesta Básica (DIEESE)',
    icone: '🧺',
    itens: [
      { nome: 'Açúcar refinado', quantidade: 1, unidade: 'kg' },
      { nome: 'Arroz agulhinha', quantidade: 5, unidade: 'kg' },
      { nome: 'Banana', quantidade: 1, unidade: 'kg' },
      { nome: 'Batata', quantidade: 2, unidade: 'kg' },
      { nome: 'Café em pó', quantidade: 0.5, unidade: 'kg' },
      { nome: 'Carne bovina (primeira)', quantidade: 1, unidade: 'kg' },
      { nome: 'Farinha de trigo', quantidade: 1, unidade: 'kg' },
      { nome: 'Feijão', quantidade: 2, unidade: 'kg' },
      { nome: 'Leite integral', quantidade: 6, unidade: 'lt' },
      { nome: 'Manteiga', quantidade: 0.2, unidade: 'kg' },
      { nome: 'Óleo de soja', quantidade: 0.9, unidade: 'lt' },
      { nome: 'Pão francês', quantidade: 1, unidade: 'kg' },
      { nome: 'Tomate', quantidade: 1, unidade: 'kg' },
    ],
  },
];

// --- CSV parsing and dynamic template generation ---
const safeParseCSV = (text) => {
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  const header = [];
  // simple header parse (handles commas in quoted headers unlikely)
  lines[0].split(',').forEach(h => header.push(h.trim()));
  const rows = lines.slice(1).map(line => {
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(cur); cur = ''; } else { cur += ch; }
    }
    values.push(cur);
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (values[idx] || '').trim(); });
    return obj;
  });
  return rows;
};

const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const findProduct = (products, name) => {
  if (!Array.isArray(products)) return null;
  const target = normalize(name);
  // exact match first
  let p = products.find(r => normalize(r.nome) === target);
  if (p) return p;
  // contains
  p = products.find(r => normalize(r.nome).includes(target) || target.includes(normalize(r.nome)));
  if (p) return p;
  // startsWith
  p = products.find(r => normalize(r.nome).startsWith(target) || target.startsWith(normalize(r.nome)));
  return p || null;
};

const buildDieeseTemplateFromProducts = (products) => {
  const desired = [
    { nome: 'Açúcar refinado', quantidade: 1, unidade: 'kg' },
    { nome: 'Arroz agulhinha', quantidade: 5, unidade: 'kg' },
    { nome: 'Banana', quantidade: 1, unidade: 'kg' },
    { nome: 'Batata', quantidade: 2, unidade: 'kg' },
    { nome: 'Café em pó', quantidade: 0.5, unidade: 'kg' },
    { nome: 'Carne bovina (primeira)', quantidade: 1, unidade: 'kg' },
    { nome: 'Farinha de trigo', quantidade: 1, unidade: 'kg' },
    { nome: 'Feijão', quantidade: 2, unidade: 'kg' },
    { nome: 'Leite integral', quantidade: 6, unidade: 'lt' },
    { nome: 'Manteiga', quantidade: 0.2, unidade: 'kg' },
    { nome: 'Óleo de soja', quantidade: 0.9, unidade: 'lt' },
    { nome: 'Pão francês', quantidade: 1, unidade: 'kg' },
    { nome: 'Tomate', quantidade: 1, unidade: 'kg' },
  ];

  const itens = desired.map(d => {
    const found = findProduct(products, d.nome);
    return {
      nome: found ? found.nome : d.nome,
      quantidade: d.quantidade,
      unidade: d.unidade,
    };
  });

  return {
    id: 'tpl-cesta-dieese-generated',
    nome: 'Cesta Básica (DIEESE)',
    icone: '🧺',
    sistema: true,
    editavel: true,
    itens,
  };
};

const fetchAndCacheTemplatesFromCSV = async () => {
  try {
    if (typeof fetch === 'undefined') return;
    const resp = await fetch('/data/produtos.csv');
    if (!resp.ok) return;
    const txt = await resp.text();
    const rows = safeParseCSV(txt);
    if (!rows || rows.length === 0) return;
    const dieese = buildDieeseTemplateFromProducts(rows);
    writeJSON(GENERATED_KEY, [dieese]);
  } catch (e) {
    console.warn('fetchAndCacheTemplatesFromCSV error', e);
  }
};

// API pura (testável sem React)
export function createTemplatesAPI() {
  const _TEMPLATES_HARDCODED = TEMPLATES_HARDCODED.map(t => ({ ...t, sistema: true, editavel: true }));

  const listarUsuario = () => {
    return readJSON(TEMPLATES_KEY, []);
  };

  const listarTemplates = () => {
    const gerados = readJSON(GENERATED_KEY, []);
    return [..._TEMPLATES_HARDCODED, ...gerados, ...listarUsuario()];
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

// kick off background CSV fetch when running in a browser with fetch available
try {
  if (typeof fetch !== 'undefined') {
    // don't await, run in background
    fetchAndCacheTemplatesFromCSV().catch(() => {});
  }
} catch (e) {
  // ignore in non-browser/test envs
}

// Hook default para uso em componentes
export default function useTemplates() {
  return createTemplatesAPI();
}
