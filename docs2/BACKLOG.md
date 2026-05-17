# Backlog — SmartList
> Formato: XP + SDD + TDD + CI/CD
> Atualizado em: 11/05/2026
> Estimativas: 1pt = simples (<1h) · 2pt = médio (1–3h) · 3pt = complexo (3–8h)
> Status: [ ] pendente · [→] em progresso · [x] concluído

---

## ÉPICO 1 — Reconhecimento de Voz e Regex

> Objetivo: voz confiável, determinística, sem fragmentação, com fallback amigável.

---

### US-005 — Padrão fixo de fala com feedback de erro [3pt] 🔥
**Como** usuário adicionando item por voz,
**quero** que o app aceite apenas frases no padrão definido,
**para que** eu saiba exatamente como falar e receba ajuda quando errar.

**Padrões aceitos (regex):**
```
[produto] [quantidade] [unidade] [preço]
[quantidade] [unidade] [produto] [preço]
```

**Critérios de aceite:**
- [ ] "farinha de mandioca 1 kg 6 reais" → reconhecido corretamente
- [ ] "2 kg arroz 10 reais" → reconhecido corretamente
- [ ] "arroz de reais" → exibe feedback: "Não entendi. Tente: arroz 10 reais ou 2 kg arroz 10 reais"
- [ ] Frase fora do padrão nunca adiciona item à lista
- [ ] Feedback exibido por 4 segundos com opção de tentar novamente

**Fora do escopo:**
- NÃO usar LLM nessa story — apenas regex
- NÃO alterar o fluxo de digitação manual

---

### US-006 — Aguardar estabilização da frase antes de processar [2pt] 🔥
**Como** usuário falando pausadamente,
**quero** que o app aguarde eu terminar a frase completa,
**para que** não sejam adicionados fragmentos como "fa", "farinha de ma".

**Critérios de aceite:**
- [ ] App aguarda silêncio de 1.5s após última palavra antes de processar
- [ ] Apenas o resultado final estabilizado é enviado ao parser
- [ ] Fragmentos intermediários aparecem no input mas não são processados
- [ ] "farinha de mandioca 10 reais" → 1 item adicionado, não múltiplos fragmentos

**Fora do escopo:**
- NÃO alterar o parser de voz — apenas o timing de disparo

---

### US-007 — Produtos compostos como itens distintos [2pt] 🔥
**Como** usuário com "farinha" e "farinha de mandioca" na lista,
**quero** que sejam tratados como produtos diferentes,
**para que** atualizar um não sobrescreva o outro.

**Critérios de aceite:**
- [ ] "farinha" e "farinha de mandioca" → dois itens distintos na lista
- [ ] Falar "farinha de mandioca" não atualiza o item "farinha"
- [ ] Comparação de nome usa correspondência exata (não parcial)
- [ ] normalizeProductName aplicado antes da comparação

**Fora do escopo:**
- NÃO alterar outros comportamentos do parser

---

### US-008 — Indicadores visuais de modo ativo [1pt]
**Como** usuário,
**quero** ver qual modo está ativo (Offline / IA / Regex),
**para que** eu entenda por que o comportamento muda.

**Critérios de aceite:**
- [ ] Badge "Offline" visível quando sem conexão
- [ ] Badge "IA ativa" visível quando LLM está processando
- [ ] Badge "Regex" visível quando modo determinístico está ativo
- [ ] Badges discretos, não bloqueiam a interface

---

### US-009 — IA com maior liberdade para frases naturais [3pt]
**Como** usuário no modo LLM,
**quero** falar de forma natural sem seguir padrão rígido,
**para que** eu tenha mais flexibilidade ao adicionar itens.

**Exemplos aceitos pela IA:**
```
"2 arroz 10 reais"
"arroz 10 reais"
"3 leite"
"feijão"
"dois quilos de arroz por dez reais"
```

**Critérios de aceite:**
- [ ] Todos os exemplos acima reconhecidos e convertidos para o schema interno
- [ ] IA retorna JSON estruturado: `{ produto, quantidade, unidade, preco }`
- [ ] Fallback: se IA falhar → tenta regex → se regex falhar → exibe erro
- [ ] Modo IA nunca adiciona item com confiança abaixo do threshold definido

**Fora do escopo:**
- NÃO remover o modo regex — IA é camada adicional

---

### US-010 — Log de frases não reconhecidas [1pt]
**Como** desenvolvedor,
**quero** que frases não reconhecidas sejam logadas,
**para que** eu identifique padrões de erro em produção.

**Critérios de aceite:**
- [ ] Frase não reconhecida → salva em localStorage com timestamp
- [ ] Log acessível em tela de debug (não visível ao usuário comum)
- [ ] Máximo 50 entradas — FIFO quando lotado

---

