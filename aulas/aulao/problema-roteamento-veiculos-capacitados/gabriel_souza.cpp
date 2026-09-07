#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

#include "gabriel_souza.h"

#define ALFA 100
#define BETA 50

int main(){
    char arq[50];
    strcpy(arq, "..\\Instancia_PRVC.txt");

    ler_instancia(arq);

    Solucao sol;

    // veiculo 0: garagem -> 2 -> 1 -> garagem
    sol.vet_rota[0][0] = 0;
    sol.vet_rota[0][1] = 2;
    sol.vet_rota[0][2] = 1;
    sol.vet_rota[0][3] = 0;
    sol.vet_tam_rota[0] = 4;

    // veiculo 1: garagem -> 4 -> 3 -> garagem
    sol.vet_rota[1][0] = 0;
    sol.vet_rota[1][1] = 4;
    sol.vet_rota[1][2] = 3;
    sol.vet_rota[1][3] = 0;
    sol.vet_tam_rota[1] = 4;

    verifica_ret_garagem(sol);
    calcular_fo(sol);
    escrever_solucao(sol, "");
}

void ler_instancia(char* arq){
    FILE* f = fopen(arq, "r");

    fscanf(f, "%d %d %d", &num_vertices, &num_veiculos, &capacidade_veiculo);

    for(int i = 0 ; i < num_vertices ; i++){
        fscanf(f, "%d", &vet_demanda[i]);
    }

    for(int i = 0 ; i < num_vertices ; i++){
        for(int j = 0 ; j < num_vertices ; j++){
            fscanf(f, "%f", &mat_custo[i][j]);
        }
    }
    fclose(f);
}

void mostrar_instancia(){
    printf("%d %d %d\n", num_vertices, num_veiculos, capacidade_veiculo);
    for(int i = 0 ; i < num_vertices ; i++)
        printf("%d ", vet_demanda[i]);
    printf("\n");
    for(int i = 0 ; i < num_vertices ; i++){
        for(int j = 0 ; j < num_vertices ; j++)
            printf("%.1f ", mat_custo[i][j]);
        printf("\n");
    }
}

void escrever_solucao(Solucao &sol, char* arq){
    FILE* f;
    if(strcmp(arq, "") == 0)
        f = stdout;
    else
        f = fopen(arq, "w");

    fprintf(f, "Valor da FO: %.1f\n\n", sol.fo);

    for(int k = 0 ; k < num_veiculos ; k++){
        fprintf(f, "Veiculo %d: ", k);
        for(int i = 0 ; i < sol.vet_tam_rota[k] ; i++)
            fprintf(f, "%d ", sol.vet_rota[k][i]);
        fprintf(f, "\n");
    }

    if(strcmp(arq, "") != 0)
        fclose(f);
}

void verifica_ret_garagem(Solucao &sol){
    for(int k = 0 ; k < num_veiculos ; k++){
        int ultima = sol.vet_tam_rota[k] - 1;
        if(sol.vet_rota[k][ultima] != sol.vet_rota[k][0]){
            sol.vet_rota[k][ultima] = sol.vet_rota[k][0];
        }
    }
}

void calcular_fo(Solucao &sol){

    sol.fo = 0;
    int vet_count_vis[MAX_VERTICES];
    memset(vet_count_vis, 0, sizeof(vet_count_vis));

    for(int k = 0 ; k < num_veiculos ; k++){
        for(int i = 0 ; i < sol.vet_tam_rota[k] - 1 ; i++){
            int origem  = sol.vet_rota[k][i];
            int destino = sol.vet_rota[k][i + 1];
            sol.fo += mat_custo[origem][destino];
            vet_count_vis[origem]++;
        }
    }

    // penalidades (o deposito, vertice 0, fica de fora: por definicao e' visitado
    // uma vez por veiculo, isso nao e' repeticao nem ausencia de visita)
    for(int i = 1 ; i < num_vertices ; i++){
        if(vet_count_vis[i] == 0)
            sol.fo += ALFA;

        if(vet_count_vis[i] > 1)
            sol.fo += BETA;
    }
}
