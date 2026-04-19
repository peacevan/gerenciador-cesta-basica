import React, { useState, useEffect, useRef } from 'react';

// Correlações hardcoded conforme spec
const CORRELACOES = {
  'café':         ['açúcar', 'leite'],
  'cafe':         ['açúcar', 'leite'],
  'macarrão':     ['molho de tomate', 'queijo parmesão'],
  'macarrao':     ['molho de tomate', 'queijo parmesão'],
  'frango':       ['tempero', 'limão', 'alho'],
  'pão de forma': ['manteiga', 'requeijão'],
  'pao de forma': ['manteiga', 'requeijão'],
  'arroz':        ['feijão', 'óleo'],
  'picanha':      ['sal grosso', 'carvão'],
  'ovo':          ['sal', 'óleo'],
  'ovos':         ['sal', 'óleo'],
  'leite':        ['café', 'achocolatado'],
};

// Normaliza para lookup
const normalizar = (str) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Retorna a primeira sugestão de correlação para um item,
 * excluindo as que já foram recusadas na sessão.
 */
export const getSugestao = (itemNome, recusados = new Set()) => {
  const norm = normalizar(itemNome);

  // Busca direta
  let sugestoes = CORRELACOES[norm] || CORRELACOES[itemNome?.toLowerCase()];

  // Busca parcial
  if (!sugestoes) {
    for (const [chave, vals] of Object.entries(CORRELACOES)) {
      if (normalizar(chave).includes(norm) || norm.includes(normalizar(chave))) {
        sugestoes = vals;
        break;
      }
    }
  }

  if (!sugestoes) return null;

  const disponivel = sugestoes.find((s) => !recusados.has(s));
  return disponivel || null;
};

/**
 * ChipSugestao
 *
 * Props:
 *   sugestao    {string}        — nome do item sugerido
 *   onSim       {() => void}    — adiciona o item sugerido
 *   onNao       {() => void}    — descarta sem adicionar
 */
const ChipSugestao = ({ sugestao, onSim, onNao }) => {
  const [visible, setVisible] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sugestao) return;
    setVisible(true);
    setSaindo(false);

    timerRef.current = setTimeout(() => {
      fechar();
    }, 5000);

    return () => clearTimeout(timerRef.current);
  }, [sugestao]);

  const fechar = () => {
    setSaindo(true);
    setTimeout(() => setVisible(false), 300);
  };

  const handleSim = () => {
    clearTimeout(timerRef.current);
    fechar();
    setTimeout(() => onSim(), 300);
  };

  const handleNao = () => {
    clearTimeout(timerRef.current);
    fechar();
    setTimeout(() => onNao(), 300);
  };

  if (!visible || !sugestao) return null;

  return (
    <div className={`chip-sugestao${saindo ? ' chip-sugestao--saindo' : ''}`} role="alert">
      <span className="chip-sugestao__icone">💡</span>
      <span className="chip-sugestao__texto">
        Adicionar <strong>{sugestao}</strong>?
      </span>
      <button
        className="chip-sugestao__btn chip-sugestao__btn--sim"
        onClick={handleSim}
        id={`chip-sim-${sugestao?.replace(/\s/g, '-')}`}
      >
        Sim
      </button>
      <button
        className="chip-sugestao__btn chip-sugestao__btn--nao"
        onClick={handleNao}
        id={`chip-nao-${sugestao?.replace(/\s/g, '-')}`}
      >
        Não
      </button>
    </div>
  );
};

export default ChipSugestao;
