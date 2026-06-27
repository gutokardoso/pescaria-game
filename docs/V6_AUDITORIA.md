# pescaria-game-v6

## Objetivo
Versão de estabilização estrutural preservando a jogabilidade e corrigindo assets/itens especiais.

## Verificações realizadas
- ZIP íntegro.
- Assets principais existentes.
- Referências de assets inexistentes auditadas.
- JavaScript validado com `node --check`.
- Correção de caminhos de garrafa, baú e peixe gigante.
- Tela final preserva snapshot da fase encerrada.

## Assets especiais
- Garrafa: `assets/item-bottle.png`
- Baú: `assets/item-chest.png`
- Peixe gigante: `assets/fish-giant.png`

## Observação
Esta versão evita mexer em layout/posicionamento global para não gerar regressões visuais.
