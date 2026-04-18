# Roteiro de Teste — Comandos de Voz

## Objetivo
- Registrar cenários de reprodução para comandos de voz que apresentam comportamento incorreto, para facilitar correção futura.

## Ambiente
- Aplicação: gerenciador-cesta-basica (branch atual)
- Plataforma: navegador (Chrome/Edge/Firefox) e mobile (se aplicável)
- Microfone: integrado / headset
- Observações: anotar versão do build e data ao executar os testes.

## Instruções gerais
1. Abrir a aplicação e garantir permissão de microfone.
2. Reproduzir o cenário conforme passos.
3. Registrar o texto reconhecido (se possível via logs ou console), resultado observado e severidade.
4. Anexar gravação de áudio quando disponível.

---

## Casos de teste (check-list)

- [ ] VC-01 — remova o último item adicionado
  - Texto reconhecido: (preencher)
  - Passos:
    1. Abrir app e criar/abrir uma lista.
    2. Adicionar um item A (ex.: arroz).
    3. Falar: "remova o último item adicionado".
  - Resultado esperado: item A é removido da lista.
  - Resultado atual: (preencher)
  - Severidade: alta
  - Notas: anexar gravação e log do ASR/intent.

- [ ] VC-02 — remova o item 2 / remova arroz
  - Texto reconhecido: (preencher)
  - Passos: adicionar 3 itens; falar para remover um específico.
  - Resultado esperado: o item especificado é removido.
  - Resultado atual: (preencher)
  - Severidade: média

- [ ] VC-03 — adiciona banana / adicionar 1 kg de banana
  - Texto reconhecido: (preencher)
  - Passos: falar comando de adicionar produto com quantidade.
  - Resultado esperado: produto "banana" com quantidade correta é adicionado.
  - Resultado atual: (preencher)
  - Severidade: média

- [ ] VC-04 — criar nova lista / nova lista chamada festa
  - Texto reconhecido: (preencher)
  - Passos: falar comando para criar nova lista.
  - Resultado esperado: nova lista criada com nome correto.
  - Resultado atual: (preencher)
  - Severidade: baixa

- [ ] VC-05 — procurar produto arroz
  - Texto reconhecido: (preencher)
  - Passos: falar comando de busca por produto.
  - Resultado esperado: lista de produtos filtrada por "arroz".
  - Resultado atual: (preencher)
  - Severidade: média

- [ ] VC-06 — cancela / cancelar ação
  - Texto reconhecido: (preencher)
  - Passos: iniciar um comando e, antes de confirmar, falar "cancelar".
  - Resultado esperado: operação em andamento é cancelada.
  - Resultado atual: (preencher)
  - Severidade: baixa

- [ ] VC-07 — alterar quantidade do arroz para 2
  - Texto reconhecido: (preencher)
  - Passos: ter item "arroz" na lista; falar comando de edição de quantidade.
  - Resultado esperado: quantidade atualizada para 2.
  - Resultado atual: (preencher)
  - Severidade: média

- [ ] VC-08 — teste em ambiente ruidoso
  - Texto reconhecido: (preencher)
  - Passos: reproduzir ruído de fundo; falar comando simples.
  - Resultado esperado: reconhecer corretamente ou pedir confirmação.
  - Resultado atual: (preencher)
  - Severidade: baixa

---

## Como reportar
- Preencher neste arquivo o campo **Texto reconhecido** e **Resultado atual**.
- Adicionar link para gravação de áudio ou arquivo no repositório (`tests/audio/`), se possível.
- Priorizar correções para casos com severidade `alta`.

---

## Observações finais
- Registrar padrão de erro (ex.: ASR transcreve frase inteira como produto). Isso ajuda a identificar se é problema de roteamento de intenção ou do parser que interpreta o texto como nome de produto.
