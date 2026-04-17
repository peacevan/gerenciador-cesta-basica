# 🎯 PROMPT PARA DESENVOLVIMENTO DO MVP - LISTA DE COMPRAS COM VOZ

## CONTEXTO DO PROJETO

Tenho uma aplicação web de lista de compras (HTML/CSS/JavaScript) que precisa ser finalizada como MVP funcional para usar no supermercado. O código atual está parcialmente implementado e tem alguns bugs.

**Repositório:** peacevan/gerenciador-cesta-basica  
**Linguagens:** HTML, CSS (Bootstrap/Materialize), JavaScript puro  
**Objetivo:** Criar lista de compras usando comandos de voz durante as compras

---

## ESTADO ATUAL DO CÓDIGO

- ✅ Interface básica funcionando (index.html, lista_compras.html)
- ✅ Adição manual de itens funcionando
- ✅ CSS com Materialize e Bootstrap
- ⚠️ Reconhecimento de voz iniciado mas não funcional
- ❌ Cálculo de total incorreto (calcula todos, não apenas marcados)
- ❌ Checkbox não funciona corretamente
- ❌ Sem persistência de dados (localStorage)

---

## ESCOPO DO MVP (O QUE DEVE SER IMPLEMENTADO)

### 1. RECONHECIMENTO DE VOZ FUNCIONAL ⭐ (PRIORIDADE MÁXIMA)

**Requisitos:**
- Usar Web Speech API nativa (window.webkitSpeechRecognition)
- Idioma: português brasileiro ('pt-BR')
- Reconhecimento contínuo enquanto botão pressionado
- Parser de comandos de voz para extrair: nome do produto, quantidade, unidade e preço

**Padrões de comando aceitos:**
```
"adicionar [produto] [quantidade] [unidade] [preço] reais"
"adicionar arroz 5 quilos 25 reais"
"adicionar leite 2 litros 8 reais"
"adicionar banana 3 dúzias 15 reais"
"feijão 1 quilo 7 reais e 50"
```

**Feedback visual:**
- Botão do microfone deve pulsar/animar quando estiver ouvindo
- Mostrar texto reconhecido em tempo real
- Confirmação visual quando item for adicionado
- Mensagem de erro amigável se não entender o comando

**Tratamento de erros:**
- Se não conseguir extrair todas as informações, pedir confirmação manual
- Sugerir correção se detectar valores estranhos
- Timeout após 10 segundos sem reconhecimento

---

### 2. CORREÇÕES CRÍTICAS DE FUNCIONALIDADE

#### 2.1 Sistema de Checkbox
- Cada item deve ter um checkbox funcional
- Novos itens adicionados devem vir COM checkbox MARCADO por padrão
- Checkbox deve controlar se o item entra no cálculo do total
- Estado do checkbox deve ser persistido no localStorage

#### 2.2 Cálculo de Total Correto
```javascript
// REGRA: Calcular APENAS itens com checkbox MARCADO
function calcularTotal() {
  const total = itens
    .filter(item => item.marcado === true)
    .reduce((acc, item) => acc + (item.quantidade * item.precoUn), 0);
  
  // Formatar em BRL
  return total.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
}
```

#### 2.3 Persistência com localStorage
- Salvar array de itens automaticamente a cada alteração
- Recuperar lista ao carregar a página
- Manter estado dos checkboxes
- Botão para limpar lista completamente

---

### 3. MELHORIAS DE UX PARA SUPERMERCADO

#### 3.1 Interface Mobile-First
- Botão de microfone GRANDE e fácil de tocar (min 60px)
- Textos legíveis em tela pequena (min 16px)
- Cards de itens com espaçamento generoso (fácil de tocar)
- Cores contrastantes para fácil leitura

#### 3.2 Atalhos de Teclado
- Enter no campo de preço = adicionar item
- Esc = limpar campos
- Space = ativar/desativar microfone

#### 3.3 Validações
- Não permitir adicionar item sem nome
- Quantidade deve ser > 0
- Preço deve ser >= 0
- Alertas visuais em campos inválidos

---

### 4. RECURSOS ADICIONAIS (se houver tempo)

- [ ] Botão "Limpar lista" com confirmação
- [ ] Contador de itens marcados/total
- [ ] Som de feedback ao adicionar item por voz
- [ ] Ícone de loading durante reconhecimento de voz
- [ ] Lista de produtos recentes/sugeridos

---

## ESTRUTURA DE DADOS

```javascript
// Estrutura do item na lista
const item = {
  id: Number, // timestamp ou autoincrement
  nome: String,
  quantidade: Number,
  unidade: String, // 'kg', 'lt', 'un', 'dúz', etc
  precoUn: Number, // preço unitário
  marcado: Boolean, // checkbox - default: true
  totalProduto: Number // calculado: quantidade * precoUn
};

// Array principal
let itens = [];

// localStorage key
const STORAGE_KEY = 'listaCompras';
```

