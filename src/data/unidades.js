// src/data/unidades.js
// Lista de unidades de medida aceitas no SmartList.
// Estático — não precisa de banco de dados.
// Futuramente: se precisar de unidades customizadas por usuário, mover para Supabase.

const UNIDADES = [
  // ── Peso ──────────────────────────────────────────────
  {
    valor: 'kg',
    label: 'kg — Quilograma',
    grupo: 'Peso',
    exemplos: ['arroz', 'feijão', 'carne', 'frango'],
  },
  {
    valor: 'g',
    label: 'g — Grama',
    grupo: 'Peso',
    exemplos: ['café', 'fermento', 'tempero'],
  },

  // ── Volume ────────────────────────────────────────────
  {
    valor: 'lt',
    label: 'lt — Litro',
    grupo: 'Volume',
    exemplos: ['leite', 'óleo', 'suco', 'refrigerante'],
  },
  {
    valor: 'ml',
    label: 'ml — Mililitro',
    grupo: 'Volume',
    exemplos: ['extrato de tomate', 'molho', 'vinagre'],
  },

  // ── Contagem ──────────────────────────────────────────
  {
    valor: 'un',
    label: 'un — Unidade',
    grupo: 'Contagem',
    exemplos: ['ovo', 'pão', 'lata', 'pacote'],
  },
  {
    valor: 'duzia',
    label: 'dúz — Dúzia',
    grupo: 'Contagem',
    exemplos: ['ovo', 'pão de sal'],
  },
  {
    valor: 'pct',
    label: 'pct — Pacote',
    grupo: 'Contagem',
    exemplos: ['macarrão', 'biscoito', 'sabão em pó'],
  },
  {
    valor: 'cx',
    label: 'cx — Caixa',
    grupo: 'Contagem',
    exemplos: ['leite longa vida', 'suco', 'achocolatado'],
  },
  {
    valor: 'fd',
    label: 'fd — Fardo',
    grupo: 'Contagem',
    exemplos: ['água mineral', 'refrigerante', 'cerveja'],
  },

  // ── Comprimento ───────────────────────────────────────
  {
    valor: 'm',
    label: 'm — Metro',
    grupo: 'Comprimento',
    exemplos: ['papel alumínio', 'filme plástico', 'tecido'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Retorna apenas os valores (para selects simples).
 * Ex: ['kg', 'g', 'lt', 'ml', 'un', 'duzia', 'pct', 'cx', 'fd', 'm']
 */
export const getValores = () => UNIDADES.map(u => u.valor);

/**
 * Retorna unidades agrupadas por categoria (para selects com optgroup).
 * Ex: { Peso: [...], Volume: [...], Contagem: [...] }
 */
export const getAgrupadas = () =>
  UNIDADES.reduce((acc, u) => {
    if (!acc[u.grupo]) acc[u.grupo] = [];
    acc[u.grupo].push(u);
    return acc;
  }, {});

/**
 * Retorna o label de exibição de uma unidade pelo valor.
 * Ex: getLabelPorValor('kg') → 'kg — Quilograma'
 */
export const getLabelPorValor = (valor) =>
  UNIDADES.find(u => u.valor === valor)?.label ?? valor;

export default UNIDADES;
