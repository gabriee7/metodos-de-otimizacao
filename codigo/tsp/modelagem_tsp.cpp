// P1 — Modelagem do TSP: leitura, struct de solução, escrita e função objetivo (com penalização).
// Formato assumido da instância: n na 1ª linha, depois a matriz n x n de custos (linha a linha).
// Confirme sempre o formato EXATO no enunciado da prova antes de ler.
//
// Compilar:  g++ modelagem_tsp.cpp -o modelagem_tsp
// Executar:  ./modelagem_tsp toy_tsp.txt
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CIDADES 200
#define PENALIDADE 100

// >>> dados_e_struct
int num_cidades;
double matriz_custo[MAX_CIDADES][MAX_CIDADES];

typedef struct tSolucao
{
    int vet_rota[MAX_CIDADES]; // rota: vet_rota[i] = cidade visitada na i-ésima parada (0-based)
    double fo;
} Solucao;
// <<< dados_e_struct

// >>> ler_dados
void ler_dados(const char* arq)
{
    FILE* f = fopen(arq, "r");
    if (f == NULL)
    {
        printf("Erro ao abrir %s\n", arq);
        exit(1);
    }
    fscanf(f, "%d", &num_cidades);
    for (int i = 0; i < num_cidades; i++)
        for (int j = 0; j < num_cidades; j++)
            fscanf(f, "%lf", &matriz_custo[i][j]);
    fclose(f);
}
// <<< ler_dados

// >>> calcular_fo
void calcular_fo(Solucao& s)
{
    int vezes_visitada[MAX_CIDADES];
    memset(vezes_visitada, 0, sizeof(vezes_visitada));
    s.fo = 0;                                          // zerar ANTES de somar
    for (int i = 0; i < num_cidades; i++)
    {
        vezes_visitada[s.vet_rota[i]]++;
        int proxima = s.vet_rota[(i + 1) % num_cidades]; // a última volta para a primeira
        s.fo += matriz_custo[s.vet_rota[i]][proxima];
    }
    for (int c = 0; c < num_cidades; c++)
    {
        if (vezes_visitada[c] == 0)                    // cidade esquecida
            s.fo += PENALIDADE;
        if (vezes_visitada[c] > 1)                     // cidade repetida
            s.fo += PENALIDADE * (vezes_visitada[c] - 1);
    }
}
// <<< calcular_fo

// >>> escrever_solucao
void escrever_solucao(const Solucao& s, const char* arq)
{
    FILE* f;
    if (strcmp(arq, "") == 0)
        f = stdout;                                    // "" = escrever na tela
    else
        f = fopen(arq, "w");
    fprintf(f, "FO: %.2f\nRota: ", s.fo);
    for (int i = 0; i < num_cidades; i++)
        fprintf(f, "%d -> ", s.vet_rota[i] + 1);       // mostra 1-based
    fprintf(f, "%d\n", s.vet_rota[0] + 1);             // volta à origem
    if (strcmp(arq, "") != 0)
        fclose(f);
}
// <<< escrever_solucao

int main(int argc, char** argv)
{
    const char* arq = "toy_tsp.txt";
    if (argc > 1)
        arq = argv[1];
    ler_dados(arq);

    Solucao s;                                         // solução criada "à mão" para testar a FO
    for (int i = 0; i < num_cidades; i++)
        s.vet_rota[i] = i;
    calcular_fo(s);
    escrever_solucao(s, "");

    s.vet_rota[num_cidades - 1] = 0;                   // repete a cidade 1 e esquece a última
    calcular_fo(s);
    printf("--- com cidade repetida/esquecida (deve ter penalidade) ---\n");
    escrever_solucao(s, "");
    escrever_solucao(s, "saida_teste.txt");
    return 0;
}
