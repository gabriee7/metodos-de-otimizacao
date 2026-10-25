// P2 — Vizinha + heurísticas construtivas (aleatória, gulosa, aleatória-gulosa) no PRCP.
// PRCP MAXIMIZA pontos livres; a gulosa minimiza CONFLITOS NOVOS a cada decisão.
//
// Compilar:  g++ construtivas_prcp.cpp -o construtivas_prcp
// Executar:  ./construtivas_prcp caminho/da/instancia.txt
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_PTS 14000
#define MAX_POS 16

typedef struct tSolucao
{
    int vet_sol[MAX_PTS];
    int fo;
} Solucao;

int num_pts;
int num_pos;
int num_ids;
int* vet_qtd_conf;
int** mat_conflitos;

int get_id(const int& pt, const int& pos) { return (pt * num_pos) + pos; }
int get_ponto(const int& id) { return id / num_pos; }
int get_posicao(const int& id) { return id % num_pos; }

void ler_dados(const char* arq)
{
    FILE* f = fopen(arq, "r");
    if (f == NULL) { printf("Erro ao abrir %s\n", arq); exit(1); }
    fscanf(f, "%d %d", &num_pts, &num_pos);
    num_ids = num_pts * num_pos;
    vet_qtd_conf = (int*) malloc(num_ids * sizeof(int));
    mat_conflitos = (int**) malloc(num_ids * sizeof(int*));
    for (int i = 0; i < num_ids; i++)
    {
        fscanf(f, "%d", &vet_qtd_conf[i]);
        mat_conflitos[i] = (int*) malloc((vet_qtd_conf[i] + 1) * sizeof(int));
        for (int j = 0; j < vet_qtd_conf[i]; j++)
        {
            fscanf(f, "%d", &mat_conflitos[i][j]);
            mat_conflitos[i][j]--;
        }
    }
    fclose(f);
}

void calcular_fo(Solucao& s)
{
    s.fo = num_pts;
    for (int i = 0; i < num_pts; i++)
    {
        int id = get_id(i, s.vet_sol[i]);
        int conflito = 0;
        for (int j = 0; j < vet_qtd_conf[id]; j++)
        {
            int pt = get_ponto(mat_conflitos[id][j]);
            int pos = get_posicao(mat_conflitos[id][j]);
            if (s.vet_sol[pt] == pos) { conflito = 1; break; }
        }
        s.fo -= conflito;
    }
}

// >>> vizinha
// Q1 — vizinha: parte de uma solução COMPLETA e muda UMA decisão.
void gerar_vizinha(Solucao& s)
{
    int pt = rand() % num_pts;
    int pos;
    do
        pos = rand() % num_pos;
    while (pos == s.vet_sol[pt]);
    s.vet_sol[pt] = pos;
    calcular_fo(s);                                   // sem isso a fo fica velha
}
// <<< vizinha

// >>> aleatoria
// Q2 — construtiva aleatória: toda decisão é sorteio.
void heuristica_construtiva_aleatoria(Solucao& s)
{
    for (int i = 0; i < num_pts; i++)
        s.vet_sol[i] = rand() % num_pos;
    calcular_fo(s);
}
// <<< aleatoria

// >>> custo_parcial
// Quantos conflitos a posição 'pos' do ponto 'pt' cria com os pontos JÁ decididos (índice < pt).
// Os pontos de índice >= pt ainda têm lixo em vet_sol — não podem entrar na conta.
int contar_conflitos_parciais(const Solucao& s, int pt, int pos)
{
    int id = get_id(pt, pos);
    int conflitos = 0;
    for (int j = 0; j < vet_qtd_conf[id]; j++)
    {
        int outro_ponto = get_ponto(mat_conflitos[id][j]);
        int outra_posicao = get_posicao(mat_conflitos[id][j]);
        if (outro_ponto < pt && s.vet_sol[outro_ponto] == outra_posicao)
            conflitos++;
    }
    return conflitos;
}
// <<< custo_parcial

// >>> gulosa
// Q3 — construtiva gulosa: em cada decisão, escolhe a de menor custo imediato.
void heuristica_construtiva_gulosa(Solucao& s)
{
    for (int i = 0; i < num_pts; i++)
    {
        int melhor_posicao = 0;
        int menor_custo = contar_conflitos_parciais(s, i, 0);
        for (int pos = 1; pos < num_pos; pos++)
        {
            int custo = contar_conflitos_parciais(s, i, pos);
            if (custo < menor_custo)                  // empate: fica com a primeira
            {
                menor_custo = custo;
                melhor_posicao = pos;
            }
        }
        s.vet_sol[i] = melhor_posicao;
    }
    calcular_fo(s);
}
// <<< gulosa

// >>> aleatoria_gulosa
// Q4 — aleatória-gulosa (LRC): sorteia entre as posições "boas o bastante".
// per_ale = 0 => 100% gulosa;  per_ale = 1 => 100% aleatória.
void heuristica_construtiva_aleatoria_gulosa(Solucao& s, float per_ale)
{
    int custo[MAX_POS];
    int lista_restrita[MAX_POS];
    for (int i = 0; i < num_pts; i++)
    {
        int custo_minimo = 1000000000;
        int custo_maximo = -1;
        for (int pos = 0; pos < num_pos; pos++)
        {
            custo[pos] = contar_conflitos_parciais(s, i, pos);
            if (custo[pos] < custo_minimo) custo_minimo = custo[pos];
            if (custo[pos] > custo_maximo) custo_maximo = custo[pos];
        }
        float limite = custo_minimo + per_ale * (custo_maximo - custo_minimo);
        int tamanho = 0;
        for (int pos = 0; pos < num_pos; pos++)
            if (custo[pos] <= limite)                 // quem passa na nota de corte entra na LRC
                lista_restrita[tamanho++] = pos;
        s.vet_sol[i] = lista_restrita[rand() % tamanho];   // tamanho >= 1 sempre (o mínimo passa)
    }
    calcular_fo(s);
}
// <<< aleatoria_gulosa

int main(int argc, char** argv)
{
    const char* arq = "i25.txt";
    if (argc > 1)
        arq = argv[1];
    srand(42);
    ler_dados(arq);
    printf("instancia: %s  (%d pontos, %d posicoes)\n", arq, num_pts, num_pos);

    Solucao s;
    heuristica_construtiva_aleatoria(s);
    printf("aleatoria:            %d\n", s.fo);
    heuristica_construtiva_gulosa(s);
    printf("gulosa:               %d\n", s.fo);
    float alfas[3] = {0.0f, 0.3f, 1.0f};
    for (int k = 0; k < 3; k++)
    {
        heuristica_construtiva_aleatoria_gulosa(s, alfas[k]);
        printf("aleatoria-gulosa %.1f: %d\n", alfas[k], s.fo);
    }
    gerar_vizinha(s);
    printf("apos 1 vizinha:       %d\n", s.fo);
    return 0;
}
