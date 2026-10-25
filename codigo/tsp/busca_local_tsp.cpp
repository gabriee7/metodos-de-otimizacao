// TSP — as MESMAS 3 buscas locais, agora para um problema de MINIMIZAÇÃO.
// O que muda em relação ao PRCP: o movimento (swap de 2 cidades) e o sinal (< em vez de >).
//
// Compilar:  g++ busca_local_tsp.cpp -o busca_local_tsp -lm
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_CIDADES 200

typedef struct tSolucao
{
    int vet_rota[MAX_CIDADES]; // ordem de visita (0 .. num_cidades-1); o ciclo fecha na 1ª cidade
    double fo;                 // custo total do ciclo
} Solucao;

int num_cidades;
double matriz_custo[MAX_CIDADES][MAX_CIDADES];

void gerar_instancia_aleatoria(int quantidade)
{
    double coordenada_x[MAX_CIDADES];
    double coordenada_y[MAX_CIDADES];
    num_cidades = quantidade;
    for (int i = 0; i < num_cidades; i++)
    {
        coordenada_x[i] = rand() % 100;
        coordenada_y[i] = rand() % 100;
    }
    for (int i = 0; i < num_cidades; i++)
        for (int j = 0; j < num_cidades; j++)
        {
            double dx = coordenada_x[i] - coordenada_x[j];
            double dy = coordenada_y[i] - coordenada_y[j];
            matriz_custo[i][j] = sqrt(dx * dx + dy * dy);
        }
}

void calcular_fo(Solucao& s)
{
    s.fo = 0;                                         // zerar antes de somar!
    for (int i = 0; i < num_cidades - 1; i++)
        s.fo += matriz_custo[s.vet_rota[i]][s.vet_rota[i + 1]];
    s.fo += matriz_custo[s.vet_rota[num_cidades - 1]][s.vet_rota[0]]; // fecha o ciclo
}

void trocar(Solucao& s, int i, int j)
{
    int auxiliar = s.vet_rota[i];
    s.vet_rota[i] = s.vet_rota[j];
    s.vet_rota[j] = auxiliar;
}

void gerar_vizinha(Solucao& s)
{
    int i = rand() % num_cidades;
    int j;
    do
        j = rand() % num_cidades;
    while (j == i);
    trocar(s, i, j);
}

// >>> gulosa
// Construtiva gulosa (vizinho mais próximo): a cada parada, vai para a cidade ainda não visitada mais barata.
void heuristica_construtiva_gulosa(Solucao& s)
{
    int visitada[MAX_CIDADES];
    memset(visitada, 0, sizeof(visitada));
    s.vet_rota[0] = 0;                                // começa na cidade 0
    visitada[0] = 1;
    for (int parada = 1; parada < num_cidades; parada++)
    {
        int atual = s.vet_rota[parada - 1];
        int melhor_cidade = -1;
        for (int c = 0; c < num_cidades; c++)
        {
            if (visitada[c] == 1)
                continue;
            if (melhor_cidade == -1 || matriz_custo[atual][c] < matriz_custo[atual][melhor_cidade])
                melhor_cidade = c;
        }
        s.vet_rota[parada] = melhor_cidade;
        visitada[melhor_cidade] = 1;
    }
    calcular_fo(s);
}
// <<< gulosa

// >>> randomica
void busca_local_randomica(Solucao& s, const int iteracoes)
{
    Solucao vizinha;
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int k = 0; k < iteracoes; k++)
        {
            memcpy(&vizinha, &s, sizeof(Solucao));
            gerar_vizinha(vizinha);
            calcular_fo(vizinha);
            if (vizinha.fo < s.fo)                    // TSP minimiza
            {
                memcpy(&s, &vizinha, sizeof(Solucao));
                melhorou = 1;
            }
        }
    }
}
// <<< randomica

// >>> primeira_melhora
void busca_local_primeira_melhora(Solucao& s)
{
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int i = 0; i < num_cidades - 1 && melhorou == 0; i++)
        {
            for (int j = i + 1; j < num_cidades && melhorou == 0; j++)
            {
                double fo_original = s.fo;
                trocar(s, i, j);                      // aplica o movimento
                calcular_fo(s);
                if (s.fo < fo_original)
                    melhorou = 1;                     // fica aplicado
                else
                {
                    trocar(s, i, j);                  // desfaz (swap é a própria inversa)
                    s.fo = fo_original;
                }
            }
        }
    }
}
// <<< primeira_melhora

// >>> melhor_melhora
void busca_local_melhor_melhora(Solucao& s)
{
    calcular_fo(s);
    while (1)
    {
        int melhor_i = -1;
        int melhor_j = -1;
        double melhor_fo = s.fo;
        for (int i = 0; i < num_cidades - 1; i++)
        {
            for (int j = i + 1; j < num_cidades; j++)
            {
                double fo_original = s.fo;
                trocar(s, i, j);
                calcular_fo(s);
                if (s.fo < melhor_fo)
                {
                    melhor_fo = s.fo;
                    melhor_i = i;
                    melhor_j = j;
                }
                trocar(s, i, j);                      // sempre desfaz
                s.fo = fo_original;
            }
        }
        if (melhor_i == -1)
            break;
        trocar(s, melhor_i, melhor_j);
        s.fo = melhor_fo;
    }
}
// <<< melhor_melhora

int main()
{
    srand(7);
    gerar_instancia_aleatoria(40);

    Solucao inicial, s;
    for (int i = 0; i < num_cidades; i++)
        inicial.vet_rota[i] = i;                      // rota 0,1,2,... (ruim de propósito)
    calcular_fo(inicial);
    printf("FO inicial:             %.2f\n", inicial.fo);

    Solucao gulosa;
    heuristica_construtiva_gulosa(gulosa);
    printf("Construtiva gulosa:     %.2f\n", gulosa.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_randomica(s, num_cidades * num_cidades);
    printf("Busca randomica:        %.2f\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_primeira_melhora(s);
    printf("Busca primeira melhora: %.2f\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_melhor_melhora(s);
    printf("Busca melhor melhora:   %.2f\n", s.fo);

    Solucao conferencia;
    memcpy(&conferencia, &s, sizeof(Solucao));
    calcular_fo(conferencia);
    printf("conferencia (recalculada): %.2f\n", conferencia.fo);
    return 0;
}
