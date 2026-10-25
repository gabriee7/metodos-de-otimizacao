// Utilidades compartilhadas: botão "copiar" nos blocos de código e destaque da seção ativa na sidebar.
(function () {
  document.querySelectorAll('pre.code').forEach(function (pre) {
    var wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var botao = document.createElement('button');
    botao.className = 'code-copy';
    botao.type = 'button';
    botao.textContent = 'copiar';
    botao.addEventListener('click', function () {
      var texto = pre.innerText;
      var feito = function () { botao.textContent = 'copiado!'; setTimeout(function () { botao.textContent = 'copiar'; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(feito, function () {});
      }
    });
    wrap.appendChild(botao);
  });

  var links = Array.prototype.slice.call(document.querySelectorAll('.ex-sidebar a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var alvos = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + entrada.target.id); });
    });
  }, { rootMargin: '-80px 0px -65% 0px' });
  alvos.forEach(function (alvo) { if (alvo) observador.observe(alvo); });
})();
