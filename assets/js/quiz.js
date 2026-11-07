// Quiz de estudo: perguntas por fase, correção na hora, progresso salvo no navegador e lista de reforço.
// Convenção do texto: `código`, **negrito**, bloco com três crases. Nas questões "mc" a PRIMEIRA opção é a correta
// (as opções são embaralhadas ao exibir).
(function () {
  'use strict';

  var FASES = [
    { nome: 'Os conceitos', desc: 'As 4 peças e as 5 perguntas', ref: ['guia.html#perguntas', 'Guia'] },
    { nome: 'Os três métodos', desc: 'Randômica, primeira melhora, melhor melhora', ref: ['p3-busca-local.html', 'P3: Busca local'] },
    { nome: 'Problema novo: derive', desc: 'Movimento, vizinhança, sinal e desfazer para o que você nunca viu', ref: ['problemas.html#inedito', 'Problema inédito'] },
    { nome: 'Caça ao bug', desc: 'Ache o erro no trecho de código', ref: ['p3-busca-local.html', 'P3: Busca local'] },
    { nome: 'Construtivas', desc: 'Aleatória, gulosa, aleatória-gulosa', ref: ['p2-construtivas.html', 'P2: Construtivas'] },
    { nome: 'Regras da prova', desc: 'Entrega, prioridade e conferências', ref: ['checklist.html', 'Checklist'] }
  ];

  var Q = [
    // ---------------------------------------------------------------- Fase 1: conceitos
    { f: 0, t: 'mc', q: 'O que é uma **busca local**?',
      o: ['Partir de uma solução completa e viável e refiná-la com pequenos movimentos.',
          'Construir a solução escolhendo, passo a passo, a melhor opção parcial.',
          'Sortear soluções até aparecer uma boa e guardar a melhor.',
          'Testar todas as soluções possíveis e escolher a melhor.'],
      e: 'Busca local **refina** uma solução que já existe. Construir passo a passo é uma **construtiva** (gulosa); testar tudo é força bruta.' },

    { f: 0, t: 'mc', q: 'Quais são as **4 peças** de qualquer busca local?',
      o: ['Solução, movimento, vizinhança e a pergunta \'melhorou?\'.',
          'Construtiva, gulosa, aleatória e GRASP.',
          'Entrada, saída, laço e função.',
          'Variável, domínio, restrição e objetivo.'],
      e: 'As 4 peças: **solução** (o que o vetor guarda), **movimento** (a menor mudança), **vizinhança** (todas as soluções alcançáveis por um movimento) e **melhorou?** (maximiza ou minimiza). A última opção é a modelagem da P1.' },

    { f: 0, t: 'ab', q: 'Sem olhar: escreva, **em ordem**, as 5 perguntas que você responde ao receber um problema novo.',
      r: '1. O que muda entre vizinhas?\n2. Como enumero?\n3. Maximizo ou minimizo?\n4. Como desfaço?\n5. Chamei `calcular_fo`?',
      e: 'A ordem importa: o movimento (1) define como enumerar (2); o sinal (3) vem do enunciado; desfazer (4) é o inverso do movimento; e a FO (5) tem de ser recalculada **depois** de cada movimento.' },

    { f: 0, t: 'mc', q: 'Um **movimento** é...',
      o: ['A menor alteração que leva uma solução **viável** a outra solução **viável**.',
          'Qualquer alteração no vetor, mesmo que quebre uma restrição.',
          'A troca da instância por outra mais fácil.',
          'Recalcular a função objetivo.'],
      e: 'Se o movimento \'óbvio\' gera solução inviável (como virar um bit no exercício C), procure outro que preserve a viabilidade.' },

    { f: 0, t: 'mc', q: 'O que é um **ótimo local**?',
      o: ['Uma solução cujos vizinhos nenhum é melhor que ela (pode não ser o ótimo global).',
          'A melhor solução possível do problema.',
          'A solução inicial gerada pela construtiva.',
          'Uma solução com FO igual a zero.'],
      e: 'Ótimo local depende da vizinhança escolhida: com outro movimento, o mesmo ponto pode deixar de ser ótimo local.' },

    { f: 0, t: 'mc', q: 'Você trocou um problema de **maximização** por um de **minimização**, com o **mesmo movimento**. O que muda no código?',
      o: ['Basicamente o sinal da comparação com a FO.',
          'O movimento inteiro e os laços.',
          'A função de desfazer.',
          'O tamanho da vizinhança.'],
      e: 'Movimento, enumeração e desfazer não dependem do objetivo. Só o `>` vira `<` (e o teste de \'melhor possível\', se você tiver um).' },

    // ---------------------------------------------------------------- Fase 2: métodos
    { f: 1, t: 'mc', q: 'Diferença entre **primeira melhora** e **melhor melhora**, em uma frase:',
      o: ['A PM aplica o primeiro vizinho melhor que encontra e recomeça; a MM examina todos e aplica só o melhor.',
          'A PM sorteia vizinhos; a MM varre em ordem.',
          'A PM só serve para maximizar; a MM, para minimizar.',
          'A PM não desfaz movimentos; a MM desfaz.'],
      e: 'Sortear vizinhos é a **randômica**. PM também desfaz (quando o vizinho não melhora); o que muda é **quando** ela decide.' },

    { f: 1, t: 'mc', q: 'Por que a MM compara com `melhor_fo` e **não** com `s.fo`?',
      o: ['Como desfaz cada movimento, `s.fo` continua sendo a FO da solução original; comparar com ela aceitaria qualquer vizinho melhor que o original, não o melhor de todos.',
          'Porque `s.fo` está sempre errado.',
          'Porque `melhor_fo` é mais rápido de calcular.',
          'Porque a MM não usa `calcular_fo`.'],
      e: '`melhor_fo` começa em `s.fo` e só sobe/desce quando aparece um vizinho **melhor que o melhor visto até agora**. É o que faz a MM escolher o melhor entre todos.' },

    { f: 1, t: 'mc', q: 'Por que a **randômica** não garante ótimo local?',
      o: ['Ela sorteia vizinhos e pode nunca sortear o que melhora.',
          'Porque ela não calcula a FO.',
          'Porque só testa o primeiro vizinho.',
          'Porque não usa `memcpy`.'],
      e: 'No exercício C, dos 32 vizinhos só 1 melhorava; sorteando 32 vezes, a chance de errar esse único vizinho é (31/32)^32 ≈ **36%**. Por isso ela parou em 94 e PM/MM chegaram a 98.' },

    { f: 1, t: 'mc', q: 'Quando a **randômica** para?',
      o: ['Quando uma rodada inteira de `iteracoes` sorteios não produz nenhuma melhora.',
          'Quando encontra o ótimo global.',
          'Quando testou todos os vizinhos.',
          'Depois do primeiro sorteio.'],
      e: 'Repare no `melhorou = 0` no início de cada rodada: se nada melhorou em `iteracoes` tentativas, ela encerra.' },

    { f: 1, t: 'mc', q: 'Por que aceitar com `>` (ou `<`) estrito e **não** `>=` na primeira melhora?',
      o: ['Com `>=` um vizinho igual seria \'melhora\', `melhorou = 1` e a busca pode girar para sempre entre soluções iguais.',
          'Porque `>=` não compila.',
          'Porque `>=` é mais lento.',
          'Porque empates nunca existem.'],
      e: 'Empates existem (platôs). O estrito garante que cada aceitação melhora de verdade, então o laço termina.' },

    { f: 1, t: 'mc', q: 'Quais métodos **garantem** parar em um ótimo local?',
      o: ['Primeira melhora e melhor melhora.',
          'Só a melhor melhora.',
          'Só a randômica.',
          'Os três.'],
      e: 'PM e MM só terminam quando **varreram toda a vizinhança** sem achar melhora. A randômica só tentou alguns sorteios.' },

    { f: 1, t: 'ab', q: 'Na **primeira melhora**, o que você faz com a solução **e com `s.fo`** quando o vizinho **não** melhora?',
      r: 'Desfaz o movimento (volta o valor/valores alterados) **e** restaura `s.fo = fo_original`.',
      e: 'Esquecer a `fo` deixa a FO do vizinho ruim na struct; a próxima comparação usa um valor falso e a busca pode aceitar piora.' },

    { f: 1, t: 'mc', q: 'Qual método custa **mais por passo** (olha mais vizinhos antes de decidir)?',
      o: ['Melhor melhora: varre toda a vizinhança a cada passo.',
          'Primeira melhora: sempre varre tudo.',
          'Randômica: sempre varre tudo.',
          'Todos custam igual.'],
      e: 'A PM pode parar no primeiro vizinho bom. A MM sempre paga a vizinhança inteira por passo; em troca, escolhe passos melhores.' },

    { f: 1, t: 'mc', q: 'A FO do problema é o **máximo** de várias cargas (makespan). Por que as buscas podem parar longe do melhor possível?',
      o: ['Mover uma tarefa de uma máquina que não é a mais carregada não muda a FO: o vizinho é igual, não melhor (platô).',
          'Porque o makespan não pode ser calculado.',
          'Porque a busca local não funciona para minimizar.',
          'Porque as máquinas são idênticas.'],
      e: 'Quando a FO é um `max`, **desconfie de platôs**. Remédios: critério de desempate (ex.: soma dos quadrados das cargas) ou outro movimento (trocar duas tarefas).' },

    { f: 1, t: 'ab', q: 'No TSP de 40 cidades, a **gulosa** (623,11) ganhou da RA (797,71), da PM (630,07) e da MM (823,87). O que isso ensina?',
      r: 'Nenhuma busca vence sempre. Uma boa construtiva pode superar buscas que partem de uma solução ruim; o ponto de partida importa. E a MM não é automaticamente melhor que a PM: ela só garante ótimo local, não o global.',
      e: 'Por isso a P2 (construtivas) alimenta a P3: uma boa solução inicial muda muito o resultado final.' },

    // ---------------------------------------------------------------- Fase 3: problema novo
    { f: 2, t: 'mc', q: 'Escalonamento: **n tarefas** em **m máquinas**, minimizar a maior carga. Qual o movimento natural?',
      o: ['Mover **uma** tarefa para outra máquina (n·(m−1) vizinhos).',
          'Inverter a ordem de todas as tarefas.',
          'Sortear o tempo de uma tarefa.',
          'Trocar o número de máquinas.'],
      e: 'Solução: `vet_maquina[tarefa]`. Desfazer: restaurar a máquina original da tarefa e a `fo`.' },

    { f: 2, t: 'mc', q: 'Exercício C (escolher **exatamente k** de n). Por que **virar um bit** não serve como movimento?',
      o: ['Deixaria k+1 ou k−1 itens escolhidos (solução inviável).',
          'Porque o vetor é binário.',
          'Porque seriam poucos vizinhos.',
          'Porque o sinal fica invertido.'],
      e: 'O movimento certo é **trocar**: um item escolhido sai, um não escolhido entra. Vizinhança k·(n−k). Se o enunciado fosse \'até k\', virar um bit voltaria a servir.' },

    { f: 2, t: 'mc', q: 'A solução é uma **permutação** (cada cidade aparece uma vez). Qual movimento preserva isso?',
      o: ['Trocar de lugar duas posições (swap).',
          'Trocar o valor de uma posição por outro sorteado.',
          'Zerar uma posição.',
          'Duplicar uma cidade.'],
      e: 'Mudar o valor de uma só posição repetiria uma cidade e faltaria outra. Swap mantém a permutação; desfazer é o swap de novo.' },

    { f: 2, t: 'mc', q: 'Coloração de vértices: **5 vértices, 3 cores**, mudar a cor de um vértice. Quantos vizinhos?',
      o: ['10', '15', '5', '6'],
      e: 'n·(k−1) = 5·2 = **10**: cada vértice pode ir para as 2 outras cores (a atual não conta).' },

    { f: 2, t: 'mc', q: 'Partição em 2 grupos (|soma0 − soma1| mínimo), movimento \'mudar o grupo de um número\'. Como desfazer?',
      o: ['Aplicar o mesmo movimento de novo: com 2 grupos, `1 − atual` desfaz.',
          'Recalcular tudo do zero.',
          'Sortear outro número.',
          'Não precisa desfazer.'],
      e: 'O movimento é seu **próprio inverso**. Atenção ao `abs` na FO: sem ele, a busca \'melhora\' fabricando diferença negativa.' },

    { f: 2, t: 'mc', q: 'Exercício C com **n = 12** e **k = 4**. Quantos vizinhos (trocas) existem?',
      o: ['32', '48', '12', '8'],
      e: 'k·(n−k) = 4·8 = **32**. Esse número vira o parâmetro `iteracoes` da randômica.' },

    { f: 2, t: 'mc', q: 'TSP com movimento \'trocar duas cidades\' e **10 cidades**. Quantos vizinhos (pares i < j)?',
      o: ['45', '90', '10', '100'],
      e: 'C(10,2) = 10·9/2 = **45**. Se contasse (i, j) e (j, i) separadamente seria 90, mas é o mesmo swap.' },

    { f: 2, t: 'ab', q: 'Alocar **alunos em salas com capacidade**, minimizando custo. Que movimento você usaria e como trataria a **capacidade**?',
      r: 'Movimento: mover um aluno para outra sala (ou trocar dois alunos de salas diferentes). Capacidade: só permitir o movimento se a sala destino tem vaga, ou trocar dois alunos (mantém a lotação), ou permitir inviável e **penalizar** o excesso na FO com peso grande.',
      e: 'É a mesma pergunta do exercício C: quando o movimento óbvio quebra uma restrição, ache outro que preserve a viabilidade ou penalize.' },

    { f: 2, t: 'ab', q: 'Para **coloração de vértices com k cores** (minimizar arestas monocromáticas), escreva: solução, movimento, nº de vizinhos, sinal e como desfaz.',
      r: 'Solução: `vet_cor[v]` (0..k−1). Movimento: mudar a cor de um vértice. Vizinhos: n·(k−1). Sinal: minimiza (`<`). Desfaz: restaurar a cor (e a `fo`).',
      e: 'Bônus: ao mover um vértice, só as arestas incidentes a ele mudam; dá para calcular a variação sem refazer a FO inteira.' },

    // ---------------------------------------------------------------- Fase 4: caça ao bug
    { f: 3, t: 'mc', q: 'Primeira melhora (minimiza). Qual é o bug?\n```\ns.vet[i] = novo;\ncalcular_fo(s);\nif (s.fo < fo_original) melhorou = 1;\nelse s.vet[i] = antigo;\n```',
      o: ['Ao desfazer, falta restaurar `s.fo = fo_original`.',
          'O sinal deveria ser `>`.',
          'Falta chamar `gerar_vizinha`.',
          'Não há bug.'],
      e: 'A solução voltou, mas `s.fo` ficou com a FO do vizinho ruim. A próxima iteração compara contra um valor falso.' },

    { f: 3, t: 'mc', q: 'Melhor melhora. Qual é o bug?\n```\ns.vet[i] = novo;\ncalcular_fo(s);\nif (s.fo < melhor_fo) {\n    melhor_fo = s.fo; melhor_i = i; melhor_novo = novo;\n}\n/* (nenhuma linha depois do if) */\n```',
      o: ['Não desfaz o movimento: os próximos vizinhos são avaliados sobre uma solução já alterada.',
          'Deveria comparar com `s.fo`.',
          'Falta o `break`.',
          'Não há bug.'],
      e: 'A MM **sempre desfaz**, melhorando ou não, e só no fim aplica o melhor. Sem desfazer, cada avaliação parte de um estado sujo.' },

    { f: 3, t: 'mc', q: 'Problema de **minimizar** o makespan. A busca \'melhora\' e o resultado piora. Qual é a causa mais provável?\n```\nif (vizinha.fo > s.fo) { ... aceita ... }\n```',
      o: ['Sinal invertido: está aceitando o vizinho **pior**.',
          'Falta `memcpy`.',
          'O `rand()` está errado.',
          'A struct é grande demais.'],
      e: 'Primeira coisa a escrever no papel: \'MAXIMIZA\' ou \'MINIMIZA\'. Confira o sinal antes de qualquer outra coisa.' },

    { f: 3, t: 'mc', q: 'Exercício C: o resultado final tem 5 itens escolhidos (k = 4). Qual trecho explica?\n```\nfor (int saindo...)\n  for (int entrando...) {\n    s.v[saindo] = 0;\n    s.v[entrando] = 1;\n    ...\n  }\n```',
      o: ['Faltam os `continue` que filtram \'saindo só se escolhido\' e \'entrando só se fora\'.',
          'Falta somar `k`.',
          'O vetor deveria ter tamanho k.',
          'Faltou `srand`.'],
      e: 'Sem o filtro, uma \'troca\' pode tirar quem já estava fora e pôr quem já estava dentro: o total de escolhidos muda. Por isso o teste final confere `escolhidos == k`.' },

    { f: 3, t: 'mc', q: 'Randômica. Qual é o problema?\n```\ngerar_vizinha(s);\ncalcular_fo(s);\nif (s.fo < fo_antiga) melhorou = 1;\n```',
      o: ['Alterou `s` diretamente: se o vizinho for pior, não há como voltar. Falta copiar para `vizinha` com `memcpy`.',
          'Falta o `while`.',
          '`gerar_vizinha` não pode receber referência.',
          'Não há problema.'],
      e: 'Na randômica você trabalha numa **cópia** (`vizinha`) e só copia de volta para `s` se melhorar.' },

    { f: 3, t: 'mc', q: 'A FO fica **crescendo a cada chamada** de `calcular_fo`. O que esqueceram?\n```\nvoid calcular_fo(Solucao& s) {\n    for (...) s.fo += custo(...);\n}\n```',
      o: ['Zerar `s.fo = 0;` antes de somar.',
          'Passar `s` por valor.',
          'Usar `-=`.',
          'Chamar `rand()`.'],
      e: 'Sem zerar, a soma nova se acumula sobre a FO anterior.' },

    { f: 3, t: 'ab', q: 'O código compila, mas a FO final é **melhor que o limite inferior** (impossível). O que você confere primeiro?',
      r: '1) Recalcular a FO do zero com `calcular_fo` numa cópia e comparar com `s.fo`.\n2) Conferir a **viabilidade** (restrições: ex. escolhidos == k, permutação sem repetição).\n3) Conferir se o desfazer restaura solução **e** `fo`.',
      e: 'FO impossível quase sempre significa solução inviável ou `fo` desatualizada. O \'segundo caminho\' de teste existe para pegar isso.' },

    // ---------------------------------------------------------------- Fase 5: construtivas
    { f: 4, t: 'mc', q: 'Na construtiva **gulosa**, o que é o **custo parcial**?',
      o: ['O custo calculado só com o que já foi decidido até agora.',
          'O custo da solução final.',
          'O custo médio de todos os candidatos.',
          'O custo da pior opção.'],
      e: 'A gulosa decide passo a passo; cada candidato é avaliado só com as decisões já tomadas.' },

    { f: 4, t: 'mc', q: 'Aleatória-gulosa por **LRC**, minimização, `limite = mín + α·(máx − mín)`. Com **α = 0** ela se comporta como...',
      o: ['Gulosa pura (só o melhor candidato).',
          'Aleatória pura.',
          'Busca local.',
          'Nenhuma das duas.'],
      e: 'α = 0 → `limite = mín`: só o melhor entra na LRC. α = 1 → `limite = máx`: todos entram (aleatória pura).' },

    { f: 4, t: 'ab', q: 'Custos dos candidatos {10, 14, 20, 30}, **α = 0,5**, minimização. Quem entra na LRC?',
      r: 'limite = 10 + 0,5 × (30 − 10) = 20. Entram os com custo ≤ 20: **10, 14 e 20** (o 30 fica de fora).',
      e: 'Depois se sorteia um da LRC. Num problema de maximização a fórmula se espelha (limite = máx − α·(máx − mín), candidatos ≥ limite).' },

    { f: 4, t: 'mc', q: 'No método **percentual** do professor, `per_ale = 30` significa...',
      o: ['Os primeiros 30% das decisões são aleatórios e o resto é guloso.',
          'Escolher só 30 candidatos.',
          'Aceitar 30% de piora.',
          'Repetir a construtiva 30 vezes.'],
      e: 'É o jeito do sdTSP do professor de misturar aleatoriedade e guloso, sem LRC.' },

    { f: 4, t: 'mc', q: 'Para que serve a construtiva na busca local?',
      o: ['Gera a solução inicial **completa e viável** que a busca refina.',
          'Substitui a busca local.',
          'Calcula a vizinhança.',
          'Testa o código.'],
      e: 'Busca local precisa de um ponto de partida viável. A qualidade dele influencia o resultado final.' },

    { f: 4, t: 'mc', q: 'Construtiva aleatória para \'escolher k itens\': \'sortear k vezes e marcar o bit\'. Qual é o risco?',
      o: ['Repetir o mesmo item e terminar com **menos** de k escolhidos.',
          'Escolher itens demais.',
          'Nenhum risco.',
          'Travar o computador.'],
      e: 'Só **conte** quando o item sorteado estava livre (`while (escolhidos < k)`).' },

    // ---------------------------------------------------------------- Fase 6: regras da prova
    { f: 5, t: 'mc', q: 'Erro de **compilação** na entrega vale...',
      o: ['Nota 0,0 na questão.', 'Desconto de 10%.', 'Nada, o professor corrige.', 'Meio ponto.'],
      e: 'Compilar vale mais que ser esperto. Recompile depois de **qualquer** edição, até a última.' },

    { f: 5, t: 'mc', q: 'Como devem ser as funções dos métodos pedidos?',
      o: ['`void`, com a solução por referência (`Solucao& s`).',
          'Retornando `int`.',
          'Recebendo a solução por valor.',
          'Qualquer assinatura.'],
      e: 'Copie as **assinaturas exatas** do `.h` fornecido.' },

    { f: 5, t: 'mc', q: 'Qual a entrega correta de arquivos e pasta?',
      o: ['`nome_sobrenome.cpp` e `.h`, em pasta `ProvaN` na Área de Trabalho (nome exato do enunciado).',
          'Qualquer nome, na pasta Documentos.',
          'Só o `.cpp` por e-mail.',
          'Um `.zip` com o executável.'],
      e: 'E o `.cpp` precisa incluir o `.h` com o **nome novo**.' },

    { f: 5, t: 'mc', q: 'O tempo está acabando. O que priorizar?',
      o: ['Entregar RA e PM corretas e compiláveis; **comentar** o trecho incompleto da MM.',
          'Terminar a MM sofisticada, mesmo sem compilar.',
          'Reescrever tudo do zero.',
          'Entregar sem testar nada.'],
      e: 'Ordem de prioridade: (1) compila e está certo, (2) RA e PM, (3) MM. Trecho incompleto fica em comentário.' },

    { f: 5, t: 'mc', q: 'Nos primeiros 10 minutos da prova, o que **NÃO** fazer?',
      o: ['Presumir que o problema é o PRCP (ou outro) que você já viu.',
          'Ler as Observações do enunciado.',
          'Anotar se é maximizar ou minimizar.',
          'Copiar as assinaturas do `.h`.'],
      e: 'O problema pode ser **qualquer um**. Leia como se nunca tivesse visto nada parecido e responda as 5 perguntas no papel.' },

    { f: 5, t: 'mc', q: 'Na base de referência da prova, o `gerar_vizinha` chama `calcular_fo`?',
      o: ['Não: quem chama é a busca, depois de gerar/aplicar o movimento. (Confira no **seu** código-base.)',
          'Sim, sempre.',
          'Só na primeira melhora.',
          'Depende do compilador.'],
      e: 'Não presuma: abra o código fornecido e veja. Se não chama, a busca precisa chamar; se chama, chamar de novo só desperdiça tempo.' },

    { f: 5, t: 'ab', q: 'Antes de entregar, quais **testes** você roda?',
      r: 'Compilar de novo; rodar na instância toy (FO final melhor ou igual à inicial e nunca pior); recalcular a FO do resultado e comparar com `s.fo`; conferir viabilidade (restrições); rodar numa instância grande (termina sem laço infinito); conferir nomes de arquivos e pasta.',
      e: 'É o item 3 e 4 do Checklist.' }
  ];

  // ---------------------------------------------------------------- utilidades
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(s) {
    var partes = String(s).split('```');
    var out = '';
    for (var i = 0; i < partes.length; i++) {
      if (i % 2 === 1) {
        out += '<pre class="qcode">' + esc(partes[i].replace(/^\n/, '').replace(/\n$/, '')) + '</pre>';
      } else {
        out += esc(partes[i])
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
      }
    }
    return out;
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function embaralhar(v) {
    var a = v.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------------------------------------------------------------- ids e estado salvo
  var contagem = {};
  Q.forEach(function (q) {
    contagem[q.f] = (contagem[q.f] || 0) + 1;
    q.id = 'F' + (q.f + 1) + '.' + contagem[q.f];
  });

  var KEY = 'mo_quiz_v1';
  var estado = {};
  try { estado = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { estado = {}; }
  function salvar() { try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) { /* sem armazenamento: segue sem salvar */ } }

  var sessao = { acertos: 0, total: 0, sequencia: 0, melhor: 0 };
  var modo = null;   // { tipo: 'fase'|'reforco'|'todas', f }
  var fila = [];
  var pos = 0;

  var elMenu = document.getElementById('quiz-menu');
  var elStats = document.getElementById('quiz-stats');
  var elPalco = document.getElementById('quiz-palco');

  function doModo(m) {
    if (m.tipo === 'fase') return Q.filter(function (q) { return q.f === m.f; });
    if (m.tipo === 'reforco') return Q.filter(function (q) { return estado[q.id] === 0; });
    return Q.slice();
  }
  function erros() { return Q.filter(function (q) { return estado[q.id] === 0; }); }

  // ---------------------------------------------------------------- menu e placar
  function desenharMenu() {
    elMenu.innerHTML = '';
    FASES.forEach(function (fase, i) {
      var qs = Q.filter(function (q) { return q.f === i; });
      var feitas = qs.filter(function (q) { return estado[q.id] !== undefined; }).length;
      var certas = qs.filter(function (q) { return estado[q.id] === 1; }).length;
      var b = el('button', 'qfase' + (modo && modo.tipo === 'fase' && modo.f === i ? ' ativa' : '') + (certas === qs.length ? ' completa' : ''));
      b.type = 'button';
      b.innerHTML = '<span class="qfase-n">Fase ' + (i + 1) + '</span><span class="qfase-t">' + esc(fase.nome) + '</span>' +
        '<span class="qbar"><span style="width:' + Math.round(100 * certas / qs.length) + '%"></span></span>' +
        '<span class="qfase-c">' + certas + ' certas · ' + feitas + '/' + qs.length + ' feitas</span>';
      b.addEventListener('click', function () { iniciar({ tipo: 'fase', f: i }); });
      elMenu.appendChild(b);
    });
    var er = erros().length;
    var br = el('button', 'qfase reforco' + (modo && modo.tipo === 'reforco' ? ' ativa' : ''));
    br.type = 'button';
    br.innerHTML = '<span class="qfase-n">Reforço</span><span class="qfase-t">Só o que eu errei</span><span class="qfase-c">' + er + (er === 1 ? ' pergunta' : ' perguntas') + '</span>';
    br.addEventListener('click', function () { iniciar({ tipo: 'reforco' }); });
    elMenu.appendChild(br);
    var bt = el('button', 'qfase' + (modo && modo.tipo === 'todas' ? ' ativa' : ''));
    bt.type = 'button';
    bt.innerHTML = '<span class="qfase-n">Desafio</span><span class="qfase-t">Todas, na ordem</span><span class="qfase-c">' + Q.length + ' perguntas</span>';
    bt.addEventListener('click', function () { iniciar({ tipo: 'todas' }); });
    elMenu.appendChild(bt);
  }

  function desenharStats() {
    var totalCertas = Q.filter(function (q) { return estado[q.id] === 1; }).length;
    elStats.innerHTML =
      '<div><strong>' + totalCertas + '/' + Q.length + '</strong><span>dominadas</span></div>' +
      '<div><strong>' + sessao.acertos + '/' + sessao.total + '</strong><span>acertos nesta sessão</span></div>' +
      '<div><strong>' + sessao.sequencia + '</strong><span>sequência (melhor ' + sessao.melhor + ')</span></div>' +
      '<div><strong>' + erros().length + '</strong><span>para reforçar</span></div>';
  }

  // ---------------------------------------------------------------- fluxo
  function iniciar(m) {
    modo = m;
    fila = doModo(m);
    pos = 0;
    if (m.tipo === 'fase') {
      for (var i = 0; i < fila.length; i++) { if (estado[fila[i].id] === undefined) { pos = i; break; } }
    }
    desenharMenu();
    desenharStats();
    desenharPergunta();
    if (elPalco.scrollIntoView) elPalco.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function registrar(q, acertou) {
    estado[q.id] = acertou ? 1 : 0;
    salvar();
    sessao.total++;
    if (acertou) {
      sessao.acertos++;
      sessao.sequencia++;
      if (sessao.sequencia > sessao.melhor) sessao.melhor = sessao.sequencia;
    } else {
      sessao.sequencia = 0;
    }
    desenharMenu();
    desenharStats();
  }

  function botaoProxima(card) {
    var ultima = pos >= fila.length - 1;
    var b = el('button', 'qbtn primario', ultima ? 'Ver resumo →' : 'Próxima →');
    b.type = 'button';
    b.addEventListener('click', function () { pos++; desenharPergunta(); });
    card.appendChild(b);
    b.focus();
  }

  function explicacao(card, q, extra) {
    var ex = el('div', 'qexp');
    var h = '';
    if (extra) h += extra;
    h += '<div class="qexp-t">Por quê</div>' + fmt(q.e);
    var ref = FASES[q.f].ref;
    h += '<div class="qref">Reveja: <a href="' + ref[0] + '">' + esc(ref[1]) + '</a></div>';
    ex.innerHTML = h;
    card.appendChild(ex);
  }

  function desenharPergunta() {
    elPalco.innerHTML = '';
    if (!fila.length) {
      var vazio = el('div', 'qcard');
      vazio.innerHTML = modo.tipo === 'reforco'
        ? '<h3>Nada para reforçar 🎉</h3><p>Você não tem nenhuma pergunta marcada como errada. Faça uma fase ou o Desafio.</p>'
        : '<p>Nenhuma pergunta.</p>';
      elPalco.appendChild(vazio);
      return;
    }
    if (pos >= fila.length) { desenharResumo(); return; }

    var q = fila[pos];
    var card = el('div', 'qcard');
    var cab = el('div', 'qcab');
    cab.innerHTML = '<span class="qid">' + q.id + '</span><span class="qtipo">' + (q.t === 'mc' ? 'múltipla escolha' : 'resposta livre') + '</span>' +
      '<span class="qpos">' + (pos + 1) + ' de ' + fila.length + '</span>';
    card.appendChild(cab);
    card.appendChild(el('div', 'qenun', fmt(q.q)));

    if (q.t === 'mc') {
      var ops = embaralhar(q.o.map(function (txt, i) { return { txt: txt, ok: i === 0 }; }));
      var lista = el('div', 'qops');
      var travado = false;
      ops.forEach(function (op, i) {
        var b = el('button', 'qop', '<span class="qletra">' + String.fromCharCode(65 + i) + '</span><span>' + fmt(op.txt) + '</span>');
        b.type = 'button';
        b.addEventListener('click', function () {
          if (travado) return;
          travado = true;
          var botoes = lista.querySelectorAll('.qop');
          for (var k = 0; k < ops.length; k++) {
            botoes[k].disabled = true;
            if (ops[k].ok) botoes[k].classList.add('ok');
          }
          if (!op.ok) b.classList.add('ruim');
          registrar(q, op.ok);
          explicacao(card, q, op.ok
            ? '<div class="qres bom">Acertou!</div>'
            : '<div class="qres mau">Não foi dessa vez. A correta está em verde. Anote o código <strong>' + q.id + '</strong> para reforçar com o Claude.</div>');
          botaoProxima(card);
        });
        lista.appendChild(b);
      });
      card.appendChild(lista);
    } else {
      var ta = el('textarea', 'qtexto');
      ta.rows = 4;
      ta.placeholder = 'Escreva sua resposta aqui (só para você, não é salva). Depois mostre a resposta e se avalie com honestidade.';
      card.appendChild(ta);
      var ver = el('button', 'qbtn primario', 'Mostrar a resposta');
      ver.type = 'button';
      ver.addEventListener('click', function () {
        ver.remove();
        ta.disabled = true;
        var gab = el('div', 'qgab', '<div class="qexp-t">Resposta esperada</div>' + fmt(q.r));
        card.appendChild(gab);
        explicacao(card, q);
        var linha = el('div', 'qauto');
        linha.appendChild(el('span', 'qauto-t', 'Como foi?'));
        var bom = el('button', 'qbtn ok', 'Acertei');
        var mau = el('button', 'qbtn ruim', 'Errei / quero reforço');
        bom.type = 'button'; mau.type = 'button';
        function fim(acertou) {
          bom.disabled = true; mau.disabled = true;
          registrar(q, acertou);
          linha.appendChild(el('span', 'qres ' + (acertou ? 'bom' : 'mau'), acertou ? 'Registrado: dominada.' : 'Registrado: anote o código <strong>' + q.id + '</strong> para reforçar com o Claude.'));
          botaoProxima(card);
        }
        bom.addEventListener('click', function () { fim(true); });
        mau.addEventListener('click', function () { fim(false); });
        linha.appendChild(bom); linha.appendChild(mau);
        card.appendChild(linha);
      });
      card.appendChild(ver);
    }
    elPalco.appendChild(card);
  }

  function desenharResumo() {
    var certas = fila.filter(function (q) { return estado[q.id] === 1; });
    var erradas = fila.filter(function (q) { return estado[q.id] === 0; });
    var card = el('div', 'qcard');
    var h = '<h3>Resumo' + (modo.tipo === 'fase' ? ' — Fase ' + (modo.f + 1) + ': ' + esc(FASES[modo.f].nome) : '') + '</h3>';
    h += '<p><strong>' + certas.length + ' de ' + fila.length + '</strong> dominadas.</p>';
    if (erradas.length) {
      var ids = erradas.map(function (q) { return q.id; }).join(', ');
      h += '<div class="alert alert-warning"><strong>Para reforçar (' + erradas.length + '):</strong> ' + ids +
        '<br><span class="qdica">Copie e cole no chat com o Claude: ele vai reexplicar cada uma.</span></div>';
      h += '<ul class="qlista">' + erradas.map(function (q) { return '<li><strong>' + q.id + '</strong> — ' + fmt(q.q.split('\n')[0]) + '</li>'; }).join('') + '</ul>';
    } else {
      h += '<div class="alert alert-success">Nenhum erro pendente nesta lista. Passe para a próxima fase.</div>';
    }
    card.innerHTML = h;
    var linha = el('div', 'qauto');
    if (erradas.length) {
      var cop = el('button', 'qbtn primario', 'Copiar mensagem para o Claude');
      cop.type = 'button';
      cop.addEventListener('click', function () {
        var msg = 'Errei no quiz: ' + erradas.map(function (q) { return q.id; }).join(', ') + '. Reforça pra mim, com exemplo e pontos de atenção.';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msg).then(function () { cop.textContent = 'Copiado!'; }, function () { cop.textContent = msg; });
        } else {
          cop.textContent = msg;
        }
      });
      linha.appendChild(cop);
      var ref = el('button', 'qbtn', 'Refazer só os erros');
      ref.type = 'button';
      ref.addEventListener('click', function () { iniciar({ tipo: 'reforco' }); });
      linha.appendChild(ref);
    }
    if (modo.tipo === 'fase' && modo.f < FASES.length - 1) {
      var prox = el('button', 'qbtn', 'Próxima fase →');
      prox.type = 'button';
      prox.addEventListener('click', function () { iniciar({ tipo: 'fase', f: modo.f + 1 }); });
      linha.appendChild(prox);
    }
    card.appendChild(linha);
    elPalco.appendChild(card);
  }

  // ---------------------------------------------------------------- reiniciar progresso
  var rz = document.getElementById('quiz-zerar');
  if (rz) {
    rz.addEventListener('click', function () {
      if (!window.confirm('Apagar todo o progresso do quiz neste navegador?')) return;
      estado = {};
      salvar();
      sessao = { acertos: 0, total: 0, sequencia: 0, melhor: 0 };
      modo = null;
      elPalco.innerHTML = '<div class="qcard"><p>Progresso apagado. Escolha uma fase acima para recomeçar.</p></div>';
      desenharMenu();
      desenharStats();
    });
  }

  desenharMenu();
  desenharStats();
  elPalco.innerHTML = '<div class="qcard"><h3>Como funciona</h3>' +
    '<p>Escolha uma <strong>fase</strong> acima. Cada pergunta mostra a correção na hora e o <em>porquê</em>. ' +
    'Nas de resposta livre, escreva primeiro, depois compare com a resposta e se avalie.</p>' +
    '<p>O que você errar fica marcado com um código (por exemplo <strong>F2.2</strong>). ' +
    'Venha ao chat com o Claude, diga os códigos, e ele reforça. Seu progresso fica salvo neste navegador.</p></div>';
})();
