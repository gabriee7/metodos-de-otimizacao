# -*- coding: utf-8 -*-
"""Definição do Playground: problemas, etapas, testes (C++), soluções certas e erros comuns.

Tudo que aparece no site (assets/js/playground-data.js) é gerado daqui por playground_build.py,
e playground_testar.py compila cada solução certa (todos os testes devem passar) e cada erro comum
(o teste indicado em `pega` deve falhar). Assim nenhum "certo" ou "errado" do site é palpite.
"""

HEADER = r'''#include <stdio.h>
#include <stdlib.h>
#include <string.h>

'''

# ------------------------------------------------------------------ infraestrutura dos testes (oculta)
FRAMEWORK = r'''
// ---------------------------------------------------------------- infraestrutura dos testes (oculta)
static int __total = 0, __ok = 0;
static void check(const char* nome, int cond, const char* dica)
{
    __total++;
    if (cond) { __ok++; printf("PASS|%s\n", nome); }
    else printf("FAIL|%s|%s\n", nome, dica);
}
'''

# ------------------------------------------------------------------ PROBLEMA A: escalonamento (minimiza)
A_DECL = r'''// ===== Problema A: escalonamento em máquinas paralelas (MINIMIZA o makespan) =====
// 8 tarefas, 3 máquinas idênticas. Cada tarefa vai para UMA máquina.
// FO = a maior carga entre as máquinas (o makespan).
#define MAX_TAREFAS 20
#define MAX_MAQUINAS 5

int num_tarefas = 8;
int num_maquinas = 3;
int vet_tempo[MAX_TAREFAS] = {9, 8, 7, 6, 5, 4, 3, 2};

typedef struct tSolucao
{
    int vet_maquina[MAX_TAREFAS];   // vet_maquina[t] = máquina (0..num_maquinas-1) da tarefa t
    int fo;                         // maior carga entre as máquinas
} Solucao;
'''

A_FORNECIDOS = {
    'calcular_fo': r'''
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
''',
    'gerar_vizinha': r'''
void gerar_vizinha(Solucao& s)
{
    int tarefa = rand() % num_tarefas;
    int maquina;
    do
        maquina = rand() % num_maquinas;
    while (maquina == s.vet_maquina[tarefa]);
    s.vet_maquina[tarefa] = maquina;
}
''',
}

A_HELPERS = r'''
#define NUM_VIZINHOS 16
#define MOV_DICA "Um movimento é a MENOR mudança que leva a outra solução viável: aqui, mover UMA tarefa para OUTRA maquina."

static int fo_ref(const Solucao& s)
{
    int carga[MAX_MAQUINAS];
    for (int m = 0; m < MAX_MAQUINAS; m++) carga[m] = 0;
    for (int t = 0; t < num_tarefas; t++)
        if (s.vet_maquina[t] >= 0 && s.vet_maquina[t] < num_maquinas)
            carga[s.vet_maquina[t]] += vet_tempo[t];
    int maior = 0;
    for (int m = 0; m < num_maquinas; m++) if (carga[m] > maior) maior = carga[m];
    return maior;
}
static int viavel(const Solucao& s)
{
    for (int t = 0; t < num_tarefas; t++)
        if (s.vet_maquina[t] < 0 || s.vet_maquina[t] >= num_maquinas) return 0;
    return 1;
}
static int diferencas(const Solucao& a, const Solucao& b)
{
    int d = 0;
    for (int t = 0; t < num_tarefas; t++) if (a.vet_maquina[t] != b.vet_maquina[t]) d++;
    return d;
}
static int mov_minimo(const Solucao& a, const Solucao& b) { return diferencas(a, b) == 1; }
static int melhor(int novo, int velho) { return novo < velho; }       // MINIMIZA
static int existe_vizinho_melhor(const Solucao& s)
{
    Solucao v = s;
    int base = fo_ref(s);
    for (int t = 0; t < num_tarefas; t++)
        for (int m = 0; m < num_maquinas; m++)
        {
            if (m == s.vet_maquina[t]) continue;
            v.vet_maquina[t] = m;
            if (melhor(fo_ref(v), base)) return 1;
            v.vet_maquina[t] = s.vet_maquina[t];
        }
    return 0;
}
static void solucao_ruim(Solucao& s)
{
    memset(&s, 0, sizeof(s));
    for (int t = 0; t < num_tarefas; t++) s.vet_maquina[t] = 0;       // tudo na maquina 0
    s.fo = fo_ref(s);
}
static void solucao_exemplo(Solucao& s)
{
    int v[8] = {0, 1, 2, 0, 1, 2, 0, 1};
    memset(&s, 0, sizeof(s));
    for (int t = 0; t < num_tarefas; t++) s.vet_maquina[t] = v[t];
    s.fo = fo_ref(s);
}
static void solucao_exemplo2(Solucao& s)
{
    int v[8] = {2, 2, 1, 1, 0, 0, 2, 1};
    memset(&s, 0, sizeof(s));
    for (int t = 0; t < num_tarefas; t++) s.vet_maquina[t] = v[t];
    s.fo = fo_ref(s);
}
'''

# ------------------------------------------------------------------ PROBLEMA B: seleção de k itens (maximiza)
B_DECL = r'''// ===== Problema B: escolher EXATAMENTE k de n itens (MAXIMIZA a soma dos valores) =====
// 10 itens, k = 4. FO = soma dos valores dos itens escolhidos.
#define MAX_ITENS 30

int num_itens = 10;
int num_escolhas = 4;    // k
int vet_valor[MAX_ITENS] = {15, 3, 22, 8, 19, 5, 30, 11, 2, 27};

typedef struct tSolucao
{
    int vet_escolhido[MAX_ITENS];   // 1 = escolhido, 0 = fora. Sempre com exatamente k uns.
    int fo;                         // soma dos valores dos itens escolhidos
} Solucao;
'''

B_FORNECIDOS = {
    'calcular_fo': r'''
void calcular_fo(Solucao& s)
{
    s.fo = 0;
    for (int i = 0; i < num_itens; i++)
        if (s.vet_escolhido[i] == 1)
            s.fo += vet_valor[i];
}
''',
    'gerar_vizinha': r'''
void gerar_vizinha(Solucao& s)
{
    int saindo, entrando;
    do
        saindo = rand() % num_itens;
    while (s.vet_escolhido[saindo] == 0);
    do
        entrando = rand() % num_itens;
    while (s.vet_escolhido[entrando] == 1);
    s.vet_escolhido[saindo] = 0;
    s.vet_escolhido[entrando] = 1;
}
''',
}

