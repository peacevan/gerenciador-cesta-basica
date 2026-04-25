# Spec de Implantação XP — SmartList
> Documento para rodar na IA e implementar o método XP
> no projeto que já existe. Leia docs2/ antes de executar.

---

## CONTEXTO

O SmartList é um projeto React em andamento.
O XP está sendo implantado no meio do desenvolvimento,
não desde o início. O objetivo é formalizar práticas
que já existem parcialmente e adicionar as que faltam
sem quebrar o que já funciona.

---

## FASE 1 — DIAGNÓSTICO
*(executar primeiro, antes de qualquer mudança)*

### 1.1 Ler o estado atual
Ler obrigatoriamente antes de qualquer ação:
- docs2/CLAUDE.md
- docs2/COPILOT.md
- docs2/SPEC.md
- docs2/BACKLOG.md
- docs2/BUGS.md
- package.json
- netlify.toml (se existir)
- src/utils/voiceParser.js
- src/utils/normalizeProductName.js
- src/utils/voiceParser.test.js (se existir)

### 1.2 Mapear práticas XP existentes
Após a leitura, responder:

| Prática XP | Existe? | Como? |
|---|---|---|
| TDD | sim/não | onde? |
| Small Releases | sim/não | como? |
| Simple Design | sim/não | exemplo? |
| Refactoring | sim/não | exemplo? |
| Coding Standards | sim/não | onde? |
| Continuous Integration | sim/não | como? |
| Planning Game | sim/não | onde? |
| Pair Programming (IA) | sim/não | como? |

### 1.3 Identificar gaps
Listar o que está faltando para XP completo.
Não implementar ainda — apenas listar.

---

## FASE 2 — ESTRUTURA DE DOCUMENTAÇÃO XP

Criar pasta docs2/xp/ com os arquivos abaixo.
NÃO apagar nada existente em docs2/.

### 2.1 docs2/xp/XP_OVERVIEW.md

Conteúdo:

# XP no SmartList — Visão Geral

## Contexto de implantação
XP foi implantado no meio do desenvolvimento do SmartList,
após o MVP ser construído sem metodologia formal.
O objetivo é formalizar o que já existe e adicionar
o que falta — sem reescrever o projeto.

## Os 5 Valores aplicados

### Comunicação
- CLAUDE.md e COPILOT.md como contrato com a IA
- Specs atualizadas a cada ciclo
- User Stories com critério de aceite explícito

### Simplicidade
- localStorage antes de Supabase
- Regex antes de LLM
- Sem dependências sem aprovação
- Regra: "qual é a coisa mais simples que funciona?"

### Feedback
- TDD: teste antes da implementação
- Deploy automático no Netlify
- npm test antes de cada deploy
- Testar no celular antes de considerar pronto

### Coragem
- Refatorar sem medo
- Mudar decisões ruins (ex: voice input → template-first)
- Dívida técnica registrada — não ignorada

### Respeito
- Design calibrado para o público-alvo real
- Zero fricção para o usuário
- Não adicionar complexidade desnecessária

## As 12 Práticas — Status atual

| Prática | Status | Próxima ação |
|---|---|---|
| Planning Game | ⚠️ Parcial | Formalizar User Stories |
| Small Releases | ✅ Ativo | Netlify deploy contínuo |
| Metaphor | ✅ Ativo | "Waze de Preço" guia decisões |
| Simple Design | ✅ Ativo | localStorage, sem over-engineering |
| TDD | ⚠️ Parcial | Formalizar ciclo red-green-refactor |
| Refactoring | ✅ Ativo | Praticado continuamente |
| Pair Programming | ✅ Adaptado | Claude/Copilot como par |
| Collective Ownership | ✅ Adaptado | IA pode tocar qualquer parte |
| Continuous Integration | ⚠️ Parcial | Adicionar pipeline de testes |
| 40-Hour Week | ⚠️ Adaptar | Não acumular débito técnico |
| On-site Customer | ❌ Falta | Testar com usuário real |
| Coding Standards | ⚠️ Parcial | Adicionar .eslintrc |

## O Ciclo XP no SmartList

PLANNING → TDD → IMPLEMENTAÇÃO → RELEASE → FEEDBACK → RETRO

1. Selecionar User Story do USER_STORIES.md
2. Escrever teste que falha (RED)
3. Pedir para IA implementar o mínimo (GREEN)
4. Dev revisa e refatora (REFACTOR)
5. npm test — todos passando?
6. git commit (mensagem semântica)
7. Push → deploy automático Netlify
8. Testar no celular
9. Atualizar USER_STORIES.md e BUGS.md
10. Retrospectiva ao final do ciclo

