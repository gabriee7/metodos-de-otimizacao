// PROBLEMA INÉDITO (exercício de treino): escalonamento de tarefas em máquinas paralelas.
// Cada tarefa tem um tempo; cada tarefa vai para UMA máquina; FO = carga da máquina MAIS carregada
// (makespan). MINIMIZA. Não é nenhum problema das listas — serve para treinar a derivação:
//   solução: vet_maquina[tarefa]   movimento: mover 1 tarefa p/ outra máquina   vizinhança: n x (m-1)
//
// Compilar:  g++ busca_local_makespan.cpp -o busca_local_makespan
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TAREFAS 100
#define MAX_MAQUINAS 20

typedef struct tSolucao
{
    int vet_maquina[MAX_TAREFAS]; // vet_maquina[tarefa] = máquina (0 .. num_maquinas-1)
    int fo;                       // maior carga entre as máquinas
} Solucao;

int num_tarefas = 10;
int num_maquinas = 3;
int vet_tempo[MAX_TAREFAS] = {9, 8, 7, 7, 6, 5, 4, 4, 3, 3};   // soma 56 -> limite inferior ceil(56/3) = 19

void calcular_fo(Solucao& s)
{
    int carga[MAX_MAQUINAS];
    memset(carga, 0, sizeof(carga));
    for (int t = 0; t < num_tarefas; t++)
        carga[s.vet_maquina[t]] += vet_tempo[t];
    s.fo = 0;
    for (int m = 0; m < num_maquinas; m++)
        if (carga[m] > s.fo)
            s.fo = carga[m];
}

void gerar_vizinha(Solucao& s)
{
    int tarefa = rand() % num_tarefas;
    int maquina;
    do
        maquina = rand() % num_maquinas;
    while (maquina == s.vet_maquina[tarefa]);
    s.vet_maquina[tarefa] = maquina;
}

// >>> randomica
void busca_local_randomica(Solucao& s, const int iteracoes)
{
    Solucao vizinha;
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
            if (vizinha.fo < s.fo)                    // MINIMIZA
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
        for (int tarefa = 0; tarefa < num_tarefas && melhorou == 0; tarefa++)
        {
            int maquina_original = s.vet_maquina[tarefa];
            int fo_original = s.fo;
            for (int maquina = 0; maquina < num_maquinas && melhorou == 0; maquina++)
            {
                if (maquina == maquina_original)
                    continue;
                s.vet_maquina[tarefa] = maquina;      // aplica
                calcular_fo(s);
                if (s.fo < fo_original)               // MINIMIZA
                    melhorou = 1;
                else
                {
                    s.vet_maquina[tarefa] = maquina_original;   // desfaz
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
        int melhor_tarefa = -1;
        int melhor_maquina = -1;
        int melhor_fo = s.fo;
        for (int tarefa = 0; tarefa < num_tarefas; tarefa++)
        {
            int maquina_original = s.vet_maquina[tarefa];
            int fo_original = s.fo;
            for (int maquina = 0; maquina < num_maquinas; maquina++)
            {
                if (maquina == maquina_original)
                    continue;
                s.vet_maquina[tarefa] = maquina;
                calcular_fo(s);
                if (s.fo < melhor_fo)
                {
                    melhor_fo = s.fo;
                    melhor_tarefa = tarefa;
                    melhor_maquina = maquina;
                }
                s.vet_maquina[tarefa] = maquina_original;
                s.fo = fo_original;
            }
        }
        if (melhor_tarefa == -1)
            break;
        s.vet_maquina[melhor_tarefa] = melhor_maquina;
        s.fo = melhor_fo;
    }
}
// <<< melhor_melhora

void escrever(const char* rotulo, const Solucao& s)
{
    int carga[MAX_MAQUINAS];
    memset(carga, 0, sizeof(carga));
    for (int t = 0; t < num_tarefas; t++)
        carga[s.vet_maquina[t]] += vet_tempo[t];
    printf("%-22s FO %2d   cargas:", rotulo, s.fo);
    for (int m = 0; m < num_maquinas; m++)
        printf(" %d", carga[m]);
    printf("\n");
}

int main()
{
    srand(5);
    Solucao inicial, s;
    for (int t = 0; t < num_tarefas; t++)
        inicial.vet_maquina[t] = 0;                   // pior caso: tudo na máquina 0
    calcular_fo(inicial);
    escrever("inicial (tudo na maq 0)", inicial);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_randomica(s, num_tarefas * num_maquinas);
    escrever("randomica", s);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_primeira_melhora(s);
    escrever("primeira melhora", s);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_melhor_melhora(s);
    escrever("melhor melhora", s);

    // Platô: reaplicar a busca a uma solução já "presa" não muda nada, mesmo havendo vizinhos IGUAIS.
    Solucao conferencia;
    memcpy(&conferencia, &s, sizeof(Solucao));
    calcular_fo(conferencia);
    printf("conferencia (recalculada): %d   limite inferior: 19\n", conferencia.fo);
    return 0;
}
