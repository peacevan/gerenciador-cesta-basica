# Voice Command Spec — Claude-friendly

Esta é uma cópia da especificação de comandos de voz adaptada para uso com Claude/Anthropic-style LLMs.

Principais diferenças para Claude:
- Forneça instruções mais descritivas e exemplos de formato de saída JSON claros.
- Inclua exemplos de prompts com instruções de normalização e limites (ex.: "Retorne apenas JSON sem comentários").

Exemplo de prompt breve para Claude:

"Given the user's transcribed text and context, extract `intent`, `slots` and `confidence` as JSON. Normalize numbers and units. Return only valid JSON."

Exemplo de saída esperada (Claude):

```json
{
  "intent": "AddItem",
  "slots": {"product_name":"arroz","quantity":1,"unit":"kg"},
  "confidence": 0.92
}
```

Sincronize com `docs/VOICE_COMMAND_SPEC.md` e mantenha exemplos de prompts separados para Claude e Copilot.