---

## ARQUITETURA DO CÓDIGO

```
/gerenciador-cesta-basica
├── index.html              # Página principal (manter atual)
├── lista_compras.html      # Lista de compras (manter atual)
├── script.js               # Lógica principal (REFATORAR)
│   ├── Módulo: Reconhecimento de Voz
│   ├── Módulo: Gerenciamento de Itens
│   ├── Módulo: Cálculo de Totais
│   ├── Módulo: localStorage
│   └── Módulo: Parser de Comandos
├── styles.css              # Estilos customizados
├── MVP_PROMPT.md           # Este arquivo
└── README.md               # Atualizar com instruções de uso
```

---

## EXEMPLOS DE CÓDIGO PARA IMPLEMENTAR

### Parser de Comandos de Voz

```javascript
function parseVoiceCommand(texto) {
  // Remover artigos e normalizar
  texto = texto.toLowerCase()
    .replace(/^(adicionar|adiciona|colocar|coloca|põe)\s+/i, '')
    .trim();
  
  // Regex para extrair informações
  const patterns = {
    // "arroz 5 quilos 25 reais"
    completo: /^(.+?)\s+(\d+(?:,\d+)?)\s*(kg|quilos?|lt|litros?|un|unidades?|dúz|dúzias?)\s+(\d+(?:,\d+)?)\s*reais?/i,
    
    // "arroz 5 kg 25"
    curto: /^(.+?)\s+(\d+(?:,\d+)?)\s*(kg|lt|un|dúz)\s+(\d+(?:,\d+)?)/i
  };
  
  // Tentar match
  for (let pattern of Object.values(patterns)) {
    const match = texto.match(pattern);
    if (match) {
      return {
        nome: match[1].trim(),
        quantidade: parseFloat(match[2].replace(',', '.')),
        unidade: normalizarUnidade(match[3]),
        preco: parseFloat(match[4].replace(',', '.'))
      };
    }
  }
  
  return null; // Não conseguiu parsear
}

function normalizarUnidade(unidade) {
  const map = {
    'quilos': 'kg', 'quilo': 'kg',
    'litros': 'lt', 'litro': 'lt',
    'unidades': 'un', 'unidade': 'un',
    'dúzias': 'dúz', 'dúzia': 'dúz'
  };
  return map[unidade.toLowerCase()] || unidade;
}
```

### Reconhecimento de Voz

```javascript
let recognition = null;
let isListening = false;

function iniciarReconhecimentoVoz() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Seu navegador não suporta reconhecimento de voz. Use Chrome/Edge.');
    return;
  }
  
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;
  
  recognition.onstart = () => {
    isListening = true;
    document.getElementById('mic-button').classList.add('listening');
    mostrarFeedback('Estou ouvindo...');
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    mostrarFeedback(`Ouvi: "${transcript}"`);
    
    if (event.results[0].isFinal) {
      const item = parseVoiceCommand(transcript);
      if (item) {
        adicionarItem(item);
        mostrarFeedback('✅ Item adicionado!', 'success');
      } else {
        mostrarFeedback('❌ Não entendi. Tente: "arroz 5 quilos 25 reais"', 'error');
      }
    }
  };
  
  recognition.onerror = (event) => {
    mostrarFeedback('Erro ao ouvir: ' + event.error, 'error');
    isListening = false;
  };
  
  recognition.onend = () => {
    isListening = false;
    document.getElementById('mic-button').classList.remove('listening');
  };
  
  recognition.start();
}
```

### Persistência localStorage

```javascript
// Salvar lista
function salvarLista() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
}

// Carregar lista
function carregarLista() {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (dados) {
    itens = JSON.parse(dados);
    atualizarLista();
  }
}

// Limpar lista
function limparLista() {
  if (confirm('Deseja realmente limpar toda a lista?')) {
    itens = [];
    salvarLista();
    atualizarLista();
  }
}

// Chamar ao carregar página
window.addEventListener('DOMContentLoaded', carregarLista);
```

---

## TESTES ESSENCIAIS ANTES DE USAR NO SUPERMERCADO

### 1. Teste de Voz
- [ ] Reconhece comandos básicos corretamente
- [ ] Funciona com ruído ambiente
- [ ] Parser extrai informações corretamente
- [ ] Feedback visual funciona

### 2. Teste de Cálculo
- [ ] Total calcula apenas itens marcados
- [ ] Desmarcar item recalcula total
- [ ] Valores decimais funcionam (R$ 7,50)

### 3. Teste de Persistência
- [ ] Lista salva ao fechar navegador
- [ ] Lista recupera ao abrir novamente
- [ ] Checkboxes mantêm estado