B_HELPERS = r'''
#define NUM_VIZINHOS 24
#define MOV_DICA "Um movimento é a MENOR mudança que leva a outra solução VIAVEL (sempre exatamente k itens): aqui, uma TROCA (um sai, um entra)."

static int fo_ref(const Solucao& s)
{
    int soma = 0;
    for (int i = 0; i < num_itens; i++) if (s.vet_escolhido[i] == 1) soma += vet_valor[i];
    return soma;
}
static int viavel(const Solucao& s)
{
    int total = 0;
    for (int i = 0; i < num_itens; i++)
    {
        if (s.vet_escolhido[i] != 0 && s.vet_escolhido[i] != 1) return 0;
        total += s.vet_escolhido[i];
    }
    return total == num_escolhas;
}
static int diferencas(const Solucao& a, const Solucao& b)
{
    int d = 0;
    for (int i = 0; i < num_itens; i++) if (a.vet_escolhido[i] != b.vet_escolhido[i]) d++;
    return d;
}
static int mov_minimo(const Solucao& a, const Solucao& b) { return diferencas(a, b) == 2; }
static int melhor(int novo, int velho) { return novo > velho; }       // MAXIMIZA
static int existe_vizinho_melhor(const Solucao& s)
{
    Solucao v = s;
    int base = fo_ref(s);
    for (int a = 0; a < num_itens; a++)
    {
        if (s.vet_escolhido[a] != 1) continue;
        for (int b = 0; b < num_itens; b++)
        {
            if (s.vet_escolhido[b] != 0) continue;
            v.vet_escolhido[a] = 0; v.vet_escolhido[b] = 1;
            if (melhor(fo_ref(v), base)) return 1;
            v.vet_escolhido[a] = 1; v.vet_escolhido[b] = 0;
        }
    }
    return 0;
}
static void solucao_ruim(Solucao& s)
{
    memset(&s, 0, sizeof(s));
    s.vet_escolhido[1] = s.vet_escolhido[3] = s.vet_escolhido[5] = s.vet_escolhido[8] = 1;   // valores 3+8+5+2
    s.fo = fo_ref(s);
}
static void solucao_exemplo(Solucao& s)
{
    memset(&s, 0, sizeof(s));
    s.vet_escolhido[0] = s.vet_escolhido[2] = s.vet_escolhido[4] = s.vet_escolhido[6] = 1;
    s.fo = fo_ref(s);
}
static void solucao_exemplo2(Solucao& s)
{
    memset(&s, 0, sizeof(s));
    s.vet_escolhido[1] = s.vet_escolhido[3] = s.vet_escolhido[5] = s.vet_escolhido[9] = 1;
    s.fo = fo_ref(s);
}
'''

# ------------------------------------------------------------------ testes (comuns aos dois problemas)
T_FO = r'''
int main()
{
    Solucao a, b, c;
    solucao_exemplo(a);
    a.fo = 99999;                         // lixo de proposito: a funcao precisa sobrescrever
    calcular_fo(a);
    check("calcular_fo dá o valor certo (solução 1)", a.fo == fo_ref(a), "Confira a conta à mão para esta solução e o que a FO mede neste problema.");
    solucao_exemplo2(b);
    b.fo = -7;
    calcular_fo(b);
    check("calcular_fo dá o valor certo (solução 2)", b.fo == fo_ref(b), "Confira a conta à mão para esta solução e o que a FO mede neste problema.");
    int antes = b.fo;
    calcular_fo(b);
    check("chamar duas vezes dá o mesmo resultado", b.fo == antes && antes == fo_ref(b), "Provável: faltou reiniciar a fo (e/ou o acumulador) antes de calcular; o valor antigo entra na conta.");
    solucao_exemplo(c);
    Solucao copia = c;
    calcular_fo(c);
    check("não altera a solução, só a fo", diferencas(c, copia) == 0, "calcular_fo só pode escrever em s.fo.");
    printf("RESULT|%d|%d\n", __ok, __total);
    return 0;
}
'''

T_VIZ = r'''
int main()
{
    srand(5);
    Solucao base;
    solucao_exemplo(base);
    Solucao vistas[64];
    int n_vistas = 0, todas_viaveis = 1, todas_minimas = 1;
    for (int i = 0; i < 300; i++)
    {
        Solucao v = base;
        gerar_vizinha(v);
        if (!viavel(v)) todas_viaveis = 0;
        if (!mov_minimo(base, v)) todas_minimas = 0;
        int nova = 1;
        for (int j = 0; j < n_vistas; j++)
            if (diferencas(vistas[j], v) == 0) { nova = 0; break; }
        if (nova && n_vistas < 64) vistas[n_vistas++] = v;
    }
    check("toda vizinha é viável", todas_viaveis, "Alguma vizinha ficou inviável. " MOV_DICA);
    check("cada vizinha difere da original por exatamente um movimento", todas_minimas, "A vizinha não difere da original do jeito esperado. " MOV_DICA);
    check("sorteia vizinhas variadas", n_vistas >= 10, "Sempre as mesmas vizinhas? Sorteie com rand() todos os elementos que o movimento escolhe.");
    printf("RESULT|%d|%d\n", __ok, __total);
    return 0;
}
'''

T_CONS = r'''
int main()
{
    srand(3);
    Solucao vistas[8];
    int n_vistas = 0, todas_viaveis = 1, fo_ok = 1;
    for (int i = 0; i < 60; i++)
    {
        Solucao s;
        memset(&s, 1, sizeof(s));         // lixo de proposito: a funcao nao pode confiar no que ja estava ali
        heuristica_construtiva_aleatoria(s);
        if (!viavel(s)) todas_viaveis = 0;
        if (s.fo != fo_ref(s)) fo_ok = 0;
        int nova = 1;
        for (int j = 0; j < n_vistas; j++)
            if (diferencas(vistas[j], s) == 0) { nova = 0; break; }
        if (nova && n_vistas < 8) vistas[n_vistas++] = s;
    }
    check("toda solução gerada é viável", todas_viaveis, "Alguma solução saiu inviável (restrição quebrada, valor fora do intervalo ou vetor com lixo).");
    check("a fo da solução está atualizada", fo_ok, "Depois de montar a solução, chame calcular_fo(s).");
    check("gera soluções diferentes", n_vistas >= 5, "É uma construtiva ALEATORIA: sorteie com rand().");
    printf("RESULT|%d|%d\n", __ok, __total);
    return 0;
}
'''