## AI Pair Programming — Protocolo

A IA é o par de programação. O dev é o piloto.

DEV faz:               IA faz:
- Escreve testes       - Implementa código
- Revisa código        - Sugere refactoring
- Faz commits          - Explica decisões
- Decide a story       - Alerta sobre riscos
- Valida no celular    - Documenta mudanças

A IA NUNCA:
- Escreve testes (responsabilidade do dev)
- Faz commits (responsabilidade do dev)
- Decide qual story implementar
- Altera voiceParser sem ler o arquivo primeiro
- Cria dependências sem aprovação

---

### 2.2 docs2/xp/USER_STORIES.md

Conteúdo:

# User Stories — SmartList

## Formato padrão
"Como [usuário], quero [ação] para que [benefício]"

Estimativas:
1pt = simples (menos de 1h)
2pt = médio (1-3h)
3pt = complexo (3-8h)
5pt = muito complexo (quebrar antes de iniciar)

Status:
[ ] = pendente
[→] = em progresso
[x] = concluído

---

## SPRINT ATUAL — Lançamento MVP

### US-001 — Modo claro como padrão [1pt]
Como usuário, quero que o app abra sempre em modo claro
para que a experiência seja consistente.

- [ ] App abre em modo claro na primeira visita
- [ ] App abre em modo claro sem preferência salva
- [ ] Usuário pode trocar manualmente
- [ ] Preferência salva no localStorage

### US-002 — Ícones do rodapé visíveis [1pt]
Como usuário, quero ver todos os ícones do rodapé
em qualquer tema para que eu possa navegar sempre.

- [ ] 4 ícones visíveis no modo escuro
- [ ] 4 ícones visíveis no modo claro
- [ ] Ícone ativo: fundo #E1F5EE, cor #1D9E75

### US-003 — Parser de voz salva preço [2pt]
Como usuário, quero falar "pasta de dente 5 reais"
para que o preço seja salvo automaticamente.

- [ ] "pasta de dente 5 reais" → preco: 5.00
- [ ] "pasta de dente R$ 5,50" → preco: 5.50
- [ ] "pasta de dente $5" → preco: 5.00
- [ ] Item atualizado no localStorage
- [ ] Total do carrinho recalculado

### US-004 — Total correto no carrinho [2pt]
Como usuário, quero ver o total correto no carrinho
para que eu saiba quanto vou gastar.

- [ ] Badge mostra soma de todos os precoTotal
- [ ] Badge atualiza em tempo real
- [ ] Badge some quando carrinho vazio
- [ ] Total no rodapé igual ao badge

### US-005 — Descrição capitalizada [2pt]
Como usuário, quero ver "Açúcar Refinado" e não
"acucar refinado" para que a lista seja legível.

- [ ] UI exibe item.descricao (nunca item.nome)
- [ ] item.descricao com acentos corretos
- [ ] item.nome normalizado internamente
- [ ] Templates migrados com descricao

### US-006 — Finalizar redireciona ao histórico [2pt]
Como usuário, quero ser redirecionado ao histórico
após finalizar para ver o resumo imediato.

- [ ] "Finalizar" salva snapshot no histórico
- [ ] Redireciona para tela Histórico
- [ ] Primeira entrada = compra recém-feita
- [ ] Toast "Compra salva!" por 3 segundos
- [ ] Carrinho limpo após finalizar

---

## BACKLOG — Próximas Sprints

### US-007 — Header verde todas as telas [1pt]
- [ ] Header #1D9E75 em todas as telas
- [ ] Logo, texto e ícones brancos
- [ ] box-shadow consistente

### US-008 — Tela Mercado 100% [3pt]
- [ ] Tela completa (não modal flutuante)
- [ ] Header verde padrão
- [ ] Chips de tipo selecionáveis
- [ ] Lista Nominatim funcionando
- [ ] Label "Mercado" no rodapé

### US-009 — Itens padrão extrato [3pt]
- [ ] Linha 1: descricao em negrito
- [ ] Linha 2: qtd + unidade + preço em cinza
- [ ] Total do item à direita
- [ ] Ícone colorido da categoria

### US-010 — Separação pendentes/comprados [2pt]
- [ ] Itens marcados → seção "Comprados"
- [ ] Seção colapsável
- [ ] Contagem no cabeçalho

### US-011 — Histórico de compras [3pt]
- [ ] Cards com nome, local, data, total
- [ ] Barra de progresso de preços
- [ ] Detalhe com lista completa
- [ ] Botão "Usar de novo"

