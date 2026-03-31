# Voice Command — Checklist Executável

Instruções rápidas antes de começar:
- Abra a aplicação em modo de desenvolvimento (`npm start`).
- Garanta permissão de microfone no navegador.
- Tenha um meio de gravar/arquivar o áudio (recomenda-se `tests/audio/`).

Checklist (executar e marcar):

- [ ] VC-01 — Remover o último item adicionado
  - Passos:
    1. Abrir app e criar/abrir uma lista.
    2. Adicionar um item (ex.: arroz).
    3. Falar: "remova o último item adicionado".
  - Resultado esperado: item removido e confirmação.

- [ ] VC-02 — Remover item por posição/nome
  - Passos:
    1. Adicionar 3 itens.
    2. Falar: "remova o item 2" ou "remova arroz".
  - Resultado esperado: item especificado removido.

- [ ] VC-03 — Adicionar item com quantidade
  - Passos:
    1. Falar: "adicionar 1 kg de arroz".
  - Resultado esperado: item adicionado com `quantity:1`, `unit:kg`.

- [ ] VC-04 — Criar nova lista por voz
  - Passos:
    1. Falar: "criar nova lista chamada festa".
  - Resultado esperado: nova lista criada com nome correto.

- [ ] VC-05 — Buscar produto
  - Passos:
    1. Falar: "procurar arroz".
  - Resultado esperado: UI filtrada por "arroz".

- [ ] VC-06 — Cancelar ação
  - Passos:
    1. Iniciar um comando e falar "cancelar" antes de confirmar.
  - Resultado esperado: operação abortada.

- [ ] VC-07 — Alterar quantidade de item
  - Passos:
    1. Ter item "arroz" na lista.
    2. Falar: "alterar a quantidade do arroz para 2".
  - Resultado esperado: quantidade atualizada.

- [ ] VC-08 — Teste em ambiente ruidoso
  - Passos:
    1. Reproduzir ruído de fundo (TV/música) e falar comando.
  - Resultado esperado: reconhecer corretamente ou pedir confirmação.

Registro de execução (preencha ao testar):
- Data:
- Ambiente (navegador/versão):
- Microfone usado:
- Texto reconhecido (ASR):
- Resultado observado:
- Severidade (alta/média/baixa):
- Arquivo de áudio (caminho em repo):

Observações:
- Salve gravações em `tests/audio/` e registre logs do parser (`useLLMParser`) para facilitar debugging.
