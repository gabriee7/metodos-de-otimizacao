/* Visualização das "fitas" (máquinas): mostra, passo a passo, a primeira melhora
   e a melhor melhora mexendo nas tarefas. Sem dependências. */
(function () {
  var raiz = document.getElementById('fitas');
  if (!raiz) { return; }

  var EXEMPLOS = {
    a: { nome: 'Exemplo da página: tempos 5, 4, 3, 2', tempos: [5, 4, 3, 2] },
    b: { nome: 'Exercício do papel: tempos 6, 5, 4, 1', tempos: [6, 5, 4, 1] }
  };
  var CORES = ['#2563eb', '#16a34a', '#d97706', '#9333ea'];

  var estado = { modo: 'pm', ex: 'a', frames: [], i: 0, timer: null };

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

  /* Gera a lista de quadros simulando exatamente o algoritmo do código. */
  function gerar(tempos, modo) {
    var n = tempos.length;
    var q = [];
    var sol = [];
    for (var k = 0; k < n; k++) { sol.push(0); }
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
        var destino = v[t];
        var base = atual;
        if (modo === 'mm') { base = melhorFO; }
        var melhor = (f < base);
        var txtBase = 'a nota atual (' + atual + ')';
        if (modo === 'mm') { txtBase = 'o melhor visto até agora (' + melhorFO + ')'; }
        var veredito;
        if (melhor) {
          veredito = '<b style="color:#16a34a">' + f + ' &lt; ' + base + ': melhorou.</b>';
        } else if (f === base) {
          veredito = '<b style="color:#dc2626">' + f + ' = ' + base + ': empate, e empate não conta.</b>';
        } else {
          veredito = '<b style="color:#dc2626">' + f + ' &gt; ' + base + ': piorou.</b>';
        }
        q.push({ tipo: 'teste', sol: v, mov: t, fo: f, ref: atual,
          msg: 'Testo mover a <b>tarefa ' + t + '</b> (tempo ' + tempos[t] + ') para a <b>máquina ' + destino + '</b>. Nota da vizinha = <b>' + f + '</b>. Comparo com ' + txtBase + ': ' + veredito });

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

      if (modo === 'mm') {
        if (melhorT >= 0) {
          var viz = vizinha(sol, melhorT);
          q.push({ tipo: 'aceita', sol: viz.slice(), mov: melhorT, fo: melhorFO, ref: melhorFO,
            log: 'Rodada ' + rodada + ' · aplica a <b>tarefa ' + melhorT + '</b> (FO ' + melhorFO + ')',
            msg: 'Olhei todas. Agora aplico <b>só a melhor</b>: tarefa ' + melhorT + ', FO <b>' + melhorFO + '</b>.' });
          sol = viz;
          melhorou = true;
        }
      }
    }

    q.push({ tipo: 'fim', sol: sol.slice(), mov: -1, fo: fo(sol, tempos), ref: fo(sol, tempos),
      log: 'Rodada ' + rodada + ' · nenhuma vizinha melhora',
      msg: '<b>Fim.</b> Nenhuma vizinha melhora a nota. Isso é um <b>ótimo local</b>. FO final = <b>' + fo(sol, tempos) + '</b>.' });
    return q;
  }

  /* ---------- interface ---------- */
  raiz.innerHTML =
    '<div class="ft-barra">' +
      '<label>Método <select id="ft-modo"><option value="pm">Primeira melhora</option><option value="mm">Melhor melhora</option></select></label>' +
      '<label>Exemplo <select id="ft-ex"><option value="a">' + EXEMPLOS.a.nome + '</option><option value="b">' + EXEMPLOS.b.nome + '</option></select></label>' +
    '</div>' +
    '<div class="ft-palco" id="ft-palco"></div>' +
    '<div class="ft-placar">' +
      '<div><span>Nota atual (FO)</span><b id="ft-fo-atual">-</b></div>' +
      '<div><span>Nota da vizinha testada</span><b id="ft-fo-viz">-</b></div>' +
    '</div>' +
    '<div class="ft-msg" id="ft-msg"></div>' +
    '<div class="ft-botoes">' +
      '<button type="button" id="ft-volta">◀ Voltar</button>' +
      '<button type="button" id="ft-prox" class="ft-prim">Próximo ▶</button>' +
      '<button type="button" id="ft-auto">▶▶ Automático</button>' +
      '<button type="button" id="ft-reset">↺ Reiniciar</button>' +
      '<label class="ft-vel">Velocidade <select id="ft-vel"><option value="2600">Lenta</option><option value="1500" selected>Normal</option><option value="700">Rápida</option></select></label>' +
      '<span id="ft-cont"></span>' +
    '</div>' +
    '<input type="range" id="ft-barra" class="ft-barra-passos" min="0" max="0" value="0" aria-label="Passo">' +
    '<div class="ft-dica">Dica: arraste a barra para ir e voltar, ou use as setas ← → do teclado.</div>' +
    '<div class="ft-log-t">Histórico dos testes</div>' +
    '<div class="ft-log" id="ft-log"></div>';

  var elPalco = document.getElementById('ft-palco');
  var elMsg = document.getElementById('ft-msg');
  var elFoA = document.getElementById('ft-fo-atual');
  var elFoV = document.getElementById('ft-fo-viz');
  var elCont = document.getElementById('ft-cont');
  var elLog = document.getElementById('ft-log');
  var elAuto = document.getElementById('ft-auto');
  var elBarra = document.getElementById('ft-barra');
  var elVel = document.getElementById('ft-vel');
  var blocos = [];
  var cargaEls = [];

  function tempos() { return EXEMPLOS[estado.ex].tempos; }

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
    var larg = elPalco.clientWidth;
    var unidade = (larg - 130) / total;
    if (unidade > 34) { unidade = 34; }
    var x = [70, 70];
    for (var k = 0; k < tp.length; k++) {
      var m = q.sol[k];
      var b = blocos[k];
      b.style.width = (tp[k] * unidade - 4) + 'px';
      b.style.left = x[m] + 'px';
      b.style.top = (m * 74 + 14) + 'px';
      x[m] += tp[k] * unidade;
      var cls = 'ft-bloco';
      if (k === q.mov) {
        if (q.tipo === 'teste') { cls += ' ft-teste'; }
        if (q.tipo === 'aceita') { cls += ' ft-ok'; }
        if (q.tipo === 'desfaz') { cls += ' ft-volta'; }
      }
      b.className = cls;
    }
    var c = carga(q.sol, tp);
    var maior = 0;
    if (c[1] > c[0]) { maior = 1; }
    for (var mm = 0; mm < 2; mm++) {
      cargaEls[mm].textContent = 'carga ' + c[mm];
      var igual = (c[0] === c[1]);
      if (mm === maior || igual) {
        cargaEls[mm].className = 'ft-carga ft-max';
      } else {
        cargaEls[mm].className = 'ft-carga';
      }
    }
    elFoA.textContent = q.ref;
    if (q.tipo === 'teste') {
      elFoV.textContent = q.fo;
    } else {
      elFoV.textContent = '-';
    }
    elMsg.innerHTML = q.msg;
    elCont.textContent = 'Passo ' + (estado.i + 1) + ' de ' + estado.frames.length;
    elBarra.max = estado.frames.length - 1;
    elBarra.value = estado.i;
    document.getElementById('ft-volta').disabled = (estado.i === 0);
    document.getElementById('ft-prox').disabled = (estado.i === estado.frames.length - 1);

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
    estado.frames = gerar(tempos(), estado.modo);
    estado.i = 0;
    montarPalco();
    desenhar();
  }

  document.getElementById('ft-modo').addEventListener('change', function (e) { estado.modo = e.target.value; recomecar(); });
  document.getElementById('ft-ex').addEventListener('change', function (e) { estado.ex = e.target.value; recomecar(); });
  document.getElementById('ft-reset').addEventListener('click', recomecar);
  document.getElementById('ft-prox').addEventListener('click', function () {
    parar();
    if (estado.i < estado.frames.length - 1) { estado.i++; desenhar(); }
  });
  document.getElementById('ft-volta').addEventListener('click', function () {
    parar();
    if (estado.i > 0) { estado.i--; desenhar(); }
  });
  elAuto.addEventListener('click', function () {
    if (estado.timer) { parar(); return; }
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
  });
  elVel.addEventListener('change', function () {
    if (estado.timer) {
      parar();
      elAuto.click();
    }
  });
  elBarra.addEventListener('input', function () {
    parar();
    estado.i = Number(elBarra.value);
    desenhar();
  });
  document.addEventListener('keydown', function (e) {
    var alvo = e.target.tagName;
    if (alvo === 'INPUT' || alvo === 'SELECT' || alvo === 'TEXTAREA') { return; }
    if (e.key === 'ArrowRight') {
      parar();
      if (estado.i < estado.frames.length - 1) { estado.i++; desenhar(); }
    }
    if (e.key === 'ArrowLeft') {
      parar();
      if (estado.i > 0) { estado.i--; desenhar(); }
    }
  });
  window.addEventListener('resize', desenhar);

  recomecar();
})();
