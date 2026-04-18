# Especificação de Comandos de Voz

## Objetivo

Definir intents, slots, fluxos de diálogo, critérios de aceitação e casos de teste para os comandos de voz do projeto `gerenciador-cesta-basica`.

Este documento serve como referência para desenvolvimento (hooks/ASR/LLM), testes e para que assistentes de código (Copilot/Claude) possam gerar código coerente.

## Escopo

- Reconhecimento de intenções (intent detection) e extração de entidades (slot filling).
- Ações suportadas: adicionar/remover/editar itens, criar listas, procurar produtos, cancelar, confirmar, desfazer.
- Multistep flows com confirmação quando necessário.

## Intents e Slots

- `AddItem`
  - slots: `product_name` (string), `quantity` (number, optional), `unit` (string, optional)
- `RemoveItem`
  - slots: `product_name` (string, optional), `position` (last|first|index, optional)
- `UpdateQuantity`
  - slots: `product_name`, `quantity`, `unit` (optional)
- `CreateList`
  - slots: `list_name` (string, optional)
- `DeleteList`
  - slots: `list_name` (string)
- `SearchProduct`
  - slots: `product_name` (string)
- `ConfirmAction`
  - slots: none (yes/no expected)
- `CancelAction`
  - slots: none
- `Undo`
  - slots: none
- `ReadList`
  - slots: none (opcional: `list_name`)

## Exemplos de Enunciados (Utterances)

- AddItem:
  - "adicionar 1 kg de arroz"
  - "coloca arroz na lista"
  - "adicione duas latas de óleo"
- RemoveItem:
  - "remova o último item adicionado"
  - "tira o arroz"
  - "remova o item 2"
- UpdateQuantity:
  - "altera a quantidade de arroz para 2"
  - "muda arroz para 3 pacotes"
- CreateList:
  - "criar nova lista chamada festa"
  - "nova lista"
- SearchProduct:
  - "procure arroz"
  - "tem feijão?"
- Generic:
  - "cancelar"
  - "sim" / "não"

## Normalização de Slots

- Quantidades: converter "um", "uma", "dois", "duas", "meio quilo" para número/decimal padrão.
- Unidades: mapear variantes ("kg", "quilo", "kilo") para token padrão `kg`.
- Nomes de produtos: aplicar normalização (lowercase, remover acentos) e usar fuzzy match com catálogo local.

## Fluxos de Diálogo (exemplos)

- Fluxo simples (AddItem com quantidade):
  1. Usuário fala: "adicionar 1 kg de arroz".
  2. System: transcrição ASR -> "adicionar 1 kg de arroz".
  3. NLU/Parser retorna: intent=`AddItem`, slots={product_name: "arroz", quantity:1, unit:"kg"}.
  4. System adiciona item e confirma: "OK, adicionei 1 kg de arroz.".

- Fluxo ambíguo (AddItem sem quantidade):
  1. Usuário: "adicionar arroz".
  2. Parser: intent=`AddItem`, slots={product_name:"arroz", quantity: null}.
  3. System pergunta: "Qual a quantidade?".
  4. Usuário responde: "1 pacote".
  5. System confirma e persiste.

- Fluxo de remoção por posição:
  1. Usuário: "remova o último item adicionado".
  2. Parser: intent=`RemoveItem`, slots={position:"last"}.
  3. System remove e fala: "Removi o último item: arroz.".

## Regras de Confirmação e Segurança

- Para ações destrutivas (ex.: `DeleteList`, `DeleteItem` com múltiplos matches) pedir confirmação.
- Timeout de confirmação: 8-12s. Se não houver resposta, cancelar a operação.
- Comando "cancelar" em qualquer momento aborta o fluxo atual.

## Política de Fallbacks e Erros

- ASR invertido / baixa confiança: pedir repetição ou confirmação curta ("Desculpe, não entendi — pode repetir?").
- NLU com baixa confiança: mostrar alternativa (listar possíveis interpretações) e perguntar qual.
- Ruído/ambiente ruidoso: diminuir sensibilidade ou sugerir usar teclado se falha consecutiva > 2 vezes.

## Integração com LLM / Parser (`useLLMParser`)

- Entrada: `raw_text` (string), `context` (lista atual, últimas intenções, lista de produtos disponíveis).
- Saída esperada: JSON
  - `intent`: string
  - `slots`: object com slots normalizados
  - `confidence`: float (0-1)

Exemplo de contrato de saída:

```json
{
  "intent": "AddItem",
  "slots": {"product_name":"arroz","quantity":1,"unit":"kg"},
  "confidence": 0.92
}
```

Diretrizes para prompts (para uso com Claude/Copilot): inclua instruções de normalização, exemplos positivos/negativos e as entidades suportadas.

## Critérios de Aceitação (por caso)

- VC-01 (remover último): ao falar "remova o último item adicionado" o sistema deve remover o último item. Aceitação: item removido e mensagem de confirmação.
- VC-03 (adicionar com quantidade): ao falar "adicionar 1 kg de arroz" o item deve aparecer com `product_name: arroz`, `quantity:1`, `unit:kg`.
- VC-08 (ambiente ruidoso): sistema deve pedir confirmação ou reprovar com mensagem amigável após 2 tentativas falhas.

Mapping completo: veja `tests/voice_command_test_plan.md` para checklist de casos (VC-01..VC-08).

## Testes e Ferramentas

- Local de gravação de amostras: `tests/audio/` (recomenda-se criar).
- Scripts de teste automatizados: criar integração com browser tests (Playwright) para simular comandos via arquivo de áudio.
- Unit tests: testar `useLLMParser` com payloads de texto e respostas simuladas.

## Métricas e Telemetria

- Taxa de sucesso por intent (per intento)
- Taxa de confirmação necessária (percentual de intents que exigiram confirmação)
- Latência total (ASR + NLU + ação)

## Notas de Implementação

- Reuse: evite misturar responsabilidades entre `useVoiceRecognition` (ASR) e `useLLMParser` (NLU); ASR apenas retorna texto e confiança.
- Logging: armazenar `raw_text`, `intent`, `slots`, `confidence`, `timestamp` em logs locais/telemetria (sem dados sensíveis).

---
Referência: `tests/voice_command_test_plan.md` (checklist de reprodução).
