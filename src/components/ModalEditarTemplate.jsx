import React, { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';

const ICONS = ['🛒', '🗓️', '☕', '🔥', '🧹', '🥗', '🍎', '🥩', '🍞', '🧼', '📋'];

const ModalEditarTemplate = ({ isOpen, onClose, template, onSave }) => {
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState('📋');
  const [itens, setItens] = useState([]);
  
  const [newItem, setNewItem] = useState({ nome: '', quantidade: '', unidade: 'un' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (template) {
      setNome(template.nome || '');
      setIcone(template.icone || '📋');
      setItens(template.itens ? [...template.itens] : []);
      setFormError('');
    }
  }, [template, isOpen]);

  if (!isOpen || !template) return null;

  const handleMudarQuantidade = (idx, qtd) => {
    const novos = [...itens];
    novos[idx].quantidade = Number(qtd) || 0;
    setItens(novos);
  };

  const handleMudarUnidade = (idx, un) => {
    const novos = [...itens];
    novos[idx].unidade = un;
    setItens(novos);
  };

  const handleRemoverItem = (idx) => {
    const novos = [...itens];
    novos.splice(idx, 1);
    setItens(novos);
  };

  const handleAdicionarItem = (e) => {
    e.preventDefault();
    if (!newItem.nome || !newItem.quantidade) {
      setFormError('Preencha o nome e quantidade do produto');
      return;
    }
    
    setItens([...itens, {
      nome: newItem.nome,
      quantidade: Number(newItem.quantidade),
      unidade: newItem.unidade || 'un'
    }]);
    
    setNewItem({ nome: '', quantidade: '', unidade: 'un' });
    setFormError('');
  };

  const handleSalvar = () => {
    if (!nome.trim()) {
      setFormError('O template precisa de um nome.');
      return;
    }
    if (itens.length === 0) {
      setFormError('Adicione pelo menos um item ao template.');
      return;
    }

    onSave({
      ...template,
      nome: nome.trim(),
      icone,
      itens
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-editar-template" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h5>
            <i className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>edit</i>
            Editar Template
          </h5>
          <button className="btn-close-modal" onClick={onClose} aria-label="Fechar">
            <i className="material-icons">close</i>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          
          {template.sistema && (
            <div className="voice-feedback info" style={{ position: 'relative', bottom: 'auto', left: 'auto', right: 'auto', marginBottom: '16px', animation: 'none' }}>
              <span className="feedback-message" style={{ fontSize: '13px' }}>
                Este é um template do sistema. Salvar criará uma cópia customizada.
              </span>
            </div>
          )}

          {formError && <p className="form-error">{formError}</p>}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '80px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Icone</label>
              <select 
                value={icone}
                onChange={e => setIcone(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--divider)' }}
              >
                {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome do Template</label>
              <input 
                type="text" 
                value={nome}
                onChange={e => setNome(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--divider)' }}
              />
            </div>
          </div>

          <form onSubmit={handleAdicionarItem} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--divider)' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Adicionar Produto</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 2, position: 'relative' }}>
                 <AutocompleteInput
                    value={newItem.nome}
                    onChange={val => setNewItem({ ...newItem, nome: val })}
                    onSelect={sug => setNewItem({
                      nome: sug.nomeBruto || sug.nome,
                      quantidade: newItem.quantidade,
                      unidade: sug.unidade || newItem.unidade
                    })}
                    placeholder="Ex: Arroz"
                  />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="number" step="0.01" min="0.01" placeholder="Qtd"
                  value={newItem.quantidade} 
                  onChange={e => setNewItem({...newItem, quantidade: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--divider)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <select 
                  value={newItem.unidade} 
                  onChange={e => setNewItem({...newItem, unidade: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--divider)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="un">un</option>
                  <option value="kg">kg</option>
                  <option value="lt">lt</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="dúz">dúz</option>
                </select>
              </div>
              <button type="submit" className="btn-submit" style={{ padding: '8px 12px', flexShrink: 0 }}>
                <i className="material-icons" style={{ fontSize: '20px', margin: 0 }}>add</i>
              </button>
            </div>
          </form>

          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {itens.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>Nenhum item neste template.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {itens.map((it, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
                    <div style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{it.nome}</div>
                    
                    <input 
                      type="number" step="0.01" min="0" value={it.quantidade}
                      onChange={(e) => handleMudarQuantidade(idx, e.target.value)}
                      style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--divider)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', textAlign: 'right' }}
                    />
                    
                    <select 
                      value={it.unidade}
                      onChange={(e) => handleMudarUnidade(idx, e.target.value)}
                      style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid var(--divider)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="lt">lt</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="dúz">dúz</option>
                    </select>

                    <button className="btn-delete" onClick={() => handleRemoverItem(idx)} style={{ padding: '4px' }}>
                      <i className="material-icons">delete</i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        <div className="modal-actions" style={{ padding: '16px 20px', borderTop: '1px solid var(--divider)' }}>
          <button onClick={onClose} className="btn-cancel">Cancelar</button>
          <button className="btn-submit" onClick={handleSalvar}>
            {template.sistema ? 'Salvar Cópia' : 'Salvar Template'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalEditarTemplate;
