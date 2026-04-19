import React, { useState, useEffect } from 'react';
import useTemplates from '../hooks/useTemplates';
import ModalEditarTemplate from './ModalEditarTemplate';

/**
 * ModalTemplates — selecionar template e adicionar/substituir itens na lista.
 *
 * Props:
 *   isOpen              {boolean}
 *   onClose             {() => void}
 *   onSubstituir        {(itens) => void}  — substitui lista atual
 *   onAdicionar         {(itens) => void}  — adiciona à lista atual
 *   listaAtual          {Array}            — itens atualmente na lista (para salvar como template)
 */
const ModalTemplates = ({ isOpen, onClose, onSubstituir, onAdicionar, listaAtual = [], templateInicial = null }) => {
  const { TEMPLATES_HARDCODED, listarUsuario, salvarComoTemplate, salvarTemplate, duplicarTemplate, excluirTemplate } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modoAcao, setModoAcao] = useState('adicionar'); // padrão: adicionar
  const [salvarNome, setSalvarNome] = useState('');
  const [mostraSalvar, setMostraSalvar] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');
  const [templatesUsuario, setTemplatesUsuario] = useState(() => listarUsuario());
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Pré-selecionar template quando recebido via prop
  useEffect(() => {
    if (isOpen && templateInicial) {
      // Busca o template completo na lista
      const todos = [...TEMPLATES_HARDCODED, ...listarUsuario()];
      const encontrado = todos.find((t) => t.id === templateInicial.templateId || t.id === templateInicial.id);
      if (encontrado) {
        setSelectedTemplate(encontrado);
        setModoAcao(null);
      }
    }
  }, [isOpen, templateInicial]);

  if (!isOpen) return null;

  const recarregarUsuario = () => setTemplatesUsuario(listarUsuario());

  const handleSelecionarTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setModoAcao(null);
  };

  const handleConfirmarAcao = () => {
    if (!selectedTemplate) return;
    const itens = selectedTemplate.itens.map((it) => ({ ...it, preco: 0 }));
    if (modoAcao === 'substituir') {
      onSubstituir(itens, selectedTemplate);
    } else {
      onAdicionar(itens, selectedTemplate);
    }
    onClose();
  };

  const handleExcluirUsuario = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Excluir este template?')) {
      excluirTemplate(id);
      recarregarUsuario();
      if (selectedTemplate && selectedTemplate.id === id) setSelectedTemplate(null);
    }
  };

  const handleEditarTemplate = (tpl, e) => {
    e.stopPropagation();
    setEditingTemplate(tpl);
  };

  const handleSalvarEdicao = (templateAtualizado) => {
    let salvo;
    if (templateAtualizado.sistema) {
      // Template do sistema: sempre criar cópia em vez de editar o original
      salvo = duplicarTemplate(templateAtualizado.id);
      // Aplicar as alterações feitas pelo usuário na cópia
      if (salvo) {
        salvo = salvarTemplate({
          ...salvo,
          nome: templateAtualizado.nome,
          icone: templateAtualizado.icone,
          itens: templateAtualizado.itens,
        });
      }
    } else {
      salvo = salvarTemplate(templateAtualizado);
    }
    setEditingTemplate(null);
    recarregarUsuario();
    if (salvo && selectedTemplate && (selectedTemplate.id === templateAtualizado.id || selectedTemplate.id === salvo.id)) {
      setSelectedTemplate(salvo);
    }
  };

  const handleSalvarLista = () => {
    if (!salvarNome.trim()) {
      setErroSalvar('Informe um nome para o template.');
      return;
    }
    if (listaAtual.length === 0) {
      setErroSalvar('A lista está vazia.');
      return;
    }
    const result = salvarComoTemplate(salvarNome.trim(), listaAtual);
    if (!result) {
      setErroSalvar('Não foi possível salvar.');
      return;
    }
    setSalvarNome('');
    setErroSalvar('');
    setMostraSalvar(false);
    recarregarUsuario();
  };

  const renderTemplateCard = (tpl, podeExcluir = false) => {
    const selecionado = selectedTemplate && selectedTemplate.id === tpl.id;
    return (
      <div
        key={tpl.id}
        className={`template-card${selecionado ? ' template-card--selected' : ''}`}
        onClick={() => handleSelecionarTemplate(tpl)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleSelecionarTemplate(tpl)}
        aria-pressed={selecionado}
      >
        <span className="template-card__icon">{tpl.icone}</span>
        <div className="template-card__info" style={{ flex: 1 }}>
          <span className="template-card__nome">{tpl.nome}</span>
          <span className="template-card__qtd">{tpl.itens.length} itens</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="template-card__editar"
            onClick={(e) => handleEditarTemplate(tpl, e)}
            aria-label={`Editar template ${tpl.nome}`}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <i className="material-icons">edit</i>
          </button>
          {podeExcluir && (
            <button
              className="template-card__excluir"
              onClick={(e) => handleExcluirUsuario(tpl.id, e)}
              aria-label={`Excluir template ${tpl.nome}`}
              style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}
            >
              <i className="material-icons">delete</i>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-templates" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h5>
            <i className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>folder</i>
            Templates
          </h5>
          <button className="btn-close-modal" onClick={onClose} aria-label="Fechar">
            <i className="material-icons">close</i>
          </button>
        </div>

        <div className="modal-body templates-body">

          {/* Templates prontos */}
          <section className="templates-section">
            <h6 className="templates-section__title">Templates prontos</h6>
            <div className="templates-grid">
              {TEMPLATES_HARDCODED.map((tpl) => renderTemplateCard(tpl, false))}
            </div>
          </section>

          {/* Templates do usuário */}
          <section className="templates-section">
            <div className="templates-section__header">
              <h6 className="templates-section__title">Meus templates</h6>
              {listaAtual.length > 0 && (
                <button
                  className="btn-salvar-lista"
                  onClick={() => { setMostraSalvar((v) => !v); setErroSalvar(''); }}
                  title="Salvar lista atual como template"
                >
                  <i className="material-icons">save</i>
                  <span>Salvar lista atual</span>
                </button>
              )}
            </div>

            {mostraSalvar && (
              <div className="salvar-template-form">
                <input
                  type="text"
                  placeholder="Nome do template..."
                  value={salvarNome}
                  onChange={(e) => setSalvarNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSalvarLista()}
                  autoFocus
                />
                <button onClick={handleSalvarLista} className="btn-submit btn-sm">
                  <i className="material-icons">check</i>
                </button>
                {erroSalvar && <p className="form-error">{erroSalvar}</p>}
              </div>
            )}

            {templatesUsuario.length === 0 ? (
              <p className="templates-empty">Nenhum template salvo ainda.</p>
            ) : (
              <div className="templates-grid">
                {templatesUsuario.map((tpl) => renderTemplateCard(tpl, true))}
              </div>
            )}
          </section>

          {/* Preview e seleção de ação */}
          {selectedTemplate && (
            <section className="templates-section templates-acao">
              <h6 className="templates-section__title">
                {selectedTemplate.icone} {selectedTemplate.nome}
                <span className="template-card__qtd" style={{ marginLeft: 8 }}>
                  {selectedTemplate.itens.length} itens
                </span>
              </h6>
              <ul className="template-preview-list">
                {selectedTemplate.itens.slice(0, 5).map((it, i) => (
                  <li key={i}>{it.nome} — {it.quantidade} {it.unidade}</li>
                ))}
                {selectedTemplate.itens.length > 5 && (
                  <li style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    ...e mais {selectedTemplate.itens.length - 5} item(ns)
                  </li>
                )}
              </ul>
              {/* Radios compactos — "Adicionar" pré-selecionado */}
              <div className="templates-acao__radios">
                <label className="templates-acao__radio-label">
                  <input
                    type="radio"
                    name="modoAcao"
                    value="adicionar"
                    checked={modoAcao === 'adicionar'}
                    onChange={() => setModoAcao('adicionar')}
                  />
                  Adicionar à lista
                </label>
                <label className="templates-acao__radio-label">
                  <input
                    type="radio"
                    name="modoAcao"
                    value="substituir"
                    checked={modoAcao === 'substituir'}
                    onChange={() => setModoAcao('substituir')}
                  />
                  Substituir lista
                </label>
              </div>
            </section>
          )}
        </div>

        {/* Footer de confirmação */}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancelar</button>
          <button
            className="btn-submit"
            disabled={!selectedTemplate}
            onClick={handleConfirmarAcao}
          >
            {modoAcao === 'substituir' ? 'Substituir' : 'Adicionar'}
          </button>
        </div>

      </div>

      <ModalEditarTemplate 
        isOpen={!!editingTemplate}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={handleSalvarEdicao}
      />
    </div>
  );
};

export default ModalTemplates;
