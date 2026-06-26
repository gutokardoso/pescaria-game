# Estrutura do projeto

- `index.html`: estrutura HTML principal.
- `css/styles.css`: estilos extraídos do HTML original, mantendo a ordem original dos blocos.
- `js/game.js`: lógica principal do jogo.
- `js/firebase-auth.js`: autenticação Firebase e ranking online.
- `js/auth-gate.js`: bloqueio de acesso ao jogo sem login.
- `js/ranking-submit.js`: envio seguro de pontuação ao ranking.
- `assets/`: imagens e recursos visuais.

## Observação

A versão v2 foi reorganizada preservando o comportamento existente. As próximas alterações devem ser feitas em arquivos específicos, evitando novos patches duplicados no `index.html`.