### US-012 — Waze de Preço [Fase 2]
Depende de: Supabase + Login
Quebrar em stories menores quando Supabase disponível.

---

### 2.3 docs2/xp/DEFINITION_OF_DONE.md

Conteúdo:

# Definition of Done — SmartList

Um item só está PRONTO quando TODOS os critérios
forem atendidos. Sem exceção.

## Código
- [ ] Todos os testes passando (npm test)
- [ ] Sem erros no console do browser
- [ ] Sem warnings de React
- [ ] item.descricao na UI (nunca item.nome)
- [ ] normalizeProductName não alterado

## Funcionalidade
- [ ] Critérios de aceite da User Story atendidos
- [ ] Testado no celular (não só desktop)
- [ ] Funciona em modo claro
- [ ] localStorage íntegro

## Deploy
- [ ] npm test antes do push
- [ ] Build Netlify sem erros
- [ ] URL de produção funcionando

## Documentação
- [ ] BUGS.md atualizado
- [ ] USER_STORIES.md atualizado
- [ ] SPEC.md atualizado se comportamento mudou

## Proibido chamar de Done
- "Funciona na minha máquina"
- "Vou ajustar depois"
- "O teste quebra mas o código funciona"
- "É só um detalhe visual"

---

### 2.4 docs2/xp/CODING_STANDARDS.md

Conteúdo:

# Padrões de Código — SmartList

## Linguagem e framework
- JavaScript puro (sem TypeScript)
- React funcional com hooks
- CSS inline ou módulos CSS
- Sem styled-components
- Sem novas dependências sem aprovação

## Nomenclatura
- Componentes: PascalCase → CarrinhoScreen.jsx
- Utilitários: camelCase → voiceParser.js
- Constantes: UPPER_SNAKE_CASE → CATEGORIAS
- Testes: mesmo nome + .test → voiceParser.test.js

## Formatação de dados
- Datas: dd/mm/aaaa
- Moeda: valor.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL' })
- IDs: crypto.randomUUID()
- UI: sempre item.descricao, nunca item.nome

## Mensagens de commit (Conventional Commits)
feat: adiciona parser de voz com preço
fix: corrige total do carrinho
refactor: separa nome e descricao no item
test: adiciona testes do voiceParser
docs: atualiza SPEC com tela de histórico
style: aplica header verde em todas as telas
chore: configura pipeline de testes netlify

## Proibido
- console.log em produção
- TODO sem issue no BUGS.md
- Recriar voiceParser.js do zero
- Alterar normalizeProductName sem testes
- localStorage.clear() sem confirmação
- Hardcode de texto visível ao usuário
- Dependência nova sem aprovação

---

### 2.5 docs2/xp/PLANNING_GAME.md

Conteúdo:

# Planning Game — SmartList

## Frequência
A cada ciclo (1-3 dias para projeto solo).

## Protocolo

### 1. Revisar estado atual (5 min)
- BUGS.md — bugs críticos pendentes?
- USER_STORIES.md — o que tem mais valor agora?
- Definition of Done — última story realmente concluída?

### 2. Selecionar stories (5 min)
- Máximo 3pt por ciclo de 1 dia
- Máximo 6pt por ciclo de 2-3 dias
- Prioridade: bugs críticos > valor pro usuário > polish

### 3. Escrever testes antes de codar
Para cada story:
- Identificar arquivo de teste
- Escrever casos de teste (critérios de aceite → testes)
- Confirmar que falham (RED)
- Só então passar para implementação

### 4. Protocolo com a IA
1. Mostrar o teste que falha
2. Pedir implementação mínima para passar
3. Revisar o código gerado
4. Refatorar se necessário
5. Confirmar que todos os testes passam
6. Commit com mensagem semântica

### 5. Não começar se:
- Critério de aceite não está claro
- Depende de story não concluída
- Estimativa maior que 3pt (quebrar primeiro)

## Prioridade Sprint de Lançamento
1. US-002 — Ícones rodapé (1pt) CRÍTICO
2. US-001 — Modo claro (1pt) CRÍTICO
3. US-003 — Parser voz preço (2pt) CRÍTICO
4. US-004 — Total carrinho (2pt) CRÍTICO
5. US-005 — Descrição capitalizada (2pt) IMPORTANTE
6. US-006 — Finalizar → histórico (2pt) IMPORTANTE

---

### 2.6 docs2/xp/RETROSPECTIVA.md

Conteúdo:

