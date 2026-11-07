// EXERCÍCIO C (inédito): escolher EXATAMENTE k de n itens para MAXIMIZAR a soma dos valores.
//
// Formato da instância (inventado para o exercício):
//   linha 1: n k
//   linha 2: n valores (um por item)
//
// Compilar:  g++ selecao_k_itens.cpp -o selecao_k_itens
// Executar:  ./selecao_k_itens toy_selecao.txt
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_ITENS 200

// ---------------------------------------------------------------- dados e solução
int num_itens;
int num_escolhas;                    // k
int vet_valor[MAX_ITENS];

typedef struct tSolucao
{
    int vet_escolhido[MAX_ITENS];    // 1 = item escolhido, 0 = não escolhido. Sempre com exatamente k uns.
    int fo;                          // soma dos valores dos itens escolhidos
} Solucao;

void ler_dados(const char* arq)
{
    FILE* f = fopen(arq, "r");
    if (f == NULL)
    {
        printf("Erro ao abrir %s\n", arq);
        exit(1);
    }
    fscanf(f, "%d %d", &num_itens, &num_escolhas);
    for (int i = 0; i < num_itens; i++)
        fscanf(f, "%d", &vet_valor[i]);
    fclose(f);
}

// >>> calcular_fo
void calcular_fo(Solucao& s)
{
    s.fo = 0;                                         // zerar antes de somar
    for (int i = 0; i < num_itens; i++)
        if (s.vet_escolhido[i] == 1)
            s.fo += vet_valor[i];
}
// <<< calcular_fo

// >>> construtiva_aleatoria
// Escolhe k itens DIFERENTES ao acaso. Sortear "k vezes" poderia repetir o mesmo item e
// gerar menos de k escolhidos; por isso só conta quando o item sorteado ainda estava livre.
void heuristica_construtiva_aleatoria(Solucao& s)
{
    memset(s.vet_escolhido, 0, sizeof(s.vet_escolhido));
    int escolhidos = 0;
    while (escolhidos < num_escolhas)
    {
        int item = rand() % num_itens;
        if (s.vet_escolhido[item] == 0)
        {
            s.vet_escolhido[item] = 1;
            escolhidos++;
        }
    }
    calcular_fo(s);
}
// <<< construtiva_aleatoria

// >>> vizinha
// O movimento NÃO pode ser "virar um bit": isso deixaria k+1 ou k-1 itens (solução inviável).
// O movimento certo é TROCAR: tira um item escolhido e coloca um não escolhido.
void gerar_vizinha(Solucao& s)
{
    int saindo, entrando;
    do
        saindo = rand() % num_itens;
    while (s.vet_escolhido[saindo] == 0);             // precisa ser um item hoje escolhido
    do
        entrando = rand() % num_itens;
    while (s.vet_escolhido[entrando] == 1);           // precisa ser um item hoje fora
    s.vet_escolhido[saindo] = 0;
    s.vet_escolhido[entrando] = 1;
}
// <<< vizinha

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
            if (vizinha.fo > s.fo)                    // MAXIMIZA
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
        for (int saindo = 0; saindo < num_itens && melhorou == 0; saindo++)
        {
            if (s.vet_escolhido[saindo] == 0)
                continue;                             // só sai quem está escolhido
            for (int entrando = 0; entrando < num_itens && melhorou == 0; entrando++)
            {
                if (s.vet_escolhido[entrando] == 1)
                    continue;                         // só entra quem está fora
                int fo_original = s.fo;
                s.vet_escolhido[saindo] = 0;          // aplica a troca
                s.vet_escolhido[entrando] = 1;
                calcular_fo(s);
                if (s.fo > fo_original)               // MAXIMIZA
                    melhorou = 1;                     // fica aplicada
                else
                {
                    s.vet_escolhido[saindo] = 1;      // desfaz (repete a troca ao contrário)
                    s.vet_escolhido[entrando] = 0;
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
        int melhor_saindo = -1;
        int melhor_entrando = -1;
        int melhor_fo = s.fo;
        for (int saindo = 0; saindo < num_itens; saindo++)
        {
            if (s.vet_escolhido[saindo] == 0)
                continue;
            for (int entrando = 0; entrando < num_itens; entrando++)
            {
                if (s.vet_escolhido[entrando] == 1)
                    continue;
                int fo_original = s.fo;
                s.vet_escolhido[saindo] = 0;
                s.vet_escolhido[entrando] = 1;
                calcular_fo(s);
                if (s.fo > melhor_fo)                 // compara com o melhor visto até agora
                {
                    melhor_fo = s.fo;
                    melhor_saindo = saindo;
                    melhor_entrando = entrando;
                }
                s.vet_escolhido[saindo] = 1;          // sempre desfaz
                s.vet_escolhido[entrando] = 0;
                s.fo = fo_original;
            }
        }
        if (melhor_saindo == -1)
            break;                                    // nenhuma troca melhora: ótimo local
        s.vet_escolhido[melhor_saindo] = 0;           // aplica só a melhor
        s.vet_escolhido[melhor_entrando] = 1;
        s.fo = melhor_fo;
    }
}
// <<< melhor_melhora

// ---------------------------------------------------------------- teste (segundo caminho)
int contar_escolhidos(const Solucao& s)
{
    int total = 0;
    for (int i = 0; i < num_itens; i++)
        total += s.vet_escolhido[i];
    return total;
}

int valor_otimo_conhecido()
{
    // Neste problema (soma simples) o ótimo é a soma dos k MAIORES valores.
    int copia[MAX_ITENS];
    memcpy(copia, vet_valor, sizeof(copia));
    int soma = 0;
    for (int rodada = 0; rodada < num_escolhas; rodada++)
    {
        int posicao_maior = 0;
        for (int i = 1; i < num_itens; i++)
            if (copia[i] > copia[posicao_maior])
                posicao_maior = i;
        soma += copia[posicao_maior];
        copia[posicao_maior] = -1;
    }
    return soma;
}

void escrever(const char* rotulo, const Solucao& s)
{
    printf("%-22s FO %3d  escolhidos (%d):", rotulo, s.fo, contar_escolhidos(s));
    for (int i = 0; i < num_itens; i++)
        if (s.vet_escolhido[i] == 1)
            printf(" %d", i + 1);
    printf("\n");
}

int main(int argc, char** argv)
{
    const char* arq = "toy_selecao.txt";
    if (argc > 1)
        arq = argv[1];
    srand(11);
    ler_dados(arq);
    printf("n = %d itens, k = %d, otimo conhecido (soma dos k maiores) = %d\n\n", num_itens, num_escolhas, valor_otimo_conhecido());

    Solucao inicial, s;
    heuristica_construtiva_aleatoria(inicial);
    escrever("inicial (aleatoria)", inicial);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_randomica(s, num_escolhas * (num_itens - num_escolhas));
    escrever("randomica", s);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_primeira_melhora(s);
    escrever("primeira melhora", s);

    memcpy(&s, &inicial, sizeof(Solucao));
    busca_local_melhor_melhora(s);
    escrever("melhor melhora", s);

    Solucao conferencia;
    memcpy(&conferencia, &s, sizeof(Solucao));
    calcular_fo(conferencia);
    printf("\nconferencia: fo recalculada = %d | itens escolhidos = %d (deve ser k = %d)\n",
           conferencia.fo, contar_escolhidos(conferencia), num_escolhas);
    return 0;
}
