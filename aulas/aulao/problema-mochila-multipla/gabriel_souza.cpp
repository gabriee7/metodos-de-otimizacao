#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

#include "gabriel_souza.h"

#define ALFA 10

int main(){
    char arq[50];
    strcpy(arq, "..\\Instancia_PMM.txt");

    ler_instancia(arq);

    Solucao sol;

    sol.vet_obj[1] = 1; // item 1 -> mochila 1
    sol.vet_obj[2] = 2; // item 2 -> mochila 2
    sol.vet_obj[3] = 1; // item 3 -> mochila 1
    sol.vet_obj[4] = 0; // item 4 -> nao usado
    sol.vet_obj[5] = 2; // item 5 -> mochila 2
    sol.vet_obj[6] = 0; // item 6 -> nao usado

    calcular_FO(sol);
    escrever_solucao(sol, "");
}

void ler_instancia(char* arq){
    FILE* f = fopen(arq, "r");

    fscanf(f, "%d %d", &numero_itens, &numero_mochilas);

    for(int k = 1 ; k <= numero_mochilas ; k++){
        fscanf(f, "%d", &vet_capacidade_mochilas[k]);
    }

    for(int i = 1 ; i <= numero_itens ; i++){
        fscanf(f, "%d %d",  &matriz_valor_peso_itens[i][0], &matriz_valor_peso_itens[i][1]);
    }
    fclose(f);
}

void mostrar_instancia(){
    printf("%d %d \n", numero_itens, numero_mochilas);
    for(int k = 1 ; k <= numero_mochilas ; k++)
        printf("%d ", vet_capacidade_mochilas[k]);
    printf("\n");
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
    int vet_peso_mochilas[MAX_MOCHILAS + 1];
    memset(vet_peso_mochilas, 0, sizeof(vet_peso_mochilas));

    for(int i = 1 ; i <= numero_itens ; i++){
        int mochila = sol.vet_obj[i];
        if(mochila != 0){
            sol.fo += matriz_valor_peso_itens[i][0];
            vet_peso_mochilas[mochila] += matriz_valor_peso_itens[i][1];
        }
    }

    for(int k = 1 ; k <= numero_mochilas ; k++){
        if(vet_peso_mochilas[k] > vet_capacidade_mochilas[k]){
            sol.fo -= (vet_peso_mochilas[k] - vet_capacidade_mochilas[k]) * ALFA;
        }
    }
}