### 4. Teste Mobile
- [ ] Interface usável em tela pequena
- [ ] Botões fáceis de tocar
- [ ] Não precisa dar zoom para ler

---

## RESULTADO ESPERADO

Ao final da implementação, o app deve:

1. ✅ Permitir adicionar itens por voz naturalmente
2. ✅ Calcular total correto apenas dos itens marcados
3. ✅ Salvar lista automaticamente
4. ✅ Funcionar bem em celular durante compras
5. ✅ Ser intuitivo sem precisar de manual

---

## PRAZO E PRIORIDADES

### PRIORITÁRIO (fazer primeiro)
1. Reconhecimento de voz funcional
2. Correção do cálculo de total
3. Sistema de checkbox funcionando

### IMPORTANTE (fazer depois)
4. Persistência localStorage
5. Melhorias de UX mobile

### OPCIONAL (se sobrar tempo)
6. Recursos adicionais

---

## COMO TESTAR

Após implementar, fazer compras reais com a lista de produtos:
- Arroz, feijão, macarrão, carne, frango, leite, ovos, frutas, legumes
- Testar em ambiente com ruído (supermercado)
- Verificar se consegue adicionar rapidamente sem tirar luvas/carregar sacolas

---

## ✅ CHECKLIST DE VALIDAÇÃO - MVP PRONTO

### Reconhecimento de Voz
- [ ] Botão de microfone visível e grande
- [ ] Reconhece "adicionar arroz 5 quilos 25 reais"
- [ ] Reconhece variações ("feijão 1 kg 7 reais e 50")
- [ ] Mostra feedback visual quando ouvindo
- [ ] Adiciona item automaticamente após reconhecer
- [ ] Mostra mensagem de erro se não entender

### Lista de Compras
- [ ] Itens aparecem na lista após adicionar
- [ ] Cada item tem checkbox funcional
- [ ] Novos itens vêm marcados por padrão
- [ ] Marcar/desmarcar recalcula total
- [ ] Pode excluir itens individualmente
- [ ] Pode editar quantidade/preço

### Cálculo
- [ ] Total calcula APENAS itens marcados
- [ ] Total atualiza ao marcar/desmarcar
- [ ] Valores decimais funcionam (R$ 7,50)
- [ ] Total exibido em formato BRL (R$ 150,00)

### Persistência
- [ ] Lista salva ao fechar navegador
- [ ] Lista carrega ao abrir novamente
- [ ] Estado dos checkboxes é mantido
- [ ] Botão limpar lista funciona

### Mobile/UX
- [ ] Interface legível em celular
- [ ] Botões fáceis de tocar (>= 44px)
- [ ] Não precisa dar zoom
- [ ] Cores com bom contraste
- [ ] Funciona offline (PWA básico opcional)

### Teste Real
- [ ] Testado com 10+ itens
- [ ] Testado em ambiente com ruído
- [ ] Funciona com mãos ocupadas
- [ ] Rápido de usar durante compras

---

## 📝 NOTAS DE DESENVOLVIMENTO

### Comandos de Voz Suportados

O sistema deve reconhecer variações naturais de fala:

**Formato completo:**
```
"adicionar [produto] [quantidade] [unidade] [preço] reais"
```

**Exemplos válidos:**
- "adicionar arroz 5 quilos 25 reais"
- "adicionar leite 2 litros 8 reais e 50"
- "colocar banana 3 dúzias 15 reais"
- "põe feijão 1 quilo 7 reais"
- "arroz 5 kg 25" (formato curto)

**Unidades aceitas:**
- Peso: kg, quilos, quilo
- Volume: lt, litros, litro
- Unidade: un, unidades, unidade
- Dúzia: dúz, dúzias, dúzia

### Compatibilidade

- **Navegadores suportados:** Chrome, Edge (Chromium)
- **Não suportados:** Firefox, Safari (não tem Web Speech API completa)
- **Recomendação:** Usar Chrome no Android para melhor experiência

### Limitações Conhecidas

1. Web Speech API requer conexão com internet
2. Reconhecimento pode ser afetado por ruído excessivo
3. Sotaques regionais podem afetar precisão
4. Necessário permissão de microfone no navegador

---

## 🚀 COMO USAR ESTE PROMPT

1. **Copie todo o conteúdo deste arquivo**
2. **Cole em uma IA de desenvolvimento** (GitHub Copilot, ChatGPT, Claude, etc.)
3. **Adicione contexto** dos arquivos atuais do projeto se necessário
4. **Implemente fase por fase** seguindo as prioridades
5. **Teste cada funcionalidade** antes de avançar para a próxima

---

**Última atualização:** 2026-03-08 05:35:48  
**Versão:** 1.0  
**Status:** Pronto para implementação