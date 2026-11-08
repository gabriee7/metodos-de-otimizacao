/* Visualização do problema "escolher exatamente k itens" (movimento de TROCA:
   um item sai, outro entra). Mesmo molde dos hubs (p hubs entre n nós) e da
   seleção de k itens. Uso: <div class="card troca" data-modo="pm"></div>
   Modos: pm, mm, flip (armadilha de virar um item só). Sem dependências. */
(function () {
  var raizes = document.querySelectorAll('.troca');
  if (!raizes.length) { return; }

  var VALORES = [4, 9, 3, 7, 5, 8];
  var K = 3;
  var CORES = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777'];

  function soma(sel) {
    var s = 0;
    for (var i = 0; i < sel.length; i++) {
      if (sel[i]) { s += VALORES[i]; }
    }
    return s;
  }
  function conta(sel) {
    var c = 0;
    for (var i = 0; i < sel.length; i++) {
      if (sel[i]) { c++; }
    }
    return c;
  }
  function trocar(sel, i, j) {
    var v = sel.slice();
    v[i] = false;
    v[j] = true;
    return v;
  }
  function veredito(f, base) {
    if (f > base) { return '<b style="color:#16a34a">' + f + ' &gt; ' + base + ': melhorou (aqui MAIOR é melhor).</b>'; }
    if (f === base) { return '<b style="color:#dc2626">' + f + ' = ' + base + ': empate, e empate não conta.</b>'; }
    return '<b style="color:#dc2626">' + f + ' &lt; ' + base + ': piorou.</b>';
  }
  function inicial() {
    var s = [];
    for (var i = 0; i < VALORES.length; i++) { s.push(i < K); }
    return s;
  }

  /* listagens do código (a linha amarela acompanha o passo) */
  var LST = {
    pm: [
      'void primeira_melhora(Solucao& s) {',
      '  INICIO: ;',
      '  double fo_orig = s.fo;',
      '  for (int i = 0; i < n; i++) {',
      '    if (!s.dentro[i]) continue;      // i precisa estar dentro',
      '    for (int j = 0; j < n; j++) {',
      '      if (s.dentro[j]) continue;     // j precisa estar fora',
      '      s.dentro[i] = 0; s.dentro[j] = 1;   // TROCA',
      '      calcular_fo(s);',
      '      if (s.fo > fo_orig) {          // aqui MAIOR é melhor',
      '        goto INICIO;                 // fica e recomeça',
      '      }',
      '      s.dentro[i] = 1; s.dentro[j] = 0;   // desfaz',
      '      s.fo = fo_orig;',
      '    }',
      '  }',
      '}'
    ],
    mm: [
      'void melhor_melhora(Solucao& s) {',
      '  INICIO: ;',
      '  double fo_orig = s.fo, melhor_fo = s.fo;',
      '  int melhor_i = -1, melhor_j = -1;',
      '  for (int i = 0; i < n; i++) {',
      '    if (!s.dentro[i]) continue;',
      '    for (int j = 0; j < n; j++) {',
      '      if (s.dentro[j]) continue;',
      '      s.dentro[i] = 0; s.dentro[j] = 1;   // TROCA',
      '      calcular_fo(s);',
      '      if (s.fo > melhor_fo) {        // compara com o melhor',
      '        melhor_fo = s.fo; melhor_i = i; melhor_j = j;',
      '      }',
      '      s.dentro[i] = 1; s.dentro[j] = 0;   // SEMPRE desfaz',
      '      s.fo = fo_orig;',
      '    }',
      '  }',
      '  if (melhor_i != -1) {              // achou alguma melhora',
      '    s.dentro[melhor_i] = 0; s.dentro[melhor_j] = 1;',
      '    s.fo = melhor_fo;',
      '    goto INICIO;',
      '  }',
      '}'
    ],
    flip: [
      '// itens 0, 1, 2 dentro; K = 3',
      's.dentro[3] = 1;                  // vira SÓ o item 3',
      'if (contar(s) != K) desfaz();     // 4 dentro: inviável',
      's.dentro[0] = 0;                  // vira SÓ o item 0',
      'if (contar(s) != K) desfaz();     // 2 dentro: inviável',
      's.dentro[2] = 0; s.dentro[3] = 1; // TROCA: sai 2, entra 3',
      '// contar(s) == K sempre: viável'
    ]
  };
  var LN = {
    pm: { inicio: 0, rodada: 2, teste: 9, aceita: 10, desfaz: 12, fim: 16 },
    mm: { inicio: 0, rodada: 2, teste: 10, novo: 11, desfaz: 13, aceita: 17, fim: 20 }
  };
  function escapar(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function pintar(txt) {
    var c = txt.indexOf('//');
    if (c < 0) { return escapar(txt); }
    return escapar(txt.slice(0, c)) + '<span class="ft-cm">' + escapar(txt.slice(c)) + '</span>';
  }

  function gerar(modo) {
    var n = VALORES.length;
    var q = [];
    var sel = inicial();
    var L = LN[modo];
    q.push({ tipo: 'inicio', ln: L.inicio, sel: sel.slice(), movs: [], fo: soma(sel), ref: soma(sel),
      msg: 'Escolho <b>exatamente ' + K + ' itens</b> para ficar "dentro". Começo com os itens 0, 1 e 2: soma = <b>' + soma(sel) + '</b>. Objetivo: <b>maximizar</b> a soma. O movimento é uma <b>troca</b>: um item sai e um entra.' });

    var rodada = 0;
    var melhorou = true;
    while (melhorou) {
      melhorou = false;
      rodada++;
      var atual = soma(sel);
      q.push({ tipo: 'rodada', ln: L.rodada, sel: sel.slice(), movs: [], fo: atual, ref: atual,
        msg: '<b>Rodada ' + rodada + '.</b> Soma atual = <b>' + atual + '</b>. Vou testar trocar cada item de dentro por cada item de fora (' + K + ' × ' + (n - K) + ' = ' + (K * (n - K)) + ' vizinhas).' });
      var melhorFO = atual;
      var melhorI = -1;
      var melhorJ = -1;

      for (var i = 0; i < n; i++) {
        if (!sel[i]) { continue; }
        for (var j = 0; j < n; j++) {
          if (sel[j]) { continue; }
          if (modo === 'pm' && melhorou) { continue; }
          var v = trocar(sel, i, j);
          var f = soma(v);
          var base = atual;
          var txtBase = 'a soma atual (' + atual + ')';
          if (modo === 'mm') {
            base = melhorFO;
            txtBase = 'o melhor visto até agora (' + melhorFO + ')';
          }
          q.push({ tipo: 'teste', ln: L.teste, sel: v, movs: [i, j], fo: f, ref: atual,
            msg: 'Testo <b>tirar o item ' + i + '</b> (valor ' + VALORES[i] + ') e <b>pôr o item ' + j + '</b> (valor ' + VALORES[j] + '). Continuam ' + K + ' dentro. Soma da vizinha = <b>' + f + '</b>. Comparo com ' + txtBase + ': ' + veredito(f, base) });
          var melhor = (f > base);
          if (modo === 'pm') {
            if (melhor) {
              q.push({ tipo: 'aceita', ln: L.aceita, sel: v.slice(), movs: [i, j], fo: f, ref: f,
                log: 'Rodada ' + rodada + ' · sai ' + i + ', entra ' + j + ' → ' + f + ' · <b style="color:#16a34a">aceita</b>',
                msg: '<b>Melhorou, fico com ela</b> e paro de procurar. Recomeço a varredura daqui.' });
              sel = v;
              melhorou = true;
            } else {
              q.push({ tipo: 'desfaz', ln: L.desfaz, sel: sel.slice(), movs: [i, j], fo: atual, ref: atual,
                log: 'Rodada ' + rodada + ' · sai ' + i + ', entra ' + j + ' → ' + f + ' · desfaz',
                msg: 'Não melhorou: <b>desfaço</b> (o item ' + i + ' volta para dentro, o ' + j + ' volta para fora).' });
            }
          } else {
            var novo = '';
            if (melhor) {
              melhorFO = f;
              melhorI = i;
              melhorJ = j;
              novo = ' · <b style="color:#16a34a">novo melhor</b>';
            }
            var resumo = 'ainda nenhuma melhora encontrada';
            if (melhorI >= 0) { resumo = 'melhor até agora: sai ' + melhorI + ', entra ' + melhorJ + ' (soma ' + melhorFO + ')'; }
            q.push({ tipo: 'desfaz', ln: (melhor ? L.novo : L.desfaz), sel: sel.slice(), movs: [i, j], fo: atual, ref: atual,
              log: 'Rodada ' + rodada + ' · sai ' + i + ', entra ' + j + ' → ' + f + novo,
              msg: 'Na melhor melhora eu <b>sempre desfaço</b> e só anoto. Placar: ' + resumo + '.' });
          }
        }
      }
      if (modo === 'mm' && melhorI >= 0) {
        var viz = trocar(sel, melhorI, melhorJ);
        q.push({ tipo: 'aceita', ln: L.aceita, sel: viz.slice(), movs: [melhorI, melhorJ], fo: melhorFO, ref: melhorFO,
          log: 'Rodada ' + rodada + ' · aplica: sai ' + melhorI + ', entra ' + melhorJ + ' (soma ' + melhorFO + ')',
          msg: 'Olhei as ' + (K * (n - K)) + ' vizinhas. Aplico <b>só a melhor</b>: sai o item ' + melhorI + ', entra o ' + melhorJ + '. Soma = <b>' + melhorFO + '</b>.' });
        sel = viz;
        melhorou = true;
      }
    }
    q.push({ tipo: 'fim', ln: L.fim, sel: sel.slice(), movs: [], fo: soma(sel), ref: soma(sel),
      log: 'Rodada ' + rodada + ' · nenhuma troca melhora',
      msg: '<b>Fim.</b> Nenhuma troca melhora a soma: <b>ótimo local</b>. Soma final = <b>' + soma(sel) + '</b>. (Os 3 maiores valores são 9, 8 e 7 = 24; confira se foi isso que você obteve.)' });
    return q;
  }

  /* armadilha: virar um item só quebra o "exatamente k" */
  function gerarFlip() {
    var q = [];
    var sel = inicial();
    q.push({ tipo: 'inicio', ln: 0, sel: sel.slice(), movs: [], fo: soma(sel), ref: soma(sel),
      msg: 'Mesma situação: itens 0, 1, 2 dentro, soma ' + soma(sel) + ', e o enunciado exige <b>exatamente ' + K + '</b> dentro. Vamos ver o que acontece se o movimento for <b>virar um item só</b> (como se fosse 0/1).' });
    var v = sel.slice();
    v[3] = true;
    q.push({ tipo: 'invalida', ln: 2, sel: v, movs: [3], fo: soma(v), ref: soma(sel),
      msg: 'Viro só o <b>item 3</b> para dentro. A soma sobe para <b>' + soma(v) + '</b>, parece ótimo! Mas agora há <b>' + conta(v) + ' itens dentro</b>, e o enunciado pede exatamente ' + K + '. <b style="color:#dc2626">Solução inviável.</b> Uma busca que aceitasse isso entregaria uma resposta inválida (nota zero na questão).' });
    q.push({ tipo: 'desfaz', ln: 2, sel: sel.slice(), movs: [3], fo: soma(sel), ref: soma(sel),
      log: 'Virar só o item 3 → ' + soma(v) + ' mas ' + conta(v) + ' dentro · <b style="color:#dc2626">inviável</b>',
      msg: 'Descarto. O mesmo vale ao virar um item de dentro para fora:' });
    var w = sel.slice();
    w[0] = false;
    q.push({ tipo: 'invalida', ln: 3, sel: w, movs: [0], fo: soma(w), ref: soma(sel),
      msg: 'Viro só o <b>item 0</b> para fora. Agora há <b>' + conta(w) + ' itens dentro</b>. <b style="color:#dc2626">Também inviável.</b>' });
    q.push({ tipo: 'desfaz', ln: 4, sel: sel.slice(), movs: [0], fo: soma(sel), ref: soma(sel),
      log: 'Virar só o item 0 → ' + conta(w) + ' dentro · <b style="color:#dc2626">inviável</b>',
      msg: 'Descarto de novo. Qual movimento nunca estraga a contagem?' });
    var t = trocar(sel, 2, 3);
    q.push({ tipo: 'teste', ln: 5, sel: t, movs: [2, 3], fo: soma(t), ref: soma(sel),
      msg: 'A <b>troca</b>: tiro o item 2 e ponho o item 3 <u>ao mesmo tempo</u>. Continuam <b>' + conta(t) + '</b> dentro. Soma = ' + soma(t) + '. <b style="color:#16a34a">Sempre viável.</b>' });
    q.push({ tipo: 'fim', ln: 6, sel: t.slice(), movs: [], fo: soma(t), ref: soma(t),
      log: 'Troca (sai 2, entra 3) → ' + soma(t) + ' · viável',
      msg: '<b>Regra para a prova:</b> se o enunciado diz "exatamente k" (ou "exatamente p"), o movimento é uma <b>troca</b>: um sai e um entra. Virar um só item quebra a contagem.' });
    return q;
  }

  function montar(raiz) {
    var estado = { modo: 'pm', frames: [], i: 0, timer: null };
    var modoIni = raiz.getAttribute('data-modo');
    if (modoIni === 'pm' || modoIni === 'mm' || modoIni === 'flip') { estado.modo = modoIni; }

    raiz.innerHTML =
      '<div class="ft-barra">' +
        '<label>Método <select class="js-modo">' +
          '<option value="pm">Primeira melhora</option>' +
          '<option value="mm">Melhor melhora</option>' +
          '<option value="flip">Armadilha: virar um item só</option>' +
        '</select></label>' +
        '<span class="ft-dica" style="margin:0">Itens com valores ' + VALORES.join(', ') + ' · escolher exatamente ' + K + ' · maximizar a soma</span>' +
      '</div>' +
      '<div class="ft-duas">' +
      '<div class="ft-col-viz">' +
      '<div class="ft-palco js-palco"></div>' +
      '<div class="ft-placar">' +
        '<div><span>Soma dentro (FO)</span><b class="js-foa">-</b></div>' +
        '<div><span>Soma da vizinha testada</span><b class="js-fov">-</b></div>' +
        '<div><span>Itens dentro (precisa ser ' + K + ')</span><b class="js-cnt">-</b></div>' +
      '</div>' +
      '<div class="ft-msg js-msg"></div>' +
      '<div class="ft-botoes">' +
        '<button type="button" class="js-volta">◀ Voltar</button>' +
        '<button type="button" class="js-prox ft-prim">Próximo ▶</button>' +
        '<button type="button" class="js-auto">▶▶ Automático</button>' +
        '<button type="button" class="js-reset">↺ Reiniciar</button>' +
        '<label class="ft-vel">Velocidade <select class="js-vel"><option value="2600">Lenta</option><option value="1500" selected>Normal</option><option value="700">Rápida</option></select></label>' +
        '<span class="ft-cont js-cont"></span>' +
      '</div>' +
      '<input type="range" class="ft-barra-passos js-passos" min="0" max="0" value="0" aria-label="Passo">' +
      '<div class="ft-dica">Dica: arraste a barra para ir e voltar. Com o foco aqui dentro, as setas ← → do teclado também funcionam.</div>' +
      '<div class="ft-log-t">Histórico dos testes</div>' +
      '<div class="ft-log js-log"></div>' +
      '</div>' +
      '<div class="ft-col-cod">' +
        '<div class="ft-cod-t">Código executando (a linha amarela é a que está rodando agora)</div>' +
        '<div class="ft-codigo js-cod"></div>' +
      '</div>' +
      '</div>';
    raiz.setAttribute('tabindex', '0');

    var elModo = raiz.querySelector('.js-modo');
    var elPalco = raiz.querySelector('.js-palco');
    var elMsg = raiz.querySelector('.js-msg');
    var elFoA = raiz.querySelector('.js-foa');
    var elFoV = raiz.querySelector('.js-fov');
    var elCnt = raiz.querySelector('.js-cnt');
    var elCont = raiz.querySelector('.js-cont');
    var elLog = raiz.querySelector('.js-log');
    var elAuto = raiz.querySelector('.js-auto');
    var elBarra = raiz.querySelector('.js-passos');
    var elVel = raiz.querySelector('.js-vel');
    var elVolta = raiz.querySelector('.js-volta');
    var elProx = raiz.querySelector('.js-prox');
    var elCod = raiz.querySelector('.js-cod');
    var linhasEl = [];
    var blocos = [];
    elModo.value = estado.modo;

    function montarCodigo() {
      var lst = LST[estado.modo];
      var h = '';
      for (var k = 0; k < lst.length; k++) {
        var num = String(k + 1);
        while (num.length < 2) { num = ' ' + num; }
        h += '<div class="ft-ln"><i>' + num + '</i><span class="ft-seta"></span><code>' + pintar(lst[k]) + '</code></div>';
      }
      elCod.innerHTML = h;
      linhasEl = elCod.children;
    }
    function destacar(ln) {
      for (var k = 0; k < linhasEl.length; k++) {
        var on = (k === ln);
        linhasEl[k].className = on ? 'ft-ln ft-on' : 'ft-ln';
        linhasEl[k].children[1].textContent = on ? '▶' : '';
      }
      if (linhasEl[ln]) {
        var alvo = linhasEl[ln].offsetTop - elCod.clientHeight / 2;
        elCod.scrollTop = alvo > 0 ? alvo : 0;
      }
    }

    function montarPalco() {
      elPalco.innerHTML = '';
      blocos = [];
      var rotulos = ['Dentro', 'Fora'];
      for (var m = 0; m < 2; m++) {
        var fita = document.createElement('div');
        fita.className = 'ft-fita';
        fita.style.top = (m * 74 + 6) + 'px';
        fita.innerHTML = '<span class="ft-rot">' + rotulos[m] + '</span>';
        elPalco.appendChild(fita);
      }
      for (var i = 0; i < VALORES.length; i++) {
        var b = document.createElement('div');
        b.className = 'ft-bloco';
        b.style.background = CORES[i];
        b.innerHTML = '<b>Item ' + i + '</b><i>valor ' + VALORES[i] + '</i>';
        elPalco.appendChild(b);
        blocos.push(b);
      }
    }

    function desenhar() {
      var q = estado.frames[estado.i];
      var n = VALORES.length;
      var larg = (elPalco.clientWidth - 110) / n;
      if (larg > 72) { larg = 72; }
      var x = [100, 100];
      for (var i = 0; i < n; i++) {
        var m = 1;
        if (q.sel[i]) { m = 0; }
        var b = blocos[i];
        b.style.width = (larg - 6) + 'px';
        b.style.left = x[m] + 'px';
        b.style.top = (m * 74 + 14) + 'px';
        x[m] += larg;
        var cls = 'ft-bloco';
        var marcado = false;
        for (var z = 0; z < q.movs.length; z++) {
          if (q.movs[z] === i) { marcado = true; }
        }
        if (marcado) {
          if (q.tipo === 'teste') { cls += ' ft-teste'; }
          if (q.tipo === 'aceita') { cls += ' ft-ok'; }
          if (q.tipo === 'desfaz' || q.tipo === 'invalida') { cls += ' ft-volta'; }
        }
        b.className = cls;
      }
      elFoA.textContent = q.ref;
      if (q.tipo === 'teste' || q.tipo === 'invalida') {
        elFoV.textContent = q.fo;
      } else {
        elFoV.textContent = '-';
      }
      var c = conta(q.sel);
      elCnt.textContent = c;
      if (c === K) {
        elCnt.style.color = '';
      } else {
        elCnt.style.color = '#dc2626';
      }
      elMsg.innerHTML = q.msg;
      destacar(q.ln);
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
      if (estado.modo === 'flip') {
        estado.frames = gerarFlip();
      } else {
        estado.frames = gerar(estado.modo);
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

    elModo.addEventListener('change', function (e) { estado.modo = e.target.value; recomecar(); });
    raiz.querySelector('.js-reset').addEventListener('click', recomecar);
    elProx.addEventListener('click', function () { parar(); avancar(); });
    elVolta.addEventListener('click', function () { parar(); recuar(); });
    elBarra.addEventListener('input', function () {
      parar();
      estado.i = Number(elBarra.value);
      desenhar();
    });
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
    window.addEventListener('resize', desenhar);

    recomecar();
  }

  for (var r = 0; r < raizes.length; r++) { montar(raizes[r]); }
})();
