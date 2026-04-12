# Especificação de Implementação — Atualização MVP v2.1

**Data:** 2026-04-12
**Repositório:** peacevan/gerenciador-cesta-basica

## Objetivo

Documentar a atualização da abordagem do MVP v2.1 para centralizar o fluxo em torno de templates pré-prontos e tornar a voz um complemento em vez da entrada principal.

O spec deve guiar a implementação dos ajustes solicitados, preservando o comportamento atual do app e reforçando a experiência "Template First".

---

## Visão Geral da Atualização

- A tela inicial vazia deve incentivar o usuário a começar por um template.
- Templates do sistema são a base do workflow e podem ser editados através da criação de cópias do tipo usuário.
- A interface principal precisa ter uma toolbar fixa no rodapé com input de autocomplete e botões de ação para Templates, Texto, Voz e Foto.
- A edição de template deve ser suportada por um modal dedicado.
- Templates devem ser persistidos localmente no `localStorage` para sobreviver ao refresh.

---

## Requisitos Funcionais

1. Fluxo "Template First"
   - Ao abrir o app com lista vazia, mostrar um banner ou CTA que direcione para seleção de templates.
   - O usuário deve poder escolher um template pronto para popular a lista.
   - Templates servem como ponto de partida e podem ser ajustados depois.

2. Templates do sistema x templates do usuário
   - Templates de sistema são entregues pelo app com `sistema: true`.
   - Quando o usuário desejar editar um template de sistema, o app deve duplicá-lo como um novo template com `sistema: false`.
   - O template duplicado deve receber um nome como `Cópia de <nome do template>` e manter relação com o original.
   - Templates do usuário podem ser atualizados e salvos no `localStorage`.

3. Modal de edição de template
   - Deve permitir editar nome, ícone e itens do template.
   - Deve listar itens atuais com campos de quantidade, unidade e remoção.
   - Deve incluir `AutocompleteInput` para adicionar itens novos diretamente no modal.
   - Deve ter botões "Cancelar" e "Salvar Template".

4. Toolbar de ação fixa no rodapé
   - Linha 1: `AutocompleteInput` + botão `+` para adicionar item rápido.
   - Linha 2: botões principais ordenados: `[Templates] [Texto] [Voz] [Foto]`.
   - O botão de templates deve abrir o modal de seleção de templates.
   - A entrada por voz permanece disponível, mas não mais como fluxo principal exclusivo.

5. Persistência
   - Novo `localStorage` key para salvar templates do usuário: `smart-list:templates`.
   - O app deve carregar templates do sistema e do usuário ao iniciar.
   - As alterações de template devem atualizar `atualizadoEm`.

6. Compatibilidade e escopo
   - Não modificar funcionalidades de backend (Netlify functions) ou outros módulos fora do MVP central.
   - Manter `useShoppingList.js`, `useVoiceRecognition.js`, `useHistorico.js` e outros módulos existentes funcionando.

---

## Arquivos a Criar

- `src/hooks/useTemplates.js`
- `src/components/ModalTemplates.jsx`
- `src/components/ModalEditarTemplate.jsx`

---

## Arquivos a Modificar

- `src/components/ListVoice.jsx`
- `src/styles/ListVoice.css`

---

## Modelos de Dados

### Template
```javascript
{
  id: String,
  nome: String,
  icone: String,
  itens: [
    {
      nome: String,
      quantidade: Number,
      unidade: String,
      precoSugerido: Number | null
    }
  ],
  editavel: Boolean,
  sistema: Boolean,
  criadoEm: String,
  atualizadoEm: String
}
```

### Item de lista
```javascript
{
  id: String,
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number | '',
  comprado: Boolean,
  fonte: String
}
```

---

## Comportamento Esperado

- Ao abrir com lista vazia, exibir banner "Comece por um template →" e botão de acesso rápido.
- Ao selecionar um template, popular a lista de compras com os itens do template.
- Se o usuário editar um template do sistema, criar um novo template de usuário em vez de alterar o original.
- O modal de edição deve permitir ajustes diretos no template antes de salvar.
- A toolbar fixa no rodapé deve manter as ações à mão e não bloquear a área principal da lista.

---

## Critérios de Aceitação

- [ ] O estado vazio exibe um CTA de templates.
- [ ] A seleção de template funciona e popula a lista corretamente.
- [ ] A edição de um template de sistema cria uma cópia editável.
- [ ] Templates do usuário salvos persistem após refresh.
- [ ] A toolbar fixa no rodapé está visível e funcional.
- [ ] A integração de voz continua disponível como ação secundária.

---

## Pontos de Validação

- Testar no navegador a abertura do app com lista vazia.
- Testar seleção e uso de templates prontos.
- Testar edição de template de sistema e verificação do novo template salvo.
- Verificar persistência em `localStorage` nas chaves relevantes.
- Testar a experiência da toolbar no rodapé em desktop e mobile.
