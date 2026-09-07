#define MAX_OBJ 50

typedef struct TSolucao
{
    int vet_obj[MAX_OBJ + 1];
    int fo;
}Solucao;


int numero_itens;
int capacidade_mochila;
int matriz_valor_peso_itens[MAX_OBJ + 1][2];

void ler_instancia(char* arq);
void mostrar_instancia(); // completamente opcional, apenas para testes
void escrever_solucao(Solucao &sol, char* arq);
void calcular_FO(Solucao &sol);
