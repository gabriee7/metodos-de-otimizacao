# Verificação manual da FO — Problema da Mochila Múltipla (PMM)

Mesma lógica de conferência da Mochila simples (PM): somar valor e peso dos itens
selecionados e comparar com a capacidade. A diferença é que agora existem **várias
mochilas**, cada uma com sua própria capacidade — então a soma de peso e a checagem de
excedente são feitas **por mochila**, não uma vez só.

## Instância (`Instancia_PMM.txt`)

- `n = 6` itens, `m = 2` mochilas
- Capacidades: mochila 1 = **15**, mochila 2 = **20**

| item | valor | peso |
|:---:|:---:|:---:|
| 1 | 10 | 5 |
| 2 | 25 | 8 |
| 3 | 15 | 4 |
| 4 | 10 | 3 |
| 5 | 30 | 12 |
| 6 | 5  | 2 |

## Passo a passo

1. Para cada item, ver em qual mochila `vet_obj[i]` ele foi colocado (`0` = não usado).
2. Agrupar os itens **por mochila** e somar valor e peso de cada grupo.
3. Somar o valor de **todos** os grupos → FO "bruta".
4. Para **cada mochila k**, comparar o peso do grupo com a capacidade daquela mochila:
   - `peso_k ≤ capacidade_k` → não desconta nada dessa mochila.
   - `peso_k > capacidade_k` → desconta `ALFA × (peso_k − capacidade_k)` da FO.
5. Somar os descontos de todas as mochilas na FO bruta → FO final.

`ALFA = 10` no código.

## Caso 1 — solução do `main` (item→mochila: 1→1, 2→2, 3→1, 4→0, 5→2, 6→0)

**Mochila 1** (itens 1, 3):

| item | valor | peso |
|:---:|:---:|:---:|
| 1 | 10 | 5 |
| 3 | 15 | 4 |
| **soma** | **25** | **9** |

peso (9) ≤ capacidade (15) → sem penalidade.

**Mochila 2** (itens 2, 5):

| item | valor | peso |
|:---:|:---:|:---:|
| 2 | 25 | 8 |
| 5 | 30 | 12 |
| **soma** | **55** | **20** |

peso (20) = capacidade (20) → **não excede**, sem penalidade (caso de fronteira: `>` estrito,
não `≥`).

- FO bruta = 25 + 55 = 80
- Nenhuma mochila excedeu → FO final = **80**

## Caso 2 — forçando excedente (item 6 também vai para a mochila 2)

Assignments: 1→1, 2→2, 3→1, 4→0, 5→2, 6→2

**Mochila 1** (itens 1, 3): valor 25, peso 9 → dentro da capacidade (15), sem penalidade.

**Mochila 2** (itens 2, 5, 6):

| item | valor | peso |
|:---:|:---:|:---:|
| 2 | 25 | 8 |
| 5 | 30 | 12 |
| 6 | 5  | 2 |
| **soma** | **60** | **22** |

peso (22) > capacidade (20) → excedente = 2 → desconto = 2 × 10 = 20

- FO bruta = 25 + 60 = 85
- Desconto total = 0 (mochila 1) + 20 (mochila 2) = 20
- FO final = 85 − 20 = **65**

## Caso 3 — mesmo item em nenhuma mochila estoura, mas as duas mochilas estouram

Assignments: 1→1, 2→1, 3→1, 4→2, 5→2, 6→2

**Mochila 1** (itens 1, 2, 3): valor 10+25+15=50, peso 5+8+4=17 → capacidade 15 → excedente 2
→ desconto 20

**Mochila 2** (itens 4, 5, 6): valor 10+30+5=45, peso 3+12+2=17 → capacidade 20 → dentro, sem
desconto

- FO bruta = 50 + 45 = 95
- Desconto total = 20 (mochila 1) + 0 (mochila 2) = 20
- FO final = 95 − 20 = **75**

## Resumo

| caso | mochila 1 (valor/peso) | mochila 2 (valor/peso) | desconto | FO |
|---|:---:|:---:|:---:|:---:|
| 1 | 25 / 9 (ok) | 55 / 20 (ok, no limite) | 0 | 80 |
| 2 | 25 / 9 (ok) | 60 / 22 (excede 2) | 20 | 65 |
| 3 | 50 / 17 (excede 2) | 45 / 17 (ok) | 20 | 75 |

Testar um caso sem excedente em nenhuma mochila, um com excedente em só uma mochila e um
com excedente em mochilas diferentes cobre bem o laço `for k = 1..numero_mochilas` de
`calcular_FO`.
