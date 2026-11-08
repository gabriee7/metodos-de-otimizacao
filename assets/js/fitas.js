/* Visualização das "fitas" (máquinas): mostra, passo a passo, a busca local
   mexendo nas tarefas. Uso: <div class="card fitas" data-modo="pm"></div>
   Modos: pm (primeira melhora), mm (melhor melhora), ra (randômica),
   bug (primeira melhora esquecendo de desfazer). Sem dependências. */
(function () {
  var raizes = document.querySelectorAll('.fitas');
  if (!raizes.length) { return; }

  var EXEMPLOS = {
    a: { nome: 'Exemplo da página: tempos 5, 4, 3, 2', tempos: [5, 4, 3, 2] },
    b: { nome: 'Exercício do papel: tempos 6, 5, 4, 1', tempos: [6, 5, 4, 1] }
  };
  var CORES = ['#2563eb', '#16a34a', '#d97706', '#9333ea'];
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

  function montar(raiz) {
    var estado = { modo: 'pm', ex: 'a', frames: [], i: 0, timer: null };
    var modoIni = raiz.getAttribute('data-modo');
    if (modoIni === 'pm' || modoIni === 'mm' || modoIni === 'ra' || modoIni === 'bug') { estado.modo = modoIni; }

    raiz.innerHTML =
      '<div class="ft-barra">' +
        '<label>Método <select class="js-modo">' +
          '<option value="pm">Primeira melhora</option>' +
          '<option value="mm">Melhor melhora</option>' +
          '<option value="ra">Randômica</option>' +
          '<option value="bug">Erro: esqueci de desfazer</option>' +
        '</select></label>' +
        '<label>Exemplo <select class="js-ex"><option value="a">' + EXEMPLOS.a.nome + '</option><option value="b">' + EXEMPLOS.b.nome + '</option></select></label>' +
      '</div>' +
      '<div class="ft-palco js-palco"></div>' +
      '<div class="ft-placar">' +
        '<div><span>Nota atual (FO)</span><b class="js-foa">-</b></div>' +
        '<div><span>Nota da vizinha testada</span><b class="js-fov">-</b></div>' +
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
      '<div class="ft-log js-log"></div>';
    raiz.setAttribute('tabindex', '0');

    var elModo = raiz.querySelector('.js-modo');
    var elEx = raiz.querySelector('.js-ex');
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
    var blocos = [];
    var cargaEls = [];
    elModo.value = estado.modo;

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
      var unidade = (elPalco.clientWidth - 130) / total;
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
        elFoV.textContent = q.fo;
      } else {
        elFoV.textContent = '-';
      }
      elMsg.innerHTML = q.msg;
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
      if (estado.modo === 'ra') {
        estado.frames = gerarRA(tempos());
      } else if (estado.modo === 'bug') {
        estado.frames = gerarBug(tempos());
      } else {
        estado.frames = gerar(tempos(), estado.modo);
      }
      estado.i = 0;
      montarPalco();
      desenhar();
    }

    function avancar() {
      if (estado.i < estado.frames.length - 1) { estado.i++; desenhar(); }
    }
    function recuar() {
      if (estado.i > 0) { estado.i--; desenhar(); }
    }

    elModo.addEventListener('change', function (e) { estado.modo = e.target.value; recomecar(); });
    elEx.addEventListener('change', function (e) { estado.ex = e.target.value; recomecar(); });
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
    window.addEventListener('resize', desenhar);

    recomecar();
  }

  for (var r = 0; r < raizes.length; r++) { montar(raizes[r]); }
})();