T_RA = r'''
int main()
{
    srand(7);
    Solucao s;
    solucao_ruim(s);
    int fo0 = fo_ref(s);
    busca_local_randomica(s, NUM_VIZINHOS);
    check("a solução final é viável", viavel(s), "A busca deixou a solução inviável. Aceite só vizinhas (cópias) geradas por gerar_vizinha.");
    check("a fo está atualizada (bate com o recálculo)", s.fo == fo_ref(s), "s.fo não bate com a solução final. Ao aceitar uma vizinha, copie a solução INTEIRA (inclusive a fo).");
    check("não piorou", !melhor(fo0, fo_ref(s)), "A solução final ficou PIOR que a inicial. Confira o sinal da comparação e se você trabalha numa CÓPIA.");
    check("melhorou em relação à inicial", melhor(fo_ref(s), fo0), "Nada melhorou. Confira o sinal (maximiza ou minimiza?) e se a vizinha aceita volta para s.");
    int piorou_alguma_vez = 0;
    for (int semente = 1; semente <= 8; semente++)
    {
        Solucao g;
        solucao_exemplo(g);                  // ja e uma solucao razoavel
        int fo_g = fo_ref(g);
        srand(semente);
        busca_local_randomica(g, NUM_VIZINHOS);
        if (melhor(fo_g, fo_ref(g)) || !viavel(g)) piorou_alguma_vez = 1;
    }
    check("nunca piora, nem partindo de uma solução boa", !piorou_alguma_vez, "Partindo de uma solução razoável a busca acabou PIOR. A randômica só pode aceitar vizinhas melhores: trabalhe numa cópia e só copie de volta se melhorar.");
    printf("RESULT|%d|%d\n", __ok, __total);
    return 0;
}
'''

_T_BUSCA_TEMPLATE = r'''
int main()
{
    srand(11);
    Solucao s, t, u;
    solucao_ruim(s);
    int fo0 = fo_ref(s);
    @BUSCA@(s);
    check("a solução final é viável", viavel(s), "A busca deixou a solução inviável. Confira o movimento e, principalmente, o DESFAZER (todos os elementos que o movimento mudou).");
    check("a fo está atualizada (bate com o recálculo)", s.fo == fo_ref(s), "s.fo não bate com a solução final. Ao desfazer, restaure tambem a fo (s.fo = fo_original).");
    check("não piorou", !melhor(fo0, fo_ref(s)), "A solução final ficou PIOR que a inicial. Confira o sinal da comparação.");
    check("melhorou em relação à inicial", melhor(fo_ref(s), fo0), "Nada melhorou. Confira o sinal (maximiza ou minimiza?).");
    check("é ótimo local (nenhum vizinho melhora)", viavel(s) && !existe_vizinho_melhor(s), "Ainda existe um vizinho melhor. A busca parou cedo demais: ela só termina depois de varrer TODA a vizinhança sem achar melhora.");
    t = s;
    @BUSCA@(t);
    check("rodar de novo não muda nada", fo_ref(t) == fo_ref(s), "Rodar a busca em um ótimo local não pode alterar a FO.");
    solucao_exemplo(u);
    @BUSCA@(u);
    check("também chega a ótimo local partindo de outra solução", viavel(u) && u.fo == fo_ref(u) && !existe_vizinho_melhor(u), "Partindo de outra solução inicial a busca não terminou em ótimo local.");
    printf("RESULT|%d|%d\n", __ok, __total);
    return 0;
}
'''
T_PM = _T_BUSCA_TEMPLATE.replace('@BUSCA@', 'busca_local_primeira_melhora')
T_MM = _T_BUSCA_TEMPLATE.replace('@BUSCA@', 'busca_local_melhor_melhora')

TESTES = {'fo': T_FO, 'viz': T_VIZ, 'cons': T_CONS, 'ra': T_RA, 'pm': T_PM, 'mm': T_MM}

# ------------------------------------------------------------------ etapas (ordem e quais funções já vêm prontas)
ETAPAS = [
    dict(id='fo', titulo='calcular_fo', assinatura='void calcular_fo(Solucao& s)', fornecidos=[]),
    dict(id='viz', titulo='gerar_vizinha (o movimento)', assinatura='void gerar_vizinha(Solucao& s)', fornecidos=['calcular_fo']),
    dict(id='cons', titulo='construtiva aleatória', assinatura='void heuristica_construtiva_aleatoria(Solucao& s)', fornecidos=['calcular_fo']),
    dict(id='ra', titulo='busca local randômica', assinatura='void busca_local_randomica(Solucao& s, const int iteracoes)', fornecidos=['calcular_fo', 'gerar_vizinha']),
    dict(id='pm', titulo='busca local primeira melhora', assinatura='void busca_local_primeira_melhora(Solucao& s)', fornecidos=['calcular_fo']),
    dict(id='mm', titulo='busca local melhor melhora', assinatura='void busca_local_melhor_melhora(Solucao& s)', fornecidos=['calcular_fo']),
]

# ------------------------------------------------------------------ conteúdo por problema e etapa
# 'pega': trecho do nome do teste que deve FALHAR com esse erro; 'TIMEOUT' = laço infinito; 'NAO_PEGA' = os testes passam mesmo
# assim (o erro só se vê lendo o código).

PROBLEMAS = {}

