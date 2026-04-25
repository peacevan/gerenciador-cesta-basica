# 🧪 Roteiro de Teste Manual — Parser Offline (via Tela)

> **Versão:** 1.0 · **Data:** 2026-04-25  
> **Tela de entrada:** SmartList (`/list-voice`) → menu ⋮ → **Importar texto livre**  
> **Objetivo:** Confirmar que os 12 cenários TDD funcionam na interface real.

---

## Como acessar a tela de teste

1. Abrir o app no navegador: `http://localhost:5173/list-voice` (ou a porta configurada no seu ambiente).
2. Clicar no ícone **⋮ (menu)** no canto superior direito.
3. Escolher **"Importar texto livre"**.
4. O modal de texto livre será exibido — é onde você digitará cada frase abaixo.

> [!NOTE]
> O modal de texto livre chama `interpretar()`, que tenta o LLM primeiro.  
> Para testar **somente o parser offline**, desconecte a internet ou certifique-se de que `REACT_APP_PROXY_SECRET` não está configurado.

---

## 🟢 Grupo 1 — ADD simples (sem quantidade, com preço)

### CT-01 · `feijão 10 reais`
- **Esperado:** Ação: `adicionar`, Nome: `feijão`, Preço: `10.00`.
- **Passos:** Digitar no modal e interpretar.
- **Status:** [ ] Passou [ ] Falhou

### CT-02 · `feijão $5`
- **Esperado:** Ação: `adicionar`, Nome: `feijão`, Preço: `5.00`.
- **Status:** [ ] Passou [ ] Falhou

### CT-03 · `coloca arroz 5 reais`
- **Esperado:** Ação: `adicionar`, Nome: `arroz`, Preço: `5.00`.
- **Status:** [ ] Passou [ ] Falhou

---

## 🟡 Grupo 2 — ADD sem preço válido

### CT-04 · `feijão de reais`
- **Esperado:** Ação: `adicionar`, Nome: `feijão`, Preço: `null/zero`.
- **Status:** [ ] Passou [ ] Falhou

---

## 🔵 Grupo 3 — ADD com quantidade + unidade

### CT-05 · `1 kilo de feijão 10 reais`
- **Esperado:** Ação: `adicionar`, Nome: `feijão`, Qtd: `1`, Unidade: `kg`, Preço: `10.00`.
- **Status:** [ ] Passou [ ] Falhou

### CT-06 · `insira um quilo de arroz 10 reais`
- **Esperado:** Ação: `adicionar`, Nome: `arroz`, Qtd: `1`, Unidade: `kg`, Preço: `10.00`.
- **Status:** [ ] Passou [ ] Falhou

### CT-07 · `bote um quilo de farinha 10 reais`
- **Esperado:** Ação: `adicionar`, Nome: `farinha`, Qtd: `1`, Unidade: `kg`, Preço: `10.00`.
- **Status:** [ ] Passou [ ] Falhou

### CT-08 · `500 gramas de macarrão`
- **Esperado:** Ação: `adicionar`, Nome: `macarrão`, Qtd: `500`, Unidade: `g`.
- **Status:** [ ] Passou [ ] Falhou

---

## 🟣 Grupo 4 — ADD nome composto

### CT-09 · `farinha de mandioca 4 reais`
- **Esperado:** Ação: `adicionar`, Nome: `farinha de mandioca`, Preço: `4.00`.
- **Status:** [ ] Passou [ ] Falhou

---

## 🔴 Grupo 5 — REMOVE

### CT-10 · `tire 1 kg de arroz`
- **Pré-condição:** Ter `arroz` na lista.
- **Esperado:** Ação: `remover`, Nome: `arroz`, Qtd: `1`, Unidade: `kg`.
- **Status:** [ ] Passou [ ] Falhou

### CT-11 · `abater 1 arroz`
- **Esperado:** Ação: `remover`, Nome: `arroz`, Qtd: `1`.
- **Status:** [ ] Passou [ ] Falhou

### CT-12 · `excluir farinha`
- **Esperado:** Ação: `remover`, Nome: `farinha`.
- **Status:** [ ] Passou [ ] Falhou

---

## 📋 Resumo
**Aprovados:** ___ / 12
