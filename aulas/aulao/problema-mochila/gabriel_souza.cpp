#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

#include "gabriel_souza.h"

#define ALFA 10

int main(){
    char arq[50];
    strcpy(arq, "..\\Instancia_PM.txt");

    ler_instancia(arq);

    Solucao sol;

    sol.vet_obj[1] = 1;
    sol.vet_obj[2] = 0;
    sol.vet_obj[3] = 1;
    sol.vet_obj[4] = 0;
    sol.vet_obj[5] = 1;

    calcular_FO(sol);
    escrever_solucao(sol, "");
}

void ler_instancia(char* arq){
    FILE* f = fopen(arq, "r");

    fscanf(f, "%d %d", &numero_itens, &capacidade_mochila);

    for(int i = 1 ; i <= numero_itens ; i++){
        fscanf(f, "%d %d",  &matriz_valor_peso_itens[i][0], &matriz_valor_peso_itens[i][1]);
    }
    fclose(f);
}

void mostrar_instancia(){
    printf("%d %d \n", numero_itens, capacidade_mochila);
    for(int i = 1 ; i <= numero_itens ; i++)
        printf( "%d %d \n",  matriz_valor_peso_itens[i][0], matriz_valor_peso_itens[i][1]);
}

void escrever_solucao(Solucao &sol, char* arq){
    FILE* f;
    if(strcmp(arq, "") == 0)
        f = stdout;
    else
        f = fopen(arq, "w");

    fprintf(f,"FO: %d\n", sol.fo);

    for(int i = 1 ; i <= numero_itens ; i++){
        fprintf(f, "%d ", sol.vet_obj[i]);
    }

    if(strcmp(arq, "") != 0)
        fclose(f);
}

void calcular_FO(Solucao &sol){

    sol.fo = 0;
    int peso_mochila = 0;
    for(int i = 1 ; i <= numero_itens ; i++){
        if(sol.vet_obj[i] == 1){
            sol.fo += matriz_valor_peso_itens[i][0];
            peso_mochila += matriz_valor_peso_itens[i][1];
        }
    }

    if(peso_mochila > capacidade_mochila){
        sol.fo -= (peso_mochila - capacidade_mochila) * ALFA;
    }
}
