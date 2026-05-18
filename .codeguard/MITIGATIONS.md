Mitigações recomendadas para vulnerabilidades encontradas

Sumário:
- Semgrep: Corrigido uso inseguro de interpolação em `.github/workflows/sdd-pipeline.yml`.
- SAST (XSS): Corrigido uso de `insertAdjacentHTML` em `script.js` substituindo por criação segura de elementos.
- SCA (materialize-css): ações recomendadas abaixo.

Ações recomendadas para `materialize-css` (SCA findings - CVE):

1) Prioridade: Atualizar ou remover a dependência
- Tentar atualizar `materialize-css` para uma versão que contenha correções (se existir). Ex:

  npm view materialize-css versions
  npm install materialize-css@<versao-patch>

- Se não houver versão segura disponível, considere remover a dependência e substituir por:
  - Uma alternativa leve (Bootstrap, Pico.css, Bulma) ou
  - Implementações nativas/vanilla para os componentes usados (modal, select, toasts, autocomplete).

2) Mitigação temporária (se atualização/removal não for possível imediatamente):
- Evitar a inicialização automática (`M.AutoInit()`) e não usar componentes vulneráveis (Autocomplete, Tooltip, Toast) até que a dependência seja atualizada.
- Rever o uso do componente Autocomplete/Tooltip/Toast e evitar passar dados de usuário diretamente a APIs que geram HTML.

3) Verificação adicional
- Rodar `npm audit` e `npm audit fix` para detectar e aplicar correções automáticas.
- Revisar bundling: garantir que versões vulneráveis não sejam carregadas via CDN ou bundles antigos.

4) Automação/CI
- Adicionar uma etapa no pipeline para bloquear merges quando `trivy`/SCA reportar vulnerabilidades de severidade `HIGH` ou `CRITICAL`.

Comandos de exemplo:

```bash
# Atualizar versões (tentativa automática)
npm audit fix --force

# Listar versões disponíveis
npm view materialize-css versions --json

# Remover a dependência (exemplo) e ajustar código
npm remove materialize-css
```

Se quiser, eu aplico agora:
- A: tentar atualizar `materialize-css` para uma versão mais nova (vou checar `npm view` e aplicar `npm install`).
- B: criar issues/PR com as mudanças e o resumo das mitigações.
- C: remover `M.AutoInit()` e inicializar apenas os componentes necessários manualmente (reduz exposição).

Diga qual opção prefere que eu execute primeiro.