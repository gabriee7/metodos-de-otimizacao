/* Visualização das "fitas" (máquinas): mostra, passo a passo, a busca local
   mexendo nas tarefas. Uso: <div class="card fitas" data-modo="pm"></div>
   Modos: pm (primeira melhora), mm (melhor melhora), ra (randômica),
   bug (primeira melhora esquecendo de desfazer). Sem dependências. */
(function () {
  var raizes = document.querySelectorAll('.fitas');
  if (!raizes.length) { return; }

  var EXEMPLOS = {
    a: { nome: 'Cenário 1: exemplo da página (tempos 5, 4, 3, 2)', tempos: [5, 4, 3, 2] },
    b: { nome: 'Cenário 2: exercício do papel (tempos 6, 5, 4, 1)', tempos: [6, 5, 4, 1] }
  };
  var CORES = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777', '#65a30d', '#475569'];
  var MIN_TAREFAS = 2;
  var MAX_TAREFAS = 8;
  var MAX_TEMPO = 20;
  var MAX_SOMA = 36;

  /* Lê o texto digitado ("7, 3, 5") e devolve { ok, tempos } ou { ok:false, erro }. */
  function lerTempos(texto) {
    var partes = texto.split(/[\s,;]+/);
    var tp = [];
    for (var i = 0; i < partes.length; i++) {
      if (partes[i] === '') { continue; }
      var v = Number(partes[i]);
      if (isNaN(v) || v !== Math.floor(v) || v < 1 || v > MAX_TEMPO) {
        return { ok: false, erro: '"' + partes[i] + '" não serve: use só números inteiros de 1 a ' + MAX_TEMPO + '.' };
      }
      tp.push(v);
    }
    if (tp.length < MIN_TAREFAS || tp.length > MAX_TAREFAS) {
      return { ok: false, erro: 'Use de ' + MIN_TAREFAS + ' a ' + MAX_TAREFAS + ' tarefas (você digitou ' + tp.length + ').' };
    }
    var soma = 0;
    for (var k = 0; k < tp.length; k++) { soma += tp[k]; }
    if (soma > MAX_SOMA) {
      return { ok: false, erro: 'A soma dos tempos é ' + soma + ' e o máximo é ' + MAX_SOMA + ' (para os blocos caberem na tela).' };
    }
    return { ok: true, tempos: tp };
  }
  var ITER = 4;

  function carga(sol, tempos) {
    var c = [0, 0];
    for (var t = 0; t < sol.length; t++) { c[sol[t]] += tempos[t]; }
    return c;
  }
  function fo(sol, tempos) {
    var c = carga(sol, tempos);
    if (c[0] > c[1]) { return c[0]; }
    return c[1];
  }
  function vizinha(sol, t) {
    var v = sol.slice();
    v[t] = 1 - v[t];
    return v;
  }
  function zeros(n) {
    var s = [];
    for (var k = 0; k < n; k++) { s.push(0); }
    return s;
  }
  function veredito(f, base) {
    if (f < base) { return '<b style="color:#16a34a">' + f + ' &lt; ' + base + ': melhorou.</b>'; }
    if (f === base) { return '<b style="color:#dc2626">' + f + ' = ' + base + ': empate, e empate não conta.</b>'; }
    return '<b style="color:#dc2626">' + f + ' &gt; ' + base + ': piorou.</b>';
  }

  /* ---------- primeira melhora e melhor melhora ---------- */
  function gerar(tempos, modo) {
    var n = tempos.length;
    var q = [];
    var sol = zeros(n);
    var rodada = 0;
    var melhorou = true;

    q.push({ tipo: 'inicio', sol: sol.slice(), mov: -1, fo: fo(sol, tempos), ref: fo(sol, tempos),
      msg: 'Começo com <b>tudo na máquina 0</b>. A nota (FO) é a carga da fita mais comprida: <b>' + fo(sol, tempos) + '</b>. Clique em <b>Próximo</b>.' });

    while (melhorou) {
      melhorou = false;
      rodada++;
      var atual = fo(sol, tempos);
      q.push({ tipo: 'rodada', sol: sol.slice(), mov: -1, fo: atual, ref: atual,
        msg: '<b>Rodada ' + rodada + '.</b> Solução atual com FO = <b>' + atual + '</b>. Vou testar mover cada tarefa para a outra fita, uma por vez.' });

      var melhorFO = atual;
      var melhorT = -1;

      for (var t = 0; t < n; t++) {
        if (modo === 'pm' && melhorou) { break; }
        var v = vizinha(sol, t);
        var f = fo(v, tempos);
        var base = atual;
        var txtBase = 'a nota atual (' + atual + ')';
        if (modo === 'mm') {
          base = melhorFO;
          txtBase = 'o melhor visto até agora (' + melhorFO + ')';
        }
        var melhor = (f < base);
        q.push({ tipo: 'teste', sol: v, mov: t, fo: f, ref: atual,
          msg: 'Testo mover a <b>tarefa ' + t + '</b> (tempo ' + tempos[t] + ') para a <b>máquina ' + v[t] + '</b>. Nota da vizinha = <b>' + f + '</b>. Comparo com ' + txtBase + ': ' + veredito(f, base) });

        if (modo === 'pm') {
          if (melhor) {
            q.push({ tipo: 'aceita', sol: v.slice(), mov: t, fo: f, ref: f,
              log: 'Rodada ' + rodada + ' · tarefa ' + t + ' → FO ' + f + ' · <b style="color:#16a34a">aceita</b>',
              msg: '<b>Melhorou, então fico com ela</b> e paro de olhar as outras tarefas. É isso que torna a "primeira" melhora. Recomeço a varredura a partir daqui.' });
            sol = v;
            melhorou = true;
          } else {
            q.push({ tipo: 'desfaz', sol: sol.slice(), mov: t, fo: atual, ref: atual,
              log: 'Rodada ' + rodada + ' · tarefa ' + t + ' → FO ' + f + ' · desfaz',
              msg: 'Não melhorou. <b>Desfaço</b>: a tarefa volta para onde estava e a nota volta a ser ' + atual + '. Sigo para a próxima tarefa.' });
          }
        } else {
          var novo = '';
          if (melhor) {
            melhorFO = f;
            melhorT = t;
            novo = ' · <b style="color:#16a34a">novo melhor</b>';
          }
          var resumo = 'ainda nenhuma melhora encontrada';
          if (melhorT >= 0) { resumo = 'melhor até agora: tarefa ' + melhorT + ' com FO ' + melhorFO; }
          q.push({ tipo: 'desfaz', sol: sol.slice(), mov: t, fo: atual, ref: atual,
            log: 'Rodada ' + rodada + ' · tarefa ' + t + ' → FO ' + f + novo,
            msg: 'Na melhor melhora eu <b>sempre desfaço</b>, melhorando ou não, e só anoto. Placar: ' + resumo + '.' });
        }
      }

      if (modo === 'mm' && melhorT >= 0) {
        var viz = vizinha(sol, melhorT);
        q.push({ tipo: 'aceita', sol: viz.slice(), mov: melhorT, fo: melhorFO, ref: melhorFO,
          log: 'Rodada ' + rodada + ' · aplica a <b>tarefa ' + melhorT + '</b> (FO ' + melhorFO + ')',
          msg: 'Olhei todas. Agora aplico <b>só a melhor</b>: tarefa ' + melhorT + ', FO <b>' + melhorFO + '</b>.' });
        sol = viz;
        melhorou = true;
      }
    }

    q.push({ tipo: 'fim', sol: sol.slice(), mov: -1, fo: fo(sol, tempos), ref: fo(sol, tempos),
      log: 'Rodada ' + rodada + ' · nenhuma vizinha melhora',
      msg: '<b>Fim.</b> Nenhuma vizinha melhora a nota. Isso é um <b>ótimo local</b>. FO final = <b>' + fo(sol, tempos) + '</b>.' });
    return q;
  }

  /* ---------- randômica: sorteios fixos, para a animação ser sempre a mesma ---------- */
  function gerarRA(tempos) {
    var n = tempos.length;
    var q = [];
    var sol = zeros(n);
    var semente = 7;
    function sorteio() {
      semente = (semente * 1103515245 + 12345) % 2147483648;
      return Math.floor(semente / 65536) % n;
    }
    q.push({ tipo: 'inicio', sol: sol.slice(), mov: -1, fo: fo(sol, tempos), ref: fo(sol, tempos),
      msg: 'Começo com <b>tudo na máquina 0</b> (FO ' + fo(sol, tempos) + '). Na randômica não varro nada: <b>sorteio</b> uma tarefa, movo numa <b>cópia</b> e vejo se melhora. Faço ' + ITER + ' sorteios por rodada.' });

    var rodada = 0;
    var melhorouRodada = true;
    while (melhorouRodada) {
      melhorouRodada = false;
      rodada++;
      var atual = fo(sol, tempos);
      q.push({ tipo: 'rodada', sol: sol.slice(), mov: -1, fo: atual, ref: atual,
        msg: '<b>Rodada ' + rodada + '.</b> Solução atual com FO = <b>' + atual + '</b>. Vou fazer ' + ITER + ' sorteios. Se a rodada inteira não melhorar nada, paro.' });
      for (var k = 1; k <= ITER; k++) {
        var t = sorteio();
        var v = vizinha(sol, t);
        var f = fo(v, tempos);
        var atualAgora = fo(sol, tempos);
        q.push({ tipo: 'teste', sol: v, mov: t, fo: f, ref: atualAgora,
          msg: 'Sorteio ' + k + ' de ' + ITER + ': saiu a <b>tarefa ' + t + '</b>. Na cópia, ela vai para a máquina ' + v[t] + '. Nota da cópia = <b>' + f + '</b>. Comparo com ' + atualAgora + ': ' + veredito(f, atualAgora) });
        if (f < atualAgora) {
          q.push({ tipo: 'aceita', sol: v.slice(), mov: t, fo: f, ref: f,
            log: 'Rodada ' + rodada + ' · sorteio ' + k + ' (tarefa ' + t + ') → FO ' + f + ' · <b style="color:#16a34a">aceita</b>',
            msg: 'Melhorou: <b>copio a vizinha de volta para s</b>.' });
          sol = v;
          melhorouRodada = true;
        } else {
          q.push({ tipo: 'desfaz', sol: sol.slice(), mov: t, fo: atualAgora, ref: atualAgora,
            log: 'Rodada ' + rodada + ' · sorteio ' + k + ' (tarefa ' + t + ') → FO ' + f + ' · descarta',
            msg: 'Não melhorou: <b>jogo a cópia fora</b>. A solução s nem chegou a ser mexida.' });
        }
      }
    }
    var fim = fo(sol, tempos);
    var existe = -1;
    var melhorViz = fim;
    for (var tt = 0; tt < n; tt++) {
      var fv = fo(vizinha(sol, tt), tempos);
      if (fv < melhorViz) { melhorViz = fv; existe = tt; }
    }
    var nota;
    if (existe >= 0) {
      nota = 'Repare: <b>ainda existe</b> uma vizinha melhor (mover a tarefa ' + existe + ' daria ' + melhorViz + '), mas os sorteios não a pegaram. Por isso a randômica <u>não garante ótimo local</u>.';
    } else {
      nota = 'Aqui, por sorte, nenhuma vizinha melhora, então é um ótimo local. Mas a randômica <u>não garante</u> isso: ela só testa o que sorteia.';
    }
    q.push({ tipo: 'fim', sol: sol.slice(), mov: -1, fo: fim, ref: fim,
      log: 'Rodada ' + rodada + ' · nenhuma melhora nos ' + ITER + ' sorteios',
      msg: '<b>Fim.</b> Uma rodada inteira sem melhora. FO final = <b>' + fim + '</b>. ' + nota });
    return q;
  }

  /* ---------- erro clássico: primeira melhora que esquece de desfazer ---------- */
  function gerarBug(tempos) {
    var n = tempos.length;
    var q = [];
    var sol = zeros(n);
    var foS = fo(sol, tempos);
    var melhorVisto = foS;
    var testes = 0;
    var LIM = 10;
    var rodada = 0;
    var melhorou = true;
    q.push({ tipo: 'inicio', sol: sol.slice(), mov: -1, fo: foS, ref: foS,
      msg: '<b>Atenção: este é o código ERRADO</b>, igual à primeira melhora mas <u>sem a parte de desfazer</u>. Acompanhe o que acontece. FO inicial = ' + foS + '.' });

    while (melhorou && testes < LIM) {
      melhorou = false;
      rodada++;
      q.push({ tipo: 'rodada', sol: sol.slice(), mov: -1, fo: foS, ref: foS,
        msg: '<b>Rodada ' + rodada + '.</b> Solução atual na tela, FO = ' + foS + '.' });
      for (var t = 0; t < n && !melhorou && testes < LIM; t++) {
        var foOrig = foS;
        var v = vizinha(sol, t);
        var f = fo(v, tempos);
        foS = f;
        testes++;
        q.push({ tipo: 'teste', sol: v.slice(), mov: t, fo: f, ref: foOrig,
          msg: 'Movo a <b>tarefa ' + t + '</b>. Nota da vizinha = <b>' + f + '</b>. Comparo com ' + foOrig + ': ' + veredito(f, foOrig) });
        sol = v;
        if (f < foOrig) {
          melhorou = true;
          var aviso = '';
          if (f > melhorVisto) {
            aviso = ' <b style="color:#dc2626">Mas olhe: a melhor solução que eu já tive era ' + melhorVisto + ', e agora "melhorei" para ' + f + ', que é PIOR.</b> Aceitei uma piora achando que era melhora.';
          }
          if (f < melhorVisto) { melhorVisto = f; }
          q.push({ tipo: 'aceita', sol: sol.slice(), mov: t, fo: f, ref: f,
            log: 'Teste ' + testes + ' · tarefa ' + t + ' → FO ' + f + ' · aceita',
            msg: 'Pareceu melhorar (comparou com a nota que estava no momento), então aceita.' + aviso });
        } else {
          q.push({ tipo: 'bug', sol: sol.slice(), mov: t, fo: f, ref: f,
            log: 'Teste ' + testes + ' · tarefa ' + t + ' → FO ' + f + ' · <b style="color:#dc2626">esqueceu de desfazer</b>',
            msg: 'Não melhorou, e o código <b>não desfez</b>: a tarefa continua na fita errada e a nota "atual" virou ' + f + '. O melhor que eu já tive era ' + melhorVisto + '. Os próximos testes partem desta solução estragada.' });
        }
      }
    }
    var resumo;
    if (foS > melhorVisto) {
      resumo = 'A melhor solução que passou por aqui tinha FO <b>' + melhorVisto + '</b>, mas o código terminou em <b>' + foS + '</b>: <u>perdeu a melhor</u>.';
    } else {
      resumo = 'Aqui, por sorte, terminou na melhor que viu (' + melhorVisto + '). Mas repare no caminho: a nota subiu e desceu sem controle, e nada garantia esse final.';
    }
    q.push({ tipo: 'fim', sol: sol.slice(), mov: -1, fo: foS, ref: foS,
      log: 'Parei de simular (limite de ' + LIM + ' testes)',
      msg: '<b>Resumo do estrago.</b> A solução andou sozinha, sem controle. ' + resumo + ' Com o <code>desfazer</code> (guardar o valor antigo e voltar) o caminho é sempre sob controle: só se aceita o que melhora de verdade.' });
    return q;
  }


  /* ---------- código mostrado ao lado (estilo depurador) ---------- */
  var PM = [
    'void primeira_melhora(Solucao& s)',
    '{',
    '    int melhorou = 1;',
    '    calcular_fo(s);',
    '    while (melhorou == 1)',
    '    {',
    '        melhorou = 0;',
    '        for (int t = 0; t < n && melhorou == 0; t++)',
    '        {',
    '            int orig = s.vet_maquina[t];     // guarda o que tinha',
    '            int fo_orig = s.fo;              // guarda a nota de antes',
    '            int m = 1 - orig;                // a outra máquina',
    '            s.vet_maquina[t] = m;            // APLICA o movimento',
    '            calcular_fo(s);                  // nota da vizinha',
    '            if (s.fo < fo_orig)              // melhorou?',
    '                melhorou = 1;                // fica com ela',
    '            else',
    '            {',
    '                s.vet_maquina[t] = orig;     // DESFAZ o movimento',
    '                s.fo = fo_orig;              // e a nota',
    '            }',
    '        }',
    '    }',
    '}'
  ];
  var BUG = PM.slice();
  BUG[0] = 'void primeira_melhora_ERRADA(Solucao& s)';
  BUG[18] = '                // ESQUECI de desfazer a solução!';
  BUG[19] = '                // ESQUECI de voltar a nota!';
  var MM = [
    'void melhor_melhora(Solucao& s)',
    '{',
    '    int melhorou = 1;',
    '    calcular_fo(s);',
    '    while (melhorou == 1)',
    '    {',
    '        melhorou = 0;',
    '        int melhor_t = -1, melhor_fo = s.fo;',
    '        int fo_orig = s.fo;',
    '        for (int t = 0; t < n; t++)',
    '        {',
    '            int orig = s.vet_maquina[t];',
    '            s.vet_maquina[t] = 1 - orig;     // APLICA',
    '            calcular_fo(s);',
    '            if (s.fo < melhor_fo)            // melhor que o melhor visto?',
    '            {',
    '                melhor_fo = s.fo;            // anota',
    '                melhor_t = t;',
    '            }',
    '            s.vet_maquina[t] = orig;         // SEMPRE desfaz',
    '            s.fo = fo_orig;',
    '        }',
    '        if (melhor_t != -1)',
    '        {',
    '            s.vet_maquina[melhor_t] = 1 - s.vet_maquina[melhor_t];  // aplica só a melhor',
    '            calcular_fo(s);',
    '            melhorou = 1;',
    '        }',
    '    }',
    '}'
  ];
  var RA = [
    'void randomica(Solucao& s)',
    '{',
    '    int melhorou = 1;',
    '    calcular_fo(s);',
    '    while (melhorou == 1)',
    '    {',
    '        melhorou = 0;',
    '        for (int k = 0; k < ITER; k++)',
    '        {',
    '            Solucao viz = s;                 // CÓPIA da solução',
    '            gerar_vizinha(viz);              // sorteia uma tarefa e move',
    '            calcular_fo(viz);',
    '            if (viz.fo < s.fo)               // melhorou?',
    '            {',
    '                s = viz;                     // copia de volta',
    '                melhorou = 1;',
    '            }                                // senão: descarta viz',
    '        }',
    '    }',
    '}'
  ];
  var CODIGOS = { pm: PM, mm: MM, ra: RA, bug: BUG };
  var LINHAS_ERRO = { bug: [18, 19] };

  function pad(n) {
    if (n < 10) { return ' ' + n; }
    return '' + n;
  }
  function escapar(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Para cada quadro: quais linhas do código estão "executando" e o valor das variáveis. */
  function anotar(q, modo, tp) {
    var mf = 0;
    var mt = -1;
    var rod = 0;
    for (var i = 0; i < q.length; i++) {
      var f = q[i];
      if (f.tipo === 'rodada') { rod++; }
      var ln = [];
      var v = '';
      if (modo === 'pm' || modo === 'bug') {
        if (f.tipo === 'inicio') { ln = [2, 3]; v = 'melhorou = 1'; }
        if (f.tipo === 'rodada') { ln = [4, 6]; v = 'melhorou = 0'; }
        if (f.tipo === 'teste') { ln = [12, 13, 14]; v = 't = ' + f.mov + ' · fo_orig = ' + f.ref + ' · comparo ' + f.fo + ' &lt; ' + f.ref; }
        if (f.tipo === 'aceita') { ln = [15]; v = 'melhorou = 1 (os for vão parar)'; }
        if (f.tipo === 'desfaz') { ln = [18, 19]; v = 't = ' + f.mov + ' · restaurou: s.fo = ' + f.ref; }
        if (f.tipo === 'bug') { ln = [18, 19]; v = 't = ' + f.mov + ' · NÃO restaurou: s.fo ficou ' + f.fo; }
        if (f.tipo === 'fim') { ln = [4]; v = 'melhorou = 0, o while termina'; }
      } else if (modo === 'mm') {
        if (f.tipo === 'inicio') { ln = [2, 3]; v = 'melhorou = 1'; }
        if (f.tipo === 'rodada') { mf = f.ref; mt = -1; ln = [4, 6, 7, 8]; v = 'melhor_fo = ' + mf + ' · melhor_t = -1'; }
        if (f.tipo === 'teste') { ln = [12, 13, 14]; v = 't = ' + f.mov + ' · comparo ' + f.fo + ' &lt; melhor_fo (' + mf + ')'; }
        if (f.tipo === 'desfaz') {
          if (f.log && f.log.indexOf('novo melhor') >= 0) {
            mf = q[i - 1].fo;
            mt = f.mov;
            ln = [16, 17, 19, 20];
          } else {
            ln = [19, 20];
          }
          v = 'melhor_fo = ' + mf + ' · melhor_t = ' + mt;
        }
        if (f.tipo === 'aceita') { ln = [22, 24, 25, 26]; v = 'melhor_t = ' + mt + ' · melhorou = 1'; }
        if (f.tipo === 'fim') { ln = [22, 4]; v = 'melhor_t = -1 · melhorou = 0, o while termina'; }
      } else {
        if (f.tipo === 'inicio') { ln = [2, 3]; v = 'melhorou = 1'; }
        if (f.tipo === 'rodada') { ln = [4, 6]; v = 'melhorou = 0'; }
        if (f.tipo === 'teste') { ln = [9, 10, 11, 12]; v = 'comparo viz.fo (' + f.fo + ') &lt; s.fo (' + f.ref + ')'; }
        if (f.tipo === 'aceita') { ln = [14, 15]; v = 's = viz · melhorou = 1'; }
        if (f.tipo === 'desfaz') { ln = [16]; v = 'viz descartada · s.fo continua ' + f.ref; }
        if (f.tipo === 'fim') { ln = [4]; v = 'melhorou = 0, o while termina'; }
      }
      f.ln = ln;
      var rotulo = 'Variáveis neste passo · rodada ' + rod;
      if (f.tipo === 'inicio') { rotulo = 'Variáveis neste passo · antes da 1ª rodada'; }
      if (f.tipo === 'fim') { rotulo = 'Variáveis neste passo · fim (rodada ' + rod + ')'; }
      if (f.mov >= 0 && f.tipo !== 'fim') {
        if (modo === 'ra') {
          rotulo += ' · sorteou a tarefa ' + f.mov;
        } else if (f.tipo === 'aceita' && modo === 'mm') {
          rotulo += ' · aplicando a tarefa ' + f.mov;
        } else {
          rotulo += ' · tarefa ' + f.mov;
        }
      }
      var cab = '<div class="ft-vars-t">' + rotulo + '</div>';
      var estilo = '';
      if (f.tipo === 'bug') { estilo = ' style="color:#dc2626"'; }
      if (modo === 'ra' && f.tipo === 'teste') {
        f.vars = cab + '<div><b>s.vet_maquina</b> = [' + q[i - 1].sol.join(', ') + '] &nbsp; <b>s.fo</b> = ' + f.ref + '</div>' +
          '<div><b>viz.vet_maquina</b> = [' + f.sol.join(', ') + '] &nbsp; <b>viz.fo</b> = ' + f.fo + '</div>' +
          '<div class="ft-vars-x">' + v + '</div>';
      } else {
        var foS = f.ref;
        if (f.tipo === 'teste' || f.tipo === 'bug') { foS = f.fo; }
        f.vars = cab + '<div><b>s.vet_maquina</b> = [' + f.sol.join(', ') + '] &nbsp; <b>s.fo</b> = ' + foS + '</div>' +
          '<div class="ft-vars-x"' + estilo + '>' + v + '</div>';
      }
    }
  }

  /* ---------- Debug linha a linha: executa o código de verdade, uma linha por passo ---------- */
  var ORDEM_VARS = ['s.vet_maquina', 's.fo', 'viz.vet_maquina', 'viz.fo', 'melhorou', 'k', 't', 'orig', 'm', 'fo_orig', 'melhor_t', 'melhor_fo'];
  var TOKENS = {
    's.vet_maquina[melhor_t]': 1, 's.vet_maquina[t]': 1, 'viz.vet_maquina': 1, 's.vet_maquina': 1,
    'viz.fo': 1, 's.fo': 1, 'melhor_fo': 1, 'melhor_t': 1, 'fo_orig': 1, 'melhorou': 1,
    'orig': 1, 'viz': 1, 'ITER': 1, 'n': 1, 't': 1, 'm': 1, 'k': 1, 's': 1
  };

  function fmt(v) {
    if (v === undefined) { return null; }
    if (v instanceof Array) { return '[' + v.join(', ') + ']'; }
    return String(v);
  }
  function copiarVars(V) {
    var o = {};
    for (var k in V) {
      if (V.hasOwnProperty(k)) {
        if (V[k] instanceof Array) { o[k] = V[k].slice(); } else { o[k] = V[k]; }
      }
    }
    return o;
  }
  function htmlVars(dv, prev) {
    var h = '<div class="ft-vars-t">Variáveis agora (em amarelo: mudou neste passo)</div><div class="ft-vgrade">';
    for (var i = 0; i < ORDEM_VARS.length; i++) {
      var nome = ORDEM_VARS[i];
      if (dv[nome] === undefined) { continue; }
      var cls = 'ft-var';
      if (fmt(prev[nome]) !== fmt(dv[nome])) { cls += ' ft-var-mud'; }
      h += '<div class="' + cls + '"><b>' + nome + '</b> = ' + fmt(dv[nome]) + '</div>';
    }
    return h + '</div>';
  }

  /* valor que aparece ao passar o mouse sobre um nome do código (null = não existe neste ponto) */
  function valorToken(nome, dv, n) {
    if (nome === 'n') { return String(n); }
    if (nome === 'ITER') { return String(ITER); }
    if (nome === 's' || nome === 'viz') {
      if (dv[nome + '.vet_maquina'] === undefined) { return null; }
      return '{ vet_maquina = ' + fmt(dv[nome + '.vet_maquina']) + ', fo = ' + fmt(dv[nome + '.fo']) + ' }';
    }
    var ix = nome.indexOf('[');
    if (ix >= 0) {
      var base = nome.slice(0, ix);
      var idxNome = nome.slice(ix + 1, nome.length - 1);
      var vet = dv[base];
      var idx = dv[idxNome];
      if (vet === undefined || idx === undefined) { return null; }
      return vet[idx] + '  (posição ' + idxNome + ' = ' + idx + ' do vetor ' + base + ')';
    }
    return fmt(dv[nome]);
  }

  /* Executa a busca linha por linha. modo: pm, bug, mm ou ra. Os números das linhas são os índices (a partir de 0) do código mostrado. */
  function gerarDebug(tp, modo) {
    var n = tp.length;
    var q = [];
    var V = {};
    var prev = {};
    var rod = 0;
    var semente = 7;
    var LIM = 10;
    var testes = 0;

    function sorteio() {
      semente = (semente * 1103515245 + 12345) % 2147483648;
      return Math.floor(semente / 65536) % n;
    }
    function emit(ln, msg, tipo, mov, o) {
      o = o || {};
      var mostrada = V['s.vet_maquina'];
      if (V['viz.vet_maquina'] !== undefined) { mostrada = V['viz.vet_maquina']; }
      var refv = o.ref;
      if (refv === undefined) {
        if (V['s.fo'] === undefined) { refv = fo(V['s.vet_maquina'], tp); } else { refv = V['s.fo']; }
      }
      var dv = copiarVars(V);
      q.push({ tipo: tipo, sol: mostrada.slice(), mov: mov, fo: o.fo, fov: o.fov, ref: refv, ln: [ln],
        msg: '<b>Linha ' + (ln + 1) + ':</b> ' + msg, log: o.log, dv: dv, vars: htmlVars(dv, prev) });
      prev = dv;
    }
    function limparFor() {
      delete V['t'];
      delete V['orig'];
      delete V['m'];
      delete V['fo_orig'];
    }
    var T = function (t) { return '<b>' + t + '</b>'; };

    V['s.vet_maquina'] = zeros(n);

    /* ===== primeira melhora (e a versão com o erro de não desfazer) ===== */
    if (modo === 'pm' || modo === 'bug') {
      var bug = (modo === 'bug');
      var parou = false;
      emit(0, 'Entrei na função. A solução <code>s</code> chegou <b>por referência</b>: o que eu mudar aqui muda a original.', 'inicio', -1);
      V['melhorou'] = 1;
      emit(2, 'Crio <code>melhorou</code> com valor 1 ("ainda estou melhorando"), só para o <code>while</code> entrar.', 'inicio', -1);
      V['s.fo'] = fo(V['s.vet_maquina'], tp);
      emit(3, '<code>calcular_fo(s)</code> calcula a nota da solução e guarda em <code>s.fo</code> = ' + T(V['s.fo']) + '.', 'inicio', -1);
      for (;;) {
        var entra = (V['melhorou'] === 1);
        var txtW = 'Testo <code>while (melhorou == 1)</code>: melhorou vale ' + V['melhorou'] + ', então ';
        if (entra) { txtW += 'entro no laço.'; } else { txtW += 'saio do laço.'; }
        emit(4, txtW, 'rodada', -1);
        if (!entra) { break; }
        rod++;
        V['melhorou'] = 0;
        emit(6, 'Nesta volta ainda não melhorei: <code>melhorou = 0</code>.', 'rodada', -1);
        V['t'] = 0;
        var primeiro = true;
        for (;;) {
          var txtF;
          if (primeiro) {
            txtF = 'O <code>for</code> começa com <code>t = 0</code>. ';
          } else {
            V['t']++;
            txtF = 'Fim da volta do <code>for</code>: <code>t++</code> faz t valer ' + V['t'] + '. ';
          }
          primeiro = false;
          var ok = (V['t'] < n && V['melhorou'] === 0);
          txtF += 'Testo <code>t &lt; n</code> (n = ' + n + ') e <code>melhorou == 0</code>: ';
          if (ok) { txtF += 'continua.'; } else if (V['melhorou'] === 1) { txtF += 'melhorou já é 1, então o for para.'; } else { txtF += 'acabaram as tarefas, o for termina.'; }
          emit(7, txtF, 'rodada', -1);
          if (!ok) { break; }
          var tt = V['t'];
          V['orig'] = V['s.vet_maquina'][tt];
          emit(9, 'Guardo a máquina atual da tarefa ' + tt + ': <code>orig</code> = ' + T(V['orig']) + ' (para poder desfazer).', 'rodada', -1);
          V['fo_orig'] = V['s.fo'];
          emit(10, 'Guardo a nota de antes: <code>fo_orig</code> = ' + T(V['fo_orig']) + '.', 'rodada', -1);
          V['m'] = 1 - V['orig'];
          emit(11, 'A "outra máquina" é <code>1 - orig</code>: <code>m</code> = ' + T(V['m']) + '.', 'rodada', -1);
          V['s.vet_maquina'][tt] = V['m'];
          emit(12, '<b>APLICO o movimento</b>: a tarefa ' + tt + ' vai para a máquina ' + V['m'] + '. A nota ainda é a velha (' + V['s.fo'] + ').', 'teste', tt, { ref: V['fo_orig'], fov: '-' });
          V['s.fo'] = fo(V['s.vet_maquina'], tp);
          emit(13, '<code>calcular_fo(s)</code> recalcula: <code>s.fo</code> = ' + T(V['s.fo']) + ' (nota da vizinha).', 'teste', tt, { ref: V['fo_orig'], fo: V['s.fo'] });
          testes++;
          var melhor = (V['s.fo'] < V['fo_orig']);
          var resp = 'não';
          if (melhor) { resp = 'sim'; }
          var logTxt = 'Rodada ' + rod + ' · tarefa ' + tt + ' → FO ' + V['s.fo'];
          if (melhor) { logTxt += ' · <b style="color:#16a34a">aceita</b>'; } else if (bug) { logTxt += ' · <b style="color:#dc2626">esqueceu de desfazer</b>'; } else { logTxt += ' · desfaz'; }
          emit(14, 'Pergunto <code>s.fo &lt; fo_orig</code>: ' + V['s.fo'] + ' &lt; ' + V['fo_orig'] + '? ' + T(resp) + (melhor ? '' : ' (empate também é "não")') + '.', 'teste', tt, { ref: V['fo_orig'], fo: V['s.fo'], log: logTxt });
          if (melhor) {
            V['melhorou'] = 1;
            emit(15, 'Verdadeiro: <code>melhorou = 1</code>. Fico com a solução, e os dois <code>for</code> vão parar (a condição <code>melhorou == 0</code> falha).', 'aceita', tt, { ref: V['s.fo'] });
          } else if (bug) {
            emit(18, 'Falso. Aqui deveria desfazer, mas <b>esta linha é só um comentário</b>: nada acontece. A tarefa ' + tt + ' continua na máquina errada.', 'bug', tt, { ref: V['s.fo'] });
            emit(19, 'Idem: a nota continua sendo a da vizinha ruim (<code>s.fo</code> = ' + V['s.fo'] + '). O próximo teste parte desta solução estragada.', 'bug', tt, { ref: V['s.fo'] });
          } else {
            V['s.vet_maquina'][tt] = V['orig'];
            emit(18, 'Falso, então <b>DESFAÇO</b>: a tarefa ' + tt + ' volta para a máquina ' + V['orig'] + '.', 'desfaz', tt, { ref: V['fo_orig'] });
            V['s.fo'] = V['fo_orig'];
            emit(19, 'Desfaço também a nota: <code>s.fo = fo_orig</code> = ' + T(V['s.fo']) + '. Volto ao <code>for</code>.', 'desfaz', tt, { ref: V['s.fo'] });
          }
          if (bug && testes >= LIM) { parou = true; }
          if (parou) { break; }
        }
        limparFor();
        if (parou) { break; }
      }
      if (parou) {
        emit(23, 'Interrompi a simulação aqui (limite de ' + LIM + ' testes). No código real o laço continuaria assim, sem controle. FO na tela = ' + V['s.fo'] + '.', 'fim', -1);
      } else {
        emit(23, 'Saí do <code>while</code>: nenhuma volta melhorou. Fim da função. FO final = ' + T(V['s.fo']) + '.', 'fim', -1);
      }
      return q;
    }

    /* ===== melhor melhora ===== */
    if (modo === 'mm') {
      emit(0, 'Entrei na função. A solução <code>s</code> chegou <b>por referência</b>.', 'inicio', -1);
      V['melhorou'] = 1;
      emit(2, 'Crio <code>melhorou</code> = 1 só para o <code>while</code> entrar.', 'inicio', -1);
      V['s.fo'] = fo(V['s.vet_maquina'], tp);
      emit(3, '<code>calcular_fo(s)</code>: <code>s.fo</code> = ' + T(V['s.fo']) + '.', 'inicio', -1);
      for (;;) {
        var entraM = (V['melhorou'] === 1);
        var txtWM = 'Testo <code>while (melhorou == 1)</code>: melhorou vale ' + V['melhorou'] + ', então ';
        if (entraM) { txtWM += 'entro no laço.'; } else { txtWM += 'saio do laço.'; }
        emit(4, txtWM, 'rodada', -1);
        if (!entraM) { break; }
        rod++;
        V['melhorou'] = 0;
        emit(6, 'Nesta volta ainda não melhorei: <code>melhorou = 0</code>.', 'rodada', -1);
        V['melhor_t'] = -1;
        V['melhor_fo'] = V['s.fo'];
        emit(7, 'Preparo o "placar": <code>melhor_t = -1</code> (nenhuma tarefa ainda) e <code>melhor_fo = s.fo</code> = ' + T(V['melhor_fo']) + '.', 'rodada', -1);
        V['fo_orig'] = V['s.fo'];
        emit(8, 'Guardo a nota da solução atual: <code>fo_orig</code> = ' + T(V['fo_orig']) + ' (vou desfazer sempre para ela).', 'rodada', -1);
        V['t'] = 0;
        var primeiroM = true;
        for (;;) {
          var txtFM;
          if (primeiroM) {
            txtFM = 'O <code>for</code> começa com <code>t = 0</code>. ';
          } else {
            V['t']++;
            txtFM = '<code>t++</code> faz t valer ' + V['t'] + '. ';
          }
          primeiroM = false;
          var okM = (V['t'] < n);
          txtFM += 'Testo <code>t &lt; n</code> (n = ' + n + '): ';
          if (okM) { txtFM += 'continua. (Aqui não há <code>melhorou == 0</code>: a melhor melhora olha TODAS.)'; } else { txtFM += 'acabaram as tarefas.'; }
          emit(9, txtFM, 'rodada', -1);
          if (!okM) { break; }
          var tm = V['t'];
          V['orig'] = V['s.vet_maquina'][tm];
          emit(11, 'Guardo a máquina atual da tarefa ' + tm + ': <code>orig</code> = ' + T(V['orig']) + '.', 'rodada', -1);
          V['s.vet_maquina'][tm] = 1 - V['orig'];
          emit(12, '<b>APLICO</b> o movimento: a tarefa ' + tm + ' vai para a máquina ' + V['s.vet_maquina'][tm] + '.', 'teste', tm, { ref: V['fo_orig'], fov: '-' });
          V['s.fo'] = fo(V['s.vet_maquina'], tp);
          emit(13, '<code>calcular_fo(s)</code>: <code>s.fo</code> = ' + T(V['s.fo']) + ' (nota da vizinha).', 'teste', tm, { ref: V['fo_orig'], fo: V['s.fo'] });
          var melhorM = (V['s.fo'] < V['melhor_fo']);
          var logM = 'Rodada ' + rod + ' · tarefa ' + tm + ' → FO ' + V['s.fo'];
          if (melhorM) { logM += ' · <b style="color:#16a34a">novo melhor</b>'; }
          var respM = 'não';
          if (melhorM) { respM = 'sim'; }
          emit(14, 'Pergunto <code>s.fo &lt; melhor_fo</code>: ' + V['s.fo'] + ' &lt; ' + V['melhor_fo'] + '? ' + T(respM) + '. (Compara com o <b>melhor visto</b>, não com a nota atual.)', 'teste', tm, { ref: V['fo_orig'], fo: V['s.fo'], log: logM });
          if (melhorM) {
            V['melhor_fo'] = V['s.fo'];
            emit(16, 'Anoto o novo melhor valor: <code>melhor_fo</code> = ' + T(V['melhor_fo']) + '.', 'teste', tm, { ref: V['fo_orig'], fo: V['s.fo'] });
            V['melhor_t'] = tm;
            emit(17, 'E anoto qual tarefa foi: <code>melhor_t</code> = ' + T(V['melhor_t']) + '.', 'teste', tm, { ref: V['fo_orig'], fo: V['s.fo'] });
          }
          V['s.vet_maquina'][tm] = V['orig'];
          emit(19, '<b>SEMPRE desfaço</b> (melhorando ou não): a tarefa ' + tm + ' volta para a máquina ' + V['orig'] + '.', 'desfaz', tm, { ref: V['fo_orig'] });
          V['s.fo'] = V['fo_orig'];
          emit(20, 'Volto também a nota: <code>s.fo = fo_orig</code> = ' + T(V['s.fo']) + '.', 'desfaz', tm, { ref: V['s.fo'] });
        }
        delete V['t'];
        delete V['orig'];
        var temMelhor = (V['melhor_t'] !== -1);
        var respT = 'não';
        if (temMelhor) { respT = 'sim'; }
        emit(22, 'Terminei de olhar tudo. Pergunto <code>melhor_t != -1</code>: melhor_t vale ' + V['melhor_t'] + ', então ' + T(respT) + '.', 'rodada', -1);
        if (temMelhor) {
          var bt = V['melhor_t'];
          V['s.vet_maquina'][bt] = 1 - V['s.vet_maquina'][bt];
          emit(24, 'Agora aplico <b>só a melhor</b>: a tarefa ' + bt + ' muda de máquina.', 'aceita', bt, { ref: V['fo_orig'], fov: '-' });
          V['s.fo'] = fo(V['s.vet_maquina'], tp);
          emit(25, '<code>calcular_fo(s)</code>: <code>s.fo</code> = ' + T(V['s.fo']) + '.', 'aceita', bt, { ref: V['s.fo'] });
          V['melhorou'] = 1;
          emit(26, '<code>melhorou = 1</code>: houve melhora, então o <code>while</code> vai rodar de novo.', 'aceita', bt, { ref: V['s.fo'] });
        }
        delete V['melhor_t'];
        delete V['melhor_fo'];
        delete V['fo_orig'];
      }
      emit(29, 'Saí do <code>while</code>: nenhuma volta melhorou. Fim da função. FO final = ' + T(V['s.fo']) + '.', 'fim', -1);
      return q;
    }

    /* ===== randômica ===== */
    emit(0, 'Entrei na função. A solução <code>s</code> chegou <b>por referência</b>.', 'inicio', -1);
    V['melhorou'] = 1;
    emit(2, 'Crio <code>melhorou</code> = 1 só para o <code>while</code> entrar.', 'inicio', -1);
    V['s.fo'] = fo(V['s.vet_maquina'], tp);
    emit(3, '<code>calcular_fo(s)</code>: <code>s.fo</code> = ' + T(V['s.fo']) + '.', 'inicio', -1);
    for (;;) {
      var entraR = (V['melhorou'] === 1);
      var txtWR = 'Testo <code>while (melhorou == 1)</code>: melhorou vale ' + V['melhorou'] + ', então ';
      if (entraR) { txtWR += 'entro no laço.'; } else { txtWR += 'saio do laço.'; }
      emit(4, txtWR, 'rodada', -1);
      if (!entraR) { break; }
      rod++;
      V['melhorou'] = 0;
      emit(6, 'Nesta rodada ainda não melhorei: <code>melhorou = 0</code>.', 'rodada', -1);
      V['k'] = 0;
      var primeiroR = true;
      for (;;) {
        delete V['viz.vet_maquina'];
        delete V['viz.fo'];
        var txtFR;
        if (primeiroR) {
          txtFR = 'O <code>for</code> começa com <code>k = 0</code>. ';
        } else {
          V['k']++;
          txtFR = '<code>k++</code> faz k valer ' + V['k'] + '. ';
        }
        primeiroR = false;
        var okR = (V['k'] < ITER);
        txtFR += 'Testo <code>k &lt; ITER</code> (ITER = ' + ITER + '): ';
        if (okR) { txtFR += 'faço mais um sorteio.'; } else { txtFR += 'acabaram os sorteios desta rodada.'; }
        emit(7, txtFR, 'rodada', -1);
        if (!okR) { break; }
        V['viz.vet_maquina'] = V['s.vet_maquina'].slice();
        V['viz.fo'] = V['s.fo'];
        emit(9, 'Faço uma <b>CÓPIA</b> de <code>s</code> em <code>viz</code>. Daqui em diante mexo só na cópia; <code>s</code> fica protegida.', 'rodada', -1);
        var ts = sorteio();
        V['viz.vet_maquina'][ts] = 1 - V['viz.vet_maquina'][ts];
        emit(10, '<code>gerar_vizinha(viz)</code> <b>sorteou</b> a tarefa ' + ts + ' e a moveu para a máquina ' + V['viz.vet_maquina'][ts] + ' (só na cópia).', 'teste', ts, { ref: V['s.fo'], fov: '-' });
        V['viz.fo'] = fo(V['viz.vet_maquina'], tp);
        emit(11, '<code>calcular_fo(viz)</code>: <code>viz.fo</code> = ' + T(V['viz.fo']) + '.', 'teste', ts, { ref: V['s.fo'], fo: V['viz.fo'] });
        var melhorR = (V['viz.fo'] < V['s.fo']);
        var respR = 'não';
        if (melhorR) { respR = 'sim'; }
        var logR = 'Rodada ' + rod + ' · sorteio ' + (V['k'] + 1) + ' (tarefa ' + ts + ') → FO ' + V['viz.fo'];
        if (melhorR) { logR += ' · <b style="color:#16a34a">aceita</b>'; } else { logR += ' · descarta'; }
        emit(12, 'Pergunto <code>viz.fo &lt; s.fo</code>: ' + V['viz.fo'] + ' &lt; ' + V['s.fo'] + '? ' + T(respR) + '.', 'teste', ts, { ref: V['s.fo'], fo: V['viz.fo'], log: logR });
        if (melhorR) {
          V['s.vet_maquina'] = V['viz.vet_maquina'].slice();
          V['s.fo'] = V['viz.fo'];
          emit(14, '<code>s = viz</code>: <b>copio a vizinha de volta</b> para <code>s</code>. Agora s.fo = ' + T(V['s.fo']) + '.', 'aceita', ts, { ref: V['s.fo'] });
          V['melhorou'] = 1;
          emit(15, '<code>melhorou = 1</code>: houve melhora nesta rodada.', 'aceita', ts, { ref: V['s.fo'] });
        } else {
          emit(16, 'Não entrou no <code>if</code>: a cópia <code>viz</code> será <b>descartada</b> ao fim desta volta. <code>s</code> nunca foi mexida.', 'desfaz', ts, { ref: V['s.fo'] });
        }
      }
      delete V['k'];
    }
    emit(19, 'Saí do <code>while</code>: uma rodada inteira sem melhora. Fim da função. FO final = ' + T(V['s.fo']) + '.', 'fim', -1);
    return q;
  }

  function montar(raiz) {
    var estado = { modo: 'pm', ex: 'a', visao: 'jogada', bps: {}, frames: [], i: 0, timer: null, custom: [7, 3, 5, 2, 6] };
    var modoIni = raiz.getAttribute('data-modo');
    if (modoIni === 'pm' || modoIni === 'mm' || modoIni === 'ra' || modoIni === 'bug') { estado.modo = modoIni; }
    if (raiz.getAttribute('data-visao') === 'debug') { estado.visao = 'debug'; }

    raiz.innerHTML =
      '<div class="ft-barra">' +
        '<label>Método <select class="js-modo">' +
          '<option value="pm">Primeira melhora</option>' +
          '<option value="mm">Melhor melhora</option>' +
          '<option value="ra">Randômica</option>' +
          '<option value="bug">Erro: esqueci de desfazer</option>' +
        '</select></label>' +
        '<label>Visão <select class="js-visao"><option value="jogada">Animação por jogada</option><option value="debug">Debug linha a linha</option></select></label>' +
        '<label>Cenário <select class="js-ex"><option value="a">' + EXEMPLOS.a.nome + '</option><option value="b">' + EXEMPLOS.b.nome + '</option><option value="c">Meu cenário (você digita)</option></select></label>' +
        '<button type="button" class="js-meu ft-meu">✎ Criar meu cenário</button>' +
      '</div>' +
      '<div class="ft-custom js-custom" style="display:none">' +
        '<label>Tempos das tarefas, separados por vírgula <input type="text" class="js-in" value="7, 3, 5, 2, 6" size="24" maxlength="60"></label>' +
        '<button type="button" class="js-aplicar ft-prim">Aplicar</button>' +
        '<button type="button" class="js-sorteia">🎲 Sortear</button>' +
        '<span class="ft-erro js-erro"></span>' +
        '<div class="ft-dica" style="width:100%;margin:0">2 máquinas · de ' + MIN_TAREFAS + ' a ' + MAX_TAREFAS + ' tarefas · tempos inteiros de 1 a ' + MAX_TEMPO + ' · soma até ' + MAX_SOMA + ' · todas as tarefas começam na máquina 0. Cada número é o tempo de uma tarefa (T0, T1, ...).</div>' +
      '</div>' +
      '<div class="ft-duas"><div class="ft-col-viz">' +
      '<div class="ft-palco js-palco"></div>' +
      '<div class="ft-placar">' +
        '<div><span>Nota atual (FO)</span><b class="js-foa">-</b></div>' +
        '<div><span>Nota da vizinha testada</span><b class="js-fov">-</b></div>' +
      '</div>' +
      '<div class="ft-msg js-msg"></div>' +
      '<div class="ft-log-t">Histórico dos testes</div>' +
      '<div class="ft-log js-log"></div>' +
      '</div><div class="ft-col-cod">' +
        '<div class="ft-cod-t">Código executando (a linha amarela é a que está rodando agora)</div>' +
        '<div class="ft-dbg-dica">Visão Debug: passe o mouse sobre uma variável para ver o valor dela neste passo. Clique no número da linha para criar um breakpoint ●.</div>' +
        '<div class="ft-codigo js-cod"></div>' +
        '<div class="ft-vars js-vars"></div>' +
      '</div></div>' +
      '<div class="ft-botoes">' +
        '<button type="button" class="js-volta">◀ Voltar</button>' +
        '<button type="button" class="js-prox ft-prim">Próximo ▶</button>' +
        '<button type="button" class="js-bp">⏩ Continuar até o breakpoint</button>' +
        '<button type="button" class="js-auto">▶▶ Automático</button>' +
        '<button type="button" class="js-reset">↺ Reiniciar</button>' +
        '<label class="ft-vel">Velocidade <select class="js-vel"><option value="3000">Muito lenta</option><option value="2600">Lenta</option><option value="1500" selected>Normal</option><option value="700">Rápida</option><option value="300">Muito rápida</option></select></label>' +
        '<span class="ft-cont js-cont"></span>' +
      '</div>' +
      '<input type="range" class="ft-barra-passos js-passos" min="0" max="0" value="0" aria-label="Passo">' +
      '<div class="ft-dica">Dica: arraste a barra para ir e voltar. Com o foco aqui dentro, as setas ← → do teclado também funcionam.</div>' +
      '<div class="ft-tip js-tip" style="display:none"></div>';
    raiz.setAttribute('tabindex', '0');

    var elModo = raiz.querySelector('.js-modo');
    var elEx = raiz.querySelector('.js-ex');
    var elVisao = raiz.querySelector('.js-visao');
    var elTip = raiz.querySelector('.js-tip');
    var elCustom = raiz.querySelector('.js-custom');
    var elIn = raiz.querySelector('.js-in');
    var elErro = raiz.querySelector('.js-erro');
    var elPalco = raiz.querySelector('.js-palco');
    var elMsg = raiz.querySelector('.js-msg');
    var elFoA = raiz.querySelector('.js-foa');
    var elFoV = raiz.querySelector('.js-fov');
    var elCont = raiz.querySelector('.js-cont');
    var elLog = raiz.querySelector('.js-log');
    var elAuto = raiz.querySelector('.js-auto');
    var elBarra = raiz.querySelector('.js-passos');
    var elVel = raiz.querySelector('.js-vel');
    var elVolta = raiz.querySelector('.js-volta');
    var elProx = raiz.querySelector('.js-prox');
    var elCod = raiz.querySelector('.js-cod');
    var elVars = raiz.querySelector('.js-vars');
    var linhasEl = [];

    function colorir(linha) {
      var out = '';
      var ultimo = 0;
      var re = /[A-Za-z_][A-Za-z0-9_.]*(\[[a-z_]+\])?/g;
      var m;
      while ((m = re.exec(linha)) !== null) {
        out += escapar(linha.slice(ultimo, m.index));
        if (TOKENS[m[0]]) {
          out += '<span class="ft-tok" data-n="' + m[0] + '">' + escapar(m[0]) + '</span>';
        } else {
          out += escapar(m[0]);
        }
        ultimo = m.index + m[0].length;
      }
      return out + escapar(linha.slice(ultimo));
    }

    function montarCodigo() {
      var cod = CODIGOS[estado.modo];
      var erro = LINHAS_ERRO[estado.modo] || [];
      var h = '';
      for (var i = 0; i < cod.length; i++) {
        var linha = cod[i].replace(/^( {4})+/, function (m) { return m.slice(0, m.length / 2); });
        linha = linha.replace(/ {2,}\/\//, '  //');
        var cm = linha.indexOf('//');
        var parteCod = linha;
        var parteCm = '';
        if (cm >= 0) {
          parteCod = linha.slice(0, cm);
          parteCm = '<span class="ft-cm">' + escapar(linha.slice(cm)) + '</span>';
        }
        var txt = colorir(parteCod) + parteCm;
        var cls = 'ft-ln';
        if (erro.indexOf(i) >= 0) { cls += ' ft-ln-erro'; }
        h += '<div class="' + cls + '"><i data-l="' + i + '" title="Clique para criar ou tirar um breakpoint">' + pad(i + 1) + '</i><span class="ft-seta"></span><code>' + txt + '</code></div>';
      }
      elCod.innerHTML = h;
      linhasEl = elCod.children;
    }
    var blocos = [];
    var cargaEls = [];
    elModo.value = estado.modo;
    elVisao.value = estado.visao;

    function tempos() {
      if (estado.ex === 'c') { return estado.custom; }
      return EXEMPLOS[estado.ex].tempos;
    }

    function mostrarCustom() {
      if (estado.ex === 'c') {
        elCustom.style.display = 'flex';
      } else {
        elCustom.style.display = 'none';
      }
    }

    function aplicarCustom() {
      var r = lerTempos(elIn.value);
      if (!r.ok) {
        elErro.textContent = r.erro;
        return;
      }
      elErro.textContent = '';
      estado.custom = r.tempos;
      elIn.value = r.tempos.join(', ');
      recomecar();
    }

    function montarPalco() {
      elPalco.innerHTML = '';
      blocos = [];
      cargaEls = [];
      for (var m = 0; m < 2; m++) {
        var fita = document.createElement('div');
        fita.className = 'ft-fita';
        fita.style.top = (m * 74 + 6) + 'px';
        fita.innerHTML = '<span class="ft-rot">Máquina ' + m + '</span>';
        elPalco.appendChild(fita);
        var c = document.createElement('div');
        c.className = 'ft-carga';
        c.style.top = (m * 74 + 6) + 'px';
        elPalco.appendChild(c);
        cargaEls.push(c);
      }
      var tp = tempos();
      for (var t = 0; t < tp.length; t++) {
        var b = document.createElement('div');
        b.className = 'ft-bloco';
        b.style.background = CORES[t];
        b.innerHTML = '<b>T' + t + '</b><i>' + tp[t] + '</i>';
        elPalco.appendChild(b);
        blocos.push(b);
      }
    }

    function desenhar() {
      var q = estado.frames[estado.i];
      var tp = tempos();
      var total = 0;
      for (var t = 0; t < tp.length; t++) { total += tp[t]; }
      var unidade = (elPalco.clientWidth - 130) / total;
      if (unidade > 44) { unidade = 44; }
      var x = [70, 70];
      for (var k = 0; k < tp.length; k++) {
        var m = q.sol[k];
        var b = blocos[k];
        var largBloco = tp[k] * unidade - 4;
        if (largBloco < 18) { largBloco = 18; }
        b.style.width = largBloco + 'px';
        b.style.left = x[m] + 'px';
        b.style.top = (m * 74 + 14) + 'px';
        x[m] += largBloco + 4;
        var cls = 'ft-bloco';
        if (k === q.mov) {
          if (q.tipo === 'teste') { cls += ' ft-teste'; }
          if (q.tipo === 'aceita') { cls += ' ft-ok'; }
          if (q.tipo === 'desfaz' || q.tipo === 'bug') { cls += ' ft-volta'; }
        }
        b.className = cls;
      }
      var c = carga(q.sol, tp);
      var maior = 0;
      if (c[1] > c[0]) { maior = 1; }
      for (var mm = 0; mm < 2; mm++) {
        cargaEls[mm].textContent = 'carga ' + c[mm];
        if (mm === maior || c[0] === c[1]) {
          cargaEls[mm].className = 'ft-carga ft-max';
        } else {
          cargaEls[mm].className = 'ft-carga';
        }
      }
      elFoA.textContent = q.ref;
      if (q.tipo === 'teste') {
        if (q.fov === '-') {
          elFoV.textContent = '-';
        } else {
          elFoV.textContent = q.fo;
        }
      } else {
        elFoV.textContent = '-';
      }
      elMsg.innerHTML = q.msg;
      elVars.innerHTML = q.vars;
      elTip.style.display = 'none';
      if (estado.visao === 'debug') {
        raiz.className = raiz.className.replace(' ft-debug', '') + ' ft-debug';
      } else {
        raiz.className = raiz.className.replace(' ft-debug', '');
      }
      for (var li = 0; li < linhasEl.length; li++) {
        var ativa = (q.ln.indexOf(li) >= 0);
        linhasEl[li].className = linhasEl[li].className.replace(' ft-on', '').replace(' ft-bp', '');
        if (ativa) { linhasEl[li].className += ' ft-on'; }
        if (estado.bps[li]) { linhasEl[li].className += ' ft-bp'; }
        var seta = linhasEl[li].querySelector('.ft-seta');
        if (ativa && li === q.ln[q.ln.length - 1]) {
          seta.textContent = '▶';
        } else {
          seta.textContent = '';
        }
      }
      if (q.ln.length > 0) {
        var alvo = linhasEl[q.ln[0]].offsetTop - 60;
        if (alvo < 0) { alvo = 0; }
        elCod.scrollTop = alvo;
      }
      elCont.textContent = 'Passo ' + (estado.i + 1) + ' de ' + estado.frames.length;
      elBarra.max = estado.frames.length - 1;
      elBarra.value = estado.i;
      elVolta.disabled = (estado.i === 0);
      elProx.disabled = (estado.i === estado.frames.length - 1);

      var html = '';
      for (var j = 0; j <= estado.i; j++) {
        if (estado.frames[j].log) { html += '<div>' + estado.frames[j].log + '</div>'; }
      }
      if (html === '') { html = '<div class="ft-vazio">Os testes aparecem aqui.</div>'; }
      elLog.innerHTML = html;
      elLog.scrollTop = elLog.scrollHeight;
    }

    function parar() {
      if (estado.timer) { clearInterval(estado.timer); }
      estado.timer = null;
      elAuto.textContent = '▶▶ Automático';
    }

    function recomecar() {
      parar();
      if (estado.visao === 'debug') {
        estado.frames = gerarDebug(tempos(), estado.modo);
      } else {
        if (estado.modo === 'ra') {
          estado.frames = gerarRA(tempos());
        } else if (estado.modo === 'bug') {
          estado.frames = gerarBug(tempos());
        } else {
          estado.frames = gerar(tempos(), estado.modo);
        }
        anotar(estado.frames, estado.modo, tempos());
      }
      estado.i = 0;
      montarPalco();
      montarCodigo();
      desenhar();
    }

    function avancar() {
      if (estado.i < estado.frames.length - 1) { estado.i++; desenhar(); }
    }
    function recuar() {
      if (estado.i > 0) { estado.i--; desenhar(); }
    }

    elModo.addEventListener('change', function (e) { estado.modo = e.target.value; estado.bps = {}; recomecar(); });
    elVisao.addEventListener('change', function (e) { estado.visao = e.target.value; recomecar(); });
    elEx.addEventListener('change', function (e) {
      estado.ex = e.target.value;
      mostrarCustom();
      if (estado.ex === 'c') {
        aplicarCustom();
      } else {
        elErro.textContent = '';
        recomecar();
      }
    });
    raiz.querySelector('.js-meu').addEventListener('click', function () {
      elEx.value = 'c';
      estado.ex = 'c';
      mostrarCustom();
      aplicarCustom();
      elIn.focus();
      elIn.select();
    });
    raiz.querySelector('.js-aplicar').addEventListener('click', aplicarCustom);
    elIn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { aplicarCustom(); }
    });
    raiz.querySelector('.js-sorteia').addEventListener('click', function () {
      var n = 4 + Math.floor(Math.random() * 3);
      var lista = [];
      for (var i = 0; i < n; i++) { lista.push(1 + Math.floor(Math.random() * 9)); }
      elIn.value = lista.join(', ');
      aplicarCustom();
    });
    raiz.querySelector('.js-reset').addEventListener('click', recomecar);
    elProx.addEventListener('click', function () { parar(); avancar(); });
    elVolta.addEventListener('click', function () { parar(); recuar(); });
    elBarra.addEventListener('input', function () {
      parar();
      estado.i = Number(elBarra.value);
      desenhar();
    });
    function ligarAuto() {
      if (estado.i === estado.frames.length - 1) { estado.i = 0; desenhar(); }
      elAuto.textContent = '⏸ Pausar';
      estado.timer = setInterval(function () {
        if (estado.i < estado.frames.length - 1) {
          estado.i++;
          desenhar();
        } else {
          parar();
        }
      }, Number(elVel.value));
    }
    elAuto.addEventListener('click', function () {
      if (estado.timer) { parar(); } else { ligarAuto(); }
    });
    elVel.addEventListener('change', function () {
      if (estado.timer) {
        parar();
        ligarAuto();
      }
    });
    raiz.addEventListener('keydown', function (e) {
      var alvo = e.target.tagName;
      if (alvo === 'INPUT' || alvo === 'SELECT' || alvo === 'TEXTAREA') { return; }
      if (e.key === 'ArrowRight') { parar(); avancar(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { parar(); recuar(); e.preventDefault(); }
    });
    function temBreakpoint(q) {
      for (var z = 0; z < q.ln.length; z++) {
        if (estado.bps[q.ln[z]]) { return true; }
      }
      return false;
    }
    raiz.querySelector('.js-bp').addEventListener('click', function () {
      parar();
      var i = estado.i + 1;
      while (i < estado.frames.length && !temBreakpoint(estado.frames[i])) { i++; }
      if (i >= estado.frames.length) { i = estado.frames.length - 1; }
      estado.i = i;
      desenhar();
    });
    elCod.addEventListener('click', function (e) {
      var alvo = e.target;
      if (alvo.tagName === 'I' && alvo.getAttribute('data-l') !== null) {
        var l = Number(alvo.getAttribute('data-l'));
        if (estado.bps[l]) { delete estado.bps[l]; } else { estado.bps[l] = true; }
        desenhar();
      }
    });
    elCod.addEventListener('mouseover', function (e) {
      var alvo = e.target;
      if (!alvo.classList || !alvo.classList.contains('ft-tok')) { return; }
      var nome = alvo.getAttribute('data-n');
      var q = estado.frames[estado.i];
      var html;
      if (estado.visao !== 'debug' || !q.dv) {
        html = 'Para ver o valor de <b>' + nome + '</b> neste ponto, troque a <b>Visão</b> para <i>Debug linha a linha</i>.';
      } else {
        var val = valorToken(nome, q.dv, tempos().length);
        if (val === null) {
          html = '<b>' + nome + '</b>: ainda não existe neste ponto (não foi declarada ainda, ou já saiu do escopo).';
        } else {
          html = '<b>' + nome + '</b> = ' + val;
        }
      }
      elTip.innerHTML = html;
      elTip.style.display = 'block';
      var r = alvo.getBoundingClientRect();
      var esq = r.left;
      if (esq > window.innerWidth - 360) { esq = window.innerWidth - 360; }
      if (esq < 8) { esq = 8; }
      elTip.style.left = esq + 'px';
      elTip.style.top = (r.bottom + 6) + 'px';
    });
    elCod.addEventListener('mouseout', function (e) {
      if (e.target.classList && e.target.classList.contains('ft-tok')) { elTip.style.display = 'none'; }
    });
    elCod.addEventListener('scroll', function () { elTip.style.display = 'none'; });
    window.addEventListener('resize', desenhar);

    recomecar();
  }

  for (var r = 0; r < raizes.length; r++) { montar(raizes[r]); }
})();
