# SmartList — Voice Parser

Fontes consolidadas:
- docs/VOICE_COMMAND_SPEC.md
- docs/VOICE_COMMAND_SPEC_claude.md
- docs/VOICE_COMMAND_SPEC_copilot.md

## Escopo do parser no MVP
- Parser primário: regex local (offline, rápido, sem custo).
- Reconhecimento de voz: Web Speech API (`pt-BR`).
- Parser LLM: backlog premium (não implementar agora).

## Padrões suportados pelo regex
- Quantidade + unidade + preço
  - "2 kg 10 reais"
  - "3 unidades 7 reais e 90"
  - "um pacote oito reais"
- Apenas preço
  - "10 reais"
  - "R$ 10,50"
  - "7,90"
- Apenas quantidade + unidade
  - "duas unidades"
  - "1 lata"

Normalizações esperadas:
- Numerais por extenso para número (`um`, `uma`, `dois`, `duas`, `três`...).
- Unidades equivalentes para token padrão:
  - `kg|quilo|kilo` → `kg`
  - `g|grama` → `g`
  - `l|litro` → `l`
  - `ml` → `ml`
  - `un|unidade|und` → `und`
  - `pacote|pct` → `pct`
  - `caixa|cx` → `cx`
  - `lata` → `lata`
  - `saco` → `saco`
- Preço em reais com variações:
  - `X reais`
  - `X reais e Y`
  - `R$ X,Y`

## Contrato esperado de saída
```json
{
  "quantidade": 2,
  "unidade": "kg",
  "preco": 10,
  "sucesso": true
}
```

Regras:
- `sucesso` é `true` quando ao menos quantidade ou preço foi extraído.
- Se não houver extração útil, retornar `sucesso: false` e campos nulos.

## Exemplos de entrada e saída esperada
1.
Entrada: "2 kg 10 reais"
Saída: `{ quantidade: 2, unidade: 'kg', preco: 10.0, sucesso: true }`

2.
Entrada: "três unidades 5 reais e 50"
Saída: `{ quantidade: 3, unidade: 'und', preco: 5.5, sucesso: true }`

3.
Entrada: "um pacote oito reais"
Saída: `{ quantidade: 1, unidade: 'pct', preco: 8.0, sucesso: true }`

4.
Entrada: "10 reais"
Saída: `{ quantidade: null, unidade: null, preco: 10.0, sucesso: true }`

5.
Entrada: "duas unidades"
Saída: `{ quantidade: 2, unidade: 'und', preco: null, sucesso: true }`

6.
Entrada: "banana"
Saída: `{ quantidade: null, unidade: null, preco: null, sucesso: false }`

## Fluxo de fallback
1. Usuário fala no item expandido.
2. Web Speech API transcreve (`pt-BR`).
3. Parser regex tenta extrair quantidade/unidade/preço.
4. Se sucesso: preencher campos, mostrar badge "via regex".
5. Se falha: exibir mensagem amigável:
   "Não entendi. Tente: '2 unidades 10 reais' ou preencha abaixo."
6. Usuário pode concluir manualmente sem bloqueio.

## Regras de UX e segurança
- Não forçar confirmação destrutiva para parse simples.
- Não bloquear marcação de item por falta de preço.
- Não chamar LLM automaticamente no MVP.

## Backlog (não implementar agora)
Premium — Parser de voz LLM:
- `parserMode: 'regex' | 'llm'` no perfil.
- `llm` como parser principal para assinantes premium.
- Badge visual muda de "via regex" para "via IA".
- Requer backend persistente, política de custos e controle de plano.

## Nota de consolidação
- `docs/VOICE_COMMAND_SPEC_claude.md` e `docs/VOICE_COMMAND_SPEC_copilot.md` são adaptações resumidas da spec principal; esta versão unifica os pontos comuns e mantém o contrato único.
