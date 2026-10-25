// PET didático — alocação de tarefas (trechos de viagem) a tripulações.
// Modelo SIMPLIFICADO para estudar a busca local (a FO oficial da prova pode ter outros termos):
//   por tripulação: tempo ocioso entre tarefas, sobreposição, hora extra e excesso de jornada.
// PET MINIMIZA a FO => "melhorou" significa fo MENOR.
// Movimento: MOVER 1 tarefa da tripulação A para a tripulação B.
//
// Compilar:  g++ busca_local_pet.cpp -o busca_local_pet
// Executar:  ./busca_local_pet pet_toy.txt
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TAREFAS 100
#define MAX_TRIPULACOES 60

typedef struct tSolucao
{
    int matriz_sol[MAX_TRIPULACOES][MAX_TAREFAS]; // tarefas de cada tripulação, ordenadas por início
    int quantidade[MAX_TRIPULACOES];              // quantas tarefas cada tripulação tem
    int fo;
} Solucao;

int num_tarefas;
int num_tripulacoes;
int tempo_normal;
int tempo_maximo;
int vet_inicio[MAX_TAREFAS];
int vet_termino[MAX_TAREFAS];

const int PESO_OCIOSO = 1;
const int PESO_EXTRA = 1;
const int PESO_SOBREPOSICAO = 100;
const int PESO_EXCESSO = 100;

int maior(int a, int b) { if (a > b) return a; return b; }
int menor(int a, int b) { if (a < b) return a; return b; }

void ler_dados(const char* arq)
{
    FILE* f = fopen(arq, "r");
    if (f == NULL) { printf("Erro ao abrir %s\n", arq); exit(1); }
    fscanf(f, "%d %d %d", &num_tarefas, &tempo_normal, &tempo_maximo);
    int horas_somadas = 0;
    for (int i = 0; i < num_tarefas; i++)
    {
        fscanf(f, "%d %d", &vet_inicio[i], &vet_termino[i]);
        horas_somadas += vet_termino[i] - vet_inicio[i];
    }
    fclose(f);
    num_tripulacoes = (horas_somadas + tempo_normal - 1) / tempo_normal; // teto da divisão
    if (num_tripulacoes > MAX_TRIPULACOES)
        num_tripulacoes = MAX_TRIPULACOES;
}

void calcular_fo(Solucao& s)
{
    int ocioso = 0, extra = 0, sobreposicao = 0, excesso = 0;
    for (int t = 0; t < num_tripulacoes; t++)
    {
        int quantidade = s.quantidade[t];
        if (quantidade == 0)
            continue;
        for (int k = 1; k < quantidade; k++)
        {
            int anterior = s.matriz_sol[t][k - 1];
            int atual = s.matriz_sol[t][k];
            ocioso += maior(0, vet_inicio[atual] - vet_termino[anterior]);
            sobreposicao += maior(0, vet_termino[anterior] - vet_inicio[atual]);
        }
        int primeira = s.matriz_sol[t][0];
        int ultima = s.matriz_sol[t][quantidade - 1];
        int jornada = vet_termino[ultima] - vet_inicio[primeira];
        extra += menor(tempo_maximo - tempo_normal, maior(0, jornada - tempo_normal));
        excesso += maior(0, jornada - tempo_maximo);
    }
    s.fo = PESO_OCIOSO * ocioso + PESO_EXTRA * extra
         + PESO_SOBREPOSICAO * sobreposicao + PESO_EXCESSO * excesso;
}

void remover_tarefa(Solucao& s, int t, int posicao)
{
    for (int k = posicao; k < s.quantidade[t] - 1; k++)
        s.matriz_sol[t][k] = s.matriz_sol[t][k + 1];
    s.quantidade[t]--;
}

void inserir_tarefa(Solucao& s, int t, int tarefa)    // mantém ordenado por início
{
    int k = s.quantidade[t] - 1;
    while (k >= 0 && vet_inicio[s.matriz_sol[t][k]] > vet_inicio[tarefa])
    {
        s.matriz_sol[t][k + 1] = s.matriz_sol[t][k];
        k--;
    }
    s.matriz_sol[t][k + 1] = tarefa;
    s.quantidade[t]++;
}

// Vizinha: tira 1 tarefa de uma tripulação não vazia e coloca em OUTRA.
void gerar_vizinha(Solucao& s)
{
    int origem, destino;
    do
        origem = rand() % num_tripulacoes;
    while (s.quantidade[origem] == 0);
    int posicao = rand() % s.quantidade[origem];
    int tarefa = s.matriz_sol[origem][posicao];
    do
        destino = rand() % num_tripulacoes;
    while (destino == origem);
    remover_tarefa(s, origem, posicao);
    inserir_tarefa(s, destino, tarefa);
}

void heuristica_construtiva_aleatoria(Solucao& s)
{
    memset(&s, 0, sizeof(Solucao));
    for (int tarefa = 0; tarefa < num_tarefas; tarefa++)
        inserir_tarefa(s, rand() % num_tripulacoes, tarefa);
    calcular_fo(s);
}

