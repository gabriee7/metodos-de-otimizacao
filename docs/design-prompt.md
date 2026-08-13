# Design Prompt — Site Métodos de Otimização

Mesmo design system do projeto irmão [Otimização Linear](https://github.com/gabriee7/otimizacao-linear)
— ver `docs/design-prompt.md` daquele repositório para a especificação completa (paleta, tipografia,
componentes). Resumo aplicado aqui:

- Paleta em `--primary` (#1a56db), `--accent` (#0ea5e9), tokens definidos em `assets/css/style.css`.
- Sem fontes externas — stack do sistema (`'Segoe UI'`), monospace (`'Courier New'`) para código C.
- Componentes reutilizados: `.card`, `.phase`/`.phase-head`/`.phase-tag`/`.phase-body` (blocos de
  questão em exercícios resolvidos), `.attn` (pontos de atenção / pegadinhas), `.exemplo` (blocos de
  verificação/execução de exemplo), `.alert-info/success/warning`, tabelas `.tab`/`.tgrid`/`.gtbl`.
- Navegação de exercícios: `.ex-lista-tabs` (abas por prova) + `.ex-sidebar` (desktop) + `<select>`
  `.ex-mobile-nav` (mobile), mesmo padrão do `exercicios.html` de Otimização Linear.

> Nota: há uma tarefa pendente de consolidar a documentação canônica do design system num diretório
> próprio em `E:\`, compartilhado entre os dois projetos, em vez de duplicar/referenciar entre repos.
