
    const game = document.getElementById('game');
    const world = document.getElementById('world');
    const hook = document.getElementById('hook');
    const fishingLine = document.getElementById('fishingLine');
    const liveScore = document.getElementById('liveScore');
    const liveFish = document.getElementById('liveFish');
    const depthMeter = document.getElementById('depthMeter');
    const startOverlay = document.getElementById('startOverlay');
    const resultOverlay = document.getElementById('resultOverlay');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const normalCountEl = document.getElementById('normalCount');
    const goldCountEl = document.getElementById('goldCount');
    const depthProgressFill = document.getElementById('depthProgressFill');
    const finalScoreEl = document.getElementById('finalScore');
    const rainbowTimerEl = document.getElementById('rainbowTimer');
    const rankingListEl = document.getElementById('rankingList');
    const bestScoreLineEl = document.getElementById('bestScoreLine');

    let gameWidth = 0;
    let gameHeight = 0;
    let hookWorldX = 0;
    let hookWorldY = 0;
    let targetX = 0;
    let hookVisualOffsetY = 0;
    let targetVisualOffsetY = 0;
    let verticalControlActive = false;
    let cameraY = 0;
    let state = 'idle';
    let animationId = null;
    let fishes = [];
    let score = 0;
    let normalCaught = 0;
    let goldCaught = 0;
    let comboStreak = 0;
    let lastMultiplier = 1;
    let freezeTimer = 0;
    let freezeSpawnTimer = 0;
    let lastTime = 0;

    const config = {
      rodTipXRatio: 0.75,
      rodTipY: 92,
      startY: 245,
      endY: 250,
      maxDepth: 2860,
      cameraLimit: 2380,
      downSpeed: 620,
      upSpeed: 145,
      verticalEase: 0.18,
      verticalControlRange: 340,
      horizontalEase: 0.2,
      fishCount: 30,
      rainbowChance: 0.08,
      baiacuChance: 0.20,
      hookCollisionRadius: 36
    };

    function resize() {
      const rect = game.getBoundingClientRect();
      gameWidth = rect.width;
      gameHeight = rect.height;
      if (state === 'idle' || state === 'result') {
        hookWorldX = gameWidth * config.rodTipXRatio;
        hookWorldY = config.startY;
        targetX = hookWorldX;
        cameraY = 0;
        renderAll();
      }
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function spawnFishes() {
      fishes.forEach(fish => fish.el.remove());
      fishes = [];
      const minY = 420;
      const maxY = config.maxDepth - 260;

      for (let i = 0; i < config.fishCount; i++) {
        const fishRoll = Math.random();
        const fishType =
          i < 2
            ? 'baiacu'
            : fishRoll < config.rainbowChance
              ? 'rainbow'
              : fishRoll < config.rainbowChance + config.baiacuChance
                ? 'baiacu'
                : fishRoll < config.rainbowChance + config.baiacuChance + 0.22
                  ? 'gold'
                  : 'normal';

        const el = document.createElement('div');
        el.className = `fish ${fishType}`;
        world.appendChild(el);

        const dir = Math.random() > 0.5 ? 1 : -1;
        const width = fishType === 'gold' ? 82 : fishType === 'baiacu' ? 76 : fishType === 'rainbow' ? 96 : 72;
        const height = fishType === 'gold' ? 58 : fishType === 'baiacu' ? 76 : fishType === 'rainbow' ? 60 : 54;
        const x = dir === 1 ? -140 - Math.random() * 380 : gameWidth + 140 + Math.random() * 380;
        const y = minY + Math.random() * (maxY - minY);
        const speed = (50 + Math.random() * 95) * dir;

        fishes.push({
          el,
          x,
          y,
          speed,
          dir,
          width,
          height,
          type: fishType,
          value:
            fishType === 'gold'
              ? 100
              : fishType === 'baiacu'
                ? -50
                : fishType === 'rainbow'
                  ? 0
                  : 50,
          caught: false
        });
      }
    }


    function spawnBonusFish() {
      const fishType = Math.random() < 0.35 ? 'gold' : 'normal';
      const el = document.createElement('div');
      el.className = `fish ${fishType}`;
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;
      const width = fishType === 'gold' ? 82 : 72;
      const height = fishType === 'gold' ? 58 : 54;
      const screenY = 150 + Math.random() * (gameHeight - 260);
      const y = cameraY + screenY;
      const x = dir === 1 ? -120 : gameWidth + 120;
      const speed = (90 + Math.random() * 120) * dir;

      fishes.push({
        el,
        x,
        y,
        speed,
        dir,
        width,
        height,
        type: fishType,
        value: fishType === 'gold' ? 100 : 50,
        caught: false,
        bonus: true
      });
    }

    function updateFishes(dt) {
      fishes.forEach(fish => {
        if (fish.caught) return;
        fish.x += fish.speed * dt;

        if (fish.dir === 1 && fish.x > gameWidth + 140) {
          fish.x = -150;
        }
        if (fish.dir === -1 && fish.x < -160) {
          fish.x = gameWidth + 150;
        }

        const flip = fish.dir === -1 ? ' scaleX(-1)' : '';
        fish.el.style.left = `${fish.x}px`;
        fish.el.style.top = `${fish.y}px`;
        fish.el.style.transform = flip.trim();
      });
    }

    function updateCamera() {
      const desired = hookWorldY - gameHeight * 0.55;
      cameraY = clamp(desired, 0, config.cameraLimit);
    }

    function renderAll() {
      updateCamera();
      world.style.transform = `translateY(${-cameraY}px)`;

      const rodTipX = gameWidth * config.rodTipXRatio;
      const rodTipScreenY = config.rodTipY - cameraY;
      const hookScreenX = hookWorldX;
      const baseHookScreenY = hookWorldY - cameraY;
      const hookScreenY = baseHookScreenY + hookVisualOffsetY;

      fishingLine.setAttribute('x1', rodTipX.toFixed(1));
      fishingLine.setAttribute('y1', rodTipScreenY.toFixed(1));
      fishingLine.setAttribute('x2', hookScreenX.toFixed(1));
      fishingLine.setAttribute('y2', hookScreenY.toFixed(1));

      hook.style.left = `${hookScreenX - 14}px`;
      hook.style.top = `${hookScreenY}px`;
      let depthPercent = 0;

      if (state === 'down') {
        depthPercent = Math.max(0, Math.min(1,
          (hookWorldY - config.startY) / (config.maxDepth - config.startY)
        ));

        if (depthProgressFill) {
          depthProgressFill.style.top = '0';
          depthProgressFill.style.bottom = 'auto';
          depthProgressFill.style.height = `${depthPercent * 100}%`;
        }
      } else {
        depthPercent = Math.max(0, Math.min(1,
          (hookWorldY - config.endY) / (config.maxDepth - config.endY)
        ));

        if (depthProgressFill) {
          depthProgressFill.style.top = '0';
          depthProgressFill.style.bottom = 'auto';
          depthProgressFill.style.height = `${depthPercent * 100}%`;
        }
      }
    }



    let audioCtx = null;

    function playTone(frequency, duration = 0.08, type = 'sine', volume = 0.06) {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.stop(audioCtx.currentTime + duration);
      } catch {}
    }

    function playCatchSound(value) {
      if (value < 0) {
        playTone(170, 0.12, 'sawtooth', 0.05);
      } else if (value >= 100) {
        playTone(880, 0.08, 'triangle', 0.06);
        setTimeout(() => playTone(1180, 0.08, 'triangle', 0.05), 70);
      } else {
        playTone(620, 0.07, 'sine', 0.05);
      }
    }

    function flashHook() {
      hook.classList.remove('flash');
      void hook.offsetWidth;
      hook.classList.add('flash');
      setTimeout(() => hook.classList.remove('flash'), 320);
    }

    function showParticles(x, y, value) {
      const count = value >= 100 ? 18 : value < 0 ? 10 : 12;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = value < 0 ? '#ff4b4b' : value >= 100 ? '#fff27a' : '#7ff6ff';
        const angle = Math.random() * Math.PI * 2;
        const distance = 28 + Math.random() * 42;
        p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        game.appendChild(p);
        setTimeout(() => p.remove(), 700);
      }
    }

    function getComboMultiplier() {
      if (comboStreak >= 5) return 3;
      if (comboStreak >= 3) return 2;
      return 1;
    }

    function showComboPop(multiplier) {
      if (multiplier <= 1 || multiplier === lastMultiplier) return;
      lastMultiplier = multiplier;
      const pop = document.createElement('div');
      pop.className = 'combo-pop';
      pop.textContent = `COMBO x${multiplier}!`;
      game.appendChild(pop);
      setTimeout(() => pop.remove(), 800);
    }

    function showFreezeBanner() {
      const img = document.createElement('img');
      img.className = 'rainbow-notice';
      img.src = './assets/aviso-arcoiris.png';
      img.alt = 'Peixe Arco-íris! Subida pausada! 5 segundos';
      game.appendChild(img);
      setTimeout(() => img.remove(), 2200);
    }


    function cinematicFlashGold() {
      const flash = document.createElement('div');
      flash.className = 'cinematic-overlay gold';
      game.appendChild(flash);
      setTimeout(() => flash.remove(), 520);
    }

    function cinematicShake() {
      game.classList.remove('screen-shake');
      void game.offsetWidth;
      game.classList.add('screen-shake');
      setTimeout(() => game.classList.remove('screen-shake'), 340);
    }

    function cinematicHitHook() {
      hook.classList.add('cinematic-glow');
      hook.classList.remove('cinematic-hit');
      void hook.offsetWidth;
      hook.classList.add('cinematic-hit');
      setTimeout(() => hook.classList.remove('cinematic-hit'), 380);
    }

    function cinematicWave(x, y) {
      const wave = document.createElement('div');
      wave.className = 'splash-wave';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      game.appendChild(wave);
      setTimeout(() => wave.remove(), 760);
    }

    function cinematicBurst(x, y, type) {
      const total = type === 'gold' ? 24 : type === 'bad' ? 12 : 16;
      for (let i = 0; i < total; i++) {
        const p = document.createElement('span');
        p.className = 'burst-particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = type === 'gold' ? '#ffe45e' : type === 'bad' ? '#ff4b4b' : '#8df7ff';
        const angle = Math.random() * Math.PI * 2;
        const dist = (type === 'gold' ? 64 : 44) + Math.random() * 28;
        p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        game.appendChild(p);
        setTimeout(() => p.remove(), 720);
      }
    }

    function cinematicSlowMotion() {
      if (game.classList.contains('slowmo-look')) return;
      game.classList.add('slowmo-look');
      const originalUpSpeed = config.upSpeed;
      config.upSpeed = originalUpSpeed * 0.55;
      setTimeout(() => {
        config.upSpeed = originalUpSpeed;
        game.classList.remove('slowmo-look');
      }, 520);
    }

    function cinematicCaptureFeedback(fishType, x, y) {
      cinematicHitHook();
      cinematicWave(x, y);

      if (fishType === 'gold') {
        cinematicFlashGold();
        cinematicShake();
        cinematicSlowMotion();
        cinematicBurst(x, y, 'gold');
      } else if (fishType === 'baiacu') {
        cinematicShake();
        cinematicBurst(x, y, 'bad');
      } else {
        cinematicBurst(x, y, 'normal');
      }
    }


    function getRanking() {
      try {
        return JSON.parse(localStorage.getItem('pescariaTop5') || '[]');
      } catch {
        return [];
      }
    }

    function saveRanking(ranking) {
      localStorage.setItem('pescariaTop5', JSON.stringify(ranking.slice(0, 5)));
    }

    function updateRanking(scoreValue) {
      const ranking = getRanking();
      const now = new Date();
      ranking.push({
        score: scoreValue,
        date: now.toLocaleDateString('pt-BR')
      });
      ranking.sort((a, b) => b.score - a.score);
      saveRanking(ranking);
      renderRanking();
    }

    function renderRanking() {
      const ranking = getRanking();

      if (bestScoreLineEl) {
        const best = ranking[0]?.score || 0;
        bestScoreLineEl.textContent = `Recorde: ${best}`;
      }

      if (!rankingListEl) return;

      if (!ranking.length) {
        rankingListEl.innerHTML = '<div class="ranking-empty">Nenhuma pescaria ainda</div>';
        return;
      }

      rankingListEl.innerHTML = ranking
        .slice(0, 5)
        .map((item, index) => `
          <div class="ranking-item">
            <span>${index + 1}. ${item.date}</span>
            <strong>${item.score}</strong>
          </div>
        `)
        .join('');
    }

    function updateRainbowTimer() {
      if (!rainbowTimerEl) return;

      if (freezeTimer > 0) {
        rainbowTimerEl.textContent = `Arco-íris: ${Math.ceil(freezeTimer)}s`;
        rainbowTimerEl.classList.add('show');
      } else {
        rainbowTimerEl.classList.remove('show');
      }
    }

    function showScorePop(value, x, y) {
      const img = document.createElement('img');
      img.className = 'score-pop';
      if (value === 100) {
        img.src = './assets/score-100.png';
      } else if (value === -50) {
        img.src = './assets/score-minus-50.png';
      } else {
        img.src = './assets/score-50.png';
      }
      img.alt = `+${value} pontos`;
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      game.appendChild(img);
      setTimeout(() => img.remove(), 700);
    }

    function checkCollisions() {
      const visualHookWorldY = hookWorldY + hookVisualOffsetY;
      fishes.forEach(fish => {
        if (fish.caught) return;
        const fishCenterX = fish.x + fish.width / 2;
        const fishCenterY = fish.y + fish.height / 2;
        const dx = hookWorldX - fishCenterX;
        const dy = visualHookWorldY - fishCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.hookCollisionRadius) {
          fish.caught = true;
          fish.el.classList.add('caught');

          const popX = hookWorldX;
          const popY = (hookWorldY + hookVisualOffsetY) - cameraY;
          flashHook();

          if (fish.type === 'rainbow') {
            freezeTimer += 5;
            freezeSpawnTimer = 0;
            comboStreak += 1;
            showFreezeBanner();
            showParticles(popX, popY, 100);
            playTone(980, 0.09, 'triangle', 0.06);
            setTimeout(() => playTone(1320, 0.1, 'triangle', 0.05), 80);
          } else {
            let earnedValue = fish.value;
            if (fish.value > 0) {
              comboStreak += 1;
              const multiplier = getComboMultiplier();
              earnedValue = Math.round(fish.value * multiplier);
              showComboPop(multiplier);
            } else {
              comboStreak = 0;
              lastMultiplier = 1;
            }

            score += earnedValue;
            cinematicCaptureFeedback(fish.type, popX, popY);
            showScorePop(fish.value, popX, popY);
            showParticles(popX, popY, earnedValue);
            playCatchSound(fish.value);
          }

          if (fish.type === 'gold') {
            goldCaught += 1;
          } else if (fish.type === 'normal') {
            normalCaught += 1;
          }
          updateHud();
        }
      });
    }

    function updateHud() {
      liveScore.textContent = score;
      liveFish.textContent = normalCaught + goldCaught;
    }

    function update(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
      lastTime = timestamp;

      hookWorldX += (targetX - hookWorldX) * config.horizontalEase;
      hookWorldX = clamp(hookWorldX, 22, gameWidth - 22);

      if (state === 'down') {
        hookWorldY += config.downSpeed * dt;
        hookVisualOffsetY = 0;
        targetVisualOffsetY = 0;
        if (hookWorldY >= config.maxDepth) {
          hookWorldY = config.maxDepth;
          state = 'up';
        }
      } else if (state === 'up') {
        if (freezeTimer > 0 && hookWorldY > config.endY + 90) {
          freezeTimer = Math.max(0, freezeTimer - dt);
          freezeSpawnTimer += dt;
          if (freezeSpawnTimer >= 0.45) {
            freezeSpawnTimer = 0;
            spawnBonusFish();
          }
        } else {
          hookWorldY -= config.upSpeed * dt;
        }

        if (verticalControlActive) {
          targetVisualOffsetY = clamp(targetVisualOffsetY, -config.verticalControlRange, config.verticalControlRange);
          hookVisualOffsetY += (targetVisualOffsetY - hookVisualOffsetY) * config.verticalEase;
        } else {
          hookVisualOffsetY += (0 - hookVisualOffsetY) * config.verticalEase;
          targetVisualOffsetY = hookVisualOffsetY;
        }

        checkCollisions();
        if (hookWorldY <= config.endY) {
          hookWorldY = config.endY;
          finishRound();
          return;
        }
      }

      updateFishes(dt);
      updateRainbowTimer();
      renderAll();
      animationId = requestAnimationFrame(update);
    }

    function startRound() {
      cancelAnimationFrame(animationId);
      resize();
      score = 0;
      normalCaught = 0;
      goldCaught = 0;
      comboStreak = 0;
      lastMultiplier = 1;
      freezeTimer = 0;
      freezeSpawnTimer = 0;
      updateHud();
      hookWorldX = gameWidth * config.rodTipXRatio;
      targetX = hookWorldX;
      hookWorldY = config.startY;
      hookVisualOffsetY = 0;
      targetVisualOffsetY = 0;
      verticalControlActive = false;
      cameraY = 0;
      state = 'down';
      lastTime = 0;
      startOverlay.classList.add('hidden');
      resultOverlay.classList.add('hidden');
      updateRainbowTimer();
      spawnFishes();
      renderAll();
      animationId = requestAnimationFrame(update);
    }

    function finishRound() {
      state = 'result';
      cancelAnimationFrame(animationId);

      const resultTitleImage = document.getElementById('resultTitleImage');

      if (resultTitleImage) {
        if (score < 1000) {
          resultTitleImage.src = './assets/resultado-vergonha.png';
          resultTitleImage.alt = 'Que vergonha!';
        } else if (score < 5000) {
          resultTitleImage.src = './assets/resultado-fraca.png';
          resultTitleImage.alt = 'Pescaria fraca!';
        } else if (score < 10000) {
          resultTitleImage.src = './assets/resultado-boa.png';
          resultTitleImage.alt = 'Boa pescaria!';
        } else {
          resultTitleImage.src = './assets/resultado-fartura.png';
          resultTitleImage.alt = 'Quanta fartura!';
        }
      }

      normalCountEl.textContent = normalCaught;
      goldCountEl.textContent = goldCaught;
      finalScoreEl.textContent = score;
      updateRanking(score);
      resultOverlay.classList.remove('hidden');
      renderAll();
    }

    function setTargetFromClientPosition(clientX, clientY) {
      const rect = game.getBoundingClientRect();
      targetX = clamp(clientX - rect.left, 22, gameWidth - 22);

      if (state === 'up') {
        const pointerScreenY = clientY - rect.top;
        const baseHookScreenY = hookWorldY - cameraY;
        targetVisualOffsetY = clamp(pointerScreenY - baseHookScreenY, -config.verticalControlRange, config.verticalControlRange);
        verticalControlActive = true;
      }
    }

    game.addEventListener('mousemove', event => {
      if (state === 'down' || state === 'up') setTargetFromClientPosition(event.clientX, event.clientY);
    });

    game.addEventListener('touchstart', event => {
      if (event.touches[0]) setTargetFromClientPosition(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: true });

    game.addEventListener('touchmove', event => {
      if (event.touches[0]) setTargetFromClientPosition(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('keydown', event => {
      if (state !== 'down' && state !== 'up') return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') targetX -= 52;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') targetX += 52;
      if (state === 'up' && (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w')) {
        targetVisualOffsetY = clamp(targetVisualOffsetY - 45, -config.verticalControlRange, config.verticalControlRange);
        verticalControlActive = true;
      }
      if (state === 'up' && (event.key === 'ArrowDown' || event.key.toLowerCase() === 's')) {
        targetVisualOffsetY = clamp(targetVisualOffsetY + 45, -config.verticalControlRange, config.verticalControlRange);
        verticalControlActive = true;
      }
      targetX = clamp(targetX, 22, gameWidth - 22);
    });

    startBtn.addEventListener('click', startRound);
    restartBtn.addEventListener('click', startRound);
    window.addEventListener('resize', resize);

    renderRanking();
    resize();
    renderAll();
  