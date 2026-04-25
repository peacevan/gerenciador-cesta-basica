# SmartList — Guia para o Copilot

## Antes de qualquer tarefa, leia:
1. Este arquivo completo
2. docs2/SPEC.md (telas e comportamentos)
3. docs2/BUGS.md (bugs ativos)
4. docs2/COMMIT_GUIDELINES.md (padrão de commits)

## Fluxo principal do app
Home → Listas Prontas → Preview (substituir/mesclar)
     → Carrinho (+ mic + adicionar item) → Finalizar
     → Histórico → Home

## O que NUNCA fazer
- Recriar voiceParser.js do zero (apenas estender)
- Alterar normalizeProductName
- Alterar o schema do localStorage sem aprovação
- Adicionar dependências externas sem aprovação
- Criar botão "Salvar" — o app usa auto-save
- Usar localStorage/sessionStorage em artifacts
- Criar login ou autenticação (fora do escopo do MVP)
- Alterar ModalEstabelecimento estruturalmente

## Como pedir implementação
Sempre especifique:
1. Qual arquivo/componente alterar
2. O que mudar (não o como)
3. O que NÃO alterar
4. Se voiceParser.js existir: reaproveitar, não recriar

## Padrões de código do projeto
- Componentes React funcionais com hooks
- CSS inline ou módulos CSS — sem styled-components
- Sem TypeScript (projeto é JS puro)
- Datas em formato dd/mm/aaaa na exibição
- Valores monetários: toLocaleString('pt-BR', {style:'currency',
  currency:'BRL'})
- IDs gerados com crypto.randomUUID() ou Date.now()

## Categorias de template e cores
compras:   bg #E1F5EE  stroke #1D9E75
cafe:      bg #FEF3E2  stroke #BA7517
feira:     bg #EAF3DE  stroke #3B6D11
limpeza:   bg #FAEEDA  stroke #854F0B
proteinas: bg #FAECE7  stroke #993C1D
churrasco: bg #FCEBEB  stroke #A32D2D
dieese:    bg #E6F1FB  stroke #185FA5

## Shape do item no carrinho (localStorage)
{
  id: string,
  nome: string,
  quantidade: number,        // padrão 1
  unidade: string,           // padrão 'und'
  precoUnitario: number|null,
  precoTotal: number|null,
  marcado: boolean,
  atualizadoEm: string       // ISO 8601
}

## Shape do registro de histórico (localStorage)
{
  id: string,
  templateNome: string,
  templateCategoria: string,
  itens: [...],
  totalEstimado: number,
  totalItens: number,
  itensSemPreco: number,
  estabelecimento: { nome, endereco, lat, lng } | null,
  finalizadaEm: string
}
