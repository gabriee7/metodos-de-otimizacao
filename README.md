# Métodos de Otimização

Site de estudo estático (HTML/CSS/JS puro, sem frameworks), hospedado no GitHub Pages, sobre a
disciplina de heurísticas e meta-heurísticas. Continuação de
[Otimização Linear](https://github.com/gabriee7/otimizacao-linear) — mesmo design system.

## Estrutura

```
/
├── index.html            — landing page
├── pages/
│   ├── teoria.html        — referência conceitual por unidade da ementa
│   └── exercicios.html    — provas resolvidas (P1, P2, P3...) em formato passo a passo
├── assets/css/style.css   — estilo compartilhado
├── docs/design-prompt.md  — especificação do design system
└── README.md
```

Material bruto de terceiros (provas originais, código de colegas, PDFs do plano de ensino) fica
fora do repositório — ver `.gitignore`. Só o conteúdo original escrito para o site é publicado.

## Rodando localmente

```bash
python -m http.server 8000
```

## Deploy

GitHub Pages a partir da branch `main`, raiz do repositório.