# Retrospectivas — SmartList

## Frequência
Ao final de cada ciclo ou sprint.
Máximo 15 minutos. Ser honesto.

## Formato

### Keep — o que funcionou
Liste o que deve continuar.

### Drop — o que atrapalhou
Liste o que deve parar.

### Try — o que tentar
Uma mudança para o próximo ciclo.

---

## Retro #0 — Diagnóstico inicial (antes do XP)

### Drop (o que estava errado antes)
- Documentação fragmentada em 15+ arquivos sem estrutura
- Perda de contexto com a IA a cada sessão
- Bugs acumulando sem critério de prioridade
- Retrabalho de layout por falta de spec consolidada
- Features sendo implementadas sem critério de aceite
- "Done" sem Definition of Done real

### Keep (o que já funcionava)
- Deploy contínuo no Netlify
- Simplicidade no stack (localStorage, sem over-engineering)
- Refactoring contínuo sem medo
- Metáfora clara ("Waze de Preço") guiando decisões
- TDD nos utilitários (voiceParser, normalizeProductName)

### Try (o que muda com XP)
- User Stories com critério de aceite antes de codar
- npm test obrigatório antes de cada deploy
- CLAUDE.md e COPILOT.md como contrato com a IA
- Definition of Done não negociável

---

## Retro #1 — [data]

### Keep
-

### Drop
-

### Try
-

### Stories concluídas
-

### Stories não concluídas (e por quê)
-

---

## FASE 3 — CONFIGURAÇÕES TÉCNICAS

### 3.1 Criar .eslintrc.json na raiz

{
  "extends": ["react-app"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}

### 3.2 Atualizar netlify.toml

Verificar se existe netlify.toml.
Se não existir, criar na raiz:

[build]
  command = "npm test -- --watchAll=false --passWithNoTests && npm run build"
  publish = "build"

[build.environment]
  CI = "true"

Se existir, adicionar o npm test no comando de build
sem remover o que já está configurado.

### 3.3 Verificar testes existentes

Rodar: npm test -- --watchAll=false

Se falhar:
- Corrigir a implementação (nunca o teste)
- Reportar quais testes falharam e por quê

---

## FASE 4 — ATUALIZAR DOCUMENTAÇÃO EXISTENTE

### 4.1 Adicionar ao final de docs2/CLAUDE.md

## Metodologia — XP

Projeto usa Extreme Programming adaptado para
desenvolvimento solo com IA.

Ciclo obrigatório:
1. User Story em docs2/xp/USER_STORIES.md
2. Teste escrito pelo dev (TDD)
3. IA implementa mínimo para passar o teste
4. Dev revisa, refatora, roda npm test
5. Dev faz commit semântico
6. Deploy automático Netlify

Antes de implementar qualquer feature:
1. Existe User Story correspondente?
2. Existe teste correspondente?
3. Definition of Done em docs2/xp/DEFINITION_OF_DONE.md

A IA nunca escreve testes.
A IA nunca faz commits.
A IA nunca decide qual story implementar.

### 4.2 Adicionar ao final de docs2/COPILOT.md

## Metodologia XP — Como trabalhar comigo

Antes de implementar qualquer coisa:
1. Ler a User Story em docs2/xp/USER_STORIES.md
2. Confirmar que existe teste escrito pelo dev
3. Implementar o MÍNIMO para passar o teste
4. Não adicionar nada além do que o teste exige
5. Sugerir refactoring após o teste passar

Se não houver teste: NÃO implementar.
Pedir ao dev para escrever o teste primeiro.

Commit messages:
feat: descrição curta da feature
fix: descrição curta do bug
refactor: descrição da refatoração
test: descrição do teste adicionado

---

## FASE 5 — VERIFICAÇÃO FINAL

Após executar todas as fases, confirmar:

- [ ] docs2/xp/XP_OVERVIEW.md criado
- [ ] docs2/xp/USER_STORIES.md criado
- [ ] docs2/xp/DEFINITION_OF_DONE.md criado
- [ ] docs2/xp/CODING_STANDARDS.md criado
- [ ] docs2/xp/PLANNING_GAME.md criado
- [ ] docs2/xp/RETROSPECTIVA.md criado
- [ ] .eslintrc.json criado na raiz
- [ ] netlify.toml atualizado
- [ ] docs2/CLAUDE.md atualizado com seção XP
- [ ] docs2/COPILOT.md atualizado com seção XP
- [ ] npm test rodando sem erros

Listar todos os arquivos criados e modificados.
Reportar qualquer problema encontrado.