# ============================================================== A
PROBLEMAS['A'] = dict(
    id='A', nome='Escalonamento (minimiza)', sinal='minimiza',
    resumo='8 tarefas, 3 máquinas. Cada tarefa vai para uma máquina; a FO é a maior carga (makespan).',
    decl=A_DECL, fornecidos=A_FORNECIDOS, helpers=A_HELPERS,
    etapas={
        'fo': dict(
            enunciado='Escreva `calcular_fo`. A FO é a **maior carga** entre as máquinas (o makespan). A carga de uma máquina é a soma dos tempos das tarefas atribuídas a ela; `vet_maquina[t]` diz em que máquina está a tarefa `t`.',
            pistas=['Você precisa guardar a carga de cada máquina. Em que estrutura? E com que valor ela começa?',
                    'Percorra as tarefas: some `vet_tempo[t]` na carga da máquina `vet_maquina[t]`.',
                    'Depois percorra as máquinas guardando a maior carga em `s.fo`. Lembre de iniciar `s.fo` antes.'],
            esqueleto='''void calcular_fo(Solucao& s)
{
    // TODO: s.fo = maior carga entre as máquinas
}''',
            certo=A_FORNECIDOS['calcular_fo'].strip('\n'),
            erros=[
                dict(titulo='Somou tudo em vez de pegar o maior',
                     codigo='''void calcular_fo(Solucao& s)
{
    s.fo = 0;
    for (int t = 0; t < num_tarefas; t++)
        s.fo += vet_tempo[t];
}''',
                     explica='Isso é a soma de **todos** os tempos (44), igual para qualquer solução. O makespan é a **maior carga de uma máquina**: preciso separar por máquina e só então pegar o máximo.',
                     pega='calcular_fo dá o valor certo (solução 1)'),
                dict(titulo='Não iniciou s.fo antes de comparar',
                     codigo='''void calcular_fo(Solucao& s)
{
    int carga[MAX_MAQUINAS];
    memset(carga, 0, sizeof(carga));
    for (int t = 0; t < num_tarefas; t++)
        carga[s.vet_maquina[t]] += vet_tempo[t];
    for (int m = 0; m < num_maquinas; m++)
        if (carga[m] > s.fo)          // s.fo ainda tem o valor ANTIGO
            s.fo = carga[m];
}''',
                     explica='`s.fo` chega com o que estava na struct. Se esse valor antigo for maior que todas as cargas, nunca é substituído. Sempre inicialize (`s.fo = 0`) antes de acumular ou comparar.',
                     pega='calcular_fo dá o valor certo (solução 1)'),
            ]),
        'viz': dict(
            enunciado='Escreva `gerar_vizinha`: altera `s` para **uma** vizinha sorteada, movendo **uma tarefa para outra máquina**. Não calcule a FO aqui (quem chama a função calcula).',
            pistas=['Pergunta 1 do guia: o que muda entre uma solução e a sua vizinha? Qual é a menor mudança que continua viável?',
                    'Sorteie a tarefa. Para a máquina, repita o sorteio enquanto sair a **mesma** em que a tarefa já está.',
                    'Termine com `s.vet_maquina[tarefa] = maquina;`'],
            esqueleto='''void gerar_vizinha(Solucao& s)
{
    // TODO: mover UMA tarefa para OUTRA máquina
}''',
            certo=A_FORNECIDOS['gerar_vizinha'].strip('\n'),
            erros=[
                dict(titulo='Pode sortear a mesma máquina',
                     codigo='''void gerar_vizinha(Solucao& s)
{
    int tarefa = rand() % num_tarefas;
    s.vet_maquina[tarefa] = rand() % num_maquinas;
}''',
                     explica='1 chance em 3 de sortear a máquina em que a tarefa **já está**: a "vizinha" é igual à original (nada mudou). Use `do { ... } while (maquina == atual)`.',
                     pega='cada vizinha difere da original'),
                dict(titulo='Máquina fora do intervalo',
                     codigo='''void gerar_vizinha(Solucao& s)
{
    int tarefa = rand() % num_tarefas;
    int maquina;
    do
        maquina = rand() % (num_maquinas + 1);   // +1: sorteia uma máquina que não existe
    while (maquina == s.vet_maquina[tarefa]);
    s.vet_maquina[tarefa] = maquina;
}''',
                     explica='`rand() % n` devolve de `0` a `n-1`. Com `num_maquinas + 1` aparece a máquina 3, que não existe: a solução fica inviável (e `calcular_fo` lê fora do vetor).',
                     pega='toda vizinha é viável'),
            ]),
        'cons': dict(
            enunciado='Escreva `heuristica_construtiva_aleatoria`: gera uma solução inicial **viável** sorteando a máquina de cada tarefa, e calcula a FO. O vetor chega com lixo; não conte com nenhum valor anterior.',
            pistas=['O que torna uma solução deste problema viável? (Pense no intervalo de `vet_maquina[t]`.)',
                    'Para cada tarefa, sorteie uma máquina de `0` a `num_maquinas - 1`.',
                    'No final, chame `calcular_fo(s)`: a construtiva devolve uma solução **completa**, com a FO pronta.'],
            esqueleto='''void heuristica_construtiva_aleatoria(Solucao& s)
{
    // TODO: sortear a máquina de cada tarefa e calcular a FO
}''',
            certo='''void heuristica_construtiva_aleatoria(Solucao& s)
{
    for (int t = 0; t < num_tarefas; t++)
        s.vet_maquina[t] = rand() % num_maquinas;
    calcular_fo(s);
}''',
            erros=[
                dict(titulo='Esqueceu de calcular a FO',
                     codigo='''void heuristica_construtiva_aleatoria(Solucao& s)
{
    for (int t = 0; t < num_tarefas; t++)
        s.vet_maquina[t] = rand() % num_maquinas;
}''',
                     explica='A solução está montada, mas `s.fo` ficou com lixo. A busca local compara FOs: começar com uma FO falsa estraga a primeira comparação.',
                     pega='a fo da solução está atualizada'),
                dict(titulo='Intervalo errado do sorteio',
                     codigo='''void heuristica_construtiva_aleatoria(Solucao& s)
{
    for (int t = 0; t < num_tarefas; t++)
        s.vet_maquina[t] = rand() % (num_maquinas + 1);
    calcular_fo(s);
}''',
                     explica='Mesmo erro do `gerar_vizinha`: `% (num_maquinas + 1)` inclui uma máquina que não existe. Confira sempre os limites do sorteio.',
                     pega='toda solução gerada é viável'),
            ]),
        'ra': dict(
            enunciado='Escreva `busca_local_randomica(s, iteracoes)`: repete **rodadas**; em cada rodada sorteia `iteracoes` vizinhas (use `gerar_vizinha` numa **cópia**), aceita a vizinha se for **melhor** (aqui MINIMIZA) e termina quando uma rodada inteira não melhora nada.',
            pistas=['Quais são as 4 peças? Solução: `s`. Movimento: `gerar_vizinha`. Vizinha: uma **cópia** de `s` alterada. Melhorou?: `vizinha.fo < s.fo`.',
                    'Estrutura: `while (melhorou == 1) { melhorou = 0; for (i < iteracoes) { copia; gera; calcula; se melhor, aceita e melhorou = 1; } }`',
                    'Copiar a struct inteira: `memcpy(&vizinha, &s, sizeof(Solucao));` e, ao aceitar, `memcpy(&s, &vizinha, sizeof(Solucao));`'],
            esqueleto='''void busca_local_randomica(Solucao& s, const int iteracoes)
{
    // TODO
}''',
            certo='''void busca_local_randomica(Solucao& s, const int iteracoes)
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
            if (vizinha.fo < s.fo)               // MINIMIZA
            {
                memcpy(&s, &vizinha, sizeof(Solucao));
                melhorou = 1;
            }
        }
    }
}''',
            erros=[
                dict(titulo='Sinal invertido (aceita o pior)',
                     codigo='''void busca_local_randomica(Solucao& s, const int iteracoes)
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
            if (vizinha.fo > s.fo)               // problema é de MINIMIZAR!
            {
                memcpy(&s, &vizinha, sizeof(Solucao));
                melhorou = 1;
            }
        }
    }
}''',
                     explica='Este é um problema de **minimização**, então "melhor" é `<`. Com `>` a busca caminha para o **pior** makespan. Primeira coisa a escrever no papel: MAXIMIZA ou MINIMIZA.',
                     pega='melhorou em relação à inicial'),
                dict(titulo='Altera a própria s, sem cópia',
                     codigo='''void busca_local_randomica(Solucao& s, const int iteracoes)
{
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int i = 0; i < iteracoes; i++)
        {
            int fo_antiga = s.fo;
            gerar_vizinha(s);                    // muda a própria s
            calcular_fo(s);
            if (s.fo < fo_antiga)
                melhorou = 1;
            // se piorou, não há como voltar
        }
    }
}''',
                     explica='Trabalhando direto em `s`, uma vizinha pior **fica**. Sem cópia não existe "recusar a vizinha". Na randômica use sempre uma `vizinha` separada e só copie de volta se melhorar. Sem isso a busca vira um passeio aleatório que pode nunca terminar.',
                     pega='TIMEOUT'),
            ]),
        'pm': dict(
            enunciado='Escreva `busca_local_primeira_melhora`: varre a vizinhança **em ordem** (tarefa × máquina); ao achar o **primeiro** vizinho melhor (MINIMIZA), **mantém** e recomeça a varredura; termina quando uma varredura inteira não acha melhora. Vizinho que não melhora: **desfaça o movimento e restaure a fo**.',
            pistas=['Pergunta 2: como enumero os vizinhos? Todos os pares (tarefa, máquina diferente da atual) = 16 vizinhos.',
                    'Antes de aplicar, guarde `maquina_original` e `fo_original`. Aplique, chame `calcular_fo`, compare com `fo_original`.',
                    'Melhorou: `melhorou = 1` (mantém). Não melhorou: volte `vet_maquina[tarefa]` **e** `s.fo`. Os dois `for` também testam `melhorou == 0` para recomeçar.'],
            esqueleto='''void busca_local_primeira_melhora(Solucao& s)
{
    // TODO
}''',
            certo='''void busca_local_primeira_melhora(Solucao& s)
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
                    melhorou = 1;                     // fica aplicado
                else
                {
                    s.vet_maquina[tarefa] = maquina_original;   // desfaz
                    s.fo = fo_original;                         // e restaura a fo
                }
            }
        }
    }
}''',
            erros=[
                dict(titulo='Esqueceu de desfazer',
                     codigo='''void busca_local_primeira_melhora(Solucao& s)
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
                s.vet_maquina[tarefa] = maquina;
                calcular_fo(s);
                if (s.fo < fo_original)
                    melhorou = 1;
                // faltou o else: desfazer
            }
        }
    }
}''',
                     explica='Sem o `else`, um vizinho **pior** continua aplicado e a busca anda "para o lado errado". O desfazer faz parte do algoritmo: aplicar → avaliar → manter **ou** voltar. Aqui o resultado é grave: a busca pode girar **para sempre**.',
                     pega='TIMEOUT'),
                dict(titulo='Desfez a solução mas não a fo',
                     codigo='''void busca_local_primeira_melhora(Solucao& s)
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
                s.vet_maquina[tarefa] = maquina;
                calcular_fo(s);
                if (s.fo < fo_original)
                    melhorou = 1;
                else
                    s.vet_maquina[tarefa] = maquina_original;   // voltou a solução, mas s.fo ficou com a do vizinho
            }
        }
    }
}''',
                     explica='A solução voltou, mas `s.fo` guarda a FO do vizinho **recusado**. A struct fica inconsistente: o vetor é um e a FO é de outro. Ao desfazer, restaure **tudo** que o movimento e o cálculo alteraram. Com a `fo` errada na struct, as comparações seguintes mentem e a busca pode nem terminar.',
                     pega='TIMEOUT'),
                dict(titulo='Aceita empate (<=): laço infinito',
                     codigo='''void busca_local_primeira_melhora(Solucao& s)
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
                s.vet_maquina[tarefa] = maquina;
                calcular_fo(s);
                if (s.fo <= fo_original)           // <= aceita vizinho IGUAL
                    melhorou = 1;
                else
                {
                    s.vet_maquina[tarefa] = maquina_original;
                    s.fo = fo_original;
                }
            }
        }
    }
}''',
                     explica='Neste problema há **platôs**: mover uma tarefa de uma máquina que não é a mais carregada não muda a FO. Com `<=` o vizinho igual conta como "melhora", `melhorou` vira 1 e a busca roda para sempre trocando soluções equivalentes. Use sempre `<` (ou `>`) estrito.',
                     pega='TIMEOUT'),
            ]),
        'mm': dict(
            enunciado='Escreva `busca_local_melhor_melhora`: em cada passo **varre todos** os vizinhos, **desfazendo sempre**, e guarda qual foi o **melhor** (comparando com `melhor_fo`, não com `s.fo`). No fim do passo, se achou algum melhor que a solução atual, **aplica só ele** e repete; senão para.',
            pistas=['Guarde `melhor_tarefa`, `melhor_maquina` e `melhor_fo` (começa em `s.fo`). `melhor_tarefa == -1` significa "nenhum vizinho melhora".',
                    'Dentro da varredura: aplica, `calcular_fo`, compara com `melhor_fo`, e **sempre** desfaz (solução e fo).',
                    'Fora dos dois `for`: se `melhor_tarefa == -1`, `break`; senão aplique o melhor movimento e faça `s.fo = melhor_fo`.'],
            esqueleto='''void busca_local_melhor_melhora(Solucao& s)
{
    // TODO
}''',
            certo='''void busca_local_melhor_melhora(Solucao& s)
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
                if (s.fo < melhor_fo)               // compara com o MELHOR visto
                {
                    melhor_fo = s.fo;
                    melhor_tarefa = tarefa;
                    melhor_maquina = maquina;
                }
                s.vet_maquina[tarefa] = maquina_original;   // SEMPRE desfaz
                s.fo = fo_original;
            }
        }
        if (melhor_tarefa == -1)
            break;                                  // nenhum vizinho melhora: ótimo local
        s.vet_maquina[melhor_tarefa] = melhor_maquina;
        s.fo = melhor_fo;
    }
}''',
            erros=[
                dict(titulo='Não desfaz entre as avaliações',
                     codigo='''void busca_local_melhor_melhora(Solucao& s)
{
    calcular_fo(s);
    while (1)
    {
        int melhor_tarefa = -1;
        int melhor_maquina = -1;
        int melhor_fo = s.fo;
        for (int tarefa = 0; tarefa < num_tarefas; tarefa++)
        {
            for (int maquina = 0; maquina < num_maquinas; maquina++)
            {
                if (maquina == s.vet_maquina[tarefa])
                    continue;
                s.vet_maquina[tarefa] = maquina;
                calcular_fo(s);
                if (s.fo < melhor_fo)
                {
                    melhor_fo = s.fo;
                    melhor_tarefa = tarefa;
                    melhor_maquina = maquina;
                }
                // faltou desfazer: o próximo vizinho parte de uma solução já alterada
            }
        }
        if (melhor_tarefa == -1)
            break;
        s.vet_maquina[melhor_tarefa] = melhor_maquina;
        s.fo = melhor_fo;
    }
}''',
                     explica='A MM **sempre desfaz**, melhorando ou não: só no fim do passo aplica o melhor. Sem desfazer, cada vizinho é avaliado sobre uma solução que já foi mexida, e a "melhor" escolha não corresponde a nenhum vizinho real.',
                     pega='é ótimo local'),
                dict(titulo='Compara com s.fo em vez de melhor_fo',
                     codigo='''void busca_local_melhor_melhora(Solucao& s)
{
    calcular_fo(s);
    while (1)
    {
        int melhor_tarefa = -1;
        int melhor_maquina = -1;
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
                if (s.fo < fo_original)             // compara com a ORIGINAL, não com o melhor
                {
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
        calcular_fo(s);
    }
}''',
                     explica='**Os testes passam**, mas o código **não é melhor melhora**: como compara com a FO original, fica com o **último** vizinho que melhora, não com o melhor. Termina em ótimo local do mesmo jeito, só que por um caminho pior. Lição: passar nos testes não prova que o algoritmo é o pedido. Releia o enunciado: "aplica o melhor".',
                     pega='NAO_PEGA'),
            ]),
    })

