# Verificação manual da FO — Problema da Mochila (PM)

Mesma ideia da conferência manual usada no TSP (somar à mão e comparar com a saída do
programa), mas aqui não existe sequência/arco — é só soma de colunas de valor e peso dos
itens selecionados.

## Instância (`Instancia_PM.txt`)

Capacidade da mochila: **15**

| item | valor | peso |
|:---:|:---:|:---:|
| 1 | 10 | 4 |
| 2 | 20 | 5 |
| 3 | 15 | 8 |
| 4 | 2  | 3 |
| 5 | 30 | 6 |

## Passo a passo

1. Escolher os itens com `vet_obj[i] = 1`.
2. Somar a coluna **valor** desses itens → FO "bruta" (antes de penalidade).
3. Somar a coluna **peso** desses itens → peso total da mochila.
4. Comparar peso total com a capacidade:
   - `peso ≤ capacidade` → FO final = soma dos valores, sem alteração.
   - `peso > capacidade` → FO final = soma dos valores − `ALFA × (peso − capacidade)`.

`ALFA = 10` no código.

## Caso 1 — solução do `main` (itens 1, 3, 5) — estoura a capacidade

| item | valor | peso |
|:---:|:---:|:---:|
| 1 | 10 | 4 |
| 3 | 15 | 8 |
| 5 | 30 | 6 |
| **soma** | **55** | **18** |

- peso (18) > capacidade (15) → excedente = 3
- FO = 55 − (3 × 10) = 55 − 30 = **25**

Confere com `calcular_FO`: `sol.fo = 55`, depois `sol.fo -= (18-15)*10 = 30` → `sol.fo = 25`.

## Caso 2 — itens 2, 4, 5 — dentro da capacidade

| item | valor | peso |
|:---:|:---:|:---:|
| 2 | 20 | 5 |
| 4 | 2  | 3 |
| 5 | 30 | 6 |
| **soma** | **52** | **14** |

- peso (14) ≤ capacidade (15) → sem penalidade
- FO = **52**

## Caso 3 — itens 1, 2, 3, 4, 5 (todos) — estoura bastante, para testar excedente maior

| item | valor | peso |
|:---:|:---:|:---:|
| 1 | 10 | 4 |
| 2 | 20 | 5 |
| 3 | 15 | 8 |
| 4 | 2  | 3 |
| 5 | 30 | 6 |
| **soma** | **77** | **26** |

- peso (26) > capacidade (15) → excedente = 11
- FO = 77 − (11 × 10) = 77 − 110 = **−33**

## Resumo

| caso | itens | valor | peso | excedente | FO |
|---|---|:---:|:---:|:---:|:---:|
| 1 | 1, 3, 5 | 55 | 18 | 3 | 25 |
| 2 | 2, 4, 5 | 52 | 14 | 0 | 52 |
| 3 | 1, 2, 3, 4, 5 | 77 | 26 | 11 | −33 |

Testar pelo menos um caso dentro da capacidade (sem penalidade) e um caso estourando
(com penalidade) cobre os dois ramos de `calcular_FO`.
