# SPEC — Layout & UX Redesign v2.2 — ListVoice

**Versão:** 2.2  
**Data:** 2026-04-17  
**Status:** Aprovado para implementação  
**Branch alvo:** `feat/MVP_V2_1_implementation`  
**Componente raiz:** `src/components/ListVoice.jsx`  
**CSS raiz:** `src/styles/ListVoice.css`

---

## 1. Visão Geral

Esta spec descreve as mudanças de layout e UX para a versão 2.2 do MVP, focadas em:

- Simplificar o rodapé para 3 botões estilo nav-bar mobile (padrão WhatsApp/Telegram)
- Mover o botão Salvar para o header
- Mover ações de importação (foto + texto) para o menu ⋮
- Substituir o componente `ModalTemplates` por um painel fullscreen interno ao `ListVoice`
- Corrigir o grid de cards de templates (2 colunas, overflow controlado)
- Renomear textos visuais: "Templates" → "Listas Prontas"
- Ocultar seção "Meus Templates" quando vazia
- Encurtar nome: "Cesta Básica (DIEESE)" → "Cesta (DIEESE)" *(ver restrição §9)*

---

## 2. Escopo de Arquivos

### Arquivos a modificar
| Arquivo | Tipo de mudança |
|---|---|
| `src/components/ListVoice.jsx` | Estrutura JSX completa do header, footer, modal fullscreen |
| `src/styles/ListVoice.css` | Novos seletores para nav-btn, modal fullscreen, template-card |
| `src/components/ModalTemplates.jsx` | Pode ser aposentado ou reduzido a helper interno *(ver §8)* |

### Arquivos proibidos (não tocar)
| Arquivo |
|---|
| `src/hooks/useTemplates.js` |
| `src/hooks/useShoppingList.js` |
| `src/hooks/useHistorico.js` |
| `src/hooks/useLLMParser.js` |
| `src/hooks/useVoiceRecognition.js` |
| `src/components/ModalConfirmacao.jsx` |
| `src/components/ModalTextoLivre.jsx` |
| `src/components/NotaFiscalUpload.jsx` |
| `src/components/AutocompleteInput.jsx` |
| `netlify/functions/ai-proxy.mjs` |

---

## 3. Header

### Estado atual
```jsx
<div className="list-voice-header">
  <h4 className="header-title">
    <i className="material-icons">mic</i>
    Lista de Compras
  </h4>
  <button className="btn-config" onClick={toggleMenu}>⋮</button>
  {/* config-menu sem Importar, sem Salvar */}
</div>
```

### Estado novo
```jsx
<div className="list-voice-header">
  <h4 className="header-title">
    <i className="material-icons">mic</i>
    Lista de Compras
  </h4>
  <div className="header-right">
    {itens.length > 0 && (
      <button className="btn-salvar" onClick={handleSaveList}>
        <i className="material-icons">save</i>
        Salvar
      </button>
    )}
    <button className="btn-config" onClick={toggleMenu} aria-label="Menu">
      <i className="material-icons">more_vert</i>
    </button>
  </div>
</div>
```

### Menu ⋮ — itens revisados
| Ícone | Label | Ação | Condição |
|---|---|---|---|
| `photo_camera` | Importar foto de nota | `openNotaModal()` | sempre |
| `article` | Importar texto livre | `openTextoModal()` | sempre |
| `share` | Compartilhar lista | `shareList()` | `itens.length > 0` |
| `dark_mode` / `light_mode` | Modo escuro / claro | `toggleTheme()` | sempre |
| `delete_sweep` | Limpar lista | `handleClearList()` | `itens.length > 0` |

> **Histórico** permanece no menu (não deve ser removido).

### CSS novo
```css
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-salvar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-salvar i {
  font-size: 16px;
}
```

---

## 4. Rodapé — Nav-bar 3 botões

### Estado atual
5 botões no footer (Templates, Texto, +, Mic, Foto) + total + Salvar.

### Estado novo — estrutura JSX
```jsx
<footer className="list-voice-footer">
  <div className="footer-left">
    <h5 className="footer-total">
      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </h5>
    <p className="footer-items-count">
      {qtdMarcados} / {qtdTotal} itens
    </p>
  </div>

  <div className="footer-nav">
    <button
      className={`nav-btn${isTemplatesOpen ? ' active' : ''}`}
      onClick={() => setIsTemplatesOpen(true)}
    >
      <i className="material-icons">grid_view</i>
      <span>Listas Prontas</span>
    </button>

    <button
      className="nav-btn"
      onClick={() => setIsModalOpen(true)}
    >
      <i className="material-icons">search</i>
      <span>Adicionar</span>
    </button>

    <button
      className={`nav-btn${isListening ? ' active' : ''}${isProcessing ? ' processing' : ''}`}
      onClick={isListening ? stopListening : startListening}
      disabled={isProcessing}
    >
      <i className="material-icons">
        {isProcessing ? 'hourglass_top' : 'mic'}
      </i>
      <span>Voz</span>
    </button>
  </div>
</footer>
```

