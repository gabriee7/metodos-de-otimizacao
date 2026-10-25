// PRCP — Rotulação Cartográfica de Pontos: as 3 buscas locais da P3.
// PRCP MAXIMIZA a FO (pontos livres) => "melhorou" significa fo MAIOR.
//
// Compilar:  g++ busca_local_prcp.cpp -o busca_local_prcp
// Executar:  ./busca_local_prcp caminho/da/instancia.txt
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_PTS 14000

typedef struct tSolucao
{
    int vet_sol[MAX_PTS]; // vet_sol[ponto] = posição candidata (0 .. num_pos-1)
    int fo;               // número de pontos livres (sem sobreposição)
} Solucao;

int num_pts;
int num_pos;
int num_ids;
int* vet_qtd_conf;
int** mat_conflitos;

int get_id(const int& pt, const int& pos) { return (pt * num_pos) + pos; }
int get_ponto(const int& id) { return id / num_pos; }
int get_posicao(const int& id) { return id % num_pos; }

void ler_dados(const char* arq)
{
    FILE* f = fopen(arq, "r");
    if (f == NULL) { printf("Erro ao abrir %s\n", arq); exit(1); }
    fscanf(f, "%d %d", &num_pts, &num_pos);
    num_ids = num_pts * num_pos;
    vet_qtd_conf = (int*) malloc(num_ids * sizeof(int));
    mat_conflitos = (int**) malloc(num_ids * sizeof(int*));
    for (int i = 0; i < num_ids; i++)
    {
        fscanf(f, "%d", &vet_qtd_conf[i]);
        mat_conflitos[i] = (int*) malloc((vet_qtd_conf[i] + 1) * sizeof(int));
        for (int j = 0; j < vet_qtd_conf[i]; j++)
        {
            fscanf(f, "%d", &mat_conflitos[i][j]);
            mat_conflitos[i][j]--; // arquivo é 1-based, código é 0-based
        }
    }
    fclose(f);
}

void calcular_fo(Solucao& s)
{
    s.fo = num_pts;                                   // supõe todos livres
    for (int i = 0; i < num_pts; i++)
    {
        int id = get_id(i, s.vet_sol[i]);
        int conflito = 0;
        for (int j = 0; j < vet_qtd_conf[id]; j++)
        {
            int pt = get_ponto(mat_conflitos[id][j]);
            int pos = get_posicao(mat_conflitos[id][j]);
            if (s.vet_sol[pt] == pos) { conflito = 1; break; }
        }
        s.fo -= conflito;                             // ponto em conflito não é livre
    }
}

// Vizinha: muda a posição de UM ponto sorteado para OUTRA posição.
void gerar_vizinha(Solucao& s)
{
    int pt = rand() % num_pts;
    int pos;
    do
        pos = rand() % num_pos;
    while (pos == s.vet_sol[pt]);
    s.vet_sol[pt] = pos;
}

void heuristica_construtiva_aleatoria(Solucao& s)
{
    for (int i = 0; i < num_pts; i++)
        s.vet_sol[i] = rand() % num_pos;
    calcular_fo(s);
}

// >>> randomica
void busca_local_randomica(Solucao& s, const int iteracoes)
{
    Solucao vizinha;
    int melhorou = 1;
    calcular_fo(s);                                   // garante fo válida na entrada
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int i = 0; i < iteracoes; i++)
        {
            memcpy(&vizinha, &s, sizeof(Solucao));    // trabalha numa cópia
            gerar_vizinha(vizinha);                   // 1 movimento ao acaso
            calcular_fo(vizinha);
            if (vizinha.fo > s.fo)                    // PRCP maximiza
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
        for (int ponto = 0; ponto < num_pts && melhorou == 0; ponto++)
        {
            int posicao_original = s.vet_sol[ponto];
            int fo_original = s.fo;
            for (int pos = 0; pos < num_pos && melhorou == 0; pos++)
            {
                if (pos == posicao_original)
                    continue;                         // não é um movimento
                s.vet_sol[ponto] = pos;               // aplica o movimento
                calcular_fo(s);
                if (s.fo > fo_original)
                    melhorou = 1;                     // fica aplicado; sai dos laços
                else
                {
                    s.vet_sol[ponto] = posicao_original; // desfaz
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
        int melhor_ponto = -1;
        int melhor_posicao = -1;
        int melhor_fo = s.fo;                         // referência: o melhor visto ATÉ AGORA
        for (int ponto = 0; ponto < num_pts; ponto++)
        {
            int posicao_original = s.vet_sol[ponto];
            int fo_original = s.fo;
            for (int pos = 0; pos < num_pos; pos++)
            {
                if (pos == posicao_original)
                    continue;
                s.vet_sol[ponto] = pos;
                calcular_fo(s);
                if (s.fo > melhor_fo)                 // compara com melhor_fo, não com s.fo
                {
                    melhor_fo = s.fo;
                    melhor_ponto = ponto;
                    melhor_posicao = pos;
                }
                s.vet_sol[ponto] = posicao_original;  // SEMPRE desfaz: só anotamos
                s.fo = fo_original;
            }
        }
        if (melhor_ponto == -1)
            break;                                    // nenhum vizinho melhora: ótimo local
        s.vet_sol[melhor_ponto] = melhor_posicao;     // aplica só o melhor
        s.fo = melhor_fo;
    }
}
// <<< melhor_melhora

int main(int argc, char** argv)
{
    const char* arq = "i25.txt";
    if (argc > 1)
        arq = argv[1];
    srand(42);
    ler_dados(arq);

    Solucao inicial, s;
    heuristica_construtiva_aleatoria(inicial);
    printf("instancia: %s  (%d pontos, %d posicoes)\n", arq, num_pts, num_pos);
    printf("FO inicial (aleatoria):   %d\n", inicial.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_randomica(s, num_pts * num_pos);
    printf("Busca randomica:          %d\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_primeira_melhora(s);
    printf("Busca primeira melhora:   %d\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_melhor_melhora(s);
    printf("Busca melhor melhora:     %d\n", s.fo);

    Solucao conferencia;
    memcpy(&conferencia, &s, sizeof(Solucao));
    calcular_fo(conferencia);
    printf("conferencia FO recalculada: %d (deve ser igual ao anterior)\n", conferencia.fo);
    return 0;
}