## ÉPICO 2 — PWA e Funcionamento Offline

> Objetivo: app instalável, funcional offline, cache confiável.

---

### US-011 — PWA instalável no Android e iPhone [2pt] 🔥
**Como** usuário mobile,
**quero** instalar o SmartList na tela inicial,
**para que** acesse como app nativo sem abrir o browser.

**Critérios de aceite:**
- [ ] Manifest.json válido (ícone, nome, theme_color)
- [ ] Prompt de instalação aparece no Android (Chrome)
- [ ] Instalável no iPhone via "Adicionar à tela de início" (Safari)
- [ ] App abre sem barra de navegação do browser após instalação

---

### US-012 — Funcionamento offline completo [3pt] 🔥
**Como** usuário no supermercado sem sinal,
**quero** que o app funcione normalmente offline,
**para que** eu não perca funcionalidade na hora da compra.

**Critérios de aceite:**
- [ ] Lista carrega offline via Service Worker
- [ ] Adicionar, editar e remover itens funciona offline
- [ ] Dados persistem no localStorage sem depender de rede
- [ ] Modo regex ativo automaticamente quando offline
- [ ] Indicador visual de modo offline ativo

**Fora do escopo:**
- NÃO implementar sync com backend nessa story

---

### US-013 — Cache e atualização automática [2pt]
**Como** usuário com app instalado,
**quero** receber atualizações automaticamente,
**para que** sempre tenha a versão mais recente sem reinstalar.

**Critérios de aceite:**
- [ ] Service Worker detecta nova versão disponível
- [ ] Toast "Nova versão disponível — atualizar?" aparece
- [ ] Ao confirmar, recarrega com nova versão
- [ ] Cache antigo é limpo após atualização

---

## ÉPICO 3 — Tema e UX Visual

> Objetivo: experiência visual consistente, sem surpresas de tema.

---

### US-014 — Forçar modo claro na abertura [1pt] 🔥
**Como** usuário abrindo o app pelo LinkedIn ou link externo,
**quero** que o app abra sempre em modo claro,
**para que** a experiência visual seja consistente.

**Critérios de aceite:**
- [ ] App ignora `prefers-color-scheme` do sistema na primeira abertura
- [ ] Padrão inicial sempre modo claro
- [ ] Preferência salva no localStorage após primeira visita
- [ ] Toggle manual de tema funciona e persiste

---

### US-015 — Snackbar "desfazer" após adição por voz [2pt]
**Como** usuário que adicionou item por engano,
**quero** um snackbar com opção de desfazer,
**para que** eu corrija sem precisar procurar o item na lista.

**Critérios de aceite:**
- [ ] Após adição por voz: snackbar "Feijão — R$10,00 adicionado · Desfazer"
- [ ] Snackbar visível por 4 segundos
- [ ] Clicar "Desfazer" remove o item adicionado
- [ ] Após 4s sem ação: snackbar desaparece e item permanece
- [ ] Funciona também após erro de reconhecimento

---

### US-016 — Botão de microfone destacado [1pt]
**Como** usuário,
**quero** um botão de microfone circular e azul com feedback visual,
**para que** eu saiba claramente quando está gravando.

