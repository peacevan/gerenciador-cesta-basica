# SmartList — Spec de Telas v2.3

Fonte de verdade consolidada (prioridade):
- docs/SPEC_LAYOUT_v2_3.md
- docs/SPEC_HOME_REDESIGN.md
- docs/layout_spec/CARRINHO_UI_SPEC.md
- docs/SPEC_ITEM_EXPANDIDO_E_VOZ.md
- docs/HISTORICO_SPEC.md

## 1. Tela Home (empty state)
Estrutura visual:
- Header global com título/contexto do app.
- Corpo com título "Pronto pra montar a compra do mês?" e subtítulo orientando escolha de lista.
- Botão primário "Ver Listas Prontas".
- Chips de templates em grid 2 colunas (ordem por frequência esperada).
- Bloco "ou repita a última compra" + card de última compra (somente se houver histórico).
- Botão secundário "Adicionar item manualmente".
- Rodapé global com 4 ícones fixos.

Comportamentos e interações:
- Botão primário navega para Listas Prontas.
- Chips abrem preview do template selecionado.
- Card da última compra oferece "Ver itens" e "Usar de novo".
- Link discreto "ver histórico completo" leva para Histórico.

Estados especiais:
- Vazio sem histórico: ocultar divisor e card de última compra.
- Com histórico: exibir card com template, estabelecimento, data e valor total.
- Erro de leitura de histórico: tratar silenciosamente e renderizar como sem histórico.

O que NÃO fazer:
- Não mostrar placeholders/skeleton para card de última compra quando não houver snapshot.
- Não alterar schema de histórico/localStorage para renderizar a Home.
- Não remover o rodapé global.

## 2. Tela Listas Prontas
Estrutura visual:
- Tela completa (não modal externo), header com voltar e título "Listas Prontas".
- Grid 2 colunas de cards de template.
- Card mostra ícone/cor por categoria, nome, quantidade de itens e ação de editar.
- Último card do grid: "Criar lista".

Comportamentos e interações:
- Tocar em template disponível abre Preview de Template.
- Template já aplicado na sessão aparece com badge "adicionado" e fica não clicável.
- Estado de "adicionado" é resetado ao finalizar compra ou limpar carrinho.

Estados especiais:
- Sem templates do usuário: ocultar seção de usuário e manter templates do sistema.
- Carregando templates: manter feedback mínimo sem bloquear navegação.

O que NÃO fazer:
- Não voltar ao fluxo de modal antigo para seleção principal de template.
- Não quebrar distinção entre templates do sistema e do usuário.

## 3. Tela Preview de Template
Estrutura visual:
- Header com nome do template, contagem de itens e voltar.
- Lista scrollável com itens do template (nome/unidade).
- Barra inferior fixa com ações "Substituir" e "Mesclar".

Comportamentos e interações:
- Substituir: limpa carrinho e aplica template.
- Mesclar: mantém itens atuais e adiciona itens do template.
- Após ação: marca template como adicionado, navega para Carrinho e mostra feedback de itens adicionados.

Estados especiais:
- Template vazio: manter tela com ação de voltar e bloqueio de aplicar.

O que NÃO fazer:
- Não usar radio de seleção substituir/mesclar (decisão descartada).
- Não aplicar template sem feedback de resultado.

## 4. Tela Carrinho
Estrutura visual:
- Header com "Carrinho", progresso X/Y e menu contextual.
- Barra de progresso de 3px abaixo do header.
- Lista com duas seções: pendentes (principal) e comprados (colapsável).
- Item pendente com checkbox quadrado, nome e indicador de preço.
- Item expandido (somente pendente): bloco de voz, stepper de quantidade, preço unitário, subtotal e botão confirmar.
- Rodapé com total, contagem e botão Finalizar.
- Rodapé global abaixo (Início, Listas, Carrinho, Mercado).

Comportamentos e interações:
- Marcar/desmarcar item atualiza estado imediatamente e recalcula total/progresso.
- Itens marcados movem para seção Comprados; desmarcados retornam para Pendentes.
- Apenas um item expandido por vez.
- Bloco de voz usa Web Speech API pt-BR e parser regex.
- Ao confirmar no expandido, salvar quantidade/preço no shape do item.

