// Playground: escreva a função de cada etapa, rode os testes (compilados pelo servidor local) e compare com certo/errado.
// Dados em playground-data.js (gerado por tools/playground_build.py). Execução em POST /executar (tools/servidor_local.py).
(function () {
  'use strict';

  var DADOS = window.PLAYGROUND;
  var elServidor = document.getElementById('pg-servidor');
  var elProblemas = document.getElementById('pg-problemas');
  var elEtapas = document.getElementById('pg-etapas');
  var elPainel = document.getElementById('pg-painel');
  if (!DADOS || !elPainel) return;

  // ---------------------------------------------------------------- utilidades
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(s) {
    return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function botao(texto, cls, fn) {
    var b = el('button', 'qbtn' + (cls ? ' ' + cls : ''), texto);
    b.type = 'button';
    if (fn) b.addEventListener('click', fn);
    return b;
  }
  function contar(txt, ch) { return txt.split(ch).length - 1; }

  // ---------------------------------------------------------------- estado salvo (só neste navegador)
  var KEY = 'mo_playground_v1';
  var salvo = { codigo: {}, passou: {}, usou: {} };
  try {
    var lido = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (lido && lido.codigo) salvo = lido;
  } catch (e) { /* sem armazenamento */ }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(salvo)); } catch (e) { /* segue sem salvar */ } }

  var servidorOk = false;
  var pAtual = DADOS.problemas[0].id;
  var eAtual = 0;

  function problema() { return DADOS.problemas.filter(function (p) { return p.id === pAtual; })[0]; }
  function chave(pid, eid) { return pid + '/' + eid; }

  // ---------------------------------------------------------------- servidor local
  function verificarServidor() {
    var url = location.protocol === 'file:' ? null : '/ping';
    var aviso = function (ok, msg) {
      servidorOk = ok;
      elServidor.className = 'alert ' + (ok ? 'alert-success' : 'alert-warning');
      elServidor.innerHTML = msg;
      desenharPainel();
    };
    var instrucoes = '<strong>Executor local não detectado.</strong> Você pode ler os enunciados, as pistas, o código certo e os erros comuns, ' +
      'mas para <strong>rodar os testes</strong> precisa do servidor local (compila com o seu g++; nada sai do seu computador):' +
      '<pre class="qcode">python tools/servidor_local.py</pre>' +
      'Rode na raiz do repositório e abra <code>http://localhost:8765/pages/playground.html</code>. ' +
      'Requer Python e g++ instalados. Em <code>file://</code> ou no GitHub Pages os testes não rodam.';
    if (!url) { aviso(false, instrucoes); return; }
    fetch(url, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok && j.gpp) aviso(true, '<strong>Executor local conectado.</strong> Seus códigos são compilados com o g++ desta máquina.');
      else if (j && j.ok) aviso(false, '<strong>Servidor local ligado, mas o g++ não foi encontrado no PATH.</strong> Instale o g++ (MinGW) e reinicie o servidor.');
      else aviso(false, instrucoes);
    }).catch(function () { aviso(false, instrucoes); });
  }

  function executar(fonte) {
    return fetch('/executar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: fonte })
    }).then(function (r) { return r.json(); });
  }

  // ---------------------------------------------------------------- resultado
  function mapearLinhas(texto, offset) {
    return texto.replace(/prog\.cpp:(\d+):(\d+)/g, function (_, l, c) {
      var n = parseInt(l, 10) - offset;
      return n >= 1 ? 'seu código, linha ' + n + ', coluna ' + c : 'código fornecido (linha ' + l + ')';
    });
  }

  function mostrarResultado(dest, r, et, opcoes) {
    opcoes = opcoes || {};
    dest.innerHTML = '';
    var offset = contar(et.prefixo, '\n');
    if (r.estado === 'erro') {
      dest.appendChild(el('div', 'alert alert-warning', esc(r.mensagem || 'Erro ao executar.')));
      return false;
    }
    if (r.estado === 'compilacao') {
      dest.appendChild(el('div', 'alert alert-danger',
        '<strong>❌ Não compilou.</strong> Na prova, erro de compilação vale <strong>0,0</strong>. Leia a primeira mensagem de erro: ela quase sempre aponta a linha certa.'));
      dest.appendChild(el('pre', 'qcode', esc(mapearLinhas(r.compilacao || '', offset))));
      return false;
    }
    if (r.estado === 'tempo') {
      dest.appendChild(el('div', 'alert alert-danger',
        '<strong>⏱ O programa não terminou em 5 segundos.</strong> Quase sempre é <strong>laço infinito</strong>: confira a condição de parada, se o ' +
        '<code>melhorou</code> volta a 0 em cada rodada, se o vizinho <em>igual</em> está sendo tratado como melhora (use <code>&lt;</code>/<code>&gt;</code> estrito) ' +
        'e se o desfazer restaura tudo.'));
      return false;
    }
    var linhas = (r.saida || '').split('\n');
    var testes = [], res = null;
    linhas.forEach(function (l) {
      var p = l.split('|');
      if (p[0] === 'PASS') testes.push({ ok: true, nome: p[1] });
      else if (p[0] === 'FAIL') testes.push({ ok: false, nome: p[1], dica: p.slice(2).join('|') });
      else if (p[0] === 'RESULT') res = { ok: parseInt(p[1], 10), total: parseInt(p[2], 10) };
    });
    if (!res) {
      dest.appendChild(el('div', 'alert alert-danger',
        '<strong>💥 O programa terminou de forma anormal</strong> antes de concluir os testes (código ' + esc(r.codigo_saida) + '). ' +
        'Pode ser acesso fora do vetor, índice inválido ou memória não inicializada.'));
    }
    var tudo = !!res && res.ok === res.total && res.total > 0;
    var cab = el('div', 'alert ' + (tudo ? 'alert-success' : 'alert-warning'),
      res ? '<strong>' + (tudo ? '✅ Passou em todos os testes' : 'Passou em ' + res.ok + ' de ' + res.total + ' testes') + '</strong>' : '<strong>Testes interrompidos</strong>');
    dest.appendChild(cab);
    var lista = el('ul', 'pg-testes');
    testes.forEach(function (t) {
      var li = el('li', t.ok ? 'ok' : 'ruim');
      li.innerHTML = '<span class="pg-ico">' + (t.ok ? '✓' : '✗') + '</span><span>' + esc(t.nome) +
        (t.ok ? '' : '<span class="pg-dica">' + esc(t.dica) + '</span>') + '</span>';
      lista.appendChild(li);
    });
    dest.appendChild(lista);
    if (r.compilacao && r.compilacao.trim()) {
      var d = el('details', 'pg-avisos');
      d.innerHTML = '<summary>Avisos do compilador</summary>';
      d.appendChild(el('pre', 'qcode', esc(mapearLinhas(r.compilacao, offset))));
      dest.appendChild(d);
    }
    return tudo;
  }

  // ---------------------------------------------------------------- menus
  function desenharProblemas() {
    elProblemas.innerHTML = '';
    DADOS.problemas.forEach(function (p) {
      var feitas = DADOS.etapas.filter(function (e) { return salvo.passou[chave(p.id, e.id)]; }).length;
      var b = el('button', 'qfase' + (p.id === pAtual ? ' ativa' : ''));
      b.type = 'button';
      b.innerHTML = '<span class="qfase-n">Problema ' + p.id + ' <span class="pill ' + (p.sinal === 'maximiza' ? 'pill-max' : 'pill-min') + '">' + p.sinal + '</span></span>' +
        '<span class="qfase-t">' + esc(p.nome) + '</span><span class="qfase-c">' + esc(p.resumo) + '</span>' +
        '<span class="qfase-c"><strong>' + feitas + '/' + DADOS.etapas.length + '</strong> etapas concluídas</span>';
      b.addEventListener('click', function () { pAtual = p.id; desenharTudo(); });
      elProblemas.appendChild(b);
    });
  }

  function desenharEtapas() {
    elEtapas.innerHTML = '';
    DADOS.etapas.forEach(function (e, i) {
      var ok = salvo.passou[chave(pAtual, e.id)];
      var b = el('button', 'pg-chip' + (i === eAtual ? ' ativa' : '') + (ok ? ' feita' : ''),
        '<span class="pg-n">' + (ok ? '✓' : (i + 1)) + '</span><span>' + esc(e.titulo) + '</span>');
      b.type = 'button';
      b.addEventListener('click', function () { eAtual = i; desenharTudo(); });
      elEtapas.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- painel da etapa
  function desenharPainel() {
    elPainel.innerHTML = '';
    var p = problema();
    var meta = DADOS.etapas[eAtual];
    var et = p.etapas[meta.id];
    var k = chave(p.id, meta.id);

    var card = el('div', 'qcard');
    card.appendChild(el('div', 'qcab', '<span class="qid">Etapa ' + (eAtual + 1) + ' de ' + DADOS.etapas.length + '</span><span class="qtipo">Problema ' + p.id + ' · ' + esc(p.sinal) + '</span>'));
    card.appendChild(el('h3', null, esc(meta.titulo)));
    card.appendChild(el('div', 'qenun', fmt(et.enunciado)));
    card.appendChild(el('pre', 'qcode', esc(meta.assinatura)));

    var existente = el('details', 'pg-det');
    existente.innerHTML = '<summary>O que já existe no programa (somente leitura)</summary>';
    existente.appendChild(el('pre', 'qcode', esc(et.visivel)));
    card.appendChild(existente);

    // pistas
    var pistas = el('div', 'pg-pistas');
    var usadas = 0;
    var bp = botao('💡 Mostrar pista (0/' + et.pistas.length + ')', '', null);
    bp.addEventListener('click', function () {
      if (usadas >= et.pistas.length) return;
      pistas.appendChild(el('div', 'qexp', '<div class="qexp-t">Pista ' + (usadas + 1) + '</div>' + fmt(et.pistas[usadas])));
      usadas++;
      bp.textContent = '💡 Mostrar pista (' + usadas + '/' + et.pistas.length + ')';
      if (usadas >= et.pistas.length) bp.disabled = true;
    });
    card.appendChild(bp);
    card.appendChild(pistas);

    // editor
    card.appendChild(el('div', 'pg-rot', 'Seu código (a função desta etapa):'));
    var ta = el('textarea', 'pg-editor');
    ta.spellcheck = false;
    ta.rows = Math.max(10, et.esqueleto.split('\n').length + 6);
    ta.value = salvo.codigo[k] !== undefined ? salvo.codigo[k] : et.esqueleto;
    ta.addEventListener('input', function () { salvo.codigo[k] = ta.value; guardar(); });
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Tab') {
        ev.preventDefault();
        var s = ta.selectionStart;
        ta.value = ta.value.substring(0, s) + '    ' + ta.value.substring(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 4;
        ta.dispatchEvent(new Event('input'));
      }
    });
    card.appendChild(ta);

    var resultado = el('div', 'pg-resultado');
    var linha = el('div', 'qauto');
    var run = botao('▶ Executar testes', 'primario', null);
    if (!servidorOk) { run.disabled = true; run.title = 'Ligue o servidor local (veja o aviso no topo).'; }
    run.addEventListener('click', function () {
      run.disabled = true;
      resultado.innerHTML = '<div class="alert alert-info">Compilando e testando…</div>';
      executar(et.prefixo + ta.value + '\n' + et.sufixo).then(function (r) {
        var passou = mostrarResultado(resultado, r, et);
        if (passou) {
          salvo.passou[k] = 1; guardar();
          desenharProblemas(); desenharEtapas();
          var fim = el('div', 'qauto');
          fim.appendChild(el('span', 'qres bom', 'Agora compare com o código certo e leia os erros comuns abaixo.'));
          if (eAtual < DADOS.etapas.length - 1) fim.appendChild(botao('Próxima etapa →', 'primario', function () { eAtual++; desenharTudo(); window.scrollTo(0, 0); }));
          resultado.appendChild(fim);
        }
      }).catch(function () {
        resultado.innerHTML = '<div class="alert alert-warning">Não consegui falar com o servidor local. Ele ainda está rodando?</div>';
      }).then(function () { run.disabled = !servidorOk; });
    });
    linha.appendChild(run);
    linha.appendChild(botao('Restaurar esqueleto', '', function () {
      if (!window.confirm('Apagar o que você escreveu nesta etapa?')) return;
      ta.value = et.esqueleto; delete salvo.codigo[k]; guardar(); resultado.innerHTML = '';
    }));
    card.appendChild(linha);
    card.appendChild(resultado);
    elPainel.appendChild(card);

    // solução certa
    var certo = el('div', 'qcard pg-bloco');
    certo.appendChild(el('h3', null, '✅ O jeito certo'));
    var corpo = el('div', 'pg-oculto');
    var bc = botao('Ver a solução (tente antes!)', '', null);
    bc.addEventListener('click', function () {
      corpo.innerHTML = '';
      corpo.appendChild(el('pre', 'qcode', esc(et.certo)));
      var l2 = el('div', 'qauto');
      l2.appendChild(botao('Copiar para o editor', '', function () { ta.value = et.certo; ta.dispatchEvent(new Event('input')); window.scrollTo({ top: ta.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }));
      corpo.appendChild(l2);
      bc.remove();
    });
    certo.appendChild(bc);
    certo.appendChild(corpo);
    elPainel.appendChild(certo);

    // erros comuns
    var errosCard = el('div', 'qcard pg-bloco');
    errosCard.appendChild(el('h3', null, '❌ Erros comuns (e o que o teste mostra)'));
    errosCard.appendChild(el('p', 'qdica', 'Cada código abaixo é um erro que realmente acontece. Rode para ver como o teste reage, e leia por que está errado.'));
    et.erros.forEach(function (er) {
      var c = el('div', 'pg-erro');
      c.appendChild(el('div', 'pg-erro-t', esc(er.titulo)));
      c.appendChild(el('pre', 'qcode', esc(er.codigo)));
      c.appendChild(el('div', 'qgab', '<div class="qexp-t">Por que está errado</div>' + fmt(er.explica)));
      var quem;
      if (er.pega === 'TIMEOUT') quem = 'O programa <strong>não termina</strong> (laço infinito).';
      else if (er.pega === 'NAO_PEGA') quem = '<strong>Nenhum teste automático pega este erro.</strong> Só a leitura crítica do código.';
      else quem = 'Teste que falha: <strong>' + esc(er.pega) + '</strong>.';
      c.appendChild(el('div', 'pg-pega', quem));
      var dest = el('div', 'pg-resultado');
      var l = el('div', 'qauto');
      var rb = botao('▶ Rodar este erro', '', null);
      if (!servidorOk) { rb.disabled = true; rb.title = 'Ligue o servidor local (veja o aviso no topo).'; }
      rb.addEventListener('click', function () {
        rb.disabled = true;
        dest.innerHTML = '<div class="alert alert-info">Compilando e testando…</div>';
        executar(et.prefixo + er.codigo + '\n' + et.sufixo).then(function (r) { mostrarResultado(dest, r, et); })
          .catch(function () { dest.innerHTML = '<div class="alert alert-warning">Falha ao falar com o servidor local.</div>'; })
          .then(function () { rb.disabled = !servidorOk; });
      });
      l.appendChild(rb);
      l.appendChild(botao('Copiar para o editor', '', function () { ta.value = er.codigo; ta.dispatchEvent(new Event('input')); window.scrollTo({ top: ta.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }));
      c.appendChild(l);
      c.appendChild(dest);
      errosCard.appendChild(c);
    });
    elPainel.appendChild(errosCard);
  }

  function desenharTudo() {
    desenharProblemas();
    desenharEtapas();
    desenharPainel();
  }

  var rz = document.getElementById('pg-zerar');
  if (rz) {
    rz.addEventListener('click', function () {
      if (!window.confirm('Apagar todos os códigos e o progresso do playground neste navegador?')) return;
      salvo = { codigo: {}, passou: {}, usou: {} };
      guardar();
      desenharTudo();
    });
  }

  desenharTudo();
  verificarServidor();
})();