**Critérios de aceite:**
- [ ] Botão circular, cor azul (#3b82f6)
- [ ] Animação pulsante durante gravação ativa
- [ ] Ícone muda para "parar" durante gravação
- [ ] Centralizado corretamente na interface

---

### US-017 — Botão "Finalizar" centralizado [1pt]
**Como** usuário,
**quero** que o botão "Finalizar" esteja centralizado,
**para que** a interface fique visualmente consistente.

**Critérios de aceite:**
- [ ] Botão "Finalizar" centralizado horizontalmente
- [ ] Largura consistente com os demais botões primários
- [ ] Testado no celular (não apenas desktop)

---

## ÉPICO 4 — Histórico de Compras

> Objetivo: registrar, visualizar e reutilizar compras anteriores.

---

### US-018 — Salvar histórico ao finalizar compra [2pt]
**Como** usuário finalizando uma compra,
**quero** que a lista seja salva no histórico automaticamente,
**para que** eu possa consultar compras anteriores.

**Critérios de aceite:**
- [ ] Ao finalizar: snapshot da lista salvo no localStorage
- [ ] Snapshot inclui: itens, total, data, local (se disponível)
- [ ] Redirecionamento automático para tela de histórico
- [ ] Toast "Compra salva!" por 3 segundos
- [ ] Carrinho limpo após finalizar

---

### US-019 — Tela de histórico de compras [3pt]
**Como** usuário,
**quero** ver minhas compras anteriores,
**para que** eu compare gastos e reutilize listas.

**Critérios de aceite:**
- [ ] Cards com: nome/local, data, total, quantidade de itens
- [ ] Ordenados do mais recente para o mais antigo
- [ ] Botão "Usar de novo" recria a lista com os mesmos itens
- [ ] Botão "Ver itens" abre detalhe da compra

---

### US-020 — Exportar histórico via WhatsApp [2pt]
**Como** usuário,
**quero** compartilhar meu histórico de compras via WhatsApp,
**para que** eu divida informações com familiares.

**Critérios de aceite:**
- [ ] Botão "Compartilhar" no detalhe da compra
- [ ] Formata lista como texto legível
- [ ] Abre WhatsApp com texto pré-preenchido via deep link
- [ ] Funciona sem login ou integração de API

---

## ÉPICO 5 — Integração WhatsApp

> Objetivo: importar e exportar listas via WhatsApp sem fricção.

---

### US-021 — Exportar lista ativa via WhatsApp [1pt]
**Como** usuário,
**quero** compartilhar minha lista atual via WhatsApp,
**para que** outra pessoa possa fazer as compras por mim.

**Critérios de aceite:**
- [ ] Botão "Compartilhar lista" na tela da lista ativa
- [ ] Formata itens como texto: "• Arroz 5kg — R$24,90"
- [ ] Inclui total estimado no final
- [ ] Abre WhatsApp com texto pré-preenchido

---

### US-022 — Importar lista via WhatsApp [3pt]
**Como** usuário recebendo uma lista pelo WhatsApp,
**quero** importar diretamente para o app,
**para que** não precise digitar tudo manualmente.

**Critérios de aceite:**
- [ ] Campo para colar texto copiado do WhatsApp
- [ ] Parser interpreta o formato exportado pelo app
- [ ] Se produto já existe: merge automático (atualiza quantidade/preço)
- [ ] Se produto não existe: adiciona como novo
- [ ] Nenhum item duplicado após importação
- [ ] Preview antes de confirmar importação

**Fora do escopo:**
- NÃO integrar com API do WhatsApp Business
- NÃO acessar mensagens automaticamente

---

## ÉPICO 6 — Produtos e Categorias

> Objetivo: base de dados categorizada, editável pelo usuário.

---

### US-023 — Categorizar produtos da base de dados [2pt]
**Como** desenvolvedor,
**quero** que todos os produtos do templatesDefault.js tenham categoria,
**para que** a ordenação por categoria funcione corretamente.

**Critérios de aceite:**
- [ ] Todos os itens de templatesDefault.js com campo `categoria` preenchido
- [ ] Categorias padronizadas: Grãos, Proteínas, Laticínios, Hortifruti, Limpeza, Higiene, Outros
- [ ] Nenhum item com categoria `null` ou `undefined`

---

### US-024 — Usuário edita categoria do produto [2pt]
**Como** usuário,
**quero** editar a categoria de um produto manualmente,
**para que** a ordenação reflita minha preferência.

**Critérios de aceite:**
- [ ] Toque no item → opção "Editar categoria"
- [ ] Lista de categorias disponíveis para selecionar
- [ ] Categoria editada persiste no localStorage
- [ ] Ordenação por categoria reflete a edição imediatamente

---

### US-025 — Sugestão automática de categoria via IA [2pt]
**Como** usuário adicionando produto novo,
**quero** que o app sugira uma categoria automaticamente,
**para que** eu não precise categorizar manualmente.

**Critérios de aceite:**
- [ ] Produto novo sem categoria → IA sugere com base no nome
- [ ] Sugestão aparece como badge editável
- [ ] Usuário pode aceitar ou trocar a sugestão
- [ ] Sugestão aceita salva no localStorage

---

## RESUMO DO BACKLOG

| Épico | Stories | Pts Total | Prioridade |
|-------|---------|-----------|------------|
| 1 — Voz e Regex | US-005 a US-010 | 12pt | 🔥 Alta |
| 2 — PWA e Offline | US-011 a US-013 | 7pt | 🔥 Alta |
| 3 — Tema e UX | US-014 a US-017 | 5pt | 🔥 Alta |
| 4 — Histórico | US-018 a US-020 | 7pt | Média |
| 5 — WhatsApp | US-021 a US-022 | 4pt | Média |
| 6 — Categorias | US-023 a US-025 | 6pt | Baixa |

**Total: 21 stories · 41 pontos**

---

## SPRINT SUGERIDA — Ciclo 1 (bugs críticos)

Máx. 6pt por ciclo de 2–3 dias:

| Story | Pts | Por quê |
|-------|-----|---------|
| US-014 — Tema claro | 1pt | rápido, impacto imediato |
| US-006 — Estabilização voz | 2pt | resolve fragmentação |
| US-007 — Produtos compostos | 2pt | resolve bug crítico |
| US-017 — Botão finalizar | 1pt | rápido, pendente |

**Total: 6pt** ✅
