#define MAX_ITENS 50
#define MAX_MOCHILAS 10

typedef struct TSolucao
{
    int vet_obj[MAX_ITENS + 1]; // vet_obj[i] = mochila em que o item i foi colocado (0 = nao usado)
    int fo;
}Solucao;


int numero_itens;
int numero_mochilas;
int vet_capacidade_mochilas[MAX_MOCHILAS + 1];
int matriz_valor_peso_itens[MAX_ITENS + 1][2];

void ler_instancia(char* arq);
void mostrar_instancia(); // completamente opcional, apenas para testes
void escrever_solucao(Solucao &sol, char* arq);
void calcular_FO(Solucao &sol);
