# Implementação da Abordagem "Template First"

Vamos alterar a abordagem principal do aplicativo para centralizar o uso de **Templates de Listas pré-prontos** ("Template First"), conforme as especificações em `MVP_PROMPT_v2.1.md`. Entendemos que a entrada por voz é imprecisa para criar listas inteiras do zero, e que a aprovação rápida de listas salvas resolve 80% do uso no dia a dia.

## Mudanças Propostas

### Hooks e Lógica Base

**Modificar `src/hooks/useTemplates.js`**
- Adicionar no state/lógica os campos `sistema` e `editavel` aos templates hardcoded (`TEMPLATES_HARDCODED`), assegurando que `sistema: true`.
- Implementar a função `atualizarTemplate(template)` para permitir edições. Atualizar a propriedade `atualizadoEm` no ato do salvamento.
- Implementar a função `duplicarTemplate(id)`. Caso o usuário tente editar um template contendo `sistema: true`, uma cópia com `sistema: false` (user-land) será criada e atrelada a ele.

---

### Componentes de Interface de Templates

**Criar `src/components/ModalEditarTemplate.jsx`**
- Um novo modal dedicado à edição das propriedades (Nome, Ícone) e dos Itens do template.
- Deve listar os itens atuais de forma simples: linhas com o Nome, input de Quantidade, seletor de Unidade e botão Remover.
- Deve possuir um campo fixo com `AutocompleteInput` no próprio modal para adicionar um novo item rapidamente ao template.
- Terá os botões "Cancelar" e "Salvar Template". Cuidará da parte de "duplicar" automaticamente se o template editado for de sistema.

**Modificar `src/components/ModalTemplates.jsx`**
- Redesenhar os cards para exibirem um botão "Editar" (junto ou além do clique que seleciona para "Usar").
- Integrar a chamada para abrir o `ModalEditarTemplate.jsx` passando os dados do template a ser editado.
- Atualizar a listagem para recarregar quando o `ModalEditarTemplate` disparar o salvamento.

---

### Tela Principal e Workflow

**Modificar `src/components/ListVoice.jsx`**
- **Painel Inicial Vazio**: Substituir o _empty state_ atual por um banner atrativo sugerindo "Comece por um template →", com um botão que abre diretamente o `ModalTemplates`.
- **Toolbar de Ferramentas (Fixa no Rodapé)**:
  - O painel de ferramentas completo (barra de busca e botões principais) irá ficar ancorado na parte inferior da tela, logo acima do componente de preços totais, seguindo as melhores práticas de UX "mobile-first" (Thumb Zone). Isso traz as seguintes vantagens:
    - *Ergonomia*: Permite alcance fácil com o dedão com apenas uma mão.
    - *Teclado Integrado*: O campo de input ao ser ativado fica logo acima do teclado virtual, gerando foco natural.
    - *Visão Desobstruída*: Concentrar as ações embaixo permite que a lista inteira ocupe mais de 80% do topo da tela sem poluição.
  - Adicionar o `AutocompleteInput` e um botão de `+` visíveis diretamente (Linha 1 do novo rodapé).
  - Reordenar botões de ação (Linha 2 do novo rodapé) para: `[📋 Templates]` (em destaque), `[📝 Texto]`, `[🎙️ Voz]`, `[📷 Foto]`, com a Voz sendo apenas mais uma das opções.
  
**Modificar `src/styles/ListVoice.css`**
- Adicionar os estilos para a nova Toolbar com duas linhas (Input na de cima e botões de ação de voz, templates, etc.) ancorada na parte inferior do layout.
- Adicionar estilo do estado vazio modificado (Banner Template).
- Remover/esconder CSS de elementos que deixarão de aparecer ou ficarão sob nova estrutura do footer.

## Plano de Validação

- Iniciar a aplicação localmente e rodar no navegador.
- Garantir que a lista vazia exiba a sugestão de templates.
- Clicar em um template de sistema -> verificar os itens listados -> editar.
- Confirmar que após alterar um template de sistema, uma cópia editável "Cópia de X" é gerada e sobrevive ao refresh no `localStorage`.
- Selecionar um template modificado e "Misturá-lo" (Adicionar) à lista principal.
- Utilizar a toolbar atualizada de `AutocompleteInput` na view principal sem abrir modais.