### CSS novo
```css
.list-voice-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 10px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--divider);
}

.footer-nav {
  display: flex;
  align-items: center;
  gap: 0;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 14px;
  min-width: 64px;
}

.nav-btn i { font-size: 22px; }

.nav-btn span {
  font-size: 10px;
  font-weight: 400;
  white-space: nowrap;
}

.nav-btn.active  { color: var(--accent-primary); }
.nav-btn.processing { opacity: 0.6; }
```

> **Removidos do footer:** botão Salvar (vai para o header), botão Foto, botão Texto, toggle quick-add.

---

## 5. Modal Listas Prontas — Fullscreen interno

O `ModalTemplates` externo **não** é mais invocado via `isTemplatesOpen`. Em vez disso, um painel fullscreen é renderizado diretamente dentro do `div.list-voice-container`.

### Novos estados necessários
```js
// já existem:
const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
// adicionar:
const [templateSelecionado, setTemplateSelecionado] = useState(null);
```

### Estrutura JSX do painel
```jsx
{isTemplatesOpen && (
  <div className="modal-fullscreen">
    {/* Cabeçalho do painel */}
    <div className="modal-fullscreen-header">
      <div className="modal-fullscreen-title">
        <i className="material-icons">grid_view</i>
        Listas Prontas
      </div>
      <button className="btn-close-modal"
              onClick={() => { setIsTemplatesOpen(false); setTemplateSelecionado(null); }}>
        <i className="material-icons">close</i>
      </button>
    </div>

    {/* Corpo com scroll */}
    <div className="modal-fullscreen-body">
      <p className="section-label">LISTAS PRONTAS</p>
      <div className="templates-grid">
        {templatesDoSistema.map(t => (
          <div
            key={t.id}
            className={`template-card${templateSelecionado?.id === t.id ? ' selected' : ''}`}
            onClick={() => setTemplateSelecionado(t)}
          >
            <span className="template-icon">{t.icone}</span>
            <div className="template-info">
              <div className="template-name">{t.nome}</div>
              <div className="template-count">{t.itens.length} itens</div>
            </div>
            <button className="template-edit-btn"
                    onClick={e => { e.stopPropagation(); abrirEdicaoTemplate(t); }}>
              <i className="material-icons">edit</i>
            </button>
          </div>
        ))}
      </div>

      {/* Meus Templates — só renderiza se existir */}
      {templatesdoUsuario.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 16 }}>MEUS TEMPLATES</p>
          <div className="templates-grid">
            {templatesdoUsuario.map(t => (
              <div
                key={t.id}
                className={`template-card${templateSelecionado?.id === t.id ? ' selected' : ''}`}
                onClick={() => setTemplateSelecionado(t)}
              >
                <span className="template-icon">{t.icone}</span>
                <div className="template-info">
                  <div className="template-name">{t.nome}</div>
                  <div className="template-count">{t.itens.length} itens</div>
                </div>
                <button className="template-edit-btn"
                        onClick={e => { e.stopPropagation(); abrirEdicaoTemplate(t); }}>
                  <i className="material-icons">edit</i>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Criar novo template */}
      <button
        className="btn-criar-template"
        onClick={criarTemplateFromLista}
        disabled={itens.length === 0}
      >
        <i className="material-icons">add</i>
        Criar lista a partir da lista atual
      </button>
    </div>

    {/* Rodapé do painel */}
    <div className="modal-fullscreen-footer">
      <button className="btn-cancel"
              onClick={() => { setIsTemplatesOpen(false); setTemplateSelecionado(null); }}>
        Cancelar
      </button>
      <button
        className="btn-usar-template"
        onClick={() => aplicarTemplateSelecionado()}
        disabled={!templateSelecionado}
      >
        Usar lista selecionada
      </button>
    </div>
  </div>
)}
```

### Derivações de dados necessárias
```js
// No corpo do componente, após listarTemplates():
const todosTemplates   = listarTemplates();
const templatesDoSistema  = todosTemplates.filter(t => t.sistema);
const templatesdoUsuario  = todosTemplates.filter(t => !t.sistema);
```

### Função aplicarTemplateSelecionado
```js
const aplicarTemplateSelecionado = () => {
  if (!templateSelecionado) return;
  // Se lista não vazia, pergunta se substitui ou adiciona
  if (itens.length > 0) {
    // reusar fluxo existente handleTemplatesSubstituir/handleTemplatesAdicionar
    // ou abrir ModalConfirmacao
    handleTemplatesSubstituir(templateSelecionado.itens, templateSelecionado);
  } else {
    handleTemplatesAdicionar(templateSelecionado.itens, templateSelecionado);
  }
  setIsTemplatesOpen(false);
  setTemplateSelecionado(null);
};
```

> **Nota:** a lógica de substituir vs. adicionar pode ser expandida conforme necessidade (ver §8.1).

---

## 6. CSS do Modal Fullscreen

```css
.modal-fullscreen {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-primary);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--divider);
  flex-shrink: 0;
}

.modal-fullscreen-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.modal-fullscreen-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.modal-fullscreen-footer {
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--divider);
  flex-shrink: 0;
}

.modal-fullscreen-footer .btn-cancel {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--divider);
  background: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.modal-fullscreen-footer .btn-usar-template {
  flex: 2;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: var(--accent-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.modal-fullscreen-footer .btn-usar-template:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 7. CSS do Grid de Cards

```css
.templates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider);
  border-radius: 8px;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  transition: border-color 0.15s;
}

