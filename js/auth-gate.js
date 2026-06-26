/* BLOQUEIO REAL: NÃO DEIXA INICIAR O JOGO SEM LOGIN */
(function() {
  function isLoggedInHardGate() {
    try {
      if (typeof window.isPescariaPlayerLoggedIn === 'function' && window.isPescariaPlayerLoggedIn()) return true;
      if (window.currentPlayer && window.currentPlayer.uid) return true;
      if (document.body.classList.contains('player-authenticated')) return true;
    } catch (error) {}
    return false;
  }

  function showLoginRequiredMessage() {
    alert('Faça login com Google ou crie uma conta com e-mail e senha para jogar.');
  }

  function shouldBlockStartTarget(target) {
    if (!target || isLoggedInHardGate()) return false;

    const el = target.closest ? target.closest('button, a, .start-btn, #startBtn, [data-start], [onclick]') : null;
    if (!el) return false;

    const text = ((el.textContent || '') + ' ' + (el.alt || '') + ' ' + (el.title || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.id || '') + ' ' + (el.className || '') + ' ' + (el.getAttribute('onclick') || '')).toLowerCase();

    return (
      el.id === 'startBtn' ||
      text.includes('jogar agora') ||
      text.includes('começar') ||
      text.includes('start') ||
      text.includes('play')
    );
  }

  document.addEventListener('click', function(event) {
    if (shouldBlockStartTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showLoginRequiredMessage();
      return false;
    }
  }, true);

  document.addEventListener('pointerdown', function(event) {
    if (shouldBlockStartTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  function wrapStartFunction(name) {
    try {
      const fn = window[name];
      if (typeof fn !== 'function' || fn.__authGateWrapped) return;
      const wrapped = function(...args) {
        if (!isLoggedInHardGate()) {
          showLoginRequiredMessage();
          return false;
        }
        return fn.apply(this, args);
      };
      wrapped.__authGateWrapped = true;
      window[name] = wrapped;
    } catch (error) {}
  }

  function installFunctionGates() {
    [
      'startGame',
      'startRound',
      'startLevel',
      'startFishing',
      'beginGame',
      'playGame',
      'start'
    ].forEach(wrapStartFunction);
  }

  document.addEventListener('DOMContentLoaded', installFunctionGates);
  window.addEventListener('load', installFunctionGates);
  setTimeout(installFunctionGates, 100);
  setTimeout(installFunctionGates, 500);
  setTimeout(installFunctionGates, 1200);

  window.requirePescariaLoginBeforeStart = function() {
    if (!isLoggedInHardGate()) {
      showLoginRequiredMessage();
      return false;
    }
    return true;
  };
})();
