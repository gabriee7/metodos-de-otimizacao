// P3 no ESTILO DO PROFESSOR (padrões vistos no código de aula): nomes abreviados, flag, goto INICIO,
// clone com memcpy na randômica e "desfazer por restauração" na PM/MM.
// Faz exatamente o mesmo que busca_local_prcp.cpp (que usa nomes por extenso e while).
// Aqui calcular_fo e gerar_vizinha seguem a base da prova: gerar_vizinha NÃO calcula a fo.
//
// Compilar:  g++ estilo_professor.cpp -o estilo_professor
// Executar:  ./estilo_professor caminho/da/instancia.txt
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_PTS 14000

typedef struct tSolucao
{
    int vet_sol[MAX_PTS];
    int fo;
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
    vet_qtd_conf = new int[num_ids];
    mat_conflitos = new int*[num_ids];
    for (int i = 0; i < num_ids; i++)
    {
        fscanf(f, "%d", &vet_qtd_conf[i]);
        mat_conflitos[i] = new int[vet_qtd_conf[i] + 1];
        for (int j = 0; j < vet_qtd_conf[i]; j++)
        {
            fscanf(f, "%d", &mat_conflitos[i][j]);
            mat_conflitos[i][j]--;
        }
    }
    fclose(f);
}

void calcular_fo(Solucao& s)
{
    int id, pt, pos, conflito;
    s.fo = num_pts;
    for (int i = 0; i < num_pts; i++)
    {
        id = get_id(i, s.vet_sol[i]);
        conflito = 0;
        for (int j = 0; j < vet_qtd_conf[id]; j++)
        {
            pt = get_ponto(mat_conflitos[id][j]);
            pos = get_posicao(mat_conflitos[id][j]);
            if (s.vet_sol[pt] == pos) { conflito = 1; break; }
        }
        s.fo -= conflito;
    }
}

void gerar_vizinha(Solucao& s)                        // base da prova: NÃO chama calcular_fo
{
    int pt, pos;
    pt = rand() % num_pts;
    do
        pos = rand() % num_pos;
    while (pos == s.vet_sol[pt]);
    s.vet_sol[pt] = pos;
}

void heur_cons_ale(Solucao& s)
{
    for (int i = 0; i < num_pts; i++)
        s.vet_sol[i] = rand() % num_pos;
    calcular_fo(s);
}

// >>> estilo_ra
void heur_bl_ra(Solucao& s, const int iter)
{
    Solucao clone;
    while (1)
    {
        int flag = 1;                                 // flag = 1: "nada melhorou nesta rodada"
        for (int i = 0; i < iter; i++)
        {
            memcpy(&clone, &s, sizeof(Solucao));
            gerar_vizinha(clone);
            calcular_fo(clone);                       // aqui é o chamador que calcula a fo
            if (clone.fo > s.fo)
            {
                memcpy(&s, &clone, sizeof(Solucao));
                flag = 0;
            }
        }
        if (flag)
            break;
    }
}
// <<< estilo_ra

// >>> estilo_pm
void heur_bl_pm(Solucao& s)
{
    INICIO : ;                                        // rótulo: recomeça a varredura
    int melhor_fo = s.fo;
    for (int pt = 0; pt < num_pts; pt++)
    {
        int fo_orig = s.fo;
        int pos_orig = s.vet_sol[pt];
        for (int pos = 0; pos < num_pos; pos++)
        {
            if (pos != pos_orig)
            {
                s.vet_sol[pt] = pos;
                calcular_fo(s);
                if (s.fo > melhor_fo)
                {
                    goto INICIO;                      // primeira melhora: fica e recomeça
                }
                else
                {
                    s.vet_sol[pt] = pos_orig;         // desfaz por restauração
                    s.fo = fo_orig;
                }
            }
        }
    }
}
// <<< estilo_pm

// >>> estilo_mm
void heur_bl_mm(Solucao& s)
{
    int melhor_pt, melhor_pos;
    int melhor_fo = s.fo;
    while (1)
    {
        int flag = 1;
        for (int pt = 0; pt < num_pts; pt++)
        {
            int fo_orig = s.fo;
            int pos_orig = s.vet_sol[pt];
            for (int pos = 0; pos < num_pos; pos++)
            {
                if (pos != pos_orig)
                {
                    s.vet_sol[pt] = pos;
                    calcular_fo(s);
                    if (s.fo > melhor_fo)             // compara com o melhor visto até agora
                    {
                        melhor_fo = s.fo;
                        melhor_pt = pt;
                        melhor_pos = pos;
                        flag = 0;
                    }
                }
            }
            s.vet_sol[pt] = pos_orig;                 // desfaz DEPOIS de testar todas as posições do ponto
            s.fo = fo_orig;
        }
        if (flag)
            break;
        s.vet_sol[melhor_pt] = melhor_pos;            // aplica só o melhor
        s.fo = melhor_fo;
    }
}
// <<< estilo_mm

int main(int argc, char** argv)
{
    const char* arq = "i25.txt";
    if (argc > 1)
        arq = argv[1];
    srand(42);
    ler_dados(arq);

    Solucao inicial, s;
    heur_cons_ale(inicial);
    printf("FO inicial (aleatoria): %d\n", inicial.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    heur_bl_ra(s, num_pts * num_pos);
    printf("heur_bl_ra: %d\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    heur_bl_pm(s);
    printf("heur_bl_pm: %d\n", s.fo);

    memcpy(&s, &inicial, sizeof(Solucao));
    heur_bl_mm(s);
    printf("heur_bl_mm: %d\n", s.fo);

    Solucao conferencia;
    memcpy(&conferencia, &s, sizeof(Solucao));
    calcular_fo(conferencia);
    printf("conferencia (recalculada): %d\n", conferencia.fo);
    return 0;
}
