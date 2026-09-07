#define MAX_VERTICES 100
#define MAX_VEICULOS 20

typedef struct TSolucao
{
    int vet_rota[MAX_VEICULOS][MAX_VERTICES + 2]; // rota de cada veiculo (sequencia de vertices, comecando e terminando em 0)
    int vet_tam_rota[MAX_VEICULOS];                // quantas posicoes estao preenchidas na rota de cada veiculo
    float fo;
}Solucao;


int num_vertices;    // deposito (vertice 0) + clientes
int num_veiculos;
int capacidade_veiculo;
int vet_demanda[MAX_VERTICES];
float mat_custo[MAX_VERTICES][MAX_VERTICES];

void ler_instancia(char* arq);
void mostrar_instancia(); // completamente opcional, apenas para testes
void escrever_solucao(Solucao &sol, char* arq);
void verifica_ret_garagem(Solucao &sol);
void calcular_fo(Solucao &sol);
