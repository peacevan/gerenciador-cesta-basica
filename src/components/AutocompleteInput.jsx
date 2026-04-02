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

  return (
    <div className="autocomplete" ref={ref} style={{ position: 'relative' }}>
      <input value={query} placeholder={placeholder} onChange={e => { setQuery(e.target.value); if (onChange) onChange(e.target.value); }} />
      {open && suggestions.length > 0 && (
        <ul className="autocomplete-list" style={{ position: 'absolute', zIndex: 40, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', width: '100%', listStyle: 'none', margin: 0, padding: 0 }}>
          {suggestions.map((s, i) => (
            <li key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => handleSelect(s)}>
              <div style={{ fontWeight: 600 }}>{s.nomeBruto || s.nome}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{s.unidade || ''} · {s.precoUltimo != null ? `R$ ${Number(s.precoUltimo).toFixed(2)}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