# ============================================================== B
PROBLEMAS['B'] = dict(
    id='B', nome='Seleção de k itens (maximiza)', sinal='maximiza',
    resumo='10 itens com valores; escolher exatamente k = 4 para maximizar a soma. A restrição "exatamente k" muda o movimento.',
    decl=B_DECL, fornecidos=B_FORNECIDOS, helpers=B_HELPERS,
    etapas={
        'fo': dict(
            enunciado='Escreva `calcular_fo`. A FO é a **soma dos valores** dos itens escolhidos (`vet_escolhido[i] == 1`).',
            pistas=['O que a struct trazia em `s.fo` antes? Importa para o cálculo novo?',
                    'Percorra os itens; some `vet_valor[i]` **só** se o bit estiver em 1.',
                    'Maximizar ou minimizar não aparece aqui: isso fica no sinal das buscas.'],
            esqueleto='''void calcular_fo(Solucao& s)
{
    // TODO: s.fo = soma dos valores dos itens escolhidos
}''',
            certo=B_FORNECIDOS['calcular_fo'].strip('\n'),
            erros=[
                dict(titulo='Somou todos os itens, ignorando o bit',
                     codigo='''void calcular_fo(Solucao& s)
{
    s.fo = 0;
    for (int i = 0; i < num_itens; i++)
        s.fo += vet_valor[i];
}''',
                     explica='Sem o `if (vet_escolhido[i] == 1)` todo item entra na soma: a FO é a mesma para qualquer solução. A FO depende das **decisões** (os bits), não só dos dados.',
                     pega='calcular_fo dá o valor certo (solução 1)'),
                dict(titulo='Esqueceu de zerar s.fo',
                     codigo='''void calcular_fo(Solucao& s)
{
    for (int i = 0; i < num_itens; i++)
        if (s.vet_escolhido[i] == 1)
            s.fo += vet_valor[i];          // += sobre o valor ANTIGO de s.fo
}''',
                     explica='`+=` soma em cima do que já estava em `s.fo`. A cada chamada a FO **cresce**. Sempre `s.fo = 0` antes de acumular.',
                     pega='calcular_fo dá o valor certo (solução 1)'),
            ]),
        'viz': dict(
            enunciado='Escreva `gerar_vizinha`: altera `s` para **uma** vizinha sorteada, **sem quebrar o "exatamente k"**. Não calcule a FO aqui. Dica: o movimento mais óbvio (virar um bit) não serve; os testes vão mostrar por quê.',
            pistas=['Quantos itens a solução tem de ter sempre? O que acontece com essa conta se você virar só um bit?',
                    'Sorteie `saindo` repetindo até achar um item **escolhido**; sorteie `entrando` repetindo até achar um item **de fora**.',
                    'Faça os dois juntos: `s.vet_escolhido[saindo] = 0;` e `s.vet_escolhido[entrando] = 1;`'],
            esqueleto='''void gerar_vizinha(Solucao& s)
{
    // TODO: uma TROCA que preserve o "exatamente k"
}''',
            certo=B_FORNECIDOS['gerar_vizinha'].strip('\n'),
            erros=[
                dict(titulo='Virar um bit (bit-flip)',
                     codigo='''void gerar_vizinha(Solucao& s)
{
    int item = rand() % num_itens;
    s.vet_escolhido[item] = 1 - s.vet_escolhido[item];
}''',
                     explica='Virar **um** bit deixa a solução com k+1 ou k−1 itens: **inviável**. Qualquer movimento precisa levar uma solução viável a outra viável; aqui isso exige mudar **dois** bits ao mesmo tempo (um sai, um entra).',
                     pega='toda vizinha é viável'),
                dict(titulo='Troca sem conferir quem sai e quem entra',
                     codigo='''void gerar_vizinha(Solucao& s)
{
    int saindo = rand() % num_itens;
    int entrando = rand() % num_itens;
    s.vet_escolhido[saindo] = 0;
    s.vet_escolhido[entrando] = 1;
}''',
                     explica='Se `saindo` já era 0, ou `entrando` já era 1, a "troca" não é uma troca: o total de escolhidos muda. Sorteie `saindo` **entre os escolhidos** e `entrando` **entre os de fora**.',
                     pega='toda vizinha é viável'),
            ]),
        'cons': dict(
            enunciado='Escreva `heuristica_construtiva_aleatoria`: escolhe **exatamente k itens diferentes** ao acaso e calcula a FO. O vetor chega com lixo; não conte com nenhum valor anterior.',
            pistas=['Como começar? O que o vetor precisa ter antes de você marcar os itens?',
                    'Sortear k vezes e marcar pode **repetir** o mesmo item. Só conte um item quando ele estava livre.',
                    '`while (escolhidos < num_escolhas) { item = rand() % num_itens; se estava 0, vira 1 e escolhidos++ }` e, no fim, `calcular_fo(s)`.'],
            esqueleto='''void heuristica_construtiva_aleatoria(Solucao& s)
{
    // TODO: exatamente k itens diferentes
}''',
            certo='''void heuristica_construtiva_aleatoria(Solucao& s)
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
}''',
            erros=[
                dict(titulo='Sorteia k vezes sem conferir repetição',
                     codigo='''void heuristica_construtiva_aleatoria(Solucao& s)
{
    memset(s.vet_escolhido, 0, sizeof(s.vet_escolhido));
    for (int i = 0; i < num_escolhas; i++)
        s.vet_escolhido[rand() % num_itens] = 1;
    calcular_fo(s);
}''',
                     explica='Se o mesmo item for sorteado duas vezes, termina com **menos** de k escolhidos. Só "conte" quando o item estava livre.',
                     pega='toda solução gerada é viável'),
                dict(titulo='Não zerou o vetor antes',
                     codigo='''void heuristica_construtiva_aleatoria(Solucao& s)
{
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
}''',
                     explica='Aqui o vetor chega com lixo (como numa variável local não inicializada). Se nenhuma posição for 0, o `if` nunca é verdadeiro e o laço **nunca termina**. Sempre inicialize o vetor (`memset`) antes de construir.',
                     pega='TIMEOUT'),
            ]),
        'ra': dict(
            enunciado='Escreva `busca_local_randomica(s, iteracoes)`: repete **rodadas**; em cada rodada sorteia `iteracoes` vizinhas (use `gerar_vizinha` numa **cópia**), aceita a vizinha se for **melhor** (aqui MAXIMIZA) e termina quando uma rodada inteira não melhora nada.',
            pistas=['Quais são as 4 peças? Solução: `s`. Movimento: `gerar_vizinha` (a troca). Vizinha: **cópia** de `s` alterada. Melhorou?: `vizinha.fo > s.fo`.',
                    'Estrutura: `while (melhorou == 1) { melhorou = 0; for (i < iteracoes) { copia; gera; calcula; se melhor, aceita e melhorou = 1; } }`',
                    'Copiar a struct inteira: `memcpy(&vizinha, &s, sizeof(Solucao));` e, ao aceitar, `memcpy(&s, &vizinha, sizeof(Solucao));`'],
            esqueleto='''void busca_local_randomica(Solucao& s, const int iteracoes)
{
    // TODO
}''',
            certo='''void busca_local_randomica(Solucao& s, const int iteracoes)
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
            if (vizinha.fo > s.fo)               // MAXIMIZA
            {
                memcpy(&s, &vizinha, sizeof(Solucao));
                melhorou = 1;
            }
        }
    }
}''',
            erros=[
                dict(titulo='Sinal invertido (minimiza em vez de maximizar)',
                     codigo='''void busca_local_randomica(Solucao& s, const int iteracoes)
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
            if (vizinha.fo < s.fo)               // problema é de MAXIMIZAR!
            {
                memcpy(&s, &vizinha, sizeof(Solucao));
                melhorou = 1;
            }
        }
    }
}''',
                     explica='Este problema **maximiza**, então "melhor" é `>`. Copiar a busca de um problema de minimização sem trocar o sinal é um dos erros mais comuns.',
                     pega='melhorou em relação à inicial'),
                dict(titulo='Altera a própria s, sem cópia',
                     codigo='''void busca_local_randomica(Solucao& s, const int iteracoes)
{
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int i = 0; i < iteracoes; i++)
        {
            int fo_antiga = s.fo;
            gerar_vizinha(s);                    // muda a própria s
            calcular_fo(s);
            if (s.fo > fo_antiga)
                melhorou = 1;
        }
    }
}''',
                     explica='Sem cópia, uma vizinha pior **fica** em `s`. Na randômica a vizinha precisa existir separada de `s` para poder ser recusada. Sem isso a busca vira um passeio aleatório que pode nunca terminar.',
                     pega='TIMEOUT'),
            ]),
        'pm': dict(
            enunciado='Escreva `busca_local_primeira_melhora`: varre a vizinhança **em ordem** (quem sai × quem entra); ao achar o **primeiro** vizinho melhor (MAXIMIZA), **mantém** e recomeça a varredura; termina quando uma varredura inteira não acha melhora. Vizinho que não melhora: **desfaça a troca (os dois bits) e restaure a fo**.',
            pistas=['Pergunta 2: como enumero? `saindo` só entre os **escolhidos**, `entrando` só entre os **de fora** (dois `continue`). São k·(n−k) = 24 vizinhos.',
                    'Aplique a troca (`saindo` = 0, `entrando` = 1), chame `calcular_fo`, compare com `fo_original` com `>`.',
                    'Melhorou: `melhorou = 1`. Não melhorou: volte **os dois bits** (`saindo` = 1, `entrando` = 0) e `s.fo = fo_original`.'],
            esqueleto='''void busca_local_primeira_melhora(Solucao& s)
{
    // TODO
}''',
            certo='''void busca_local_primeira_melhora(Solucao& s)
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
                    melhorou = 1;
                else
                {
                    s.vet_escolhido[saindo] = 1;      // desfaz os DOIS bits
                    s.vet_escolhido[entrando] = 0;
                    s.fo = fo_original;
                }
            }
        }
    }
}''',
            erros=[
                dict(titulo='Desfaz só um dos dois bits',
                     codigo='''void busca_local_primeira_melhora(Solucao& s)
{
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int saindo = 0; saindo < num_itens && melhorou == 0; saindo++)
        {
            if (s.vet_escolhido[saindo] == 0)
                continue;
            for (int entrando = 0; entrando < num_itens && melhorou == 0; entrando++)
            {
                if (s.vet_escolhido[entrando] == 1)
                    continue;
                int fo_original = s.fo;
                s.vet_escolhido[saindo] = 0;
                s.vet_escolhido[entrando] = 1;
                calcular_fo(s);
                if (s.fo > fo_original)
                    melhorou = 1;
                else
                {
                    s.vet_escolhido[saindo] = 1;      // voltou o que saiu...
                    s.fo = fo_original;               // ...mas o que entrou continua escolhido
                }
            }
        }
    }
}''',
                     explica='A troca mexe em **dois** bits, então o desfazer também. Esquecer o `entrando` deixa a solução com k+1 itens (**inviável**). Regra: o desfazer é o movimento ao contrário, inteiro.',
                     pega='a solução final é viável'),
                dict(titulo='Sinal invertido',
                     codigo='''void busca_local_primeira_melhora(Solucao& s)
{
    int melhorou = 1;
    calcular_fo(s);
    while (melhorou == 1)
    {
        melhorou = 0;
        for (int saindo = 0; saindo < num_itens && melhorou == 0; saindo++)
        {
            if (s.vet_escolhido[saindo] == 0)
                continue;
            for (int entrando = 0; entrando < num_itens && melhorou == 0; entrando++)
            {
                if (s.vet_escolhido[entrando] == 1)
                    continue;
                int fo_original = s.fo;
                s.vet_escolhido[saindo] = 0;
                s.vet_escolhido[entrando] = 1;
                calcular_fo(s);
                if (s.fo < fo_original)               // problema é de MAXIMIZAR!
                    melhorou = 1;
                else
                {
                    s.vet_escolhido[saindo] = 1;
                    s.vet_escolhido[entrando] = 0;
                    s.fo = fo_original;
                }
            }
        }
    }
}''',
                     explica='Com `<` a busca procura **diminuir** a soma. Neste problema é maximização: `>`. A primeira coisa a anotar no papel é MAXIMIZA ou MINIMIZA.',
                     pega='melhorou em relação à inicial'),
            ]),
        'mm': dict(
            enunciado='Escreva `busca_local_melhor_melhora`: em cada passo **varre todas as trocas**, **desfazendo sempre**, e guarda qual foi a **melhor** (comparando com `melhor_fo`, não com `s.fo`). No fim do passo, se achou alguma melhor que a solução atual, **aplica só ela** e repete; senão para.',
            pistas=['Como a troca tem **dois** elementos, guarde `melhor_saindo` **e** `melhor_entrando` (mais `melhor_fo`, que começa em `s.fo`).',
                    'Dentro da varredura: aplica a troca, `calcular_fo`, compara com `melhor_fo` (com `>`), e **sempre** desfaz os dois bits e a fo.',
                    'Fora dos `for`: se `melhor_saindo == -1`, `break`; senão aplique a melhor troca e `s.fo = melhor_fo`.'],
            esqueleto='''void busca_local_melhor_melhora(Solucao& s)
{
    // TODO
}''',
            certo='''void busca_local_melhor_melhora(Solucao& s)
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
                if (s.fo > melhor_fo)                 // compara com o MELHOR visto
                {
                    melhor_fo = s.fo;
                    melhor_saindo = saindo;
                    melhor_entrando = entrando;
                }
                s.vet_escolhido[saindo] = 1;          // SEMPRE desfaz
                s.vet_escolhido[entrando] = 0;
                s.fo = fo_original;
            }
        }
        if (melhor_saindo == -1)
            break;                                    // nenhuma troca melhora: ótimo local
        s.vet_escolhido[melhor_saindo] = 0;
        s.vet_escolhido[melhor_entrando] = 1;
        s.fo = melhor_fo;
    }
}''',
            erros=[
                dict(titulo='Não desfaz entre as avaliações',
                     codigo='''void busca_local_melhor_melhora(Solucao& s)
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
                s.vet_escolhido[saindo] = 0;
                s.vet_escolhido[entrando] = 1;
                calcular_fo(s);
                if (s.fo > melhor_fo)
                {
                    melhor_fo = s.fo;
                    melhor_saindo = saindo;
                    melhor_entrando = entrando;
                }
                // faltou desfazer
            }
        }
        if (melhor_saindo == -1)
            break;
        s.vet_escolhido[melhor_saindo] = 0;
        s.vet_escolhido[melhor_entrando] = 1;
        s.fo = melhor_fo;
    }
}''',
                     explica='A MM **sempre desfaz**. Sem isso a solução vai sendo mexida durante a varredura e o par `(saindo, entrando)` guardado não corresponde mais a uma troca válida da solução original.',
                     pega='a solução final é viável'),
                dict(titulo='Compara com s.fo em vez de melhor_fo',
                     codigo='''void busca_local_melhor_melhora(Solucao& s)
{
    calcular_fo(s);
    while (1)
    {
        int melhor_saindo = -1;
        int melhor_entrando = -1;
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
                if (s.fo > fo_original)             // compara com a ORIGINAL, não com o melhor
                {
                    melhor_saindo = saindo;
                    melhor_entrando = entrando;
                }
                s.vet_escolhido[saindo] = 1;
                s.vet_escolhido[entrando] = 0;
                s.fo = fo_original;
            }
        }
        if (melhor_saindo == -1)
            break;
        s.vet_escolhido[melhor_saindo] = 0;
        s.vet_escolhido[melhor_entrando] = 1;
        calcular_fo(s);
    }
}''',
                     explica='**Os testes passam**, mas isto **não é melhor melhora**: qualquer vizinho melhor que a solução original sobrescreve o anterior, então fica o **último** que melhora, não o melhor. Termina em ótimo local, só que por um caminho pior. Passar nos testes não prova que o algoritmo é o pedido: releia o enunciado.',
                     pega='NAO_PEGA'),
            ]),
    })


# ------------------------------------------------------------------ montagem do programa completo
def visivel(problema, etapa_id):
    """Código que o aluno vê como 'já existe' (declarações + funções fornecidas)."""
    p = PROBLEMAS[problema]
    etapa = next(e for e in ETAPAS if e['id'] == etapa_id)
    txt = p['decl']
    for nome in etapa['fornecidos']:
        txt += p['fornecidos'][nome]
    return txt


def prefixo(problema, etapa_id):
    return HEADER + visivel(problema, etapa_id) + '\n// ---------------------------------------------------------------- SEU CÓDIGO\n'


def sufixo(problema, etapa_id):
    p = PROBLEMAS[problema]
    return '\n' + FRAMEWORK + p['helpers'] + TESTES[etapa_id]


def programa(problema, etapa_id, codigo_aluno):
    return prefixo(problema, etapa_id) + codigo_aluno + '\n' + sufixo(problema, etapa_id)
