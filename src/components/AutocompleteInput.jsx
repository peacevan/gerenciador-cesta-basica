import React, { useState, useEffect, useRef } from 'react';
import useHistorico from '../hooks/useHistorico.js';

export default function AutocompleteInput({ value, onChange, onSelect, placeholder }) {
  const { buscar } = useHistorico();
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const q = (query || '').trim();
      if (q.length >= 2) {
        try {
          const results = await buscar(q);
          setSuggestions(results || []);
          setOpen(true);
        } catch (e) { setSuggestions([]); setOpen(false); }
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, buscar]);

  const handleSelect = (sug) => {
    setOpen(false);
    if (onSelect) onSelect(sug);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className="autocomplete" ref={ref}>
      <input
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); if (onChange) onChange(e.target.value); }}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="autocomplete-list" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={false}
              className="autocomplete-item"
              onClick={() => handleSelect(s)}
            >
              <div className="autocomplete-item__nome">{s.nomeBruto || s.nome}</div>
              <div className="autocomplete-item__meta">
                {s.unidade ? <span>{s.unidade}</span> : null}
                {s.precoUltimo != null ? <span>R$ {Number(s.precoUltimo).toFixed(2)}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
