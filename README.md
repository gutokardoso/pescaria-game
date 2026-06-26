# Pescaria Game

Projeto estático em HTML, CSS e JavaScript, organizado para publicar corretamente no GitHub e na Vercel.

## Estrutura correta

Os arquivos principais ficam na raiz do repositório:

```txt
index.html
vercel.json
assets/
FIREBASE-REGRAS.txt
```

## Configuração recomendada na Vercel

- Framework Preset: Other
- Root Directory: `./`
- Build Command: vazio
- Output Directory: vazio
- Install Command: vazio

Depois de subir estes arquivos no GitHub, faça Redeploy na Vercel.


## Lógica de acesso atual

O jogo exige autenticação antes de iniciar: Google ou conta por e-mail e senha. O botão Jogar agora fica bloqueado até o jogador estar autenticado. Os dados são salvos em `players/{uid}` no Firestore.


## Ranking mundial

Ranking mundial via Firestore usando a coleção `scores/{uid}`. Publique as regras do arquivo `FIREBASE-REGRAS.txt`.


## Versão v2

Esta versão reorganiza o projeto em uma estrutura mais profissional, sem alterar a mecânica principal do jogo:

```txt
index.html
css/styles.css
js/game.js
js/phase-display-fix.js
js/firebase-auth.js
js/auth-gate.js
js/ranking-submit.js
assets/
```

O objetivo desta versão é reduzir o risco de conflitos causados por muitos blocos inline dentro do `index.html` e facilitar as próximas alterações.
