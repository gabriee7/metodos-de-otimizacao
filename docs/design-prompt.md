# Design Prompt — Site Métodos de Otimização

Mesmo design system do projeto irmão Otimização Linear. A especificação canônica completa
(paleta, tipografia, componentes, responsividade) vive em `E:\DesignSystem\docs\design-prompt.md`,
compartilhada entre os dois sites — consultar lá antes de mudanças visuais estruturais. Resumo
aplicado aqui:

- Paleta em `--primary` (#1a56db), `--accent` (#0ea5e9), tokens definidos em `assets/css/style.css`.
- Sem fontes externas — stack do sistema (`'Segoe UI'`), monospace (`'Courier New'`) para código C.
- Componentes reutilizados: `.card`, `.phase`/`.phase-head`/`.phase-tag`/`.phase-body` (blocos de
  questão em exercícios resolvidos), `.attn` (pontos de atenção / pegadinhas), `.exemplo` (blocos de
  verificação/execução de exemplo), `.alert-info/success/warning`, tabelas `.tab`/`.tgrid`/`.gtbl`.
- Navegação de exercícios: `.ex-lista-tabs` (abas por prova) + `.ex-sidebar` (desktop) + `<select>`
  `.ex-mobile-nav` (mobile), mesmo padrão do `exercicios.html` de Otimização Linear.

Este site adicionou componentes próprios (`.phase`, `.attn`, `.exemplo`, navegação `.ex-*`) que
não existiam na folha de estilo original de Otimização Linear — ver `E:\DesignSystem\README.md`
para o detalhamento de onde cada folha de estilo diverge.
