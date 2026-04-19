# Voice Command Spec — Copilot-friendly

Este arquivo é uma cópia da especificação de comandos de voz adaptada para geração/assistência via GitHub Copilot.

Principais diferenças para Copilot:
- Inclua exemplos de código pequenos (JS/TS) e contratos de função — Copilot tende a completar com base em exemplos.
- Use JSDoc em exemplos de hooks para facilitar a geração de tipos e testes.

Conteúdo base (duplicado de `docs/VOICE_COMMAND_SPEC.md`):

(Veja `docs/VOICE_COMMAND_SPEC.md` para a especificação completa — mantenha ambos sincronizados.)

Exemplo de prompt/contract para `useLLMParser` (Copilot):

```js
/**
 * Parse voice text into an intent object.
 * @param {string} rawText
 * @returns {{intent: string, slots: Object, confidence: number}}
 */
function parseVoice(rawText) {
  // implementação esperada por exemplo
}
```

Recomendações de uso com Copilot:
- Forneça exemplos positivos/negativos inline.
- Adicione testes unitários simples próximos ao hook para que Copilot sugira implementações de teste.
