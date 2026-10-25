// Interface do laboratório: executa os geradores de lab.js passo a passo e desenha a grade de vizinhos.
(function () {
  var L = window.LabBuscaLocal;
  if (!L) return;

  var el = {
    algoritmo: document.getElementById('lab-algoritmo'),
    instancia: document.getElementById('lab-instancia'),
    inicio: document.getElementById('lab-inicio'),
    passo: document.getElementById('lab-passo'),
    tudo: document.getElementById('lab-tudo'),
    reiniciar: document.getElementById('lab-reiniciar'),
    grade: document.getElementById('lab-grade'),
    log: document.getElementById('lab-log'),
    fo: document.getElementById('lab-fo'),
    avaliacoes: document.getElementById('lab-avaliacoes'),
    aplicados: document.getElementById('lab-aplicados'),
    solucao: document.getElementById('lab-solucao')
  };
  var ITERACOES_RANDOMICA = 12;
  var estado, gerador, cache, ultimo, melhor, avaliacoes, aplicados, terminou;

  function criarEstado() {
    var solucao = [];
    var i;
    if (el.inicio.value === 'zeros') {
      for (i = 0; i < L.NUM_PONTOS; i++) solucao.push(0);
    } else {
      var sorteio = L.criarSorteio(11);
      for (i = 0; i < L.NUM_PONTOS; i++) solucao.push(Math.floor(sorteio() * L.NUM_POSICOES));
    }
    return { solucao: solucao, fo: L.calcularFO(solucao) };
  }

  function reiniciar() {
    L.definirInstancia(el.instancia.value);
    estado = criarEstado();
    var nome = el.algoritmo.value;
    if (nome === 'ra') gerador = L.randomica(estado, ITERACOES_RANDOMICA, L.criarSorteio(5));
    else if (nome === 'pm') gerador = L.primeiraMelhora(estado);
    else gerador = L.melhorMelhora(estado);
    cache = {}; ultimo = null; melhor = null; avaliacoes = 0; aplicados = 0; terminou = false;
    el.log.textContent = '';
    escrever('Início: solução [' + descrever() + '], FO = ' + estado.fo + '. Objetivo: MAXIMIZAR (pontos livres).');
    desenhar();
  }

  function descrever() {
    return estado.solucao.map(function (pos) { return pos + 1; }).join(', ');
  }

  function escrever(linha) {
    el.log.textContent += linha + '\n';
    el.log.scrollTop = el.log.scrollHeight;
  }

  function rotulo(ponto, posicao) { return 'ponto ' + (ponto + 1) + ' → pos ' + (posicao + 1); }

  function desenhar() {
    var html = '<thead><tr><th></th>';
    var p, q;
    for (q = 0; q < L.NUM_POSICOES; q++) html += '<th>pos ' + (q + 1) + '</th>';
    html += '</tr></thead><tbody>';
    for (p = 0; p < L.NUM_PONTOS; p++) {
      html += '<tr><th>ponto ' + (p + 1) + '</th>';
      for (q = 0; q < L.NUM_POSICOES; q++) {
        var classe = '';
        var texto = '·';
        var chave = p + ',' + q;
        if (estado.solucao[p] === q) { classe = 'lab-atual'; texto = '● ' + estado.fo; }
        else if (cache[chave] !== undefined) { classe = 'lab-testado'; texto = String(cache[chave]); }
        if (ultimo && ultimo.ponto === p && ultimo.posicao === q && ultimo.aceito) classe = 'lab-aceito';
        if (melhor && melhor.ponto === p && melhor.posicao === q) classe += ' lab-melhor';
        html += '<td class="' + classe + '">' + texto + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody>';
    el.grade.innerHTML = html;
    el.fo.textContent = String(estado.fo);
    el.avaliacoes.textContent = String(avaliacoes);
    el.aplicados.textContent = String(aplicados);
    el.solucao.textContent = '[' + descrever() + ']';
    el.passo.disabled = terminou;
    el.tudo.disabled = terminou;
  }

  function tratar(evento) {
    ultimo = null;
    if (evento.tipo === 'fim') {
      terminou = true;
      escrever('Fim: nenhum vizinho melhora (ótimo local, ou a randômica desistiu). FO final = ' + estado.fo + '.');
      return;
    }
    if (evento.tipo === 'rodada') {
      escrever('— fim da rodada de ' + ITERACOES_RANDOMICA + ' tentativas: ' + (evento.melhorou ? 'houve melhora, nova rodada' : 'nenhuma melhora, desiste') + ' —');
      return;
    }
    avaliacoes++;
    var chave = evento.ponto + ',' + evento.posicao;
    if (evento.tipo === 'testado') {
      cache[chave] = evento.novo;
      melhor = evento.melhorPonto >= 0 ? { ponto: evento.melhorPonto, posicao: evento.melhorPosicao } : null;
      var textoMelhor = evento.melhorPonto >= 0 ? 'melhor até agora: FO ' + evento.melhorFO + ' em ' + rotulo(evento.melhorPonto, evento.melhorPosicao) : 'ainda nenhum melhora a FO atual';
      escrever('avaliou ' + rotulo(evento.ponto, evento.posicao) + ': FO ' + evento.novo + '   (' + textoMelhor + '; desfeito)');
    } else if (evento.tipo === 'rejeitado') {
      cache[chave] = evento.novo;
      escrever('testou ' + rotulo(evento.ponto, evento.posicao) + ': FO ' + evento.novo + ' — não melhora; desfeito');
    } else if (evento.tipo === 'aceito') {
      aplicados++;
      escrever('APLICOU ' + rotulo(evento.ponto, evento.posicao) + ': FO ' + evento.novo + ' > anterior ✔   → solução [' + descrever() + ']');
      cache = {};
      melhor = null;
      ultimo = { ponto: evento.ponto, posicao: evento.posicao, aceito: true };
    }
  }

  function passo() {
    if (terminou) return;
    var proximo = gerador.next();
    if (proximo.done) { terminou = true; desenhar(); return; }
    tratar(proximo.value);
    desenhar();
  }

  function tudo() {
    var limite = 5000;
    while (!terminou && limite-- > 0) {
      var proximo = gerador.next();
      if (proximo.done) { terminou = true; break; }
      tratar(proximo.value);
    }
    desenhar();
  }

  el.passo.addEventListener('click', passo);
  el.tudo.addEventListener('click', tudo);
  el.reiniciar.addEventListener('click', reiniciar);
  el.algoritmo.addEventListener('change', reiniciar);
  el.instancia.addEventListener('change', reiniciar);
  el.inicio.addEventListener('change', reiniciar);
  reiniciar();
})();
