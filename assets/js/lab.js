// Laboratório: as 3 buscas locais passo a passo num PRCP minúsculo (6 pontos x 3 posições).
// Cada algoritmo é um gerador (function*): cada yield = um evento que o painel mostra.
(function (raiz) {
  var NUM_PONTOS = 6;
  var NUM_POSICOES = 3;
  // Duas instâncias: pares de ids em conflito (id = ponto * NUM_POSICOES + posição), simétricos.
  // Em A a melhor melhora termina melhor que a primeira melhora; em B é o contrário (partindo de 0,0,0,0,0,0).
  var INSTANCIAS = {
    A: [[3,9],[5,16],[0,16],[2,4],[5,14],[7,9],[8,16],[3,7],[6,15],[4,10],[1,17],[10,14],[0,10],[13,16],[7,11],[11,16],[13,17],[6,11],[4,13],[0,6],[13,15],[1,8],[4,15],[12,17]],
    B: [[0,5],[6,10],[11,12],[7,17],[12,15],[2,11],[0,7],[9,15],[7,16],[10,14],[2,13],[4,14],[13,17],[0,12],[8,16],[12,17],[4,12],[14,17],[11,14],[1,16],[0,11],[13,16],[11,17],[3,9]]
  };
  var conflitos = [];
  function definirInstancia(nome) {
    conflitos = [];
    for (var i = 0; i < NUM_PONTOS * NUM_POSICOES; i++) conflitos.push([]);
    INSTANCIAS[nome].forEach(function (par) { conflitos[par[0]].push(par[1]); conflitos[par[1]].push(par[0]); });
  }
  definirInstancia('A');

  function calcularFO(solucao) {
    var fo = NUM_PONTOS;
    for (var p = 0; p < NUM_PONTOS; p++) {
      var id = p * NUM_POSICOES + solucao[p];
      var emConflito = false;
      for (var k = 0; k < conflitos[id].length; k++) {
        var outro = conflitos[id][k];
        if (solucao[Math.floor(outro / NUM_POSICOES)] === outro % NUM_POSICOES) { emConflito = true; break; }
      }
      if (emConflito) fo--;
    }
    return fo;
  }

  function criarSorteio(semente) {
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // estado = { solucao: [..], fo: n }
  function* randomica(estado, iteracoes, sorteio) {
    var melhorou = true;
    while (melhorou) {
      melhorou = false;
      for (var i = 0; i < iteracoes; i++) {
        var ponto = Math.floor(sorteio() * NUM_PONTOS);
        var posicao;
        do { posicao = Math.floor(sorteio() * NUM_POSICOES); } while (posicao === estado.solucao[ponto]);
        var original = estado.solucao[ponto];
        estado.solucao[ponto] = posicao;
        var novo = calcularFO(estado.solucao);
        if (novo > estado.fo) {
          estado.fo = novo; melhorou = true;
          yield { tipo: 'aceito', ponto: ponto, posicao: posicao, novo: novo };
        } else {
          estado.solucao[ponto] = original;
          yield { tipo: 'rejeitado', ponto: ponto, posicao: posicao, novo: novo };
        }
      }
      yield { tipo: 'rodada', melhorou: melhorou };
    }
    yield { tipo: 'fim' };
  }

  function* primeiraMelhora(estado) {
    var melhorou = true;
    while (melhorou) {
      melhorou = false;
      for (var ponto = 0; ponto < NUM_PONTOS && !melhorou; ponto++) {
        for (var posicao = 0; posicao < NUM_POSICOES && !melhorou; posicao++) {
          if (posicao === estado.solucao[ponto]) continue;
          var original = estado.solucao[ponto];
          estado.solucao[ponto] = posicao;
          var novo = calcularFO(estado.solucao);
          if (novo > estado.fo) {
            estado.fo = novo; melhorou = true;
            yield { tipo: 'aceito', ponto: ponto, posicao: posicao, novo: novo };
          } else {
            estado.solucao[ponto] = original;
            yield { tipo: 'rejeitado', ponto: ponto, posicao: posicao, novo: novo };
          }
        }
      }
    }
    yield { tipo: 'fim' };
  }

  function* melhorMelhora(estado) {
    while (true) {
      var melhorPonto = -1, melhorPosicao = -1, melhorFO = estado.fo;
      for (var ponto = 0; ponto < NUM_PONTOS; ponto++) {
        for (var posicao = 0; posicao < NUM_POSICOES; posicao++) {
          if (posicao === estado.solucao[ponto]) continue;
          var original = estado.solucao[ponto];
          estado.solucao[ponto] = posicao;
          var novo = calcularFO(estado.solucao);
          estado.solucao[ponto] = original;            // sempre desfaz
          if (novo > melhorFO) { melhorFO = novo; melhorPonto = ponto; melhorPosicao = posicao; }
          yield { tipo: 'testado', ponto: ponto, posicao: posicao, novo: novo, melhorFO: melhorFO, melhorPonto: melhorPonto, melhorPosicao: melhorPosicao };
        }
      }
      if (melhorPonto === -1) break;
      estado.solucao[melhorPonto] = melhorPosicao;
      estado.fo = melhorFO;
      yield { tipo: 'aceito', ponto: melhorPonto, posicao: melhorPosicao, novo: melhorFO };
    }
    yield { tipo: 'fim' };
  }

  var api = { definirInstancia: definirInstancia, NUM_PONTOS: NUM_PONTOS, NUM_POSICOES: NUM_POSICOES, calcularFO: calcularFO, criarSorteio: criarSorteio,
              randomica: randomica, primeiraMelhora: primeiraMelhora, melhorMelhora: melhorMelhora };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.LabBuscaLocal = api;
})(typeof window !== 'undefined' ? window : this);