.template-card.selected {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 8%, transparent);
}

.template-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.template-name {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-count {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.template-edit-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.template-edit-btn i { font-size: 14px; }

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.btn-criar-template {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background: none;
  border: 1px dashed var(--divider);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-criar-template:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## 8. Decisões de Arquitetura

### 8.1 — ModalTemplates.jsx vs. painel inline
O `ModalTemplates.jsx` atual fornece lógica adicional (edição, salvar como template, duplicar, excluir). A abordagem recomendada é:

**Opção A — Substituição total (recomendada para v2.2):**
- O painel fullscreen inline em `ListVoice.jsx` assume toda a lógica de seleção
- `ModalEditarTemplate.jsx` continua sendo usado para edição inline via `abrirEdicaoTemplate(t)`
- `ModalTemplates.jsx` pode ser mantido como dead code ou removido ao fim da sprint

**Opção B — Wrapper (implementação conservadora):**
- `isTemplatesOpen` abre o painel interno de seleção visual
- Ao confirmar, o fluxo atual `onSubstituir`/`onAdicionar` é mantido internamente
- `ModalTemplates.jsx` não é mais invocado diretamente pelo `ListVoice.jsx`

> A implementação seguirá a Opção A.

### 8.2 — "Cesta Básica (DIEESE)" → "Cesta (DIEESE)"
O nome está definido em `src/hooks/useTemplates.js` (linha 67 e 156), que está na lista de arquivos proibidos.

**Resolução:** O nome exibido no card pode ser formatado via display override no JSX:
```jsx
<div className="template-name">
  {t.nome.replace('Cesta Básica', 'Cesta')}
</div>
```
Isso não altera o hook — apenas o texto visual.

### 8.3 — Estado `showQuickAdd`
Com o novo footer de 3 botões, o `showQuickAdd` e o `footer-quick-add` podem ser removidos. O botão "Adicionar" no nav abre diretamente o modal existente.

### 8.4 — CardUltimoTemplate e empty state
O empty state com `CardUltimoTemplate` e botão "Escolher Template" permanece. O botão "Escolher Template" passa a abrir o painel interno (`setIsTemplatesOpen(true)`).

---

## 9. Restrições e Alertas

| # | Restrição | Detalhe |
|---|---|---|
| R1 | `useTemplates.js` proibido | Não alterar; usar display override para renomear "Cesta" |
| R2 | `ModalTextoLivre` proibido | Apenas invocar via `openTextoModal()` |
| R3 | `NotaFiscalUpload` proibido | Apenas invocar via `openNotaModal()` |
| R4 | Testes devem passar | `ListVoice.test.js` e `ListVoice.checkbox.test.jsx` podem precisar atualização |
| R5 | `color-mix()` IE/Safari <16 | Fallback: usar `rgba` estático como alternativa ao `color-mix` |

---

## 10. Critérios de Aceitação

- [ ] Header tem `header-right` com `btn-salvar` (só visível com `itens.length > 0`) e `btn-config` (⋮)
- [ ] Menu ⋮ contém: importar foto, importar texto, compartilhar, tema, histórico, limpar
- [ ] Rodapé tem exatamente 3 botões: Listas Prontas | Adicionar | Voz
- [ ] Cada botão do rodapé: ícone 22px acima, label 10px abaixo
- [ ] `nav-btn.active` aplica `var(--accent-primary)` na cor
- [ ] Modal Listas Prontas ocupa 100% do container (position: absolute, z-index: 100)
- [ ] Cards renderizados em grid 2 colunas sem overflow horizontal
- [ ] `template-name` com `font-size: 11px`
- [ ] Seção "MEUS TEMPLATES" oculta quando `templatesdoUsuario.length === 0`
- [ ] Painel exibe "Cesta (DIEESE)" sem a palavra "Básica"
- [ ] "Listas Prontas" em todos os textos visíveis (nav-btn, título do painel, section-label, empty state)
- [ ] `btn-criar-template` desabilitado quando `itens.length === 0`
- [ ] `ModalTemplates.jsx` não é mais renderizado diretamente pelo `ListVoice.jsx`
- [ ] Testes existentes passam após ajustes de seletor se necessário

---

## 11. Testes Impactados

| Arquivo | Mudança esperada |
|---|---|
| `ListVoice.test.js` | Verificar se seletores de footer/header ainda batem |
| `ListVoice.checkbox.test.jsx` | Nenhuma mudança esperada (estrutura da tabela não muda) |
| `ModalTemplates.test.jsx` (se existir) | Pode ficar obsoleto dependendo da abordagem adotada |

---

## 12. Histórico de Versões do Spec

| Versão | Data | Descrição |
|---|---|---|
| v2.2 | 2026-04-17 | Criação inicial — rodapé 3 botões, modal fullscreen, grid de cards |
| v2.1 | 2026-04-17 | Layout anterior — grid CSS, header neutro, ModalTemplates com radio |
