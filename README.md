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