// Desfazer = restaurar exatamente as 2 linhas que o movimento mexeu.
typedef struct tLinhaSalva
{
    int tarefas[MAX_TAREFAS];
    int quantidade;
} LinhaSalva;

void salvar_linha(const Solucao& s, int t, LinhaSalva& linha)
{
    memcpy(linha.tarefas, s.matriz_sol[t], sizeof(linha.tarefas));
    linha.quantidade = s.quantidade[t];
}

void restaurar_linha(Solucao& s, int t, const LinhaSalva& linha)
{
    memcpy(s.matriz_sol[t], linha.tarefas, sizeof(linha.tarefas));
    s.quantidade[t] = linha.quantidade;
}

// >>> randomica
void busca_local_randomica(Solucao& s, const int iteracoes)
{
    static Solucao vizinha;
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int i = 0; i < iteracoes; i++)
        {
            memcpy(&vizinha, &s, sizeof(Solucao));
            gerar_vizinha(vizinha);
            calcular_fo(vizinha);
            if (vizinha.fo < s.fo)                    // PET minimiza
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
    LinhaSalva salva_origem, salva_destino;
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int origem = 0; origem < num_tripulacoes && melhorou == 0; origem++)
        {
            for (int posicao = 0; posicao < s.quantidade[origem] && melhorou == 0; posicao++)
            {
                int tarefa = s.matriz_sol[origem][posicao];
                for (int destino = 0; destino < num_tripulacoes && melhorou == 0; destino++)
                {
                    if (destino == origem)
                        continue;
                    int fo_original = s.fo;
                    salvar_linha(s, origem, salva_origem);
                    salvar_linha(s, destino, salva_destino);
                    remover_tarefa(s, origem, posicao);   // aplica o movimento
                    inserir_tarefa(s, destino, tarefa);
                    calcular_fo(s);
                    if (s.fo < fo_original)
                        melhorou = 1;                     // fica aplicado
                    else
                    {
                        restaurar_linha(s, origem, salva_origem);   // desfaz
                        restaurar_linha(s, destino, salva_destino);
                        s.fo = fo_original;
                    }
                }
            }
        }
    }
}
// <<< primeira_melhora

// >>> melhor_melhora
void busca_local_melhor_melhora(Solucao& s)
{
    LinhaSalva salva_origem, salva_destino;
    calcular_fo(s);
    while (1)
    {
        int melhor_origem = -1, melhor_tarefa = -1, melhor_destino = -1;
        int melhor_fo = s.fo;
        for (int origem = 0; origem < num_tripulacoes; origem++)
        {
            for (int posicao = 0; posicao < s.quantidade[origem]; posicao++)
            {
                int tarefa = s.matriz_sol[origem][posicao];
                for (int destino = 0; destino < num_tripulacoes; destino++)
                {
                    if (destino == origem)
                        continue;
                    int fo_original = s.fo;
                    salvar_linha(s, origem, salva_origem);
                    salvar_linha(s, destino, salva_destino);
                    remover_tarefa(s, origem, posicao);
                    inserir_tarefa(s, destino, tarefa);
                    calcular_fo(s);
                    if (s.fo < melhor_fo)
                    {
                        melhor_fo = s.fo;
                        melhor_origem = origem;
                        melhor_tarefa = tarefa;
                        melhor_destino = destino;
                    }
                    restaurar_linha(s, origem, salva_origem);       // sempre desfaz
                    restaurar_linha(s, destino, salva_destino);
                    s.fo = fo_original;
                }
            }
        }
        if (melhor_origem == -1)
            break;
        for (int posicao = 0; posicao < s.quantidade[melhor_origem]; posicao++)
        {
            if (s.matriz_sol[melhor_origem][posicao] == melhor_tarefa)
            {
                remover_tarefa(s, melhor_origem, posicao);
                break;
            }
        }
        inserir_tarefa(s, melhor_destino, melhor_tarefa);
        s.fo = melhor_fo;
    }
}
// <<< melhor_melhora

int main(int argc, char** argv)
{
    const char* arq = "pet_toy.txt";
    if (argc > 1)
        arq = argv[1];
    srand(3);
    ler_dados(arq);
    printf("%d tarefas, %d tripulacoes\n", num_tarefas, num_tripulacoes);

    static Solucao inicial, s, conferencia;
    heuristica_construtiva_aleatoria(inicial);
    printf("FO inicial (aleatoria): %d\n", inicial.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_randomica(s, num_tarefas * num_tripulacoes);
    printf("Busca randomica:        %d\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_primeira_melhora(s);
    printf("Busca primeira melhora: %d\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_melhor_melhora(s);
    printf("Busca melhor melhora:   %d\n", s.fo);

    memcpy(&conferencia, &s, sizeof(Solucao));
    calcular_fo(conferencia);
    printf("conferencia (recalculada): %d\n", conferencia.fo);
    return 0;
}
