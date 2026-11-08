/* Simulador do problema REAL da P3 (hubs, UMApHCP): interface.
   Uso: <div class="card hubs" data-modo="pm" data-visao="debug"></div>
   Depende de hubs-nucleo.js (motor, código mostrado e executor linha a linha). */
(function () {
  var raizes = document.querySelectorAll('.hubs');
  if (!raizes.length) { return; }
  var N = window.HubsNucleo;
  if (!N) { return; }

  var TOKENS = {
    's.vet_sol[i]': 1, 's.vet_sol[j]': 1, 's.vet_sol[k]': 1, 's.vet_sol[l]': 1, 
    'vizinha.vet_sol': 1, 'melhor.vet_sol': 1, 'melhor.fo': 1, 'melhor': 1, 's.vet_sol': 1, 'vizinha.fo': 1, 's.fo': 1, 'vizinha': 1, 's': 1, 'mat_custo': 1, 'mat_distancias': 1,
    'flag': 1, 'aux': 1, 'INTER': 1, 'num_hub': 1, 'num_nos': 1,
    'alfa': 1, 'beta': 1, 'lambda': 1, 'INT_MAX': 1, 'i': 1, 'j': 1, 'k': 1, 'l': 1
  };
  var CENARIOS = {
    a: N.INSTANCIAS.a,
    b: N.INSTANCIAS.b
  };
  var COR_TIPO = { teste: '#facc15', aceita: '#16a34a', desfaz: '#dc2626' };
  var SEM_TIPO = { teste: 'ft-teste', aceita: 'ft-ok', desfaz: 'ft-volta' };

  function escapar(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function pad(n) {
    if (n < 10) { return ' ' + n; }
    return '' + n;
  }
  function numFmt(x) {
    if (typeof x !== 'number') { return String(x); }
    if (Math.abs(x) >= 1000) { return String(Math.round(x)); }
    return String(Math.round(x * 100) / 100);
  }
  function valStr(v) {
    if (v === undefined) { return null; }
    if (v instanceof Array) { return '[' + v.join(', ') + ']'; }
    return numFmt(v);
  }

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

  /* valor mostrado ao passar o mouse sobre um nome do código (null = não existe neste ponto) */
  function valorToken(nome, dv) {
    if (nome === 'alfa') { return '0.75 (desconto do transporte entre hubs)'; }
    if (nome === 'beta') { return '1 (peso da distribuição: hub → nó)'; }
    if (nome === 'lambda') { return '1 (peso da coleta: nó → hub)'; }
    if (nome === 'INT_MAX') { return '2147483647 (funciona como "infinito")'; }
    if (nome === 'mat_custo') { return 'matriz global ' + dv['num_nos'] + ' x ' + dv['num_nos'] + ' com o custo do melhor caminho entre cada par de nós (a tabela abaixo do código mostra o conteúdo quando você está dentro de calcular_fo)'; }
    if (nome === 'mat_distancias') { return 'matriz global com a distância entre cada par de nós (calculada por ler_dados)'; }
    if (nome === 's' || nome === 'vizinha' || nome === 'melhor') {
      if (dv[nome + '.vet_sol'] === undefined) { return null; }
      return '{ vet_sol = ' + valStr(dv[nome + '.vet_sol']) + ', fo = ' + valStr(dv[nome + '.fo']) + ' }';
    }
    var ix = nome.indexOf('[');
    if (ix >= 0) {
      var base = nome.slice(0, ix);
      var idxNome = nome.slice(ix + 1, nome.length - 1);
      var vet = dv[base];
      var idx = dv[idxNome];
      if (vet === undefined || idx === undefined) { return null; }
      return vet[idx] + '  (o nó que está na posição ' + idxNome + ' = ' + idx + ' do vetor ' + base + ')';
    }
    return valStr(dv[nome]);
  }

  function htmlMatriz(m, pm) {
    var n = m.length;
    var grande = false;
    var i, j;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        if (m[i][j] !== N.INT_MAX && m[i][j] >= 1000) { grande = true; }
      }
    }
    function f(v) {
      if (v === N.INT_MAX) { return '∞'; }
      if (grande) { return String(Math.round(v)); }
      return String(Math.round(v * 10) / 10);
    }
    var h = '<div class="hb-matriz-t">mat_custo agora (em amarelo: mudou neste passo; ∞ = INT_MAX)</div><div class="hb-matriz"><table><tr><th></th>';
    for (j = 0; j < n; j++) { h += '<th>' + j + '</th>'; }
    h += '</tr>';
    for (i = 0; i < n; i++) {
      h += '<tr><th>' + i + '</th>';
      for (j = 0; j < n; j++) {
        var mud = (pm && pm[i] && pm[i][j] !== m[i][j]);
        h += '<td' + (mud ? ' class="hb-mud"' : '') + '>' + f(m[i][j]) + '</td>';
      }
      h += '</tr>';
    }
    return h + '</table></div>';
  }

  function htmlVars(q) {
    var dv = q.dv;
    var pv = q.prevVars || {};
    var ordem;
    if (q.nivel > 0) {
      ordem = ['s.vet_sol', 's.fo', 'i', 'j', 'k', 'l', 'aux'];
    } else {
      ordem = ['s.vet_sol', 's.fo', 'vizinha.vet_sol', 'vizinha.fo', 'melhor.vet_sol', 'melhor.fo', 'flag', 'INTER', 'i', 'j', 'aux', 'num_hub', 'num_nos'];
    }
    var h = '<div class="ft-vars-t">Variáveis agora (em amarelo: mudou neste passo)</div><div class="ft-vgrade">';
    for (var x = 0; x < ordem.length; x++) {
      var nome = ordem[x];
      if (dv[nome] === undefined) { continue; }
      var cls = 'ft-var';
      if (valStr(pv[nome]) !== valStr(dv[nome])) { cls += ' ft-var-mud'; }
      h += '<div class="' + cls + '"><b>' + nome + '</b> = ' + valStr(dv[nome]) + '</div>';
    }
    h += '</div>';
    if (q.nivel > 0 && dv['mat_custo']) { h += htmlMatriz(dv['mat_custo'], pv['mat_custo']); }
    return h;
  }

  /* ---------- parser do cenário digitado: "x y; x y; ..." ---------- */
  function lerCenario(texto, pTxt) {
    var partes = texto.split(/[;\n]+/);
    var pts = [];
    for (var i = 0; i < partes.length; i++) {
      var s = partes[i].replace(/^\s+|\s+$/g, '');
      if (s === '') { continue; }
      var nums = s.split(/[\s,]+/);
      if (nums.length !== 2) { return { ok: false, erro: 'O nó "' + s + '" precisa ter exatamente dois números (x e y).' }; }
      var x = Number(nums[0]);
      var y = Number(nums[1]);
      if (isNaN(x) || isNaN(y)) { return { ok: false, erro: 'O nó "' + s + '" tem algo que não é número.' }; }
      if (Math.abs(x) > 100000 || Math.abs(y) > 100000) { return { ok: false, erro: 'Use coordenadas de até 100000.' }; }
      pts.push([x, y]);
    }
    if (pts.length < 4 || pts.length > N.LIM_INTERNO) { return { ok: false, erro: 'Use de 4 a ' + N.LIM_INTERNO + ' nós (você digitou ' + pts.length + ').' }; }
    var p = Number(pTxt);
    if (isNaN(p) || p !== Math.floor(p) || p < 2 || p > pts.length - 1) { return { ok: false, erro: 'O número de hubs p deve ser inteiro de 2 a ' + (pts.length - 1) + '.' }; }
    for (var a = 0; a < pts.length; a++) {
      for (var b = a + 1; b < pts.length; b++) {
        if (pts[a][0] === pts[b][0] && pts[a][1] === pts[b][1]) { return { ok: false, erro: 'Há dois nós na mesma posição (' + pts[a][0] + ', ' + pts[a][1] + ').' }; }
      }
    }
    return { ok: true, pts: pts, p: p };
  }

  var FORNECIDO = [
    '#define MAX_NOS 250',
    'typedef struct tSolucao',
    '{',
    '    int vet_sol[MAX_NOS];   // [num_hub | num_nos - num_hub]: os num_hub primeiros são os hubs',
    '    double fo;',
    '} Solucao;',
    '',
    'int num_nos;                 // quantos nós',
    'int num_hub;                 // quantos hubs (p)',
    'double mat_distancias[MAX_NOS][MAX_NOS];',
    'double mat_custo[MAX_NOS][MAX_NOS];     // global: o calcular_fo escreve aqui',
    'Solucao vizinha;             // global, declarada na main da prova',
    'double alfa = 0.75, beta = 1, lambda = 1;',
    '',
    '// declaradas no prova3.h: são as que VOCÊ implementa',
    'void heuristica_randonica(Solucao& s, int INTER);',
    'void heuristica_MelhorMelhora(Solucao& s);',
    'void heuristica_PrimeiraMelhora(Solucao& s);',
    'void gerar_vizinha(Solucao& s);',
    '',
    '// já prontas: criar_solucao, calcular_fo, escrever_solucao, ler_dados, testar_dados'
  ].join('\n');

  function montar(raiz) {
    var estado = {
      modo: 'pm', ex: 'a', visao: 'jogada', bps: { main: {}, calcular_fo: {}, gerar_vizinha: {} }, codAtual: 'main',
      todos: [], frames: [], vis: [], pos: [], i: 0, timer: null, pts: [], p: 0,
      custom: { texto: '0 0; 40 0; 20 35; 8 14; 33 10; 22 18', p: 3 }
    };
    var modoIni = raiz.getAttribute('data-modo');
    if (modoIni === 'pm' || modoIni === 'mm' || modoIni === 'ra') { estado.modo = modoIni; }
    if (raiz.getAttribute('data-visao') === 'debug') { estado.visao = 'debug'; }

    raiz.innerHTML =
      '<div class="ft-barra">' +
        '<label>Método <select class="js-modo">' +
          '<option value="pm">Primeira melhora</option>' +
          '<option value="mm">Melhor melhora</option>' +
          '<option value="ra">Randômica</option>' +
        '</select></label>' +
        '<label>Visão <select class="js-visao"><option value="jogada">Animação por jogada</option><option value="debug">Debug linha a linha</option></select></label>' +
        '<label>Cenário <select class="js-ex"><option value="a">' + CENARIOS.a.nome + '</option><option value="b">' + CENARIOS.b.nome + '</option><option value="c">Meu cenário (você digita)</option></select></label>' +
        '<button type="button" class="js-meu ft-meu">✎ Criar meu cenário</button>' +
      '</div>' +
      '<div class="ft-custom js-custom" style="display:none">' +
        '<label>Nós (x y), separados por ponto e vírgula <input type="text" class="js-in" size="44" maxlength="200"></label>' +
        '<label>Hubs (p) <input type="text" class="js-p" size="3" maxlength="2"></label>' +
        '<button type="button" class="js-aplicar ft-prim">Aplicar</button>' +
        '<button type="button" class="js-sorteia">🎲 Sortear</button>' +
        '<span class="ft-erro js-erro"></span>' +
        '<div class="ft-dica" style="width:100%;margin:0">De 4 a ' + N.LIM_INTERNO + ' nós; p de 2 até n−1. Cada nó é um par "x y" (a distância é a euclidiana, como em <code>ler_dados</code>). Ex.: <code>0 0; 40 0; 20 35; 8 14; 33 10</code>. Só os cenários pequenos permitem entrar em <code>calcular_fo</code>.</div>' +
      '</div>' +
      '<div class="ft-duas"><div class="ft-col-viz">' +
        '<div class="hb-visual js-visual"></div>' +
        '<div class="hb-legenda js-legenda"></div>' +
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
        '<div class="ft-pilha js-pilha"></div>' +
        '<div class="ft-codigo js-cod"></div>' +
        '<div class="ft-vars js-vars"></div>' +
      '</div></div>' +
      '<div class="ft-botoes">' +
        '<button type="button" class="js-volta">◀ Voltar</button>' +
        '<button type="button" class="js-prox ft-prim">Próximo ▶</button>' +
        '<button type="button" class="js-entra ft-fnbtn" title="Entra no código da função chamada nesta linha">⤵ Entrar na função</button>' +
        '<button type="button" class="js-sai ft-fnbtn" title="Executa o resto da função e volta para quem a chamou">⤴ Sair da função</button>' +
        '<button type="button" class="js-bp">⏩ Continuar até o breakpoint</button>' +
        '<button type="button" class="js-auto">▶▶ Automático</button>' +
        '<button type="button" class="js-reset">↺ Reiniciar</button>' +
        '<label class="ft-vel">Velocidade <select class="js-vel"><option value="3000">Muito lenta</option><option value="2600">Lenta</option><option value="1500" selected>Normal</option><option value="700">Rápida</option><option value="300">Muito rápida</option></select></label>' +
        '<span class="ft-cont js-cont"></span>' +
      '</div>' +
      '<input type="range" class="ft-barra-passos js-passos" min="0" max="0" value="0" aria-label="Passo">' +
      '<div class="ft-dica">Dica: arraste a barra para ir e voltar. Com o foco aqui dentro, as setas do teclado também funcionam: ← → andam, ↓ entra na função, ↑ sai dela.</div>' +
      '<details class="hb-fornecido"><summary>O que o professor já entrega (<code>prova3.h</code> e a <code>main</code>)</summary><pre class="code"><code>' + escapar(FORNECIDO) + '</code></pre>' +
        '<p class="ft-dica">As funções <code>calcular_fo</code> e <code>criar_solucao</code> são dele; aqui a <code>calcular_fo</code> aparece reescrita com os mesmos nomes, as mesmas 5 etapas e o mesmo resultado (conferido contra o arquivo dele). O que você escreve na prova são as 3 heurísticas e a <code>gerar_vizinha</code>.</p></details>' +
      '<div class="ft-tip js-tip" style="display:none"></div>';
    raiz.setAttribute('tabindex', '0');

    function q1(s) { return raiz.querySelector(s); }
    var elModo = q1('.js-modo');
    var elVisao = q1('.js-visao');
    var elEx = q1('.js-ex');
    var elCustom = q1('.js-custom');
    var elIn = q1('.js-in');
    var elP = q1('.js-p');
    var elErro = q1('.js-erro');
    var elVisual = q1('.js-visual');
    var elLegenda = q1('.js-legenda');
    var elFoA = q1('.js-foa');
    var elFoV = q1('.js-fov');
    var elMsg = q1('.js-msg');
    var elLog = q1('.js-log');
    var elCod = q1('.js-cod');
    var elVars = q1('.js-vars');
    var elPilha = q1('.js-pilha');
    var elCodT = q1('.ft-cod-t');
    var elTip = q1('.js-tip');
    var elVolta = q1('.js-volta');
    var elProx = q1('.js-prox');
    var elEntra = q1('.js-entra');
    var elSai = q1('.js-sai');
    var elAuto = q1('.js-auto');
    var elVel = q1('.js-vel');
    var elCont = q1('.js-cont');
    var elBarra = q1('.js-passos');
    var linhasEl = [];
    var celulas = { s: [], v: [] };
    var elStrips = {};
    elModo.value = estado.modo;
    elVisao.value = estado.visao;
    elIn.value = estado.custom.texto;
    elP.value = String(estado.custom.p);

    function cenario() {
      if (estado.ex === 'c') {
        var r = lerCenario(estado.custom.texto, estado.custom.p);
        return { pts: r.pts, p: r.p };
      }
      return CENARIOS[estado.ex];
    }

    /* ---------- parte visual: mapa dos nós e vetor vet_sol ---------- */
    function montarVisual() {
      var n = estado.pts.length;
      elVisual.innerHTML = '<svg class="hb-mapa js-mapa" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet"></svg>' +
        '<div class="hb-tiras js-tiras"></div>';
      var elT = elVisual.querySelector('.js-tiras');
      elStrips = {};
      var nomes = { s: 's.vet_sol', v: 'vizinha.vet_sol' };
      var chaves = ['s', 'v'];
      for (var c = 0; c < chaves.length; c++) {
        var ch = chaves[c];
        var tira = document.createElement('div');
        tira.className = 'hb-tira';
        tira.innerHTML = '<span class="hb-tira-rot">' + nomes[ch] + '</span><span class="hb-rot-hubs">hubs</span><span class="hb-rot-nao">não-hubs</span>';
        celulas[ch] = [];
        for (var k = 0; k < n; k++) {
          var cel = document.createElement('div');
          cel.className = 'hb-cel';
          cel.textContent = k;
          tira.appendChild(cel);
          celulas[ch].push(cel);
        }
        elT.appendChild(tira);
        elStrips[ch] = tira;
      }
    }

    function mapaSvg(q) {
      var pts = estado.pts;
      var p = estado.p;
      var n = pts.length;
      var vet = q.vetV || q.vetS;
      var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
      var i;
      for (i = 0; i < n; i++) {
        if (pts[i][0] < minx) { minx = pts[i][0]; }
        if (pts[i][0] > maxx) { maxx = pts[i][0]; }
        if (pts[i][1] < miny) { miny = pts[i][1]; }
        if (pts[i][1] > maxy) { maxy = pts[i][1]; }
      }
      var W = 400, H = 250, pd = 28;
      var sx = (W - 2 * pd) / Math.max(maxx - minx, 1e-9);
      var sy = (H - 2 * pd) / Math.max(maxy - miny, 1e-9);
      var sc = Math.min(sx, sy);
      var offx = (W - sc * (maxx - minx)) / 2;
      var offy = (H - sc * (maxy - miny)) / 2;
      function X(v) { return offx + (pts[v][0] - minx) * sc; }
      function Y(v) { return H - (offy + (pts[v][1] - miny) * sc); }
      var isHub = {};
      for (i = 0; i < p; i++) { isHub[vet[i]] = true; }
      var s = '';
      var a, b;
      for (a = 0; a < p; a++) {
        for (b = a + 1; b < p; b++) {
          s += '<line x1="' + X(vet[a]) + '" y1="' + Y(vet[a]) + '" x2="' + X(vet[b]) + '" y2="' + Y(vet[b]) + '" stroke="#93c5fd" stroke-width="2.5"/>';
        }
      }
      for (i = p; i < n; i++) {
        var near = vet[0];
        var nd = Infinity;
        for (a = 0; a < p; a++) {
          var dd = Math.pow(pts[vet[i]][0] - pts[vet[a]][0], 2) + Math.pow(pts[vet[i]][1] - pts[vet[a]][1], 2);
          if (dd < nd) { nd = dd; near = vet[a]; }
        }
        s += '<line x1="' + X(vet[i]) + '" y1="' + Y(vet[i]) + '" x2="' + X(near) + '" y2="' + Y(near) + '" stroke="#cbd5e1" stroke-width="1.5"/>';
      }
      if (q.worst) {
        s += '<line x1="' + X(q.worst[0]) + '" y1="' + Y(q.worst[0]) + '" x2="' + X(q.worst[1]) + '" y2="' + Y(q.worst[1]) + '" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 4"/>';
      }
      var cor = COR_TIPO[q.tipo];
      for (var z = 0; z < q.movs.length; z++) {
        var nodo = vet[q.movs[z]];
        if (cor) { s += '<circle cx="' + X(nodo) + '" cy="' + Y(nodo) + '" r="17" fill="none" stroke="' + cor + '" stroke-width="3.5"/>'; }
      }
      for (i = 0; i < n; i++) {
        var cx = X(i), cy = Y(i);
        if (isHub[i]) {
          s += '<rect x="' + (cx - 10) + '" y="' + (cy - 10) + '" width="20" height="20" rx="3" fill="#2563eb"/>';
          s += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + i + '</text>';
        } else {
          s += '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#94a3b8"/>';
          s += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + i + '</text>';
        }
      }
      return s;
    }

    function desenharTira(ch, vet, q) {
      var tira = elStrips[ch];
      if (!vet) { tira.style.display = 'none'; return; }
      tira.style.display = 'block';
      var n = estado.pts.length;
      var p = estado.p;
      var larg = tira.clientWidth - 110;
      var cw = larg / n;
      if (cw > 48) { cw = 48; }
      if (cw < 18) { cw = 18; }
      var gap = 12;
      for (var idx = 0; idx < n; idx++) {
        var nodo = vet[idx];
        var cel = celulas[ch][nodo];
        var x = 96 + idx * cw;
        if (idx >= p) { x += gap; }
        cel.style.left = x + 'px';
        cel.style.width = (cw - 3) + 'px';
        var cls = 'hb-cel';
        if (idx < p) { cls += ' hb-cel-hub'; }
        for (var z = 0; z < q.movs.length; z++) {
          if (q.movs[z] === idx && SEM_TIPO[q.tipo]) { cls += ' ' + SEM_TIPO[q.tipo]; }
        }
        cel.className = cls;
      }
      var rh = tira.querySelector('.hb-rot-hubs');
      var rn = tira.querySelector('.hb-rot-nao');
      rh.style.left = '96px';
      rh.style.width = (p * cw - 3) + 'px';
      rn.style.left = (96 + p * cw + gap) + 'px';
      rn.style.width = ((n - p) * cw - 3) + 'px';
    }

    /* ---------- código ---------- */
    function codigoAtual() {
      var id = estado.codAtual;
      if (id === 'main') { return N.LISTAS[estado.modo].txt; }
      return N.LISTAS[id].txt;
    }
    function montarCodigo() {
      var cod = codigoAtual();
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
        h += '<div class="ft-ln"><i data-l="' + i + '" title="Clique para criar ou tirar um breakpoint">' + pad(i + 1) + '</i><span class="ft-seta"></span><code>' + colorir(parteCod) + parteCm + '</code></div>';
      }
      elCod.innerHTML = h;
      linhasEl = elCod.children;
    }

    /* ---------- desenhar um passo ---------- */
    function desenhar() {
      var q = estado.frames[estado.i];
      var nivelQ = q.nivel || 0;
      elVisual.querySelector('.js-mapa').innerHTML = mapaSvg(q);
      desenharTira('s', q.vetS, q);
      desenharTira('v', q.vetV, q);
      var vetMostrado = q.vetV || q.vetS;
      var hubs = vetMostrado.slice(0, estado.p);
      var leg = 'Hubs agora (nós): <b>' + hubs.join(', ') + '</b>';
      if (q.worst) { leg += ' · a linha vermelha tracejada liga o par de nós que define a FO: <b>' + q.worst[0] + '</b> e <b>' + q.worst[1] + '</b>'; }
      elLegenda.innerHTML = leg;
      elFoA.textContent = numFmt(q.ref);
      if (q.tipo === 'teste' && q.fov !== '-' && q.fo !== undefined) {
        elFoV.textContent = numFmt(q.fo);
      } else {
        elFoV.textContent = '-';
      }
      elMsg.innerHTML = q.msg;
      elVars.innerHTML = htmlVars(q);
      elTip.style.display = 'none';
      if (estado.visao === 'debug') {
        raiz.className = raiz.className.replace(' ft-debug', '') + ' ft-debug';
      } else {
        raiz.className = raiz.className.replace(' ft-debug', '');
      }
      var codQ = q.cod || 'main';
      if (codQ !== estado.codAtual) {
        estado.codAtual = codQ;
        montarCodigo();
      }
      var bpsC = estado.bps[codQ] || {};
      if (nivelQ > 0) {
        elCodT.innerHTML = 'Código de <b>' + codQ + '</b> (você está dentro da função)';
        elCod.className = 'ft-codigo js-cod ft-dentro';
        elPilha.innerHTML = '<b>Pilha de chamadas:</b> ' + q.chamada.de + ' (linha ' + q.chamada.linha + ') → <b>' + codQ + '</b>. Aqui, <code>s</code> é a ' + (q.chamada.passado === 'vizinha' ? '<code>vizinha</code> (a cópia)' : 'solução <code>s</code> do chamador') + '.';
        elPilha.style.display = 'block';
      } else {
        elCodT.innerHTML = 'Código executando (a linha amarela é a que está rodando agora)';
        elCod.className = 'ft-codigo js-cod';
        elPilha.style.display = 'none';
      }
      for (var li = 0; li < linhasEl.length; li++) {
        var ativa = (q.ln.indexOf(li) >= 0);
        linhasEl[li].className = linhasEl[li].className.replace(' ft-on', '').replace(' ft-bp', '');
        if (ativa) { linhasEl[li].className += ' ft-on'; }
        if (bpsC[li]) { linhasEl[li].className += ' ft-bp'; }
        var seta = linhasEl[li].querySelector('.ft-seta');
        if (ativa && li === q.ln[q.ln.length - 1]) { seta.textContent = '▶'; } else { seta.textContent = ''; }
      }
      if (q.ln.length > 0 && linhasEl[q.ln[0]]) {
        var alvo = linhasEl[q.ln[0]].offsetTop - 60;
        if (alvo < 0) { alvo = 0; }
        elCod.scrollTop = alvo;
      }
      var posQ = estado.pos[estado.i];
      if (nivelQ > 0) {
        elCont.textContent = 'Dentro de ' + codQ + ' · passo interno ' + q.k + ' de ' + q.totalInterno + ' (chamada no passo ' + (posQ + 1) + ' de ' + estado.vis.length + ')';
      } else {
        elCont.textContent = 'Passo ' + (posQ + 1) + ' de ' + estado.vis.length;
      }
      elBarra.max = estado.vis.length - 1;
      elBarra.value = posQ;
      elVolta.disabled = (estado.i === 0);
      elProx.disabled = (idxProx(estado.i) === estado.i);
      elEntra.disabled = !(nivelQ === 0 && estado.i + 1 < estado.frames.length && (estado.frames[estado.i + 1].nivel || 0) > 0);
      elSai.disabled = (nivelQ === 0);
      var html = '';
      for (var j = 0; j <= estado.i; j++) {
        if (estado.frames[j].log) { html += '<div>' + estado.frames[j].log + '</div>'; }
      }
      if (html === '') { html = '<div class="ft-vazio">Os testes aparecem aqui.</div>'; }
      elLog.innerHTML = html;
      elLog.scrollTop = elLog.scrollHeight;
    }

    /* ---------- navegação ---------- */
    function idxProx(i) {
      var ult = estado.frames.length - 1;
      if (i >= ult) { return ult; }
      if ((estado.frames[i].nivel || 0) > 0) { return i + 1; }
      var j = i + 1;
      while (j < ult && (estado.frames[j].nivel || 0) > 0) { j++; }
      return j;
    }
    function idxAnt(i) {
      if (i <= 0) { return 0; }
      if ((estado.frames[i].nivel || 0) > 0) { return i - 1; }
      var j = i - 1;
      while (j > 0 && (estado.frames[j].nivel || 0) > 0) { j--; }
      return j;
    }
    function idxSai(i) {
      var ult = estado.frames.length - 1;
      var j = i + 1;
      while (j < ult && (estado.frames[j].nivel || 0) > 0) { j++; }
      return j;
    }
    function avancar() {
      var j = idxProx(estado.i);
      if (j !== estado.i) { estado.i = j; desenhar(); }
    }
    function recuar() {
      var j = idxAnt(estado.i);
      if (j !== estado.i) { estado.i = j; desenhar(); }
    }
    function entrar() {
      if (!elEntra.disabled) { estado.i = estado.i + 1; desenhar(); } else { avancar(); }
    }
    function sair() {
      if ((estado.frames[estado.i].nivel || 0) > 0) { estado.i = idxSai(estado.i); desenhar(); } else { avancar(); }
    }
    function indexar() {
      estado.vis = [];
      estado.pos = [];
      var ultimaPos = -1;
      var cont = {};
      var i;
      for (i = 0; i < estado.frames.length; i++) {
        var f = estado.frames[i];
        if ((f.nivel || 0) === 0) {
          estado.vis.push(i);
          ultimaPos = estado.vis.length - 1;
          estado.pos.push(ultimaPos);
        } else {
          estado.pos.push(ultimaPos);
          if (cont[ultimaPos] === undefined) { cont[ultimaPos] = 0; }
          cont[ultimaPos]++;
          f.k = cont[ultimaPos];
        }
      }
      for (i = 0; i < estado.frames.length; i++) {
        if ((estado.frames[i].nivel || 0) > 0) { estado.frames[i].totalInterno = cont[estado.pos[i]]; }
      }
    }
    function parar() {
      if (estado.timer) { clearInterval(estado.timer); }
      estado.timer = null;
      elAuto.textContent = '▶▶ Automático';
    }

    function recomecar() {
      parar();
      var c = cenario();
      estado.pts = c.pts;
      estado.p = c.p;
      var semente = N.escolherInicio(c.pts, c.p);
      estado.todos = N.gerarTrace(c.pts, c.p, semente, estado.modo);
      if (estado.visao === 'jogada') {
        estado.frames = [];
        for (var i = 0; i < estado.todos.length; i++) {
          if (estado.todos[i].marco && (estado.todos[i].nivel || 0) === 0) { estado.frames.push(estado.todos[i]); }
        }
      } else {
        estado.frames = estado.todos;
      }
      estado.i = 0;
      estado.codAtual = 'main';
      indexar();
      montarVisual();
      montarCodigo();
      desenhar();
    }

    function mostrarCustom() {
      if (estado.ex === 'c') { elCustom.style.display = 'flex'; } else { elCustom.style.display = 'none'; }
    }
    function aplicarCustom() {
      var r = lerCenario(elIn.value, elP.value);
      if (!r.ok) { elErro.textContent = r.erro; return; }
      elErro.textContent = '';
      estado.custom.texto = elIn.value;
      estado.custom.p = r.p;
      recomecar();
    }

    /* ---------- eventos ---------- */
    elModo.addEventListener('change', function (e) { estado.modo = e.target.value; estado.bps = { main: {}, calcular_fo: {}, gerar_vizinha: {} }; recomecar(); });
    elVisao.addEventListener('change', function (e) { estado.visao = e.target.value; recomecar(); });
    elEx.addEventListener('change', function (e) {
      estado.ex = e.target.value;
      mostrarCustom();
      if (estado.ex === 'c') { aplicarCustom(); } else { elErro.textContent = ''; recomecar(); }
    });
    q1('.js-meu').addEventListener('click', function () {
      elEx.value = 'c';
      estado.ex = 'c';
      mostrarCustom();
      aplicarCustom();
      elIn.focus();
      elIn.select();
    });
    q1('.js-aplicar').addEventListener('click', aplicarCustom);
    elIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { aplicarCustom(); } });
    elP.addEventListener('keydown', function (e) { if (e.key === 'Enter') { aplicarCustom(); } });
    q1('.js-sorteia').addEventListener('click', function () {
      var n = 5 + Math.floor(Math.random() * 2);
      var lista = [];
      var usados = {};
      while (lista.length < n) {
        var x = Math.floor(Math.random() * 100);
        var y = Math.floor(Math.random() * 100);
        if (!usados[x + ',' + y]) { usados[x + ',' + y] = true; lista.push(x + ' ' + y); }
      }
      elIn.value = lista.join('; ');
      elP.value = String(2 + Math.floor(Math.random() * 2));
      aplicarCustom();
    });
    q1('.js-reset').addEventListener('click', recomecar);
    elProx.addEventListener('click', function () { parar(); avancar(); });
    elVolta.addEventListener('click', function () { parar(); recuar(); });
    elEntra.addEventListener('click', function () { parar(); entrar(); });
    elSai.addEventListener('click', function () { parar(); sair(); });
    elBarra.addEventListener('input', function () {
      parar();
      estado.i = estado.vis[Number(elBarra.value)];
      desenhar();
    });
    function ligarAuto() {
      if (estado.i === estado.frames.length - 1) { estado.i = 0; desenhar(); }
      elAuto.textContent = '⏸ Pausar';
      estado.timer = setInterval(function () {
        var j = idxProx(estado.i);
        if (j !== estado.i) { estado.i = j; desenhar(); } else { parar(); }
      }, Number(elVel.value));
    }
    elAuto.addEventListener('click', function () { if (estado.timer) { parar(); } else { ligarAuto(); } });
    elVel.addEventListener('change', function () { if (estado.timer) { parar(); ligarAuto(); } });
    raiz.addEventListener('keydown', function (e) {
      var alvo = e.target.tagName;
      if (alvo === 'INPUT' || alvo === 'SELECT' || alvo === 'TEXTAREA') { return; }
      if (e.key === 'ArrowRight') { parar(); avancar(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { parar(); recuar(); e.preventDefault(); }
      if (e.key === 'ArrowDown') { parar(); entrar(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { parar(); sair(); e.preventDefault(); }
    });
    function temBreakpoint(q) {
      for (var z = 0; z < q.ln.length; z++) {
        var bc = estado.bps[q.cod || 'main'];
        if (bc && bc[q.ln[z]]) { return true; }
      }
      return false;
    }
    q1('.js-bp').addEventListener('click', function () {
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
        var bc2 = estado.bps[estado.codAtual];
        if (bc2[l]) { delete bc2[l]; } else { bc2[l] = true; }
        desenhar();
      }
    });
    elCod.addEventListener('mouseover', function (e) {
      var alvo = e.target;
      if (!alvo.classList || !alvo.classList.contains('ft-tok')) { return; }
      var nome = alvo.getAttribute('data-n');
      var q = estado.frames[estado.i];
      var html;
      if (estado.visao !== 'debug') {
        html = 'Para ver o valor de <b>' + nome + '</b> neste ponto, troque a <b>Visão</b> para <i>Debug linha a linha</i>.';
      } else {
        var val = valorToken(nome, q.dv);
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
    window.addEventListener('resize', function () { if (estado.frames.length) { desenhar(); } });

    recomecar();
  }

  for (var r = 0; r < raizes.length; r++) { montar(raizes[r]); }
})();