Estados especiais:
- Sem preço no pendente: mostrar "— adicionar preço".
- Sem comprados: ocultar seção Comprados.
- Falha no parser de voz: mostrar mensagem amigável e manter preenchimento manual disponível.

O que NÃO fazer:
- Não chamar LLM no fluxo padrão de parser (apenas regex no MVP).
- Não exibir ícone de lixo no item recolhido (somente no expandido).
- Não forçar preenchimento de preço para marcar item como comprado.

## 5. Tela Histórico
Estrutura visual:
- Header com voltar para Home e menu ⋮.
- Cards-resumo (total de compras e média por compra).
- Lista de compras finalizadas, mais recente primeiro.
- Cada card: categoria/template, estabelecimento+data, total, totalItens e barra de progresso de preços.

Comportamentos e interações:
- Tocar no card abre Tela Detalhe de Compra.
- Ação de limpar histórico via confirmação.
- Acesso ao histórico por redirecionamento pós-finalizar, link da Home e menu do header.

Estados especiais:
- Histórico vazio: estado vazio com mensagem orientativa.

O que NÃO fazer:
- Não adicionar Histórico como item do rodapé global.
- Não quebrar compatibilidade com snapshots antigos (campos legados preservados).

## 6. Tela Detalhe de Compra
Estrutura visual:
- Header com voltar para Histórico, nome do template e badge de total.
- Linha de metadados (estabelecimento, data, total de itens).
- Lista somente leitura dos itens da compra.
- Botão fixo "Usar esta lista de novo".

Comportamentos e interações:
- Renderiza item marcado com check e item sem preço com label adequada.
- "Usar esta lista de novo" permite substituir ou mesclar com carrinho atual.
- Ao concluir ação, navegar para Carrinho.

Estados especiais:
- Snapshot não encontrado: voltar para Histórico sem quebrar navegação.

O que NÃO fazer:
- Não permitir edição de item nesta tela (é leitura).

## 7. Modal Mercado (Estabelecimento)
Estrutura visual:
- Modal existente com campos de identificação do mercado e ação de geolocalização.

Comportamentos e interações:
- Abre ao tocar ícone Mercado no rodapé global.
- Pode salvar com localização, sem localização ou cancelar.
- Geolocalização opcional com reverse geocoding (Nominatim), com fallback silencioso em falha.

Estados especiais:
- Sem permissão de localização: permitir fluxo manual sem bloquear salvamento.

O que NÃO fazer:
- Não converter ModalEstabelecimento em página.
- Não alterar estrutura do modal nesta fase.

## 8. Rodapé Global
Estrutura visual:
- Quatro ícones fixos: Início | Listas | Carrinho | Mercado.
- Item ativo com destaque visual.
- Carrinho com badge quando houver itens.

Comportamentos e interações:
- Navegação deve funcionar em todas as telas.
- Ícone Mercado abre modal e retorna para tela anterior após fechar.

Estados especiais:
- Badge do carrinho some quando quantidade é zero.

O que NÃO fazer:
- Não recolocar voz/busca como ícones fixos do rodapé global.

## 9. Componentes compartilhados
Estrutura visual/funcional:
- CardUltimoTemplate: destaque de última compra com ações rápidas.
- AutocompleteInput: sugestão local/offline com debounce e navegação por teclado.
- ModalConfirmacao: confirma ações destrutivas/substituições.
- useHistorico: catálogo local + snapshots + LRU.
- voiceParser.js: parser regex para quantidade/unidade/preço.

Comportamentos e interações:
- Persistência local automática em toda alteração relevante.
- Formatação de data em dd/mm/aaaa e moeda em BRL.

Estados especiais:
- Falhas de localStorage devem ser tratadas com degradação graciosa.

O que NÃO fazer:
- Não alterar assinatura de normalizeProductName.
- Não recriar voiceParser.js do zero quando já existir.
- Não adicionar dependência externa sem aprovação.

## Nota de consolidação
- ⚠️ Conteúdo não encontrado no arquivo de origem: docs/CLAUDE.md
- ⚠️ Conteúdo não encontrado no arquivo de origem: docs/pendencias.txt
