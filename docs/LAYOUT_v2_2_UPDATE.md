# Atualização de Layout — MVP v2.2

**Versão:** 2.2  
**Data:** 2026-04-17  
**Autor do prompt:** peacevan  
**Branch:** `feat/MVP_V2_1_implementation`  
**Status:** Aguardando implementação

---

## O que muda e por quê

Esta atualização simplifica e moderniza a interface do `ListVoice`, aproximando-a do padrão de apps mobile (estilo WhatsApp/Telegram), com foco em:

- Reduzir o número de ações visíveis no rodapé (de 5 para 3)
- Elevar o botão Salvar para o header (ação principal de fluxo)
- Consolidar importações (foto + texto) no menu ⋮ (ações secundárias)
- Substituir modal flutuante de templates por painel fullscreen (melhor UX em mobile)
- Corrigir cards de templates que ultrapassavam a largura da tela

---

## Comparativo de Mudanças

### Header

| Antes | Depois |
|---|---|
| Título + botão ⋮ | Título + `btn-salvar` (condicional) + botão ⋮ |
| Menu ⋮: tema, histórico, compartilhar, limpar | Menu ⋮: **importar foto**, **importar texto**, compartilhar, tema, histórico, limpar |
| Botão Salvar no footer | **Botão Salvar no header** |

### Footer

| Antes | Depois |
|---|---|
| 5 botões: Templates, Texto, +, Mic, Foto | **3 botões: Listas Prontas, Adicionar, Voz** |
| Total + Salvar em linha separada | Total + contagem à esquerda; botões à direita |
| Quick-add expansível | Removido (Adicionar abre modal direto) |
| Botões com ícone e texto inline | **Ícone acima, label 10px abaixo** (nav-bar mobile) |

### Modal de Templates

| Antes | Depois |
|---|---|
| Componente `ModalTemplates.jsx` sobreposto | **Painel fullscreen inline** no container |
| Overlay escuro, altura parcial | Sem overlay — ocupa 100% da tela do topo ao fundo |
| Cards em lista vertical com scroll | **Grid 2 colunas** com overflow controlado |
| Nome dos templates em font-size padrão | **font-size: 11px** para caber em 2 colunas |
| "Meus Templates" sempre visível | **Seção oculta** quando não há templates do usuário |
| Ações "Adicionar/Substituir" como radio | Botão único "Usar lista selecionada" no rodapé do painel |

### Textos Visuais

| Antes | Depois |
|---|---|
| "Templates" (labels, botões) | **"Listas Prontas"** |
| "Escolher Template →" no empty state | **"Listas Prontas →"** |
| "Cesta Básica (DIEESE)" | **"Cesta (DIEESE)"** (override no render, sem alterar hook) |

---

## Novos Elementos CSS

```
.header-right          — wrapper flex dos botões do header
.btn-salvar            — botão verde Salvar no header
.footer-nav            — container dos 3 botões
.nav-btn               — botão da nav-bar (flex-column: ícone + label)
.nav-btn.active        — cor var(--accent-primary)
.nav-btn.processing    — opacity 0.6
.modal-fullscreen      — painel fullscreen (position: absolute, z-index: 100)
.modal-fullscreen-header   — cabeçalho com título e botão fechar
.modal-fullscreen-body     — área scrollável
.modal-fullscreen-footer   — rodapé com Cancelar + Usar
.templates-grid        — grid 2 colunas para cards
.template-card         — card individual com overflow controlado
.template-card.selected    — borda colorida no card selecionado
.template-icon         — emoji do template (flex-shrink: 0)
.template-info         — nome + contagem (min-width: 0)
.template-name         — 11px, ellipsis
.template-count        — 10px, muted
.template-edit-btn     — botão de lápis no card
.section-label         — label de seção em uppercase 10px
.btn-criar-template    — botão pontilhado "Criar lista da lista atual"
```

## Elementos CSS Removidos

```
.footer-action-button  — substituído por .nav-btn
.footer-save           — Salvar foi para o header
.footer-templates      — substituído por nav-btn
.footer-texto          — movido para o menu ⋮
.footer-mic            — substituído por nav-btn
.footer-foto           — movido para o menu ⋮
.footer-top-info       — substituído por .footer-left
.footer-actions        — substituído por .footer-nav
.footer-quick-add      — removido (quick-add eliminado)
.btn-toggle-add        — removido
```

---

## Novos Estados em ListVoice.jsx

| Estado | Tipo | Valor inicial | Descrição |
|---|---|---|---|
| `templateSelecionado` | `object\|null` | `null` | Template selecionado no painel fullscreen |

## Estados Removidos

| Estado | Motivo |
|---|---|
| `showQuickAdd` | Quick-add eliminado do footer |

---

## Fluxo de Dados do Painel Fullscreen

```
listarTemplates()
  ├── .filter(t => t.sistema)    → templatesDoSistema
  └── .filter(t => !t.sistema)   → templatesdoUsuario

setTemplateSelecionado(t)          ← usuário clica num card
aplicarTemplateSelecionado()       ← usuário clica "Usar lista selecionada"
  ├── se itens.length > 0 → handleTemplatesSubstituir(itens, template)
  └── se lista vazia      → handleTemplatesAdicionar(itens, template)
setIsTemplatesOpen(false)          ← fecha o painel
setTemplateSelecionado(null)       ← limpa seleção
```

---

## Impacto em Testes

| Arquivo de teste | Impacto esperado |
|---|---|
| `ListVoice.test.js` | Possível — seletores de footer, texto "Templates" pode ter mudado |
| `ListVoice.checkbox.test.jsx` | Nenhum — estrutura da tabela não muda |
| `ModalTemplates.test.jsx` | Possível — componente não mais renderizado pelo ListVoice |

---

## Arquivos Modificados

| Arquivo | Tipo | Escopo da mudança |
|---|---|---|
| `src/components/ListVoice.jsx` | JSX | Header, footer, painel fullscreen, estados, funções de template |
| `src/styles/ListVoice.css` | CSS | Novos seletores nav-bar, modal fullscreen, grid de cards; remoção dos obsoletos |
| `src/components/__tests__/ListVoice.test.js` | Teste | Atualizar asserções de texto e seletores se necessário |

## Arquivos Não Modificados (proibidos)

`useTemplates.js`, `useShoppingList.js`, `useHistorico.js`, `useLLMParser.js`,  
`useVoiceRecognition.js`, `ModalConfirmacao.jsx`, `ModalTextoLivre.jsx`,  
`NotaFiscalUpload.jsx`, `AutocompleteInput.jsx`, `ai-proxy.mjs`

---

## Checklist de Aceitação

- [ ] Header: `btn-salvar` visível somente com itens; menu ⋮ com foto e texto
- [ ] Footer: exatamente 3 botões (Listas Prontas | Adicionar | Voz)
- [ ] Footer: ícone acima, label 10px abaixo em cada botão
- [ ] `nav-btn.active` ativo ao ouvir voz ou painel aberto
- [ ] Painel fullscreen: cobre 100% sem overlay escuro
- [ ] Cards: grid 2 colunas, sem overflow horizontal
- [ ] `template-name`: font-size 11px, ellipsis
- [ ] "Meus Templates" oculto quando vazio
- [ ] "Cesta (DIEESE)" sem "Básica"
- [ ] "Listas Prontas" em todos os textos visíveis
- [ ] `btn-criar-template` desabilitado com lista vazia
- [ ] Testes existentes passando (sem regressões)
