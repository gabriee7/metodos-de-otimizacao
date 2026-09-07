# Verificação manual da FO — Roteamento de Veículos Capacitados (PRVC)

Igual ao TSP: soma-se o custo dos arcos percorridos usando a matriz de custos. A diferença é
que agora existem **várias rotas** (uma por veículo, todas partindo e voltando ao depósito —
vértice 0), e a contagem de visitas precisa somar as ocorrências de cada cliente em
**todas** as rotas juntas antes de checar quem não foi visitado ou foi visitado demais.

## Instância (`Instancia_PRVC.txt`)

- `V = 5` vértices (0 = depósito, 1 a 4 = clientes), `N = 2` veículos, capacidade `C = 20`
- Demandas: vértice 0 = 0, vértice 1 = 5, vértice 2 = 8, vértice 3 = 10, vértice 4 = 4

Matriz de custos:

| | 0 | 1 | 2 | 3 | 4 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **0** | 0 | 10 | 15 | 20 | 10 |
| **1** | 10 | 0 | 35 | 25 | 17 |
| **2** | 15 | 35 | 0 | 30 | 28 |
| **3** | 20 | 25 | 30 | 0 | 22 |
| **4** | 10 | 17 | 28 | 22 | 0 |

## Passo a passo

1. Para cada veículo, somar o custo dos arcos consecutivos da rota (igual ao TSP), usando a
   matriz de custos.
2. Somar o custo de **todos** os veículos → custo bruto da solução.
3. Contar quantas vezes cada **cliente** (vértices 1 a 4 — o depósito fica de fora dessa
   contagem, ver observação abaixo) aparece como origem de algum arco, somando as ocorrências
   em todas as rotas juntas.
4. Para cada cliente:
   - `0` ocorrências → soma `ALFA = 100` (não visitado).
   - `> 1` ocorrências → soma `BETA = 50` (visitado mais de uma vez).
5. FO final = custo bruto + soma das penalidades.

> **Por que o depósito (vértice 0) fica fora da contagem:** ele é, por construção, o início e
> o fim de **cada** rota — com `N` veículos, ele aparece `N` vezes como origem, o que é
> esperado e correto, não uma repetição indevida. Só os clientes (vértices 1 a 4) entram na
> checagem de "não visitado"/"visitado demais".

## Caso 1 — solução do `main` (válida): veículo 0 = 0-2-1-0, veículo 1 = 0-4-3-0

**Veículo 0** (0 → 2 → 1 → 0):

| arco | custo |
|:---:|:---:|
| 0→2 | 8 |
| 2→1 | 35 |
| 1→0 | 10 |
| **soma** | **53** |

**Veículo 1** (0 → 4 → 3 → 0):

| arco | custo |
|:---:|:---:|
| 0→4 | 4 |
| 4→3 | 22 |
| 3→0 | 15 |
| **soma** | **41** |

- Custo bruto = 53 + 41 = 94
- Contagem de clientes: vértice 1 → 1×, vértice 2 → 1×, vértice 3 → 1×, vértice 4 → 1× — todos
  visitados exatamente uma vez, sem penalidade.
- **FO final = 94**

(Confere também a capacidade, mesmo não entrando na FO: veículo 0 leva demanda 8+5=13 ≤ 20;
veículo 1 leva demanda 4+10=14 ≤ 20 — os dois dentro do limite.)

## Caso 2 — forçando as duas penalidades: veículo 0 = 0-2-1-0, veículo 1 = 0-4-1-0

Trocando o cliente 3 da rota do veículo 1 pelo cliente 1 (que já estava na rota do veículo 0):
cliente 3 fica sem visita nenhuma, e cliente 1 passa a ser visitado duas vezes.

**Veículo 0** (0 → 2 → 1 → 0): soma = 53 (igual ao caso 1)

**Veículo 1** (0 → 4 → 1 → 0):

| arco | custo |
|:---:|:---:|
| 0→4 | 4 |
| 4→1 | 17 |
| 1→0 | 10 |
| **soma** | **31** |

- Custo bruto = 53 + 31 = 84
- Contagem de clientes: vértice 1 → **2×** (BETA), vértice 2 → 1×, vértice 3 → **0×** (ALFA),
  vértice 4 → 1×
- Penalidade = 100 (ALFA, cliente 3 não visitado) + 50 (BETA, cliente 1 repetido) = 150
- **FO final = 84 + 150 = 234**

## Resumo

| caso | rotas | custo bruto | penalidade | FO |
|---|---|:---:|:---:|:---:|
| 1 | 0-2-1-0 / 0-4-3-0 | 94 | 0 | 94 |
| 2 | 0-2-1-0 / 0-4-1-0 | 84 | 150 (100 + 50) | 234 |

Testar um caso onde todo cliente aparece exatamente uma vez (sem penalidade) e um caso com um
cliente faltando e outro repetido ao mesmo tempo cobre os dois ramos de `calcular_fo` numa
única conferência.
