/* Núcleo do simulador do problema REAL da P3 (hubs, UMApHCP).
   Sem DOM: motor de custos, listagens de código (estilo do professor) e executor linha a linha.
   Usado por hubs.js (interface) e pelos testes em Node. */
(function (raiz) {
  var ALFA = 0.75;
  var BETA = 1;
  var LAMBDA = 1;
  var INT_MAX = 2147483647;
  var INTER = 4;
  var LIM_INTERNO = 6; // acima disso não se entra em calcular_fo (seriam milhares de passos por chamada)

  /* instâncias reais da pasta prova3 (inst1.txt e inst2.txt): coordenadas dos nós */
  var INSTANCIAS = {
    a: { nome: 'Cenário 1: inst1.txt do professor (5 nós, 3 hubs)', p: 3,
      pts: [[29362.12, 17821.35], [29330.95, 31759.85], [32036.65, 38711.64], [30334.6, 46254.2], [28071.15, 50562.44]] },
    b: { nome: 'Cenário 2: inst2.txt do professor (20 nós, 4 hubs)', p: 4,
      pts: [[12944.33, 19522.69], [23487.77, 14749.23], [31004.31, 21458.35], [49728.49, 17946.32], [18262.37, 34230.97],
        [27200.42, 29683.34], [32659.91, 31322.78], [42235.11, 32882.35], [19237.53, 39507.85], [30240.59, 38106.08],
        [35623.77, 38814.05], [44607.98, 38388.84], [21747.1, 44784.85], [28875.46, 47422.82], [32361.14, 45963.29],
        [42755.67, 42966.14], [12890.34, 52475.7], [25061.0, 51526.12], [31592.47, 49745.99], [36010.1, 49567.6]] }
  };

  /* ---------- gerador de números aleatórios determinístico (para a animação ser sempre igual) ---------- */
  function novoRand(semente) {
    var s = semente >>> 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s >>> 8;
    };
  }

  /* ---------- motor de custos: igual à calcular_fo do professor, inclusive a matriz global que persiste entre chamadas ---------- */
  function novoMotor(pts) {
    var n = pts.length;
    var d = [];
    var c = [];
    for (var i = 0; i < n; i++) {
      d.push([]);
      c.push([]);
      for (var j = 0; j < n; j++) {
        var dx = pts[i][0] - pts[j][0];
        var dy = pts[i][1] - pts[j][1];
        d[i].push(Math.sqrt(dx * dx + dy * dy));
        c[i].push(0);
      }
    }
    return { n: n, d: d, c: c };
  }
  function copiaMat(c) {
    var o = [];
    for (var i = 0; i < c.length; i++) { o.push(c[i].slice()); }
    return o;
  }
  function MIN(a, b) { if (a < b) { return a; } return b; }
  function MAX(a, b) { if (a > b) { return a; } return b; }

  function calcRapido(M, vet, p) {
    var n = M.n;
    var c = M.c;
    var d = M.d;
    var fo = 0;
    var i, j, k, l;
    for (i = p; i < n; i++) {
      for (j = i; j < n; j++) {
        c[vet[i]][vet[j]] = INT_MAX;
        c[vet[j]][vet[i]] = INT_MAX;
      }
    }
    for (k = 0; k < p; k++) {
      for (l = k + 1; l < p; l++) {
        c[vet[k]][vet[l]] = ALFA * d[vet[k]][vet[l]];
        c[vet[l]][vet[k]] = ALFA * d[vet[l]][vet[k]];
      }
      for (i = p; i < n; i++) {
        c[vet[k]][vet[i]] = LAMBDA * d[vet[k]][vet[i]];
        c[vet[i]][vet[k]] = BETA * d[vet[i]][vet[k]];
      }
    }
    for (k = 0; k < p; k++) {
      for (i = p; i < n; i++) {
        for (l = 0; l < p; l++) {
          c[vet[k]][vet[i]] = MIN(c[vet[k]][vet[i]], c[vet[k]][vet[l]] + c[vet[l]][vet[i]]);
          c[vet[i]][vet[k]] = MIN(c[vet[i]][vet[k]], c[vet[i]][vet[l]] + c[vet[l]][vet[k]]);
        }
      }
    }
    for (i = p; i < n; i++) {
      for (j = i; j < n; j++) {
        for (k = 0; k < p; k++) {
          c[vet[i]][vet[j]] = MIN(c[vet[i]][vet[j]], c[vet[i]][vet[k]] + c[vet[k]][vet[j]]);
          c[vet[j]][vet[i]] = MIN(c[vet[j]][vet[i]], c[vet[j]][vet[k]] + c[vet[k]][vet[i]]);
          for (l = 0; l < p; l++) {
            c[vet[i]][vet[j]] = MIN(c[vet[i]][vet[j]], c[vet[i]][vet[k]] + c[vet[k]][vet[l]] + c[vet[l]][vet[j]]);
            c[vet[j]][vet[i]] = MIN(c[vet[j]][vet[i]], c[vet[j]][vet[l]] + c[vet[l]][vet[k]] + c[vet[k]][vet[i]]);
          }
        }
      }
    }
    for (i = 0; i < n; i++) {
      for (j = i; j < n; j++) { fo = MAX(fo, c[vet[i]][vet[j]]); }
    }
    return fo;
  }

  /* o par de nós que define a FO (primeiro máximo na ordem do laço da etapa 5) */
  function piorPar(M, vet) {
    var n = M.n;
    var melhor = -1;
    var par = null;
    for (var i = 0; i < n; i++) {
      for (var j = i; j < n; j++) {
        var v = M.c[vet[i]][vet[j]];
        if (v > melhor) { melhor = v; par = [vet[i], vet[j]]; }
      }
    }
    return par;
  }

  /* criar_solucao do professor: permutação aleatória; os p primeiros são os hubs */
  function criarSolucao(n, rnd) {
    var aux = [];
    var vet = [];
    var i;
    for (i = 0; i < n; i++) { aux.push(i); }
    for (i = 0; i < n; i++) {
      var pos = i + rnd() % (n - i);
      vet.push(aux[pos]);
      var t = aux[i];
      aux[i] = aux[pos];
      aux[pos] = t;
    }
    return vet;
  }

  /* escolhe a semente cuja solução inicial é a pior entre as que ainda podem ser melhoradas (a animação fica instrutiva) */
  function escolherInicio(pts, p) {
    var n = pts.length;
    var melhorSem = 1;
    var melhorFo = -1;
    for (var sem = 1; sem <= 40; sem++) {
      var rnd = novoRand(sem);
      var vet = criarSolucao(n, rnd);
      var M = novoMotor(pts);
      var fo0 = calcRapido(M, vet, p);
      var melhora = false;
      for (var i = 0; i < p && !melhora; i++) {
        for (var j = p; j < n && !melhora; j++) {
          var v = vet.slice();
          var t = v[i];
          v[i] = v[j];
          v[j] = t;
          var M2 = novoMotor(pts);
          if (calcRapido(M2, v, p) < fo0) { melhora = true; }
        }
      }
      if (melhora && fo0 > melhorFo) { melhorFo = fo0; melhorSem = sem; }
    }
    return melhorSem;
  }

  /* ---------- listagens de código (nomes e assinaturas do prova3.h; estilo do professor) ---------- */
  function lista(linhas) {
    var txt = [];
    var idx = {};
    var span = {};
    for (var i = 0; i < linhas.length; i++) {
      txt.push(linhas[i][1]);
      if (linhas[i][0]) {
        idx[linhas[i][0]] = i;
        if (linhas[i][2]) { span[linhas[i][0]] = linhas[i][2]; }
      }
    }
    return { txt: txt, idx: idx, span: span };
  }

  var SWAP_IJ = [
    ['aux', '            int aux = s.vet_sol[i];                // troca o hub da posição i...'],
    ['sw1', '            s.vet_sol[i] = s.vet_sol[j];           // ...com o não-hub da posição j'],
    ['sw2', '            s.vet_sol[j] = aux;']
  ];

  var LST_PM = lista([
    ['head', 'void heuristica_PrimeiraMelhora(Solucao& s)'],
    ['', '{'],
    ['inicio', '    INICIO : ;                                  // rótulo: um goto recomeça a varredura aqui'],
    ['mf', '    double melhor_fo = s.fo;                    // a fo é double: não use int'],
    ['fi', '    for (int i = 0; i < num_hub; i++)'],
    ['', '    {'],
    ['fj', '        for (int j = num_hub; j < num_nos; j++)'],
    ['', '        {'],
    ['foorig', '            double fo_orig = s.fo;'],
    SWAP_IJ[0], SWAP_IJ[1], SWAP_IJ[2],
    ['calc', '            calcular_fo(s);'],
    ['if', '            if (s.fo < melhor_fo)                  // minimiza: menor é melhor'],
    ['goto', '                goto INICIO;                        // primeira melhora: fica e recomeça'],
    ['', '            else'],
    ['', '            {'],
    ['u1', '                aux = s.vet_sol[i];                // desfaz: troca de volta'],
    ['u2', '                s.vet_sol[i] = s.vet_sol[j];'],
    ['u3', '                s.vet_sol[j] = aux;'],
    ['u4', '                s.fo = fo_orig;'],
    ['', '            }'],
    ['', '        }'],
    ['', '    }'],
    ['end', '}']
  ]);

  var LST_MM = lista([
    ['head', 'void heuristica_MelhorMelhora(Solucao& s)'],
    ['', '{'],
    ['decl', '    int melhor_i, melhor_j;'],
    ['mf', '    double melhor_fo = s.fo;                    // a fo é double: não use int'],
    ['while', '    while (1)'],
    ['', '    {'],
    ['flag', '        int flag = 1;                              // 1 = nada melhorou nesta rodada'],
    ['fi', '        for (int i = 0; i < num_hub; i++)'],
    ['', '        {'],
    ['fj', '            for (int j = num_hub; j < num_nos; j++)'],
    ['', '            {'],
    ['foorig', '                double fo_orig = s.fo;'],
    ['aux', '                int aux = s.vet_sol[i];            // troca o hub i com o não-hub j'],
    ['sw1', '                s.vet_sol[i] = s.vet_sol[j];'],
    ['sw2', '                s.vet_sol[j] = aux;'],
    ['calc', '                calcular_fo(s);'],
    ['if', '                if (s.fo < melhor_fo)              // compara com o melhor visto até agora'],
    ['', '                {'],
    ['m1', '                    melhor_fo = s.fo;'],
    ['m2', '                    melhor_i = i;'],
    ['m3', '                    melhor_j = j;'],
    ['m4', '                    flag = 0;'],
    ['', '                }'],
    ['u1', '                aux = s.vet_sol[i];                // SEMPRE desfaz: só anotamos'],
    ['u2', '                s.vet_sol[i] = s.vet_sol[j];'],
    ['u3', '                s.vet_sol[j] = aux;'],
    ['u4', '                s.fo = fo_orig;'],
    ['', '            }'],
    ['', '        }'],
    ['flagif', '        if (flag)'],
    ['brk', '            break;                                 // nenhum vizinho melhora: ótimo local'],
    ['b1', '        int aux = s.vet_sol[melhor_i];             // aplica só o melhor'],
    ['b2', '        s.vet_sol[melhor_i] = s.vet_sol[melhor_j];'],
    ['b3', '        s.vet_sol[melhor_j] = aux;'],
    ['b4', '        s.fo = melhor_fo;'],
    ['', '    }'],
    ['end', '}']
  ]);

  var LST_RA = lista([
    ['head', 'void heuristica_randonica(Solucao& s, int INTER)'],
    ['', '{'],
    ['while', '    while (1)'],
    ['', '    {'],
    ['flag', '        int flag = 1;                              // 1 = nada melhorou nesta rodada'],
    ['for', '        for (int i = 0; i < INTER; i++)'],
    ['', '        {'],
    ['cp1', '            memcpy(&vizinha, &s, sizeof(Solucao));   // trabalha numa cópia'],
    ['gv', '            gerar_vizinha(vizinha);                  // um movimento ao acaso'],
    ['calc', '            calcular_fo(vizinha);'],
    ['if', '            if (vizinha.fo < s.fo)'],
    ['', '            {'],
    ['cp2', '                memcpy(&s, &vizinha, sizeof(Solucao));'],
    ['flag0', '                flag = 0;'],
    ['', '            }'],
    ['', '        }'],
    ['brkif', '        if (flag)'],
    ['brk', '            break;'],
    ['', '    }'],
    ['end', '}']
  ]);

  var LST_GV = lista([
    ['head', 'void gerar_vizinha(Solucao& s)'],
    ['', '{'],
    ['i', '    int i = rand() % num_hub;                       // sorteia um hub'],
    ['j', '    int j = num_hub + rand() % (num_nos - num_hub);  // sorteia um não-hub'],
    ['aux', '    int aux = s.vet_sol[i];                         // troca os dois'],
    ['sw1', '    s.vet_sol[i] = s.vet_sol[j];'],
    ['sw2', '    s.vet_sol[j] = aux;'],
    ['end', '}']
  ]);

  var LST_CALC = lista([
    ['head', 'void calcular_fo(Solucao& s)'],
    ['', '{'],
    ['zero', '    s.fo = 0;'],
    ['', '    // 1) não-hub x não-hub: ainda sem caminho (custo "infinito")'],
    ['f1i', '    for (int i = num_hub; i < num_nos; i++)'],
    ['f1j', '        for (int j = i; j < num_nos; j++)'],
    ['', '        {'],
    ['a1', '            mat_custo[s.vet_sol[i]][s.vet_sol[j]] = INT_MAX;'],
    ['a2', '            mat_custo[s.vet_sol[j]][s.vet_sol[i]] = INT_MAX;'],
    ['', '        }'],
    ['', '    // 2) custos diretos: hub x hub (com desconto alfa) e hub x não-hub'],
    ['f2k', '    for (int k = 0; k < num_hub; k++)'],
    ['', '    {'],
    ['f2l', '        for (int l = k + 1; l < num_hub; l++)'],
    ['', '        {'],
    ['b1', '            mat_custo[s.vet_sol[k]][s.vet_sol[l]] = alfa * mat_distancias[s.vet_sol[k]][s.vet_sol[l]];'],
    ['b2', '            mat_custo[s.vet_sol[l]][s.vet_sol[k]] = alfa * mat_distancias[s.vet_sol[l]][s.vet_sol[k]];'],
    ['', '        }'],
    ['f2i', '        for (int i = num_hub; i < num_nos; i++)'],
    ['', '        {'],
    ['b3', '            mat_custo[s.vet_sol[k]][s.vet_sol[i]] = lambda * mat_distancias[s.vet_sol[k]][s.vet_sol[i]];'],
    ['b4', '            mat_custo[s.vet_sol[i]][s.vet_sol[k]] = beta * mat_distancias[s.vet_sol[i]][s.vet_sol[k]];'],
    ['', '        }'],
    ['', '    }'],
    ['', '    // 3) hub x não-hub passando por um hub intermediário'],
    ['f3k', '    for (int k = 0; k < num_hub; k++)'],
    ['f3i', '        for (int i = num_hub; i < num_nos; i++)'],
    ['f3l', '            for (int l = 0; l < num_hub; l++)'],
    ['', '            {'],
    ['c1', '                mat_custo[s.vet_sol[k]][s.vet_sol[i]] = MIN(mat_custo[s.vet_sol[k]][s.vet_sol[i]],', 2],
    ['', '                        mat_custo[s.vet_sol[k]][s.vet_sol[l]] + mat_custo[s.vet_sol[l]][s.vet_sol[i]]);'],
    ['c2', '                mat_custo[s.vet_sol[i]][s.vet_sol[k]] = MIN(mat_custo[s.vet_sol[i]][s.vet_sol[k]],', 2],
    ['', '                        mat_custo[s.vet_sol[i]][s.vet_sol[l]] + mat_custo[s.vet_sol[l]][s.vet_sol[k]]);'],
    ['', '            }'],
    ['', '    // 4) não-hub x não-hub passando por 1 ou 2 hubs'],
    ['f4i', '    for (int i = num_hub; i < num_nos; i++)'],
    ['f4j', '        for (int j = i; j < num_nos; j++)'],
    ['f4k', '            for (int k = 0; k < num_hub; k++)'],
    ['', '            {'],
    ['d1', '                mat_custo[s.vet_sol[i]][s.vet_sol[j]] = MIN(mat_custo[s.vet_sol[i]][s.vet_sol[j]],', 2],
    ['', '                        mat_custo[s.vet_sol[i]][s.vet_sol[k]] + mat_custo[s.vet_sol[k]][s.vet_sol[j]]);'],
    ['d2', '                mat_custo[s.vet_sol[j]][s.vet_sol[i]] = MIN(mat_custo[s.vet_sol[j]][s.vet_sol[i]],', 2],
    ['', '                        mat_custo[s.vet_sol[j]][s.vet_sol[k]] + mat_custo[s.vet_sol[k]][s.vet_sol[i]]);'],
    ['f4l', '                for (int l = 0; l < num_hub; l++)'],
    ['', '                {'],
    ['d3', '                    mat_custo[s.vet_sol[i]][s.vet_sol[j]] = MIN(mat_custo[s.vet_sol[i]][s.vet_sol[j]],', 2],
    ['', '                        mat_custo[s.vet_sol[i]][s.vet_sol[k]] + mat_custo[s.vet_sol[k]][s.vet_sol[l]] + mat_custo[s.vet_sol[l]][s.vet_sol[j]]);'],
    ['d4', '                    mat_custo[s.vet_sol[j]][s.vet_sol[i]] = MIN(mat_custo[s.vet_sol[j]][s.vet_sol[i]],', 2],
    ['', '                        mat_custo[s.vet_sol[j]][s.vet_sol[l]] + mat_custo[s.vet_sol[l]][s.vet_sol[k]] + mat_custo[s.vet_sol[k]][s.vet_sol[i]]);'],
    ['', '                }'],
    ['', '            }'],
    ['', '    // 5) a FO é o maior custo entre qualquer par de nós'],
    ['f5i', '    for (int i = 0; i < num_nos; i++)'],
    ['f5j', '        for (int j = i; j < num_nos; j++)'],
    ['e1', '            s.fo = MAX(s.fo, mat_custo[s.vet_sol[i]][s.vet_sol[j]]);'],
    ['end', '}']
  ]);

  var LISTAS = { pm: LST_PM, mm: LST_MM, ra: LST_RA, gerar_vizinha: LST_GV, calcular_fo: LST_CALC };
  var NOME_FUNC = { pm: 'heuristica_PrimeiraMelhora', mm: 'heuristica_MelhorMelhora', ra: 'heuristica_randonica' };

  /* ---------- formatação das variáveis ---------- */
  function fmt(v) {
    if (v === undefined) { return null; }
    if (v instanceof Array) { return '[' + v.join(', ') + ']'; }
    if (typeof v === 'number' && v !== Math.floor(v)) { return String(Math.round(v * 100) / 100); }
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

  /* ---------- executor: roda o código de verdade, uma linha por passo ---------- */
  function gerarTrace(pts, p, semente, modo) {
    var n = pts.length;
    var M = novoMotor(pts);
    var rnd = novoRand(semente);
    var entrarCalc = (n <= LIM_INTERNO);
    var q = [];
    var V = {};
    var prev = {};
    var prevFn = {};
    var rod = 0;
    var W = null; // par de nós que define a FO da solução exibida (quando conhecido)
    var T = function (t) { return '<b>' + t + '</b>'; };
    var DICA = ' <span class="ft-fnhint">⤵ <b>Entrar na função</b> mostra o código dela por dentro; <b>Próximo</b> executa ela inteira de uma vez.</span>';
    var DICA_NAO = ' <span class="ft-fnhint">(Nesta instância grande a função não é aberta por dentro: seriam milhares de passos por chamada. Use o cenário 1 ou o seu para entrar nela.)</span>';

    var vet0 = criarSolucao(n, rnd);
    V['s.vet_sol'] = vet0.slice();
    V['s.fo'] = calcRapido(M, V['s.vet_sol'], p); // a main chamou criar_solucao e calcular_fo antes da heurística
    W = piorPar(M, V['s.vet_sol']);

    function base(cod, key, msg, o, nivel) {
      o = o || {};
      var L = LISTAS[cod];
      var ix = L.idx[key];
      var ln = [ix];
      if (L.span[key]) { ln.push(ix + 1); }
      return { ln: ln, o: o, ix: ix };
    }

    function emit(key, msg, o) {
      o = o || {};
      var L = LISTAS[modo];
      var ix = L.idx[key];
      var ln = [ix];
      if (L.span[key]) { ln.push(ix + 1); }
      var dv = copiarVars(V);
      dv['num_hub'] = p;
      dv['num_nos'] = n;
      var vetS = V['s.vet_sol'].slice();
      var vetV = null;
      if (V['vizinha.vet_sol'] !== undefined) { vetV = V['vizinha.vet_sol'].slice(); }
      var refv = o.ref;
      if (refv === undefined) { refv = V['s.fo']; }
      q.push({ tipo: o.tipo || 'rodada', movs: o.movs || [], ln: ln, cod: 'main', nivel: 0, msg: '<b>Linha ' + (ix + 1) + ':</b> ' + msg,
        vetS: vetS, vetV: vetV, ref: refv, fov: o.fov, fo: o.fo, worst: o.worst, marco: !!o.marco, log: o.log, dv: dv, vars: dv, prevVars: prev });
      prev = dv;
    }

    function emitFn(cod, key, msg, Lv, ctx, mat) {
      var L = LISTAS[cod];
      var ix = L.idx[key];
      var ln = [ix];
      if (L.span[key]) { ln.push(ix + 1); }
      var dv = copiarVars(Lv);
      dv['num_hub'] = p;
      dv['num_nos'] = n;
      if (mat) { dv['mat_custo'] = copiaMat(mat); }
      q.push({ tipo: ctx.tipo, movs: ctx.movs, ln: ln, cod: cod, nivel: 1, msg: '<b>Linha ' + (ix + 1) + ' de <code>' + cod + '</code>:</b> ' + msg,
        vetS: ctx.vetS, vetV: ctx.vetV, ref: ctx.ref, fov: '-', fo: undefined, worst: null, marco: false, log: undefined, dv: dv, vars: dv, prevVars: prevFn,
        chamada: { fn: cod, de: NOME_FUNC[modo], linha: ctx.linha, passado: ctx.passado } });
      prevFn = dv;
    }

    /* calcular_fo por dentro, passo a passo; devolve a FO e atualiza a matriz global igual à versão rápida */
    function traceCalc(vet, passado, ctx) {
      prevFn = {};
      var C = 'calcular_fo';
      var c = M.c;
      var d = M.d;
      var Lv = { 's.vet_sol': vet.slice(), 's.fo': V[passado === 'vizinha' ? 'vizinha.fo' : 's.fo'] };
      var E = function (key, msg) { emitFn(C, key, msg, Lv, ctx, c); };
      var nota = '';
      if (passado === 'vizinha') { nota = ' (aqui <code>s</code> é a <code>vizinha</code> que o chamador passou)'; }
      E('head', 'Entrei na função. O parâmetro <code>s</code> é a solução que me passaram' + nota + '. Vou preencher a matriz global <code>mat_custo</code> e gravar o resultado em <code>s.fo</code>.');
      Lv['s.fo'] = 0;
      E('zero', 'Zero a nota: <code>s.fo = 0</code>.');
      var i, j, k, l;
      var a, b, v;
      function atr(key, A, B, val, txt) {
        c[A][B] = val;
        var sv = val;
        if (val === INT_MAX) { sv = 'INT_MAX'; } else { sv = fmt(Math.round(val)); }
        E(key, txt + ' <code>mat_custo[' + A + '][' + B + ']</code> = ' + T(sv) + '.');
      }
      function laco(key, nome, ini, cond, passoTxt, corpo) {
        Lv[nome] = ini;
        var primeiro = true;
        for (;;) {
          var ok = cond(Lv[nome]);
          var m;
          if (primeiro) { m = 'O <code>for</code> começa com <code>' + nome + ' = ' + Lv[nome] + '</code>. '; } else { m = '<code>' + nome + '++</code> faz ' + nome + ' valer ' + Lv[nome] + '. '; }
          if (ok) { m += 'A condição vale: entro.'; } else { m += 'A condição falha: saio deste <code>for</code>.'; }
          E(key, m);
          primeiro = false;
          if (!ok) { break; }
          corpo(Lv[nome]);
          Lv[nome]++;
        }
        delete Lv[nome];
      }
      var V_ = function (x) { return Lv['s.vet_sol'][x]; };

      // 1) não-hub x não-hub
      laco('f1i', 'i', p, function (x) { return x < n; }, '', function () {
        laco('f1j', 'j', Lv['i'], function (x) { return x < n; }, '', function () {
          atr('a1', V_(Lv['i']), V_(Lv['j']), INT_MAX, 'Atribuo');
          atr('a2', V_(Lv['j']), V_(Lv['i']), INT_MAX, 'Atribuo');
        });
      });
      // 2) custos diretos
      laco('f2k', 'k', 0, function (x) { return x < p; }, '', function () {
        laco('f2l', 'l', Lv['k'] + 1, function (x) { return x < p; }, '', function () {
          a = V_(Lv['k']); b = V_(Lv['l']);
          atr('b1', a, b, ALFA * d[a][b], 'Hub x hub com desconto alfa (0,75):');
          atr('b2', b, a, ALFA * d[b][a], 'Hub x hub com desconto alfa (0,75):');
        });
        laco('f2i', 'i', p, function (x) { return x < n; }, '', function () {
          a = V_(Lv['k']); b = V_(Lv['i']);
          atr('b3', a, b, LAMBDA * d[a][b], 'Hub x não-hub (lambda = 1):');
          atr('b4', b, a, BETA * d[b][a], 'Não-hub x hub (beta = 1):');
        });
      });
      // 3) hub x não-hub passando por um hub
      laco('f3k', 'k', 0, function (x) { return x < p; }, '', function () {
        laco('f3i', 'i', p, function (x) { return x < n; }, '', function () {
          laco('f3l', 'l', 0, function (x) { return x < p; }, '', function () {
            var A = V_(Lv['k']), B = V_(Lv['i']), H = V_(Lv['l']);
            v = MIN(c[A][B], c[A][H] + c[H][B]);
            atr('c1', A, B, v, 'Melhor entre o custo atual e passar pelo hub ' + H + ':');
            v = MIN(c[B][A], c[B][H] + c[H][A]);
            atr('c2', B, A, v, 'Melhor entre o custo atual e passar pelo hub ' + H + ':');
          });
        });
      });
      // 4) não-hub x não-hub passando por 1 ou 2 hubs
      laco('f4i', 'i', p, function (x) { return x < n; }, '', function () {
        laco('f4j', 'j', Lv['i'], function (x) { return x < n; }, '', function () {
          laco('f4k', 'k', 0, function (x) { return x < p; }, '', function () {
            var A = V_(Lv['i']), B = V_(Lv['j']), H = V_(Lv['k']);
            v = MIN(c[A][B], c[A][H] + c[H][B]);
            atr('d1', A, B, v, 'Passando pelo hub ' + H + ':');
            v = MIN(c[B][A], c[B][H] + c[H][A]);
            atr('d2', B, A, v, 'Passando pelo hub ' + H + ':');
            laco('f4l', 'l', 0, function (x) { return x < p; }, '', function () {
              var H2 = V_(Lv['l']);
              v = MIN(c[A][B], c[A][H] + c[H][H2] + c[H2][B]);
              atr('d3', A, B, v, 'Passando pelos hubs ' + H + ' e ' + H2 + ':');
              v = MIN(c[B][A], c[B][H2] + c[H2][H] + c[H][A]);
              atr('d4', B, A, v, 'Passando pelos hubs ' + H2 + ' e ' + H + ':');
            });
          });
        });
      });
      // 5) FO
      laco('f5i', 'i', 0, function (x) { return x < n; }, '', function () {
        laco('f5j', 'j', Lv['i'], function (x) { return x < n; }, '', function () {
          var A = V_(Lv['i']), B = V_(Lv['j']);
          Lv['s.fo'] = MAX(Lv['s.fo'], c[A][B]);
          E('e1', 'A FO guarda o maior custo visto: <code>mat_custo[' + A + '][' + B + ']</code> = ' + (c[A][B] === INT_MAX ? 'INT_MAX' : Math.round(c[A][B])) + ', então <code>s.fo</code> = ' + T(Math.round(Lv['s.fo'])) + '.');
        });
      });
      E('end', 'Fim da função: <code>s.fo</code> = ' + T(fmt(Math.round(Lv['s.fo'] * 100) / 100)) + '. Devolvo o controle para a linha que me chamou.');
      return Lv['s.fo'];
    }

    /* gerar_vizinha por dentro: devolve [i, j] sorteados (a troca é feita dentro) */
    function traceGerar(vetRef, ctx) {
      prevFn = {};
      var G = 'gerar_vizinha';
      var Lv = { 's.vet_sol': vetRef.slice() };
      emitFn(G, 'head', 'Entrei na função. O parâmetro <code>s</code> aqui é a <code>vizinha</code> (a cópia): só ela será alterada.', Lv, ctx);
      Lv['i'] = rnd() % p;
      emitFn(G, 'i', '<b>Sorteio</b> um hub: <code>i = rand() % num_hub</code> deu ' + T(Lv['i']) + '.', Lv, ctx);
      Lv['j'] = p + rnd() % (n - p);
      emitFn(G, 'j', '<b>Sorteio</b> um não-hub: <code>j = num_hub + rand() % (num_nos - num_hub)</code> deu ' + T(Lv['j']) + '.', Lv, ctx);
      Lv['aux'] = Lv['s.vet_sol'][Lv['i']];
      emitFn(G, 'aux', 'Guardo o nó da posição ' + Lv['i'] + ': <code>aux</code> = ' + T(Lv['aux']) + '.', Lv, ctx);
      Lv['s.vet_sol'][Lv['i']] = Lv['s.vet_sol'][Lv['j']];
      emitFn(G, 'sw1', 'O nó da posição ' + Lv['j'] + ' vai para a posição ' + Lv['i'] + '.', Lv, ctx);
      Lv['s.vet_sol'][Lv['j']] = Lv['aux'];
      emitFn(G, 'sw2', 'O nó guardado vai para a posição ' + Lv['j'] + '. Agora <code>s.vet_sol</code> = ' + T(fmt(Lv['s.vet_sol'])) + '.', Lv, ctx);
      emitFn(G, 'end', 'Fim da função. A <code>vizinha</code> já está alterada; <code>s</code> (a original) não foi tocada.', Lv, ctx);
      return { i: Lv['i'], j: Lv['j'], vet: Lv['s.vet_sol'].slice() };
    }

    /* chama calcular_fo: mostra a linha da chamada, (opcionalmente) a função por dentro, e devolve a FO */
    function chamarCalc(qual, key, msgAntes, o) {
      var nome = (qual === 'vizinha') ? 'vizinha' : 's';
      var vet = V[nome + '.vet_sol'];
      emit(key, msgAntes + (entrarCalc ? DICA : DICA_NAO), o);
      var f;
      if (entrarCalc) {
        var ctx = { tipo: o.tipo || 'rodada', movs: o.movs || [], vetS: V['s.vet_sol'].slice(),
          vetV: (V['vizinha.vet_sol'] === undefined) ? null : V['vizinha.vet_sol'].slice(), ref: (o.ref === undefined ? V['s.fo'] : o.ref),
          linha: LISTAS[modo].idx[key] + 1, passado: qual };
        f = traceCalc(vet, qual, ctx);
      } else {
        f = calcRapido(M, vet, p);
      }
      V[nome + '.fo'] = f;
      W = piorPar(M, vet);
      return f;
    }

    function trocaMsg(i, j) { return 'trocar a posição ' + i + ' (hub, nó ' + V['s.vet_sol'][i] + ') com a posição ' + j + ' (não-hub, nó ' + V['s.vet_sol'][j] + ')'; }

    /* ===== primeira melhora ===== */
    if (modo === 'pm') {
      emit('head', 'Entrei na função. <code>s</code> chegou <b>por referência</b>, já com <code>s.fo</code> = ' + T(fmt(Math.round(V['s.fo']))) + ' calculada pela <code>main</code>.', { marco: true, worst: W });
      var voltou = true;
      while (voltou) {
        voltou = false;
        rod++;
        emit('inicio', 'O rótulo <code>INICIO</code>: aqui começa (ou recomeça) a varredura.', { worst: W });
        V['melhor_fo'] = V['s.fo'];
        emit('mf', 'Guardo a nota de referência: <code>melhor_fo = s.fo</code> = ' + T(fmt(Math.round(V['melhor_fo']))) + '.', { worst: W });
        V['i'] = 0;
        var primI = true;
        var salto = false;
        for (;;) {
          if (!primI) { V['i']++; }
          var okI = (V['i'] < p);
          emit('fi', (primI ? 'O <code>for</code> dos hubs começa com <code>i = 0</code>. ' : '<code>i++</code> faz i valer ' + V['i'] + '. ') + 'Testo <code>i &lt; num_hub</code> (' + p + '): ' + (okI ? 'entro.' : 'acabaram os hubs.'), { worst: W });
          primI = false;
          if (!okI) { break; }
          V['j'] = p;
          var primJ = true;
          for (;;) {
            if (!primJ) { V['j']++; }
            var okJ = (V['j'] < n);
            emit('fj', (primJ ? 'O <code>for</code> dos não-hubs começa com <code>j = num_hub</code> = ' + p + '. ' : '<code>j++</code> faz j valer ' + V['j'] + '. ') + 'Testo <code>j &lt; num_nos</code> (' + n + '): ' + (okJ ? 'entro.' : 'acabaram os não-hubs.'), { worst: W });
            primJ = false;
            if (!okJ) { break; }
            var ii = V['i'], jj = V['j'];
            V['fo_orig'] = V['s.fo'];
            var Wbase = W;
            emit('foorig', 'Guardo a nota de antes: <code>fo_orig</code> = ' + T(fmt(Math.round(V['fo_orig']))) + '.', { worst: W });
            V['aux'] = V['s.vet_sol'][ii];
            emit('aux', 'Guardo o nó da posição ' + ii + ': <code>aux</code> = ' + T(V['aux']) + '. O movimento é ' + trocaMsg(ii, jj) + '.', { worst: W });
            V['s.vet_sol'][ii] = V['s.vet_sol'][jj];
            emit('sw1', 'O nó ' + V['s.vet_sol'][jj] + ' (da posição ' + jj + ') vai para a posição ' + ii + '.', { tipo: 'teste', movs: [ii, jj], ref: V['fo_orig'], fov: '-', worst: null });
            V['s.vet_sol'][jj] = V['aux'];
            emit('sw2', 'O nó ' + V['aux'] + ' vai para a posição ' + jj + '. <b>Troca feita</b>: o hub ' + V['aux'] + ' saiu e o nó ' + V['s.vet_sol'][ii] + ' virou hub. A nota ainda é a velha.', { tipo: 'teste', movs: [ii, jj], ref: V['fo_orig'], fov: '-', worst: null });
            chamarCalc('s', 'calc', 'Chamo <code>calcular_fo(s)</code> para avaliar a vizinha.', { tipo: 'teste', movs: [ii, jj], ref: V['fo_orig'], fov: '-', worst: null });
            var melhor = (V['s.fo'] < V['melhor_fo']);
            var resp = melhor ? 'sim' : 'não';
            var logTxt = 'Rodada ' + rod + ' · trocar ' + ii + ' e ' + jj + ' → FO ' + Math.round(V['s.fo']) + (melhor ? ' · <b style="color:#16a34a">aceita</b>' : ' · desfaz');
            emit('if', 'Pergunto <code>s.fo &lt; melhor_fo</code>: ' + Math.round(V['s.fo']) + ' &lt; ' + Math.round(V['melhor_fo']) + '? ' + T(resp) + '.' + (melhor ? '' : ' (Empate também é "não".)'),
              { tipo: 'teste', movs: [ii, jj], ref: V['fo_orig'], fo: V['s.fo'], worst: W, marco: true, log: logTxt });
            if (melhor) {
              emit('goto', '<code>goto INICIO</code>: <b>fico com esta solução</b> e volto ao rótulo. Todas as variáveis locais deixam de existir.', { tipo: 'aceita', movs: [ii, jj], ref: V['s.fo'], worst: W, marco: true });
              salto = true;
              break;
            }
            V['aux'] = V['s.vet_sol'][ii];
            emit('u1', '<b>Desfaço</b> a troca. Guardo de novo o nó da posição ' + ii + ' em <code>aux</code> = ' + T(V['aux']) + '.', { tipo: 'desfaz', movs: [ii, jj], ref: V['fo_orig'], worst: null });
            V['s.vet_sol'][ii] = V['s.vet_sol'][jj];
            emit('u2', 'Trago de volta o nó da posição ' + jj + ' para a posição ' + ii + '.', { tipo: 'desfaz', movs: [ii, jj], ref: V['fo_orig'], worst: null });
            V['s.vet_sol'][jj] = V['aux'];
            emit('u3', 'Devolvo o nó guardado à posição ' + jj + '. <code>s.vet_sol</code> = ' + T(fmt(V['s.vet_sol'])) + ' de novo.', { tipo: 'desfaz', movs: [ii, jj], ref: V['fo_orig'], worst: null });
            V['s.fo'] = V['fo_orig'];
            W = Wbase;
            emit('u4', 'Volto também a nota: <code>s.fo = fo_orig</code> = ' + T(fmt(Math.round(V['s.fo']))) + '.', { tipo: 'desfaz', movs: [ii, jj], ref: V['s.fo'], worst: W, marco: true });
            delete V['fo_orig'];
            delete V['aux'];
          }
          delete V['j'];
          if (salto) { break; }
        }
        delete V['i'];
        delete V['j'];
        delete V['fo_orig'];
        delete V['aux'];
        delete V['melhor_fo'];
        if (salto) { voltou = true; }
      }
      emit('end', 'Os dois <code>for</code> terminaram sem nenhuma melhora: fim da função. <b>Ótimo local</b>, FO final = ' + T(fmt(Math.round(V['s.fo']))) + '.', { worst: W, marco: true });
      return q;
    }

    /* ===== melhor melhora ===== */
    if (modo === 'mm') {
      emit('head', 'Entrei na função. <code>s</code> chegou <b>por referência</b>, já com <code>s.fo</code> = ' + T(fmt(Math.round(V['s.fo']))) + '.', { marco: true, worst: W });
      emit('decl', 'Declaro <code>melhor_i</code> e <code>melhor_j</code> <b>sem valor</b> (lixo de memória até serem atribuídos).', { worst: W });
      V['melhor_fo'] = V['s.fo'];
      emit('mf', 'Guardo a nota de referência: <code>melhor_fo = s.fo</code> = ' + T(fmt(Math.round(V['melhor_fo']))) + '.', { worst: W });
      for (;;) {
        rod++;
        emit('while', '<code>while (1)</code>: laço infinito; só o <code>break</code> o encerra. Rodada ' + rod + '.', { worst: W });
        V['flag'] = 1;
        emit('flag', '<code>flag = 1</code>: por enquanto "nada melhorou nesta rodada".', { worst: W });
        V['i'] = 0;
        var primI2 = true;
        for (;;) {
          if (!primI2) { V['i']++; }
          var okI2 = (V['i'] < p);
          emit('fi', (primI2 ? 'O <code>for</code> dos hubs começa com <code>i = 0</code>. ' : '<code>i++</code> faz i valer ' + V['i'] + '. ') + 'Testo <code>i &lt; num_hub</code> (' + p + '): ' + (okI2 ? 'entro.' : 'acabaram os hubs.'), { worst: W });
          primI2 = false;
          if (!okI2) { break; }
          V['j'] = p;
          var primJ2 = true;
          for (;;) {
            if (!primJ2) { V['j']++; }
            var okJ2 = (V['j'] < n);
            emit('fj', (primJ2 ? 'O <code>for</code> dos não-hubs começa com <code>j = num_hub</code> = ' + p + '. ' : '<code>j++</code> faz j valer ' + V['j'] + '. ') + 'Testo <code>j &lt; num_nos</code> (' + n + '): ' + (okJ2 ? 'entro.' : 'acabaram os não-hubs.'), { worst: W });
            primJ2 = false;
            if (!okJ2) { break; }
            var i2 = V['i'], j2 = V['j'];
            V['fo_orig'] = V['s.fo'];
            var Wbase2 = W;
            emit('foorig', 'Guardo a nota da solução atual: <code>fo_orig</code> = ' + T(fmt(Math.round(V['fo_orig']))) + ' (vou desfazer sempre para ela).', { worst: W });
            V['aux'] = V['s.vet_sol'][i2];
            emit('aux', 'Guardo o nó da posição ' + i2 + ': <code>aux</code> = ' + T(V['aux']) + '. O movimento é ' + trocaMsg(i2, j2) + '.', { worst: W });
            V['s.vet_sol'][i2] = V['s.vet_sol'][j2];
            emit('sw1', 'O nó ' + V['s.vet_sol'][j2] + ' vai para a posição ' + i2 + '.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fov: '-', worst: null });
            V['s.vet_sol'][j2] = V['aux'];
            emit('sw2', 'O nó ' + V['aux'] + ' vai para a posição ' + j2 + '. <b>Troca feita</b>. A nota ainda é a velha.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fov: '-', worst: null });
            chamarCalc('s', 'calc', 'Chamo <code>calcular_fo(s)</code> para avaliar a vizinha.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fov: '-', worst: null });
            var melhor2 = (V['s.fo'] < V['melhor_fo']);
            var resp2 = melhor2 ? 'sim' : 'não';
            var logTxt2 = 'Rodada ' + rod + ' · trocar ' + i2 + ' e ' + j2 + ' → FO ' + Math.round(V['s.fo']) + (melhor2 ? ' · <b style="color:#16a34a">novo melhor</b>' : '');
            emit('if', 'Pergunto <code>s.fo &lt; melhor_fo</code>: ' + Math.round(V['s.fo']) + ' &lt; ' + Math.round(V['melhor_fo']) + '? ' + T(resp2) + '. (Compara com o <b>melhor visto</b>, não com a nota atual.)',
              { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fo: V['s.fo'], worst: W, marco: true, log: logTxt2 });
            if (melhor2) {
              V['melhor_fo'] = V['s.fo'];
              emit('m1', 'Anoto o novo melhor valor: <code>melhor_fo</code> = ' + T(fmt(Math.round(V['melhor_fo']))) + '.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fo: V['s.fo'], worst: W });
              V['melhor_i'] = i2;
              emit('m2', 'Anoto a posição do hub: <code>melhor_i</code> = ' + T(i2) + '.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fo: V['s.fo'], worst: W });
              V['melhor_j'] = j2;
              emit('m3', 'Anoto a posição do não-hub: <code>melhor_j</code> = ' + T(j2) + '.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fo: V['s.fo'], worst: W });
              V['flag'] = 0;
              emit('m4', '<code>flag = 0</code>: esta rodada achou melhora.', { tipo: 'teste', movs: [i2, j2], ref: V['fo_orig'], fo: V['s.fo'], worst: W });
            }
            V['aux'] = V['s.vet_sol'][i2];
            emit('u1', '<b>SEMPRE desfaço</b> (melhorando ou não). Guardo o nó da posição ' + i2 + ': <code>aux</code> = ' + T(V['aux']) + '.', { tipo: 'desfaz', movs: [i2, j2], ref: V['fo_orig'], worst: null });
            V['s.vet_sol'][i2] = V['s.vet_sol'][j2];
            emit('u2', 'Trago de volta o nó da posição ' + j2 + ' para a posição ' + i2 + '.', { tipo: 'desfaz', movs: [i2, j2], ref: V['fo_orig'], worst: null });
            V['s.vet_sol'][j2] = V['aux'];
            emit('u3', 'Devolvo o nó guardado à posição ' + j2 + '. <code>s.vet_sol</code> = ' + T(fmt(V['s.vet_sol'])) + ' de novo.', { tipo: 'desfaz', movs: [i2, j2], ref: V['fo_orig'], worst: null });
            V['s.fo'] = V['fo_orig'];
            W = Wbase2;
            emit('u4', 'Volto também a nota: <code>s.fo = fo_orig</code> = ' + T(fmt(Math.round(V['s.fo']))) + '.', { tipo: 'desfaz', movs: [i2, j2], ref: V['s.fo'], worst: W, marco: true });
            delete V['fo_orig'];
            delete V['aux'];
          }
          delete V['j'];
        }
        delete V['i'];
        emit('flagif', 'Terminei de olhar as ' + (p * (n - p)) + ' vizinhas. Pergunto <code>if (flag)</code>: flag vale ' + V['flag'] + ', então ' + (V['flag'] ? '<b>sim</b>.' : '<b>não</b>.'), { worst: W });
        if (V['flag']) {
          emit('brk', '<code>break</code>: nenhuma vizinha melhorou. Saio do <code>while</code>.', { worst: W });
          break;
        }
        V['aux'] = V['s.vet_sol'][V['melhor_i']];
        emit('b1', 'Agora aplico <b>só a melhor</b>. Guardo o nó da posição ' + V['melhor_i'] + ': <code>aux</code> = ' + T(V['aux']) + '.', { tipo: 'aceita', movs: [V['melhor_i'], V['melhor_j']], ref: V['s.fo'], worst: W });
        V['s.vet_sol'][V['melhor_i']] = V['s.vet_sol'][V['melhor_j']];
        emit('b2', 'O nó da posição ' + V['melhor_j'] + ' vai para a posição ' + V['melhor_i'] + '.', { tipo: 'aceita', movs: [V['melhor_i'], V['melhor_j']], ref: V['s.fo'], fov: '-', worst: null });
        V['s.vet_sol'][V['melhor_j']] = V['aux'];
        emit('b3', 'O nó guardado vai para a posição ' + V['melhor_j'] + '. <code>s.vet_sol</code> = ' + T(fmt(V['s.vet_sol'])) + '.', { tipo: 'aceita', movs: [V['melhor_i'], V['melhor_j']], ref: V['s.fo'], fov: '-', worst: null });
        V['s.fo'] = V['melhor_fo'];
        W = null;
        emit('b4', '<code>s.fo = melhor_fo</code> = ' + T(fmt(Math.round(V['s.fo']))) + ': a nota da solução aplicada (já tinha sido calculada no teste).', { tipo: 'aceita', movs: [V['melhor_i'], V['melhor_j']], ref: V['s.fo'], worst: null, marco: true });
        delete V['aux'];
        delete V['flag'];
      }
      emit('end', 'Fim da função. <b>Ótimo local</b>, FO final = ' + T(fmt(Math.round(V['s.fo']))) + '.', { worst: W, marco: true });
      return q;
    }

    /* ===== randômica ===== */
    V['INTER'] = INTER;
    emit('head', 'Entrei na função com <code>INTER</code> = ' + T(INTER) + ' (quantos sorteios por rodada). <code>s</code> chegou <b>por referência</b>, já com <code>s.fo</code> = ' + T(fmt(Math.round(V['s.fo']))) + '.', { marco: true, worst: W });
    for (;;) {
      rod++;
      emit('while', '<code>while (1)</code>: laço infinito; só o <code>break</code> o encerra. Rodada ' + rod + '.', { worst: W });
      V['flag'] = 1;
      emit('flag', '<code>flag = 1</code>: por enquanto "nada melhorou nesta rodada".', { worst: W });
      V['i'] = 0;
      var primR = true;
      for (;;) {
        delete V['vizinha.vet_sol'];
        delete V['vizinha.fo'];
        if (!primR) { V['i']++; }
        var okR = (V['i'] < INTER);
        emit('for', (primR ? 'O <code>for</code> começa com <code>i = 0</code>. ' : '<code>i++</code> faz i valer ' + V['i'] + '. ') + 'Testo <code>i &lt; INTER</code> (' + INTER + '): ' + (okR ? 'faço mais um sorteio.' : 'acabaram os sorteios desta rodada.'), { worst: W });
        primR = false;
        if (!okR) { break; }
        V['vizinha.vet_sol'] = V['s.vet_sol'].slice();
        V['vizinha.fo'] = V['s.fo'];
        emit('cp1', '<code>memcpy(&amp;vizinha, &amp;s, ...)</code>: <b>copio</b> a solução <code>s</code> inteira para <code>vizinha</code>. Daqui em diante mexo só na cópia.', { worst: W });
        emit('gv', 'Chamo <code>gerar_vizinha(vizinha)</code>: ela vai <b>sortear</b> um hub e um não-hub e trocá-los, só na cópia.' + DICA, { worst: W });
        var gi, gj;
        if (entrarCalc || true) {
          var ctxG = { tipo: 'teste', movs: [], vetS: V['s.vet_sol'].slice(), vetV: V['vizinha.vet_sol'].slice(), ref: V['s.fo'], linha: LISTAS['ra'].idx['gv'] + 1, passado: 'vizinha' };
          var rg = traceGerar(V['vizinha.vet_sol'], ctxG);
          gi = rg.i;
          gj = rg.j;
          V['vizinha.vet_sol'] = rg.vet;
        }
        emit('calc', 'Chamo <code>calcular_fo(vizinha)</code>. A troca foi: posição ' + gi + ' (hub) com a posição ' + gj + ' (não-hub), então os hubs agora são ' + fmt(V['vizinha.vet_sol'].slice(0, p)) + '.' + (entrarCalc ? DICA : DICA_NAO), { tipo: 'teste', movs: [gi, gj], ref: V['s.fo'], fov: '-', worst: null });
        var fv;
        if (entrarCalc) {
          var ctxC = { tipo: 'teste', movs: [gi, gj], vetS: V['s.vet_sol'].slice(), vetV: V['vizinha.vet_sol'].slice(), ref: V['s.fo'], linha: LISTAS['ra'].idx['calc'] + 1, passado: 'vizinha' };
          fv = traceCalc(V['vizinha.vet_sol'], 'vizinha', ctxC);
        } else {
          fv = calcRapido(M, V['vizinha.vet_sol'], p);
        }
        V['vizinha.fo'] = fv;
        var Wv = piorPar(M, V['vizinha.vet_sol']);
        var melhorR = (V['vizinha.fo'] < V['s.fo']);
        var respR = melhorR ? 'sim' : 'não';
        var logR = 'Rodada ' + rod + ' · sorteio ' + (V['i'] + 1) + ' (trocar ' + gi + ' e ' + gj + ') → FO ' + Math.round(V['vizinha.fo']) + (melhorR ? ' · <b style="color:#16a34a">aceita</b>' : ' · descarta');
        emit('if', 'Pergunto <code>vizinha.fo &lt; s.fo</code>: ' + Math.round(V['vizinha.fo']) + ' &lt; ' + Math.round(V['s.fo']) + '? ' + T(respR) + '.' + (melhorR ? '' : ' A cópia será descartada na próxima volta; <code>s</code> não foi mexida.'),
          { tipo: 'teste', movs: [gi, gj], ref: V['s.fo'], fo: V['vizinha.fo'], worst: Wv, marco: true, log: logR });
        if (melhorR) {
          V['s.vet_sol'] = V['vizinha.vet_sol'].slice();
          V['s.fo'] = V['vizinha.fo'];
          W = Wv;
          emit('cp2', '<code>memcpy(&amp;s, &amp;vizinha, ...)</code>: <b>copio a vizinha de volta</b> para <code>s</code>. Agora <code>s.fo</code> = ' + T(fmt(Math.round(V['s.fo']))) + '.', { tipo: 'aceita', movs: [gi, gj], ref: V['s.fo'], worst: W, marco: true });
          V['flag'] = 0;
          emit('flag0', '<code>flag = 0</code>: esta rodada achou melhora.', { tipo: 'aceita', movs: [gi, gj], ref: V['s.fo'], worst: W });
        }
      }
      delete V['i'];
      delete V['vizinha.vet_sol'];
      delete V['vizinha.fo'];
      emit('brkif', 'Terminei os sorteios. Pergunto <code>if (flag)</code>: flag vale ' + V['flag'] + ', então ' + (V['flag'] ? '<b>sim</b>.' : '<b>não</b>, faço outra rodada.'), { worst: W });
      if (V['flag']) {
        emit('brk', '<code>break</code>: uma rodada inteira sem melhora. Saio do <code>while</code>.', { worst: W });
        break;
      }
      delete V['flag'];
    }
    var existe = false;
    var foAtual = V['s.fo'];
    var M3 = novoMotor(pts);
    for (var a1 = 0; a1 < p && !existe; a1++) {
      for (var b1 = p; b1 < n && !existe; b1++) {
        var vv = V['s.vet_sol'].slice();
        var tt = vv[a1];
        vv[a1] = vv[b1];
        vv[b1] = tt;
        if (calcRapido(M3, vv, p) < foAtual) { existe = true; }
      }
    }
    emit('end', 'Fim da função. FO final = ' + T(fmt(Math.round(V['s.fo']))) + '. ' + (existe ? 'Repare: <b>ainda existe</b> uma troca que melhora, mas os sorteios não a pegaram. Por isso a randômica <u>não garante ótimo local</u>.' : 'Aqui, por sorte, nenhuma troca melhora; mas a randômica <u>não garante</u> isso.'), { worst: W, marco: true });
    return q;
  }

  var API = {
    INSTANCIAS: INSTANCIAS, LISTAS: LISTAS, NOME_FUNC: NOME_FUNC, ALFA: ALFA, BETA: BETA, LAMBDA: LAMBDA, INT_MAX: INT_MAX, INTER: INTER, LIM_INTERNO: LIM_INTERNO,
    novoRand: novoRand, novoMotor: novoMotor, copiaMat: copiaMat, calcRapido: calcRapido, piorPar: piorPar, criarSolucao: criarSolucao,
    escolherInicio: escolherInicio, gerarTrace: gerarTrace, fmt: fmt
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
  raiz.HubsNucleo = API;
})(typeof window !== 'undefined' ? window : globalThis);
