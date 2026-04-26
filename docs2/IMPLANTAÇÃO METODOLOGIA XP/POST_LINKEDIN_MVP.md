# Post LinkedIn — MVP SmartList

> **Instruções de uso:**
> Copie o texto abaixo diretamente para o LinkedIn.
> Adicione o link do app nos comentários após publicar.
> Substitua os campos entre [ ] antes de publicar.

---

## VERSÃO COMPLETA

🛒 **Lancei o SmartList — um app pra ajudar famílias a montar a cesta básica mais barata**

Moro em Salvador, Bahia. Sei o que é fazer a conta no mercado antes de chegar no caixa.

O SmartList nasceu de uma pergunta simples:
**"Por que não existe um Waze de Preço para a cesta básica?"**

---

**O problema real:**

Famílias de baixa renda no Nordeste gastam uma parte desproporcional da renda em alimentação. A diferença de preço de um mesmo produto entre mercados da mesma cidade pode chegar a 40%. Mas não existe ferramenta acessível que ajude a encontrar a cesta mais barata por localização.

O SmartList é o primeiro passo pra resolver isso.

---

**O que o MVP faz hoje:**

✅ Templates de lista prontos calibrados pra realidade do Nordeste
✅ Adiciona itens por voz em tempo real no mercado
✅ Registra preço e quantidade de cada produto
✅ Calcula o total estimado da compra
✅ Salva o estabelecimento onde você comprou
✅ Histórico de compras com comparativo de gastos

---

**O que vem por aí:**

🗺️ **Waze de Preço** — ranking de cesta mais barata por localização, alimentado pelos dados de preço que os próprios usuários registram.

Cada compra registrada no app contribui para o mapa coletivo de preços. Quanto mais usuários, mais preciso o ranking.

---

**A stack:**

React · Netlify · localStorage · Web Speech API · Nominatim (OpenStreetMap)

Zero custo de infraestrutura no MVP. Construído solo com IA como par de programação.

---

**Procuro:**

🔵 Beta testers em Salvador (especialmente no Nordeste)
🔵 Feedback de quem trabalha com segurança alimentar ou políticas públicas
🔵 Devs que queiram contribuir com o projeto

---

O link está nos comentários. É gratuito, roda no browser, sem cadastro.

Se você conhece alguém que poderia se beneficiar, compartilha. 🙏

#React #JavaScript #OpenSource #Nordeste #ImpactoSocial #MVP #SmartList #DesenvolvimentoWeb

---

## VERSÃO CURTA (para Stories / repost)

Lancei o SmartList — app pra ajudar famílias a montar a cesta básica mais barata por localização.

Templates prontos + voz + histórico de preços.

Próximo passo: Waze de Preço 🗺️

Link nos comentários. Feedback bem-vindo! 🙏

#SmartList #MVP #Nordeste

---

## POST 2 — A dor sem método
*(publicar 3-5 dias após o Post 1)*

🔴 **O que deu errado antes de eu adotar uma metodologia no SmartList**

Esse post é sobre os erros. Porque mostrar só o resultado final é desonesto.

Quando comecei o SmartList não tinha metodologia nenhuma. Fui codando.

**O que aconteceu:**

📋 Documentação virou um cemitério de MDs
Tinha MVP_PROMPT.md, MVP_PROMPT_v2.md, MVP_PROMPT_v2.1.md, MVP_PROMPT_v2_1_updated.md. Quatro versões do mesmo arquivo. Nenhuma era a verdade.

🤖 Perdia contexto com a IA a cada sessão
Toda vez que abria o Copilot precisava reexplicar o projeto do zero. Às vezes ele recriava arquivos que já existiam. Às vezes reescrevia funções que não podia tocar.

🐛 Bugs acumulavam sem critério
Corrigia um bug, quebrava outro. Sem Definition of Done, nada estava realmente pronto.

🔄 Retrabalho de layout infinito
Ajustava o carrinho, descobria que precisava mudar o rodapé, que afetava a home, que afetava o histórico. Sem spec consolidada, cada tela era uma ilha.

**O turning point:**

Em determinado momento parei e percebi que já estava praticando XP sem saber.
TDD nos utilitários. Releases pequenos. Simplicidade antes de escalar. Refactoring contínuo.

Só precisava formalizar.

**O que mudou depois de implantar XP no meio do projeto:**

✅ CLAUDE.md e COPILOT.md como contrato com a IA
✅ User Stories com critério de aceite antes de codar
✅ Definition of Done — nada está pronto até passar nos testes
✅ Retrospectiva ao final de cada ciclo

Não foi perfeito. Foi no meio do caminho. Mas funcionou.

No próximo post conto como foi a implantação do XP num projeto que já existia.

#XP #ExtremeProgramming #TDD #AgileNaPratica #SmartList #JornadaDev

---

## POST 3 — XP no meio do caminho
*(publicar 5-7 dias após o Post 2)*

⚙️ **Como implantei XP num projeto que já existia — e o que mudou**

Implantar uma metodologia num projeto já em andamento é diferente de começar com ela.

Você não tem o luxo de estruturar tudo do zero. Precisa encaixar as práticas no que já existe sem quebrar o que já funciona.

**O que fiz na prática:**

**1. Consolidei a documentação**
De 15+ arquivos MDs desorganizados para 7 arquivos com responsabilidade clara:
SPEC.md · BACKLOG.md · BUGS.md · CLAUDE.md · COPILOT.md · USER_STORIES.md · DEFINITION_OF_DONE.md

**2. Formalizei o AI Pair Programming**
O protocolo virou:
→ Dev escreve o teste
→ IA implementa o mínimo para passar
→ Dev revisa e refatora
→ Dev faz o commit

A IA nunca escreve testes. A IA nunca faz commit. Isso foi transformador.

**3. Criei User Stories para o que já existia**
Retroativamente escrevi as stories das features prontas. Isso me deu clareza do que estava realmente done vs o que ainda precisava de ajuste.

**4. Pipeline de testes antes do deploy**
netlify.toml configurado para rodar npm test antes de cada build. Se um teste quebra, o deploy não sobe.

**O que o XP resolveu que eu não esperava:**

Não foi só organização. Foi clareza de decisão.

Antes: "será que devo adicionar isso agora?"
Depois: "existe uma User Story pra isso? Tem critério de aceite? Está no sprint?"

Se não está, não entra.

Simples assim.

**O que ainda não está perfeito:**

Honest answer: o On-site Customer. Não testei com usuários reais de baixa renda ainda. Esse é o próximo passo — e sem ele, o Waze de Preço não tem base.

Se você é de Salvador e quer testar o app com a família, me manda mensagem.

#XP #ExtremeProgramming #AgileNaPratica #TDD #AIPairProgramming #SmartList #JornadaDev
