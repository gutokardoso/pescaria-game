const game = document.getElementById('game');
    const coinDimOverlayEl = document.getElementById('coinDimOverlay');
    const world = document.getElementById('world');
    const hook = document.getElementById('hook');
    const fishingLine = document.getElementById('fishingLine');
    const liveScore = document.getElementById('liveScore');
    const liveFish = document.getElementById('liveFish');
    const depthMeter = document.getElementById('depthMeter');
    const depthNumberEl = document.getElementById('depthNumber');
    const startOverlay = document.getElementById('startOverlay');
    const resultOverlay = document.getElementById('resultOverlay');
    const startBtn = document.getElementById('startBtn');
    const preLevelOverlay = document.getElementById('preLevelOverlay');
    const preLevelPlayBtn = document.getElementById('preLevelPlayBtn');
    const preLevelPhaseEl = document.getElementById('preLevelPhase');
    const preLevelFishIconEl = document.getElementById('preLevelFishIcon');
    const preLevelFishGoalEl = document.getElementById('preLevelFishGoal');
    const preLevelScoreGoalEl = document.getElementById('preLevelScoreGoal');
    const restartBtn = document.getElementById('restartBtn');
    const normalCountEl = document.getElementById('normalCount');
    const goldCountEl = document.getElementById('goldCount');
    const giantCountEl = document.getElementById('giantCount');
    const bottleCountEl = document.getElementById('bottleCount');
    const chestCountEl = document.getElementById('chestCount');
    const depthProgressFill = document.getElementById('depthProgressFill');
    const finalScoreEl = document.getElementById('finalScore');
    const rainbowTimerEl = document.getElementById('rainbowTimer');
    const rankingListEl = document.getElementById('rankingList');
    const phaseNumberEl = document.getElementById('phaseNumber');
    const missionTextEl = document.getElementById('missionText');
    const missionResultTextEl = document.getElementById('missionResultText');
    const resultTitleImageEl = document.getElementById('resultTitleImage');
    const missionProgressFillEl = document.getElementById('missionProgressFill');
    const missionProgressLabelEl = document.getElementById('missionProgressLabel');

    let gameWidth = 0;
    let gameHeight = 0;
    let hookWorldX = 0;
    let hookWorldY = 0;
    let targetX = 0;
    let hookVisualOffsetY = 0;
    let targetVisualOffsetY = 0;
    let verticalControlActive = false;
    let cameraY = 0;
    let equippedShopEffects = { depth: 1, time: 1, hook: 1, line: 1, bait: null };
    let state = 'idle';
    let animationId = null;
    let fishes = [];
    let score = 0;
    let totalCoins = Number(localStorage.getItem('pescaria_total_coins') || 0);
    let phaseCoinsEarned = 0;
    let normalCaught = 0;
    let missionNormalCaught = 0;
    let missionGoldCaught = 0;
    let missionSpecialCaught = 0;
    let missionSeahorseCaught = 0;
    let missionTurtleCaught = 0;
    let missionSharkCaught = 0;
    let seahorseCaught = 0;
    let turtleCaught = 0;
    let sharkCaught = 0;
    let goldCaught = 0;
    let baiacuCaught = 0;
    let specialCaught = 0;
    let giantCaught = 0;
    let bottleCaught = 0;
    let chestCaught = 0;
    let currentPhase = getSavedPhase();
    let currentMission = createMission(currentPhase);
    let specialSpawnState = {
      bottle: 0,
      chest: 0,
      giant: 0,
      activeId: null,
      giantEnabled: false
    };
    let comboStreak = 0;
    let lastMultiplier = 1;
    let freezeTimer = 0;
    let freezeSpawnTimer = 0;
    let lastTime = 0;

    
    // Base futura para loja de melhorias:
    // Pontos servem para ranking.
    // Moedas servem para comprar barcos e anzóis melhores.
    // Profundidades maiores e áreas avançadas serão liberadas indiretamente pelos upgrades de barco/anzol, nunca por compra direta de profundidade/abismo.

    
    const SPECIAL_ITEM_ASSETS_V6 = {
      bottle: './assets/item-bottle.png',
      chest: './assets/item-chest.png',
      giant: './assets/fish-giant.png'
    };

    function getSpecialItemAssetV6(kind) {
      const key = String(kind || '').toLowerCase();
      if (key.includes('bottle') || key.includes('garrafa')) return SPECIAL_ITEM_ASSETS_V6.bottle;
      if (key.includes('chest') || key.includes('bau') || key.includes('baú')) return SPECIAL_ITEM_ASSETS_V6.chest;
      if (key.includes('giant') || key.includes('gigante')) return SPECIAL_ITEM_ASSETS_V6.giant;
      return SPECIAL_ITEM_ASSETS_V6.bottle;
    }

    function applySpecialItemVisualV6(element, kind) {
      if (!element) return;
      const src = getSpecialItemAssetV6(kind);
      element.style.backgroundImage = `url("${src}")`;
      element.style.backgroundSize = 'contain';
      element.style.backgroundPosition = 'center';
      element.style.backgroundRepeat = 'no-repeat';
      element.style.display = element.style.display || 'block';
      element.classList.add('special-item-v6');
    }

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
      ensureVisibleEntityAssetsV8();
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
    
    function ensureVisibleEntityAssetsV8() {
      try {
        document.querySelectorAll('.fish, .fish-sprite, .special-item, .special-sprite, .rare-animal-sprite, [data-fish-type], [data-special-kind], [data-item-kind]').forEach(el => {
          const raw = String(
            (el.dataset && (el.dataset.type || el.dataset.kind || el.dataset.fishType || el.dataset.specialKind || el.dataset.itemKind)) ||
            el.className ||
            ''
          ).toLowerCase();

          let src = '';
          if (raw.includes('bottle') || raw.includes('garrafa')) src = './assets/item-bottle.png';
          else if (raw.includes('chest') || raw.includes('bau') || raw.includes('baú')) src = './assets/item-chest.png';
          else if (raw.includes('giant') || raw.includes('gigante')) src = './assets/fish-giant.png';
          else if (raw.includes('rainbow') || raw.includes('arco')) src = './assets/fish-rainbow.png';
          else if (raw.includes('gold') || raw.includes('dourado')) src = './assets/fish-gold.png';
          else if (raw.includes('baiacu') || raw.includes('puffer')) src = './assets/fish-baiacu.png';
          else if (raw.includes('turtle') || raw.includes('tartaruga')) src = './assets/tartaruga-marinha.png';
          else if (raw.includes('seahorse') || raw.includes('cavalo')) src = './assets/cavalo-marinho.png';
          else if (raw.includes('shark') || raw.includes('tubarao') || raw.includes('tubarão')) src = './assets/tubarao.png';
          else if (raw.includes('fish')) src = './assets/fish-normal.png';

          if (!src) return;
          if (el.tagName === 'IMG') {
            if (!el.getAttribute('src')) el.setAttribute('src', src);
          } else if (!el.style.backgroundImage || el.style.backgroundImage === 'none') {
            el.style.backgroundImage = `url("${src}")`;
          }
          el.style.backgroundSize = 'contain';
          el.style.backgroundRepeat = 'no-repeat';
          el.style.backgroundPosition = 'center';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        });
      } catch (error) {}
    }

function renderAll() {
      applyRareAnimalSpawnRules();
      enforceSpecialVisibleSpawnZone();
      updateDepthNumber();
      applyEquipmentSpawnRules();
      applyMagnetAttraction();
      enforceGiantVisibleSpawnZone();
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
      registerMissionCapture(fishType);
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

    
    function playerNameForRankingV8() {
      try {
        const raw = localStorage.getItem('pescaria_player');
        if (raw) {
          const p = JSON.parse(raw);
          if (p && p.name) return p.name;
        }
      } catch(e) {}
      return 'Jogador';
    }

    function updateRanking(scoreValue) {
      const ranking = getRanking();
      const now = new Date();
      ranking.push({
        score: scoreValue,
        name: playerNameForRankingV8(),
        date: now.toLocaleDateString('pt-BR')
      });
      ranking.sort((a, b) => b.score - a.score);
      saveRanking(ranking);
      renderRanking();
    }

    function renderRanking() {
      const ranking = getRanking();
      //  é atualizada em finishRound().

      if (!rankingListEl) return;

      if (!ranking.length) {
        rankingListEl.innerHTML = '<div class="ranking-empty">Nenhuma pescaria ainda</div>';
        return;
      }

      rankingListEl.innerHTML = ranking
        .slice(0, 5)
        .map((item, index) => `
          <div class="ranking-item">
            <span>${index + 1}. ${item.name || item.playerName || item.date || 'Jogador'}</span>
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


    function getSavedPhase() {
      const saved = Number(localStorage.getItem('pescariaPhase') || 1);
      return Math.max(1, Math.min(199, saved || 1));
    }

    function savePhase(phase) {
      localStorage.setItem('pescariaPhase', String(Math.max(1, Math.min(199, phase))));
    }


    function createMission(phase) {
      const safePhase = Math.max(1, Number(phase || 1));

      // Limites calibrados para serem possíveis dentro de uma rodada.
      const maxNormalFish = 35;
      const maxGoldFish = 14;
      const maxSpecialItems = 3;
      const maxScoreGoal = 12000;

      const normalTarget = Math.min(maxNormalFish, 6 + Math.floor(safePhase / 4));
      const goldTarget = Math.min(maxGoldFish, 3 + Math.floor(safePhase / 5));
      const specialTarget = Math.min(maxSpecialItems, 1 + Math.floor(safePhase / 40));
      const scoreTarget = Math.min(maxScoreGoal, Math.round((2500 + safePhase * 180) / 500) * 500);

      if (safePhase % 10 === 0) {
        return {
          type: 'special',
          target: specialTarget,
          label: `Pegue ${specialTarget} ${specialTarget === 1 ? 'item especial' : 'itens especiais'}`
        };
      }

      if (safePhase % 3 === 0) {
        return {
          type: 'score',
          target: scoreTarget,
          label: `Faça ${scoreTarget.toLocaleString('pt-BR')} pontos`
        };
      }

      if (safePhase % 2 === 0) {
        return {
          type: 'gold',
          target: goldTarget,
          label: `Pegue ${goldTarget} ${goldTarget === 1 ? 'peixe dourado' : 'peixes dourados'}`
        };
      }

      return {
        type: 'normal',
        target: normalTarget,
        label: `Pegue ${normalTarget} peixes`
      };
    }

    function updateMissionHud() {
      if (phaseNumberEl) phaseNumberEl.textContent = currentPhase;
      if (missionTextEl) missionTextEl.textContent = currentMission.label;
      updateMissionProgress();
    }

    function checkMissionComplete() {
      return isPhaseCaptureComplete() && isPhaseScoreComplete();
    }



    function getPhaseCaptureGoalForPhase(phase) {
      return getPreLevelFishGoalForPhase(phase);
    }

    function getPhaseScoreRequiredForPhase(phase) {
      return getPreLevelScoreGoalForPhase(phase);
    }

    function getPhaseCaptureProgress() {
      const goal = getPhaseCaptureGoalForPhase(currentPhase);

      if (goal.type === 'normal') {
        return Math.min(goal.target, missionNormalCaught || 0);
      }

      if (goal.type === 'gold') {
        return Math.min(goal.target, missionGoldCaught || 0);
      }

      if (goal.type === 'special') {
        return Math.min(goal.target, missionSpecialCaught || 0);
      }

      if (goal.type === 'seahorse') {
        return Math.min(goal.target, missionSeahorseCaught || 0);
      }

      if (goal.type === 'turtle') {
        return Math.min(goal.target, missionTurtleCaught || 0);
      }

      if (goal.type === 'shark') {
        return Math.min(goal.target, missionSharkCaught || 0);
      }

      return 0;
    }

    function isPhaseCaptureComplete() {
      const goal = getPhaseCaptureGoalForPhase(currentPhase);
      return getPhaseCaptureProgress() >= goal.target;
    }

    function isPhaseScoreComplete() {
      return score >= getPhaseScoreRequiredForPhase(currentPhase);
    }



    let lockedMissionProgressSnapshot = null;
    let finalMissionResultSnapshot = null;

    function lockMissionProgressSnapshot() {
      lockedMissionProgressSnapshot = getMissionProgress();
    }

    function unlockMissionProgressSnapshot() {
      lockedMissionProgressSnapshot = null;
    }


    function lockFinalMissionResultSnapshot(phaseScoreValue) {
      try {
        const phaseForResult = currentPhase;
        const captureGoal = typeof getPhaseCaptureGoalForPhase === 'function'
          ? getPhaseCaptureGoalForPhase(phaseForResult)
          : { label: 'Complete a missão', target: 1, type: 'normal' };

        const captureProgress = typeof getPhaseCaptureProgress === 'function'
          ? getPhaseCaptureProgress()
          : 0;

        const scoreTarget = typeof getPhaseScoreRequiredForPhase === 'function'
          ? getPhaseScoreRequiredForPhase(phaseForResult)
          : 0;

        const scoreValue = Number.isFinite(Number(phaseScoreValue)) ? Number(phaseScoreValue) : score;

        finalMissionResultSnapshot = {
          phase: phaseForResult,
          captureGoal: captureGoal ? { ...captureGoal } : { label: 'Complete a missão', target: 1, type: 'normal' },
          captureProgress: Number(captureProgress || 0),
          scoreTarget: Number(scoreTarget || 0),
          scoreValue: Number(scoreValue || 0)
        };
      } catch (error) {
        finalMissionResultSnapshot = null;
      }
    }

    function clearFinalMissionResultSnapshot() {
      finalMissionResultSnapshot = null;
    }



    function getMissionProgress() {
      const goal = getPhaseCaptureGoalForPhase(currentPhase);
      return {
        current: getPhaseCaptureProgress(),
        target: goal.target,
        label: goal.text
      };
    }
function registerCaptureForMission(kind) {
      if (kind === 'normal') normalCaught += 1;
      if (kind === 'gold') goldCaught += 1;
      if (kind === 'giant') {
        giantCaught += 1;
        specialCaught += 1;
      }
      if (kind === 'bottle') {
        bottleCaught += 1;
        specialCaught += 1;
      }
      if (kind === 'chest') {
        chestCaught += 1;
        specialCaught += 1;
      }
      refreshMissionProgressSoon();
    }

    function normalizeCapturedKind(item) {
      if (!item) return 'normal';

      const raw = String(
        item.missionType ||
        item.kind ||
        item.type ||
        item.variant ||
        item.name ||
        item.id ||
        item.src ||
        ''
      ).toLowerCase();

      if (raw.includes('gold') || raw.includes('dourado')) return 'gold';
      if (raw.includes('giant') || raw.includes('gigante')) return 'giant';
      if (raw.includes('bottle') || raw.includes('garrafa')) return 'bottle';
      if (raw.includes('chest') || raw.includes('bau') || raw.includes('baú')) return 'chest';
      if (raw.includes('seahorse') || raw.includes('cavalo')) return 'seahorse';
      if (raw.includes('turtle') || raw.includes('tartaruga')) return 'turtle';
      if (raw.includes('shark') || raw.includes('tubar')) return 'shark';
      if (raw.includes('special')) return 'special';

      return 'normal';
    }


    function playGiantImpactSound() {
      try {
        if (typeof initAudio === 'function') initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(92, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.24);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.36);

        const thump = audioCtx.createOscillator();
        const thumpGain = audioCtx.createGain();

        thump.type = 'sine';
        thump.frequency.setValueAtTime(38, now);
        thumpGain.gain.setValueAtTime(0.0001, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.24, now + 0.015);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        thump.connect(thumpGain);
        thumpGain.connect(audioCtx.destination);

        thump.start(now);
        thump.stop(now + 0.2);
      } catch (error) {}
    }


    function getVisibleGameBounds() {
      const rect = game && game.getBoundingClientRect ? game.getBoundingClientRect() : { width: window.innerWidth || 390, height: window.innerHeight || 844 };
      return {
        width: rect.width || window.innerWidth || 390,
        height: rect.height || window.innerHeight || 844
      };
    }


    function enforceGiantVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : (typeof fishList !== 'undefined' ? fishList : []);
      if (!Array.isArray(list)) return;

      const bounds = getVisibleGameBounds();
      const maxY = bounds.height * 0.42;

      list.forEach(fish => {
        if (fish && fish.caught && (fish.type === 'seahorse' || fish.type === 'turtle' || fish.type === 'shark')) triggerRareAnimalCatchFeedback(fish);
        if (!fish || fish.type !== 'giant') return;

        const outOfSafeY = fish.y > maxY || fish.y < bounds.height * 0.12;
        const outOfSafeX = fish.x < 30 || fish.x > bounds.width - 30;

        if (outOfSafeY || outOfSafeX || !fish._giantSafePositioned) {
          clampGiantSpawnPosition(fish);
          fish._giantSafePositioned = true;
          if (!fish._giantAnnounced) { fish._giantAnnounced = true; announceGiantSpawn(); }
        }

        // Mantém o gigante mais tempo visível e mais lento.
        if (fish.vx) fish.vx = Math.sign(fish.vx) * Math.min(Math.abs(fish.vx), 1.15);
      });
    }



    function clampSpecialSpawnPosition(item) {
      if (!item) return item;

      const raw = String(item.type || item.kind || item.name || item.id || '').toLowerCase();
      const isSpecial = raw.includes('giant') || raw.includes('bottle') || raw.includes('chest') || raw.includes('special') || raw.includes('garrafa') || raw.includes('bau') || raw.includes('baú');
      if (!isSpecial) return item;

      const bounds = getVisibleGameBounds ? getVisibleGameBounds() : { width: window.innerWidth || 390, height: window.innerHeight || 844 };
      const marginX = Math.max(54, bounds.width * 0.12);
      const safeTop = Math.max(145, bounds.height * 0.20);
      const safeBottom = Math.max(safeTop + 60, bounds.height * 0.55);

      item.x = marginX + Math.random() * Math.max(1, bounds.width - marginX * 2);
      item.y = safeTop + Math.random() * Math.max(1, safeBottom - safeTop);

      if (item.vx) item.vx = Math.sign(item.vx) * Math.min(Math.abs(item.vx), 1.25);
      if (item.speed) item.speed = Math.min(item.speed, 1.25);

      item._safeSpecialPositioned = true;
      return item;
    }

    function enforceSpecialVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      const bounds = getVisibleGameBounds ? getVisibleGameBounds() : { width: window.innerWidth || 390, height: window.innerHeight || 844 };
      const maxY = bounds.height * 0.62;
      const minY = bounds.height * 0.14;

      list.forEach(item => {
        if (!item) return;
        const raw = String(item.type || item.kind || item.name || item.id || '').toLowerCase();
        const isSpecial = raw.includes('giant') || raw.includes('bottle') || raw.includes('chest') || raw.includes('special') || raw.includes('garrafa') || raw.includes('bau') || raw.includes('baú');
        if (!isSpecial) return;

        const outY = Number(item.y || 0) > maxY || Number(item.y || 0) < minY;
        const outX = Number(item.x || 0) < 28 || Number(item.x || 0) > bounds.width - 28;

        if (outY || outX || !item._safeSpecialPositioned) {
          clampSpecialSpawnPosition(item);
        }
      });
    }


    function clampGiantSpawnPosition(fish) {
      if (!fish || fish.type !== 'giant') clampSpecialSpawnPosition(fish);
      fish._giantSafePositioned = true;
      return fish;

      const bounds = getVisibleGameBounds();
      const marginX = Math.max(60, bounds.width * 0.14);
      const topLimit = Math.max(130, bounds.height * 0.18);
      const bottomLimit = Math.max(topLimit + 40, bounds.height * 0.34);

      const safeY = topLimit + Math.random() * Math.max(1, bottomLimit - topLimit);
      const safeX = marginX + Math.random() * Math.max(1, bounds.width - marginX * 2);

      fish.x = safeX;
      fish.y = safeY;
      fish.vx = fish.vx ? Math.sign(fish.vx) * Math.min(Math.abs(fish.vx), 1.15) : (Math.random() < 0.5 ? -1.05 : 1.05);
      fish.speed = Math.min(fish.speed || 1.15, 1.15);
      fish.visibleLife = Math.max(fish.visibleLife || 0, 4200);
      fish.minVisibleUntil = performance.now ? performance.now() + 4200 : Date.now() + 4200;

      return fish;
    }

    

function announceGiantSpawn() {
  try {
    showGiantSpawnWarningV12();
  } catch (error) {}

  try {
    if (typeof initAudio === 'function') initAudio();
    if (audioCtx) {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(72, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.10, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    }
  } catch (error) {}
}



    function triggerGiantImpactFeedback() {
      const target = document.getElementById('game') || document.body;
      if (target) {
        target.classList.remove('giant-impact-shake');
        void target.offsetWidth;
        target.classList.add('giant-impact-shake');
        setTimeout(() => target.classList.remove('giant-impact-shake'), 460);
      }

      playGiantImpactSound();
    }


    function registerMissionCapture(itemOrKind) {
      
      playRareAnimalScoreIfNeeded(itemOrKind);
      const kind = typeof itemOrKind === 'string' ? itemOrKind : normalizeCapturedKind(itemOrKind);

      if (kind === 'giant') {
        
      }

      if (kind === 'gold') {
        missionGoldCaught += 1;
      } else if (kind === 'bottle' || kind === 'chest') {
        missionSpecialCaught += 1;
      } else if (kind === 'seahorse') {
        missionSeahorseCaught += 1;
      } else if (kind === 'turtle') {
        missionTurtleCaught += 1;
      } else if (kind === 'shark') {
        missionSharkCaught += 1;
      } else if (kind === 'normal') {
        missionNormalCaught += 1;
      }

      if (typeof updateMissionProgress === 'function') {
        updateMissionProgress();
      }
    }


    function refreshMissionProgressSoon() {
      if (typeof updateMissionProgress === 'function') {
        updateMissionProgress();
      }
    }


    function getCurrentPhaseDepthMeters() {
      const baseDepth = typeof maxDepth !== 'undefined'
        ? Number(maxDepth || 0)
        : (typeof targetDepth !== 'undefined' ? Number(targetDepth || 0) : Math.round(300 * getDepthMultiplier()));

      return Math.max(1, Math.round(baseDepth || (300 * getDepthMultiplier())));
    }

    function getCurrentDisplayDepthMeters() {
      const totalDepth = getCurrentPhaseDepthMeters();

      let progressRatio = 0;

      if (typeof depthProgress !== 'undefined') {
        progressRatio = Number(depthProgress || 0);
      } else if (typeof currentDepth !== 'undefined') {
        progressRatio = Number(currentDepth || 0) / totalDepth;
      } else if (typeof hookDepth !== 'undefined') {
        progressRatio = Number(hookDepth || 0) / totalDepth;
      } else if (depthProgressFill && depthProgressFill.style && depthProgressFill.style.height) {
        progressRatio = parseFloat(depthProgressFill.style.height) / 100;
      }

      if (!Number.isFinite(progressRatio)) progressRatio = 0;
      progressRatio = Math.max(0, Math.min(1, progressRatio));

      // Na descida: 0m -> profundidade máxima.
      // Na subida: profundidade máxima -> 0m.
      const isReturning = typeof phase === 'string'
        ? (phase === 'up' || phase === 'returning' || phase === 'reel' || phase === 'reeling')
        : (typeof isAscending !== 'undefined' ? Boolean(isAscending) : false);

      const displayRatio = isReturning ? (1 - progressRatio) : progressRatio;
      return Math.max(0, Math.round(totalDepth * displayRatio));
    }




    
    function keepHeaderVisibleOnResultV13() { return; }


    function updateHudScopeV15() { try { updateHUDVisibilityV19(); } catch(error) {} }


function updateHudScopeV17() { try { updateHUDVisibilityV19(); } catch(error) {} }


function hardHideHudOutsideGameV18() { try { updateHUDVisibilityV19(); } catch(error) {} }


function getCurrentScreenV19() {
  try {
    const body = document.body;
    if (body.classList.contains('screen-playing')) return 'playing';
    if (body.classList.contains('screen-start')) return 'start';
    if (body.classList.contains('screen-prelevel')) return 'prelevel';
    if (body.classList.contains('screen-result')) return 'result';
    if (body.classList.contains('screen-shop')) return 'shop';
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

function setHudModeV19(mode) {
  try {
    const body = document.body;
    body.classList.remove('hud-coin-counting', 'hud-force-hidden');

    if (mode === 'coin') {
      body.classList.add('hud-coin-counting');
    } else if (mode === 'hidden') {
      body.classList.add('hud-force-hidden');
    }

    updateHUDVisibilityV19();
  } catch (error) {}
}

function updateHUDVisibilityV19() {
  try {
    const body = document.body;
    const isGame = body.classList.contains('screen-playing');
    const isCoin = body.classList.contains('hud-coin-counting');
    const show = isGame || isCoin;

    const ids = ['missionProgress', 'liveScore', 'liveFish', 'depthMeter', 'depthNumber'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const visible = show && (id !== 'depthMeter' && id !== 'depthNumber' ? true : isGame);
      const displayValue = id === 'missionProgress' || id === 'depthMeter' || id === 'depthNumber' ? 'block' : 'flex';

      el.style.setProperty('display', visible ? displayValue : 'none', 'important');
      el.style.setProperty('visibility', visible ? 'visible' : 'hidden', 'important');
      el.style.setProperty('opacity', visible ? '1' : '0', 'important');
      el.style.setProperty('pointer-events', visible ? 'auto' : 'none', 'important');
    });
  } catch (error) {}
}

function setGameScreen(screenName) {
      document.body.classList.remove('screen-start', 'screen-prelevel', 'screen-playing', 'screen-result', 'screen-shop');
      document.body.classList.add(`screen-${screenName}`);
      if (screenName !== 'playing') document.body.classList.remove('hud-coin-counting');
      updateHUDVisibilityV19();
      hardHideHudOutsideGameV18();
      updateHudScopeV17();
      updateHudScopeV16();
      updateHudScopeV15();

      const isPlaying = screenName === 'playing';
      setDepthUiVisible(isPlaying);
      setMissionUiVisible(isPlaying || document.body.classList.contains('hud-coin-counting'));

      if (typeof updateShopButtonVisibility === 'function') {
        updateShopButtonVisibility();
      }
    }

    function forceHudLayout() {
      const mission = document.getElementById('missionProgress');
      const score = document.getElementById('liveScore');

      if (mission) {
        mission.style.setProperty('position', 'absolute', 'important');
        mission.style.setProperty('left', '10px', 'important');
        mission.style.setProperty('top', '10px', 'important');
        mission.style.setProperty('right', 'auto', 'important');
        mission.style.setProperty('bottom', 'auto', 'important');
        mission.style.setProperty('width', '230px', 'important');
        mission.style.setProperty('min-width', '230px', 'important');
        mission.style.setProperty('max-width', '230px', 'important');
        mission.style.setProperty('height', 'auto', 'important');
        mission.style.setProperty('aspect-ratio', '1307 / 548', 'important');
        mission.style.setProperty('display', (document.body.classList.contains('screen-playing') || document.body.classList.contains('hud-coin-counting')) ? 'block' : 'none', 'important');
        mission.style.setProperty('visibility', (document.body.classList.contains('screen-playing') || document.body.classList.contains('hud-coin-counting')) ? 'visible' : 'hidden', 'important');
        mission.style.setProperty('opacity', (document.body.classList.contains('screen-playing') || document.body.classList.contains('hud-coin-counting')) ? '1' : '0', 'important');
        mission.style.setProperty('overflow', 'visible', 'important');
        mission.style.setProperty('background', "transparent url('./assets/hud-missao-perfil-final.png') left top / contain no-repeat", 'important');
        mission.style.setProperty('border', '0', 'important');
        mission.style.setProperty('outline', '0', 'important');
        mission.style.setProperty('box-shadow', 'none', 'important');
        mission.style.setProperty('border-radius', '0', 'important');
        mission.style.setProperty('padding', '0', 'important');
        mission.style.setProperty('margin', '0', 'important');
        mission.style.setProperty('transform', 'none', 'important');
        mission.style.setProperty('z-index', '120', 'important');
        mission.style.setProperty('pointer-events', 'none', 'important');
      }

      if (score) {
        score.style.left = '50%';
        score.style.right = 'auto';
        score.style.top = '38px';
        score.style.transform = 'translateX(-50%)';
        score.style.textAlign = 'center';
      }
    }


    function isGameplayVisible() {
      return document.body.classList.contains('screen-playing') && state !== 'result' && state !== 'start';
    }

    function setMissionUiVisible(isVisible) {
      const missionEl = document.getElementById('missionProgress');
      if (missionEl) missionEl.classList.toggle('mission-ui-hidden', !isVisible);
    }

    function refreshGameplayUiVisibility() {
      const visible = isGameplayVisible();
      setDepthUiVisible(visible);
      setMissionUiVisible(visible);
      updateShopButtonVisibility && updateShopButtonVisibility();
    }


    function setDepthUiVisible(isVisible) {
      const depthEls = [
        document.getElementById('depthNumber'),
        document.getElementById('depthMeter')
      ];

      depthEls.forEach(el => {
        if (el) el.classList.toggle('depth-ui-hidden', !isVisible);
      });
    }


    function updateDepthNumber() {
      if (!depthNumberEl) return;
      const gameStarted = isGameplayVisible();
      setDepthUiVisible(gameStarted);
      if (!gameStarted) return;
      depthNumberEl.textContent = `${getCurrentDisplayDepthMeters()}m`;
    }



    function getCompactMissionHudLabel(progress) {
      const type = progress && progress.type ? progress.type : (currentMission && currentMission.type);
      if (type === 'seahorse') return 'Cavalos-marinhos';
      if (type === 'turtle') return 'Tartarugas';
      if (type === 'shark') return 'Tubarões';
      if (type === 'gold') return 'Peixes dourados';
      if (type === 'special') return 'Itens especiais';
      if (type === 'score') return 'Pontos';
      return 'Peixes';
    }

    function updateMissionProgress() {
      forceHudLayout();
      const progressFill = document.getElementById('missionProgressFill');
      const progressLabel = document.getElementById('missionProgressLabel');
      if (!progressFill || !progressLabel) return;
      if (document.body.classList.contains('screen-playing') || document.body.classList.contains('hud-coin-counting')) setMissionUiVisible(true);

      const progress = lockedMissionProgressSnapshot || getMissionProgress();
      const pct = progress.target > 0 ? Math.min(100, (progress.current / progress.target) * 100) : 0;

      progressFill.style.width = `${pct}%`;
      const hudLabel = getCompactMissionHudLabel(progress);
      progressLabel.textContent = `${hudLabel}: ${progress.current}/${progress.target}`;
    }

    function advanceOrRepeatPhase() {
      const completed = checkMissionComplete();
      const completedPhase = currentPhase;

      if (completed) {
        currentPhase = Math.min(199, currentPhase + 1);
        savePhase(currentPhase);
      }

      if (missionResultTextEl) {
        missionResultTextEl.classList.remove('success', 'fail');
        missionResultTextEl.classList.add(completed ? 'success' : 'fail');
        missionResultTextEl.textContent = completed
          ? `Fase ${completedPhase} concluída!`
          : `Fase ${completedPhase} não concluída!`;
      }

      currentMission = createMission(currentPhase);
      updateMissionHud();
    }

    function syncSpecialSpawnState() {
      if (specialSpawnState.activeId === null) return;

      const active = fishes.find(fish => fish.id === specialSpawnState.activeId && !fish.caught);
      if (!active) {
        specialSpawnState.activeId = null;
        return;
      }

      const screenX = active.x;
      const screenY = active.y - cameraY;
      const outside =
        screenX < -340 ||
        screenX > gameWidth + 340 ||
        screenY < -240 ||
        screenY > gameHeight + 240;

      if (outside) {
        active.caught = true;
        if (active.el) active.el.remove();
        specialSpawnState.activeId = null;
      }
    }


    function spawnForcedSpecialMissionItem(type) {
      const itemType = type === 'chest' ? 'chest' : 'bottle';
      const item = itemType === 'chest'
        ? { type: 'chest', value: 500, width: 92, height: 70 }
        : { type: 'bottle', value: 250, width: 62, height: 82 };

      const el = document.createElement('div');
      el.className = `special-item ${item.type}`;
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;
      const safeTop = Math.max(145, gameHeight * 0.30);
      const safeBottom = Math.min(gameHeight - 145, gameHeight * 0.64);
      const screenY = safeTop + Math.random() * Math.max(40, safeBottom - safeTop);
      const id = `${item.type}-mission-${Date.now()}-${Math.random()}`;

      fishes.push({
        id,
        el,
        x: dir === 1 ? -180 : gameWidth + 180,
        y: cameraY + screenY,
        speed: (88 + Math.random() * 45) * dir,
        dir,
        width: item.width,
        height: item.height,
        type: item.type,
        value: item.value,
        caught: false,
        special: true,
        missionForced: true
      });

      
      if (item && item.type === 'giant') notifyGiantSpawnV12(fishes[fishes.length - 1]);
      if (item && item.type === 'giant') 
      specialSpawnState[item.type] += 1;
      specialSpawnState.activeId = id;
    }

    function ensureMissionSpecialVisible() {
      const goal = getPhaseCaptureGoalForPhase(currentPhase);
      if (!goal || goal.type !== 'special') return false;
      if (missionSpecialCaught >= goal.target) return false;

      const visibleSpecial = fishes.some(fish =>
        !fish.caught && (fish.type === 'chest' || fish.type === 'bottle')
      );

      if (visibleSpecial || specialSpawnState.activeId !== null) return true;

      const preferred = specialSpawnState.bottle <= specialSpawnState.chest ? 'bottle' : 'chest';
      spawnForcedSpecialMissionItem(preferred);
      return true;
    }




    
function showGiantQuickNotice() {
  if (typeof announceGiantSpawn === 'function') {
    announceGiantSpawn();
  }
}



    function spawnGuaranteedGiantFish() {
      if (!specialSpawnState.giantEnabled || specialSpawnState.giant >= 1 || specialSpawnState.activeId !== null) return false;

      const visibleGiant = fishes.some(fish => !fish.caught && fish.type === 'giant');
      if (visibleGiant) return true;

      const progress = Math.max(0, Math.min(1, hookWorldY / config.maxDepth));
      if (progress < 0.20) return false;

      const el = document.createElement('div');
      el.className = 'fish giant';
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;

      // O gigante nasce sempre no topo/meio visível, nunca no fundo ou canto impossível.
      const safeTop = Math.max(135, gameHeight * 0.24);
      const safeBottom = Math.min(gameHeight - 180, gameHeight * 0.52);
      const screenY = safeTop + Math.random() * Math.max(30, safeBottom - safeTop);

      const id = `giant-guaranteed-${Date.now()}-${Math.random()}`;
      fishes.push({
        id,
        el,
        x: dir === 1 ? -260 : gameWidth + 260,
        y: cameraY + screenY,
        speed: (62 + Math.random() * 22) * dir,
        dir,
        width: 190,
        height: 116,
        type: 'giant',
        value: 1500,
        caught: false,
        special: true,
        missionForced: true,
        guaranteedGiant: true
      });

      specialSpawnState.giant += 1;
      specialSpawnState.activeId = id;
      if (typeof showGiantQuickNotice === 'function') showGiantQuickNotice();
      return true;
    }



    function releaseStaleGiantActiveId() {
      if (!specialSpawnState.activeId) return;
      const active = fishes.find(fish => fish.id === specialSpawnState.activeId && !fish.caught);
      if (!active) {
        specialSpawnState.activeId = null;
        return;
      }

      const screenY = active.y - cameraY;
      const farAway =
        active.x < -420 ||
        active.x > gameWidth + 420 ||
        screenY < -260 ||
        screenY > gameHeight + 260;

      if (farAway) {
        if (active.el) active.el.remove();
        active.caught = true;
        specialSpawnState.activeId = null;
      }
    }


    function maybeSpawnSpecialItems() {
      releaseStaleGiantActiveId();
      if (spawnGuaranteedGiantFish()) return;
      if (ensureMissionSpecialVisible()) return;

      const visibleSpecial = fishes.some(fish =>
        !fish.caught && (fish.type === 'chest' || fish.type === 'bottle' || fish.type === 'giant')
      );

      if (visibleSpecial || specialSpawnState.activeId !== null) return;

      const progress = Math.max(0, Math.min(1, hookWorldY / config.maxDepth));
      const candidates = [];

      if (
        specialSpawnState.bottle < 2 &&
        ((specialSpawnState.bottle === 0 && progress > 0.22) ||
         (specialSpawnState.bottle === 1 && progress > 0.60))
      ) {
        candidates.push({ type: 'bottle', value: 250, width: 62, height: 82, chance: 0.05 });
      }

      if (specialSpawnState.chest < 1 && progress > 0.42 && progress < 0.82) {
        candidates.push({ type: 'chest', value: 500, width: 92, height: 70, chance: 0.035 });
      }

      if (specialSpawnState.giant < 1 && specialSpawnState.giantEnabled && progress > 0.18) {
        candidates.push({ type: 'giant', value: 1500, width: 190, height: 116, chance: 0.65 });
      }

      if (!candidates.length) return;

      const item = candidates.find(candidate => Math.random() <= candidate.chance);
      if (!item) return;

      const el = document.createElement('div');
      el.className = item.type === 'giant' ? 'fish giant' : `special-item ${item.type}`;
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;

      // Sempre aparece na faixa central e alcançável da tela.
      // Evita topo, rodapé e regiões fora do alcance do anzol.
      const safeTop = Math.max(145, gameHeight * 0.32);
      const safeBottom = Math.min(gameHeight - 150, gameHeight * 0.68);
      const safeMiddle = (safeTop + safeBottom) / 2;
      const safeRange = Math.max(40, (safeBottom - safeTop) * 0.38);
      const screenY = safeMiddle + (Math.random() * safeRange * 2 - safeRange);

      // Nasce vindo das laterais, mas cruza a região central da tela.
      const id = `${item.type}-${Date.now()}-${Math.random()}`;

      fishes.push({
        id,
        el,
        x: dir === 1 ? -260 : gameWidth + 260,
        y: cameraY + screenY,
        speed: (item.type === 'giant' ? 42 : 76 + Math.random() * 54) * dir,
        dir,
        width: item.width,
        height: item.height,
        type: item.type,
        value: item.value,
        caught: false,
        special: true
      });

      specialSpawnState[item.type] += 1;
      specialSpawnState.activeId = id;
    }

    function showScorePop(value, x, y) {
      const img = document.createElement('img');
      img.className = 'score-pop';

      if (value === 1500) {
        img.src = './assets/score-1500.png';
        img.classList.add('special-score-img');
        img.alt = '+1500 pontos';
      } else if (value === 250) {
        img.src = './assets/score-250.png';
        img.classList.add('special-score-img');
        img.alt = '+250 pontos';
      } else if (value === 500) {
        img.src = './assets/score-500.png';
        img.classList.add('special-score-img');
        img.alt = '+500 pontos';
      } else if (value === 1000) {
        img.src = './assets/score-1000.png';
        img.classList.add('special-score-img');
        img.alt = '+1000 pontos';
      } else if (value === 100) {
        img.src = './assets/score-100.png';
        img.alt = '+100 pontos';
      } else if (value === -50) {
        img.src = './assets/score-minus-50.png';
        img.alt = '-50 pontos';
      } else {
        img.src = './assets/score-50.png';
        img.alt = '+50 pontos';
      }

      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      game.appendChild(img);
      setTimeout(() => img.remove(), 700);
    }

    /* v12 - sistema definitivo do peixe gigante:
       - Aviso aparece no spawn/entrada.
       - Captura mostra somente a pontuação visual 1500.
       - Sem pontuação duplicada. */
    function getGameVisualContainerV12() {
      return document.getElementById('game') ||
        document.getElementById('world') ||
        document.getElementById('gameScreen') ||
        document.querySelector('.game-screen') ||
        document.querySelector('.game-area') ||
        document.body;
    }

    function showGiantSpawnWarningV12() {
      try {
        const container = getGameVisualContainerV12();
        if (!container) return;

        document.querySelectorAll('.giant-alert-v12, .giant-alert-v11, .giant-alert-v10, .giant-spawn-alert, .giant-quick-notice').forEach(el => el.remove());

        const alert = document.createElement('img');
        alert.src = './assets/aviso-gigante.png';
        alert.alt = 'Peixe gigante!';
        alert.className = 'giant-alert-v12';
        alert.style.position = 'absolute';
        alert.style.left = '50%';
        alert.style.top = '28%';
        alert.style.width = 'min(72%, 430px)';
        alert.style.transform = 'translate(-50%, -50%)';
        alert.style.zIndex = '2147483646';
        alert.style.pointerEvents = 'none';
        alert.style.animation = 'giantAlertV12 1.35s ease-out forwards';

        container.appendChild(alert);
        setTimeout(() => alert.remove(), 1450);
      } catch (error) {
        console.warn('Erro ao mostrar aviso do peixe gigante:', error);
      }
    }

    function showGiantScore1500V12(fish) {
      try {
        const container = getGameVisualContainerV12();
        if (!container) return;

        const x = fish && Number.isFinite(Number(fish.x)) ? Number(fish.x) : hookWorldX;
        const y = fish && Number.isFinite(Number(fish.y)) ? (Number(fish.y) - cameraY) : ((hookWorldY || 0) - (cameraY || 0));

        const scoreImg = document.createElement('img');
        scoreImg.src = './assets/score-1500.png';
        scoreImg.alt = '+1500';
        scoreImg.className = 'giant-score-v12';
        scoreImg.style.position = 'absolute';
        scoreImg.style.left = `${x}px`;
        scoreImg.style.top = `${y}px`;
        scoreImg.style.width = '128px';
        scoreImg.style.transform = 'translate(-50%, -50%)';
        scoreImg.style.zIndex = '2147483645';
        scoreImg.style.pointerEvents = 'none';
        scoreImg.style.animation = 'giantScoreV12 1s ease-out forwards';

        container.appendChild(scoreImg);
        setTimeout(() => scoreImg.remove(), 1100);
      } catch (error) {
        console.warn('Erro ao mostrar score 1500 do peixe gigante:', error);
      }
    }

    function notifyGiantSpawnV12(fish) {
      try {
        if (fish && fish.__giantSpawnWarningShownV12) return;
        if (fish) fish.__giantSpawnWarningShownV12 = true;

        showGiantSpawnWarningV12();

        // Mantém o som já existente do projeto, sem depender dele para mostrar o aviso.
        try {
          if (typeof playGiantImpactSound === 'function') playGiantImpactSound();
          else if (typeof announceGiantSpawn === 'function') announceGiantSpawn();
          else if (typeof showGiantQuickNotice === 'function') showGiantQuickNotice();
        } catch (error) {}
      } catch (error) {}
    }

    function notifyGiantCaptureScoreV12(fish) {
      try {
        if (fish && fish.__giantScore1500ShownV12) return;
        if (fish) fish.__giantScore1500ShownV12 = true;
        showGiantScore1500V12(fish);
      } catch (error) {}
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

          if (fish.type === 'chest' || fish.type === 'bottle' || fish.type === 'giant') {
            setTimeout(() => fish.el.remove(), 190);
            specialSpawnState.activeId = null;
          }

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

            if (fish.type === 'giant') {
              
              fish.value = 1500;
              fish.baseValue = 1500;
              fish.normalValue = 0;

              if (!canScoreGiantOnce(fish)) {
                return;
              }

              notifyGiantCaptureScoreV12(fish);

              if (typeof giantCaptureNoFreeze === 'function') {
                giantCaptureNoFreeze(fish);
              } else if (typeof triggerGiantImpactFeedback === 'function') {
                triggerGiantImpactFeedback(fish);
              } else {
                showScorePop(1500, popX, popY);
              }

              showParticles(popX, popY, 1500);
              playCatchSound(1500);
              markGiantCollectedAndSafe(fish);
            } else {
              showScorePop(fish.value, popX, popY);
              showParticles(popX, popY, earnedValue);
              playCatchSound(fish.value);
            }
          }

          if (fish.type === 'gold') {
            goldCaught += 1;
          } else if (fish.type === 'normal') {
            normalCaught += 1;
          } else if (fish.type === 'baiacu') {
            baiacuCaught += 1;
          } else if (fish.type === 'chest' || fish.type === 'bottle' || fish.type === 'giant') {
            specialCaught += 1;
            if (fish.type === 'giant') {
              giantCaught += 1;
            } else if (fish.type === 'bottle') {
              bottleCaught += 1;
            } else if (fish.type === 'chest') {
              chestCaught += 1;
            }
          } else if (fish.type === 'seahorse') {
            seahorseCaught += 1;
          } else if (fish.type === 'turtle') {
            turtleCaught += 1;
          } else if (fish.type === 'shark') {
            sharkCaught += 1;
          }
          updateHud();
        }
      });
    }


    function calculateCoinsFromSpecialItems() {
      const bottleCoins = bottleCaught * 5;
      const chestCoins = chestCaught * 20;
      const giantCoins = giantCaught * 50;
      return {
        bottleCoins,
        chestCoins,
        giantCoins,
        total: bottleCoins + chestCoins + giantCoins
      };
    }

    function updateCoinHud() {
      setHudModeV19('coin');
      document.body.classList.add('hud-coin-counting');
      const coinTarget = document.getElementById('liveFish');
      if (coinTarget) {
        coinTarget.innerHTML = `<span class="coin-hud"><img src="./assets/coin-gold.png" alt="Moeda"><span>${totalCoins}</span></span>`;
      }
    }

    function playCoinTickSound() {
      try {
        if (typeof initAudio === 'function') initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(780 + Math.random() * 280, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (error) {}
    }

    function showCoinPopFeedback(amount) {
      setHudModeV19('coin');
      document.body.classList.add('hud-coin-counting');
      const pop = document.createElement('div');
      pop.className = 'coin-pop-feedback';
      pop.textContent = `+${amount} moedas`;
      game.appendChild(pop);
      setTimeout(() => pop.remove(), 800);
    }


    function startCoinDimOverlay() {
      if (coinDimOverlayEl) coinDimOverlayEl.classList.add('active');
      if (typeof setTopGameUiVisible === 'function') setTopGameUiVisible(true);
    }

    function stopCoinDimOverlay() {
      if (coinDimOverlayEl) coinDimOverlayEl.classList.remove('active');
    }

    function hideHudForResultScreen() {
      stopCoinDimOverlay();
      if (typeof setTopGameUiVisible === 'function') setTopGameUiVisible(false);
      document.querySelectorAll('.top-hud-gradient').forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      });
    }

    function restoreHudForGameplay() {
      stopCoinDimOverlay();
      document.querySelectorAll('.top-hud-gradient').forEach(el => {
        el.style.display = '';
        el.style.visibility = '';
        el.style.opacity = '';
      });
      if (typeof setTopGameUiVisible === 'function') setTopGameUiVisible(true);
    }

    function hideHudForStartScreen() {
      stopCoinDimOverlay();
      if (typeof setTopGameUiVisible === 'function') setTopGameUiVisible(false);
    }


    let finalMusicTimers = [];

    function stopFinalResultMusic() {
      finalMusicTimers.forEach(timer => clearTimeout(timer));
      finalMusicTimers = [];
    }

    function playFinalTone(frequency, startDelay, duration, type = 'sine', volume = 0.08) {
      try {
        if (typeof initAudio === 'function') initAudio();
        if (!audioCtx) return;

        const timer = setTimeout(() => {
          try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration + 0.02);
          } catch (error) {}
        }, startDelay);

        finalMusicTimers.push(timer);
      } catch (error) {}
    }

    function playMissionCompleteMusic() {
      stopFinalResultMusic();

      const melody = [
        [523.25, 0, 0.16],
        [659.25, 160, 0.16],
        [783.99, 320, 0.18],
        [1046.5, 520, 0.28],
        [783.99, 860, 0.16],
        [987.77, 1020, 0.16],
        [1174.66, 1180, 0.22],
        [1318.51, 1450, 0.46],
        [1046.5, 1900, 0.34],
        [1318.51, 2200, 0.55]
      ];

      melody.forEach(([freq, delay, dur]) => playFinalTone(freq, delay, dur, 'triangle', 0.09));

      [261.63, 329.63, 392.0].forEach((freq, index) => {
        playFinalTone(freq, 1450 + index * 35, 0.9, 'sine', 0.035);
      });
    }

    function playMissionFailedMusic() {
      stopFinalResultMusic();

      const melody = [
        [392.0, 0, 0.28],
        [349.23, 300, 0.28],
        [311.13, 600, 0.32],
        [261.63, 950, 0.55],
        [220.0, 1500, 0.65],
        [196.0, 2050, 0.8]
      ];

      melody.forEach(([freq, delay, dur]) => playFinalTone(freq, delay, dur, 'sawtooth', 0.045));
    }

    function playFinalResultMusic(missionCompleted) {
      if (missionCompleted) {
        playMissionCompleteMusic();
      } else {
        playMissionFailedMusic();
      }
    }


    function animateCoinsConversion() {
      const rewards = calculateCoinsFromSpecialItems();
      const coinsEarned = rewards.total;
      phaseCoinsEarned = coinsEarned;

      return new Promise(resolve => {
        if (coinsEarned <= 0) {
          localStorage.setItem('pescaria_total_coins', String(totalCoins));
          updateCoinHud();
      keepHeaderVisibleOnResultV13();
          resolve();
          return;
        }

        const liveScoreTarget = document.getElementById('liveScore');
        const startingScore = score;
        const startingCoins = totalCoins;
        let currentScore = startingScore;
        let currentCoins = startingCoins;
        const steps = Math.max(18, Math.min(60, coinsEarned));
        const scoreStep = startingScore / steps;
        const coinStep = coinsEarned / steps;
        let step = 0;

        startCoinDimOverlay();
        renderScoreHud(Math.round(currentScore));
        updateCoinHud();

        let interval;
        interval = setInterval(() => {
          step += 1;
          currentScore = Math.max(0, startingScore - scoreStep * step);
          currentCoins = Math.min(startingCoins + coinsEarned, startingCoins + Math.round(coinStep * step));

          renderScoreHud(Math.round(currentScore));
          totalCoins = currentCoins;
          updateCoinHud();
          playCoinTickSound();

          if (step >= steps) {
            clearInterval(interval);
            score = 0;
            totalCoins = startingCoins + coinsEarned;
            localStorage.setItem('pescaria_total_coins', String(totalCoins));
            renderScoreHud(Math.round(currentScore));
            updateCoinHud();

            setTimeout(() => {
              stopCoinDimOverlay();
              resolve();
            }, 450);
          }
        }, 36);
      });
    }



    function renderScoreHud(value) {
      const target = document.getElementById('liveScore');
      if (!target) return;
      const safeValue = Number(value || 0);
      target.innerHTML = `<span class="score-hud-inline"><img src="./assets/estrela-missao.png" alt=""><span>${safeValue}</span></span>`;
    }

    function updateHud() {
      renderScoreHud(score);
      updateCoinHud();
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
      syncSpecialSpawnState();
      if (state === 'up') maybeSpawnSpecialItems();
      updateRainbowTimer();
      syncTopGameUiVisibility(); // guard hud visibility
      renderAll();
      ensureVisibleEntityAssetsV8();
      animationId = requestAnimationFrame(update);
    }


    function getTopGameUiElements() {
      const selectors = [
        '.hud',
        '.phase-card',
        '.mission-progress',
        '.depth-progress',
        '#missionProgress',
        '#rainbowTimer'
      ];

      const found = [];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!found.includes(el)) found.push(el);
        });
      });

      return found;
    }

    function setTopGameUiVisible(isVisible) {
      const selectors = ['.hud', '.phase-card', '.hud-card', '.mission-progress', '#missionProgress', '#rainbowTimer'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.classList.toggle('force-hidden-ui', !isVisible);
        });
      });
    }

    function syncTopGameUiVisibility() {
      setTopGameUiVisible(state === 'playing' || state === 'down' || state === 'up');
    }



    function getMissionForPhase(phase) {
      return createMission(phase);
    }


    function getPreLevelFishGoalForPhase(phase) {
      const safePhase = Math.max(1, Number(phase || 1));

      if (safePhase % 10 === 0) {
        const specialTarget = Math.min(3, 1 + Math.floor(safePhase / 40));
        return {
          type: 'special',
          target: specialTarget,
          text: `Pegue ${specialTarget} ${specialTarget === 1 ? 'item especial' : 'itens especiais'}`
        };
      }

      const unlockedRare = typeof getRareUnlocks === 'function' ? getRareUnlocks() : [];

      if (Array.isArray(unlockedRare) && unlockedRare.length && safePhase >= 6 && (safePhase % 7 === 0 || safePhase % 11 === 0)) {
        const rarePool = [];
        if (unlockedRare.includes('seahorse')) rarePool.push('seahorse');
        if (unlockedRare.includes('turtle')) rarePool.push('turtle');
        if (unlockedRare.includes('shark')) rarePool.push('shark');

        if (rarePool.length) {
          const chosen = rarePool[safePhase % rarePool.length];
          const target = chosen === 'seahorse'
            ? Math.min(8, 3 + Math.floor(safePhase / 25))
            : chosen === 'turtle'
              ? Math.min(6, 2 + Math.floor(safePhase / 30))
              : Math.min(4, 1 + Math.floor(safePhase / 35));

          const plural = chosen === 'seahorse'
            ? 'cavalos-marinhos'
            : chosen === 'turtle'
              ? 'tartarugas-marinhas'
              : 'tubarões';

          return {
            type: chosen,
            target,
            text: `Pegue ${target} ${plural}`
          };
        }
      }

      if (safePhase % 2 === 0 || safePhase % 3 === 0) {
        const goldTarget = Math.min(14, 3 + Math.floor(safePhase / 5));
        return {
          type: 'gold',
          target: goldTarget,
          text: `Pegue ${goldTarget} peixes dourados`
        };
      }

      const normalTarget = Math.min(35, 6 + Math.floor(safePhase / 4));
      return {
        type: 'normal',
        target: normalTarget,
        text: `Pegue ${normalTarget} peixes`
      };
    }

    function getPreLevelScoreGoalForPhase(phase) {
      const safePhase = Math.max(1, Number(phase || 1));

      // Progressão mais natural: sobe aos poucos e só chega no máximo em fases altas.
      // Assim as fases próximas não ficam todas iguais em 12.000 pontos.
      const baseScore = 2500 + safePhase * 95;
      const roundedScore = Math.round(baseScore / 500) * 500;

      return Math.min(12000, roundedScore);
    }


    function getMissionFishIcon() {
      const fishGoal = getPreLevelFishGoalForPhase(currentPhase);
      if (fishGoal.type === 'gold') return './assets/fish-gold.png';
      if (fishGoal.type === 'special') return './assets/item-bottle.png';
      if (fishGoal.type === 'seahorse') return './assets/cavalo-marinho.png';
      if (fishGoal.type === 'turtle') return './assets/tartaruga-marinha.png';
      if (fishGoal.type === 'shark') return './assets/tubarao.png';
      return './assets/fish-normal.png';
    }

    function getMissionFishText() {
      return getPreLevelFishGoalForPhase(currentPhase).text;
    }

    function getPhaseScoreGoal() {
      return getPreLevelScoreGoalForPhase(currentPhase);
    }

    function formatPreLevelNumber(value) {
      return Number(value || 0).toLocaleString('pt-BR');
    }

    function updatePreLevelScreen() {
      const fishGoal = getPreLevelFishGoalForPhase(currentPhase);
      const scoreGoal = getPreLevelScoreGoalForPhase(currentPhase);
      currentMission = {
        type: fishGoal.type,
        target: fishGoal.target,
        label: fishGoal.text
      };

      if (preLevelPhaseEl) preLevelPhaseEl.textContent = `FASE ${currentPhase}`;
      if (preLevelFishIconEl) preLevelFishIconEl.src = getMissionFishIcon();
      if (preLevelFishGoalEl) preLevelFishGoalEl.textContent = fishGoal.text;
      if (preLevelScoreGoalEl) preLevelScoreGoalEl.textContent = `Faça ${formatPreLevelNumber(scoreGoal)} pontos`;
    }

    function showPreLevelScreen() {
      setHudModeV19('hidden');
      document.body.classList.remove('hud-coin-counting');
      hardHideHudOutsideGameV18();
      document.body.classList.remove('hud-coin-counting');
      updateHudScopeV17();
      document.body.classList.remove('hud-coin-counting');
      updateHudScopeV15();
      cleanupRareAnimalSprites();
      setGameScreen('prelevel');
      setDepthUiVisible(false);
      updatePreLevelScreen();
      if (typeof hideHudForStartScreen === 'function') hideHudForStartScreen();
      if (startOverlay) startOverlay.classList.add('hidden');
      if (resultOverlay) resultOverlay.classList.add('hidden');
      if (preLevelOverlay) {
        preLevelOverlay.classList.remove('hidden');
        preLevelOverlay.setAttribute('aria-hidden', 'false');
      }
      renderAll();
      updateShopButtonVisibility();
      refreshGameplayUiVisibility();
    }

    function hidePreLevelScreen() {
      if (preLevelOverlay) {
        preLevelOverlay.classList.add('hidden');
        preLevelOverlay.setAttribute('aria-hidden', 'true');
      }
      updateShopButtonVisibility();
      refreshGameplayUiVisibility();
    }

    function startRoundFromPreLevel() {
      hidePreLevelScreen();
      startRound();
    }



    const equippedBoatVisual = null;
    const shopOpenBtn = document.getElementById('shopOpenBtn');
    const shopOverlay = document.getElementById('shopOverlay');
    const shopCloseBtn = document.getElementById('shopCloseBtn');
    const shopContentEl = document.getElementById('shopContent');
    const shopCoinsValueEl = document.getElementById('shopCoinsValue');

    const shopItems = {
      boats: [
        { id: 'boat_basic', name: 'Barco Pescador', price: 0, icon: '⛵', image: null, desc: 'Equipamento inicial para águas rasas.', effect: { depth: 1, time: 1, rare: 1, unlocks: [] } },
        { id: 'boat_fisher', name: 'Lancha', price: 800, icon: '🚤', image: './assets/boat-lancha.png', desc: 'Mais velocidade e libera o cavalo-marinho.', effect: { depth: 1.15, time: 1.08, rare: 1.15, unlocks: ['seahorse'] } },
        { id: 'boat_pro', name: 'Barco Profissional', price: 2500, icon: '🛥️', image: './assets/boat-profissional.png', desc: 'Maior estabilidade e libera tartarugas marinhas.', effect: { depth: 1.35, time: 1.16, rare: 1.35, unlocks: ['seahorse', 'turtle'] } },
        { id: 'boat_ocean', name: 'Barco Oceânico', price: 6000, icon: '🚢', image: './assets/boat-oceanico.png', desc: 'Explora águas profundas e libera tubarões.', effect: { depth: 1.65, time: 1.25, rare: 1.65, unlocks: ['seahorse', 'turtle', 'shark'] } }
      ],
      hooks: [
        { id: 'hook_basic', name: 'Anzol Básico', price: 0, icon: '🪝', image: null, desc: 'Captura padrão.', effect: { hook: 1, radius: 1, giantBonus: 1, seahorseBonus: 1, turtleBonus: 1, sharkBonus: 1, magnet: 0 } },
        { id: 'hook_strong', name: 'Anzol Reforçado', price: 600, icon: '🪝', image: null, desc: 'Aumenta a chance de peixe gigante.', effect: { hook: 1.15, radius: 1.06, giantBonus: 1.75, seahorseBonus: 1, turtleBonus: 1, sharkBonus: 1, magnet: 0 } },
        { id: 'hook_gold', name: 'Anzol Dourado', price: 1800, icon: '🪝', image: null, desc: 'Mais raio de captura e mais cavalos-marinhos.', effect: { hook: 1.3, radius: 1.14, giantBonus: 1.2, seahorseBonus: 1.9, turtleBonus: 1, sharkBonus: 1, magnet: 0 } },
        { id: 'hook_magnet', name: 'Anzol Magnético', price: 4500, icon: '🧲', image: null, desc: 'Atrai peixes próximos e aumenta raros profundos.', effect: { hook: 1.5, radius: 1.22, giantBonus: 1.35, seahorseBonus: 1.35, turtleBonus: 1.8, sharkBonus: 1.8, magnet: 1 } }
      ],
      lines: [
        { id: 'line_basic', name: 'Linha Nylon', price: 0, icon: '🧵', image: null, desc: 'Linha inicial.', effect: { line: 1 } },
        { id: 'line_carbon', name: 'Fluorcarbono', price: 900, icon: '🧵', image: null, desc: 'Mais resistência e controle.', effect: { line: 1.12 } },
        { id: 'line_titanium', name: 'Linha Titânio', price: 2800, icon: '🧵', image: null, desc: 'Controle superior em profundidade.', effect: { line: 1.28 } }
      ],
      baits: [
        { id: 'bait_worm', name: 'Minhoca', price: 100, icon: '🪱', image: null, desc: 'Aumenta peixes comuns nesta fase.', effect: { bait: 'normal' } },
        { id: 'bait_shrimp', name: 'Camarão', price: 250, icon: '🦐', image: null, desc: 'Aumenta chance de dourados.', effect: { bait: 'gold' } },
        { id: 'bait_magic', name: 'Isca Brilhante', price: 750, icon: '✨', image: null, desc: 'Aumenta chance de itens especiais.', effect: { bait: 'special' } }
      ]
    };

    let activeShopCategory = 'boats';

    function getShopState() {
      const defaultState = {
        owned: ['boat_basic', 'hook_basic', 'line_basic'],
        equipped: {
          boats: 'boat_basic',
          hooks: 'hook_basic',
          lines: 'line_basic',
          baits: null
        }
      };

      try {
        return JSON.parse(localStorage.getItem('pescaria_shop_state')) || defaultState;
      } catch (error) {
        return defaultState;
      }
    }

    function saveShopState(state) {
      localStorage.setItem('pescaria_shop_state', JSON.stringify(state));
    }

    function updateShopCoins() {
      if (shopCoinsValueEl) shopCoinsValueEl.textContent = Number(totalCoins || 0).toLocaleString('pt-BR');
    }

    function getShopItemById(id) {
      for (const category of Object.keys(shopItems)) {
        const item = shopItems[category].find(entry => entry.id === id);
        if (item) return { item, category };
      }
      return null;
    }

    function getEquippedShopEffects() {
      const state = getShopState();
      const effects = { depth: 1, time: 1, hook: 1, line: 1, radius: 1, rare: 1, giantBonus: 1, seahorseBonus: 1, turtleBonus: 1, sharkBonus: 1, magnet: 0, bait: null, unlocks: [] };
      Object.values(state.equipped || {}).forEach(id => {
        if (!id) return;
        const found = getShopItemById(id);
        if (!found) return;
        const itemEffect = found.item.effect || {};
        const mergedUnlocks = new Set([...(effects.unlocks || []), ...(itemEffect.unlocks || [])]);
        Object.assign(effects, itemEffect);
        effects.unlocks = Array.from(mergedUnlocks);
      });
      return effects;
    }

    function showShopMessage(text) {
      let msg = document.querySelector('.shop-message');
      if (!msg) {
        msg = document.createElement('div');
        msg.className = 'shop-message';
        shopOverlay.appendChild(msg);
      }

      msg.textContent = text;
      msg.classList.add('show');
      setTimeout(() => msg.classList.remove('show'), 1300);
    }


    function getEquippedBoatItem() {
      const state = getShopState();
      const found = getShopItemById(state.equipped && state.equipped.boats ? state.equipped.boats : 'boat_basic');
      return found ? found.item : null;
    }
    function getEquippedHookItem() {
      const state = getShopState();
      const found = getShopItemById(state.equipped && state.equipped.hooks ? state.equipped.hooks : 'hook_basic');
      return found ? found.item : null;
    }
    function applyHookVisuals() {
      const hookEl = document.getElementById('hook');
      const hookItem = getEquippedHookItem();
      if (!hookEl || !hookItem) return;
      hookEl.dataset.equippedHook = hookItem.id;
      hookEl.style.filter = hookItem.id === 'hook_magnet' ? 'drop-shadow(0 0 10px rgba(255,220,50,.9))' : hookItem.id === 'hook_gold' ? 'drop-shadow(0 0 8px rgba(255,210,40,.75))' : hookItem.id === 'hook_strong' ? 'drop-shadow(0 0 7px rgba(150,220,255,.55))' : '';
    }


    function updateShopButtonVisibility() {
      if (!shopOpenBtn) return;

      const startVisible = startOverlay && !startOverlay.classList.contains('hidden');
      const shopVisible = shopOverlay && !shopOverlay.classList.contains('hidden');

      if (startVisible || shopVisible) {
        shopOpenBtn.classList.remove('start-only-hidden');
      } else {
        shopOpenBtn.classList.add('start-only-hidden');
      }
    }



    function getEquippedBoatSurfaceImage() {
      const boat = getEquippedBoatItem();
      return boat && boat.image ? boat.image : null;
    }

    function elementLooksLikeSurfaceBoat(element) {
      if (!element) return false;

      const raw = `${element.id || ''} ${element.className || ''} ${element.getAttribute ? (element.getAttribute('src') || '') : ''} ${element.src || ''} ${element.alt || ''} ${element.style && element.style.backgroundImage ? element.style.backgroundImage : ''}`.toLowerCase();

      if (
        raw.includes('shop') ||
        raw.includes('hook') ||
        raw.includes('fish') ||
        raw.includes('coin') ||
        raw.includes('star') ||
        raw.includes('pre-tela') ||
        raw.includes('btn') ||
        raw.includes('icon')
      ) {
        return false;
      }

      return (
        raw.includes('boat') ||
        raw.includes('barco') ||
        raw.includes('pescador') ||
        raw.includes('fisher') ||
        raw.includes('player') ||
        raw.includes('surface') ||
        raw.includes('boat-lancha') ||
        raw.includes('boat-profissional') ||
        raw.includes('boat-oceanico')
      );
    }

    function findSurfaceBoatElement() {
      const directSelectors = [
        '#boat',
        '#playerBoat',
        '#fisherBoat',
        '#surfaceBoat',
        '#boatSprite',
        '#boatEl',
        '.boat',
        '.player-boat',
        '.fisher-boat',
        '.surface-boat',
        '.boat-sprite',
        '.boat-layer',
        '.boat-container'
      ];

      for (const selector of directSelectors) {
        const found = document.querySelector(selector);
        if (elementLooksLikeSurfaceBoat(found)) return found;
      }

      const candidates = Array.from(document.querySelectorAll('img, [style], div, picture, source'));
      const found = candidates.find(elementLooksLikeSurfaceBoat);
      return found || null;
    }

    function setBoatImageOnElement(element, imageSrc) {
      if (!element || !imageSrc) return false;

      const tag = (element.tagName || '').toLowerCase();

      element.dataset.originalBoatSrc = element.dataset.originalBoatSrc || element.getAttribute('src') || element.src || '';
      element.dataset.originalBoatBackground = element.dataset.originalBoatBackground || (element.style ? element.style.backgroundImage || '' : '');

      if (tag === 'img' || tag === 'source') {
        element.setAttribute('src', imageSrc);
        return true;
      }

      if (element.style) {
        element.style.backgroundImage = `url("${imageSrc}")`;
        element.style.backgroundSize = element.style.backgroundSize || 'contain';
        element.style.backgroundRepeat = element.style.backgroundRepeat || 'no-repeat';
        element.style.backgroundPosition = element.style.backgroundPosition || 'center';
        return true;
      }

      return false;
    }

    function applyEquippedBoatToSurface() {
      const imageSrc = getEquippedBoatSurfaceImage();
      const surfaceBoat = findSurfaceBoatElement();

      if (!surfaceBoat) return false;

      if (imageSrc) {
        return setBoatImageOnElement(surfaceBoat, imageSrc);
      }

      if (surfaceBoat.dataset.originalBoatSrc && (surfaceBoat.tagName || '').toLowerCase() === 'img') {
        surfaceBoat.setAttribute('src', surfaceBoat.dataset.originalBoatSrc);
        return true;
      }

      if (surfaceBoat.dataset.originalBoatBackground && surfaceBoat.style) {
        surfaceBoat.style.backgroundImage = surfaceBoat.dataset.originalBoatBackground;
        return true;
      }

      return false;
    }



    function ensureSurfaceBoatFallback() {
      let fallback = document.getElementById('surfaceEquippedBoatFallback');
      if (fallback) return fallback;

      fallback = document.createElement('img');
      fallback.id = 'surfaceEquippedBoatFallback';
      fallback.className = 'surface-equipped-boat-fallback hidden';
      fallback.alt = '';

      const parent = document.getElementById('game') || document.body;
      parent.appendChild(fallback);
      return fallback;
    }

    function applyEquippedBoatFallbackIfNeeded() {
      const imageSrc = getEquippedBoatSurfaceImage();
      const fallback = ensureSurfaceBoatFallback();

      if (!imageSrc) {
        fallback.classList.add('hidden');
        return;
      }

      fallback.src = imageSrc;
      fallback.classList.remove('hidden');
    }


    function applyEquipmentVisuals() {
      const boatAppliedToSurface = applyEquippedBoatToSurface();
      if (!boatAppliedToSurface) applyEquippedBoatFallbackIfNeeded();
applyHookVisuals();

      const effects = getEquippedShopEffects();
      if (game) {
        game.classList.toggle('hook-magnet-active', Number(effects.magnet || 0) > 0);
      }
    }
    function getRareUnlocks(){ const e=getEquippedShopEffects(); return Array.isArray(e.unlocks)?e.unlocks:[]; }
    function canSpawnRareFish(type){ return getRareUnlocks().includes(type); }
    function getRareSpawnMultiplier(type){
      const e=getEquippedShopEffects(); const rare=Number(e.rare||1);
      if(type==='giant') return rare*Number(e.giantBonus||1);
      if(type==='seahorse') return rare*Number(e.seahorseBonus||1);
      if(type==='turtle') return rare*Number(e.turtleBonus||1);
      if(type==='shark') return rare*Number(e.sharkBonus||1);
      return rare;
    }
    function getCaptureRadiusMultiplier(){ const e=getEquippedShopEffects(); return Number(e.radius||1)*Number(e.hook||1)*Number(e.line||1); }
    function getDepthMultiplier(){ return Number(getEquippedShopEffects().depth||1); }
    function getTimeMultiplier(){ return Number(getEquippedShopEffects().time||1); }
    function maybeUpgradeFishToEquipmentRare(fish){
      return spawnRareAnimalByEquipmentChance(fish);
    }


    const rareScoreAssets = {
      seahorse: './assets/score-250.png',
      turtle: './assets/score-500.png',
      shark: './assets/score-1000.png'
    };

    function showRareAnimalScoreFeedback(type, x, y) {
      if (!rareScoreAssets[type]) return;

      const container = document.getElementById('game') || document.body;
      const img = document.createElement('img');
      img.className = `rare-score-feedback ${type}`;
      img.src = rareScoreAssets[type];
      img.alt = '';

      const safeX = Number.isFinite(Number(x)) ? Number(x) : (container.getBoundingClientRect ? container.getBoundingClientRect().width / 2 : window.innerWidth / 2);
      const safeY = Number.isFinite(Number(y)) ? Number(y) : (container.getBoundingClientRect ? container.getBoundingClientRect().height / 2 : window.innerHeight / 2);

      img.style.left = `${safeX}px`;
      img.style.top = `${safeY}px`;

      container.appendChild(img);
      setTimeout(() => img.remove(), 1050);
    }

    function playRareAnimalScoreIfNeeded(fish) { triggerRareAnimalCatchFeedback(fish); }


    const rareFishAssets = {
      seahorse: './assets/cavalo-marinho.png',
      turtle: './assets/tartaruga-marinha.png',
      shark: './assets/tubarao.png'
    };

    const rareFishConfig = {
      seahorse: { points: 250, width: 32, speed: 0.85, label: 'Cavalo-marinho' },
      turtle: { points: 500, width: 120, speed: 0.75, label: 'Tartaruga-marinha' },
      shark: { points: 1000, width: 170, speed: 1.05, label: 'Tubarão' }
    };

    function isRareAnimalType(type) {
      return type === 'seahorse' || type === 'turtle' || type === 'shark';
    }

    function applyRareAnimalStats(fish) {
      if (!fish || !isRareAnimalType(fish.type)) return fish;

      const cfg = rareFishConfig[fish.type];
      fish.points = Math.max(Number(fish.points || 0), cfg.points);
      fish.speed = Math.min(Number(fish.speed || cfg.speed), cfg.speed);
      fish.vx = fish.vx ? Math.sign(fish.vx) * Math.min(Math.abs(fish.vx), cfg.speed) : (Math.random() < 0.5 ? -cfg.speed : cfg.speed);
      fish.rareName = cfg.label;
      fish.isRareAnimal = true;
      if (fish.type === 'seahorse') fish.width = 32;

      return fish;
    }

    function getRareAnimalContainer() {
      return document.getElementById('world') || document.getElementById('game') || document.body;
    }

    function ensureRareAnimalSprite(fish) {
      if (!fish || !isRareAnimalType(fish.type)) return null;

      applyRareAnimalStats(fish);

      if (fish._rareAnimalSprite && !fish._rareAnimalSprite.removed) {
        return fish._rareAnimalSprite;
      }

      const sprite = document.createElement('img');
      sprite.className = `rare-fish-sprite ${fish.type}`;
      sprite.src = rareFishAssets[fish.type];
      sprite.alt = rareFishConfig[fish.type].label;
      sprite.dataset.rareType = fish.type;

      getRareAnimalContainer().appendChild(sprite);
      fish._rareAnimalSprite = sprite;

      return sprite;
    }


    function fixSeahorseSizeDirectionAndSeparation(fish) {
      if (!fish || fish.type !== 'seahorse') return fish;

      fish.width = 32;
      fish.height = 48;

      const baseEls = [fish.el, fish.element, fish.sprite, fish.node, fish.dom, fish.img].filter(Boolean);
      baseEls.forEach(el => {
        try {
          if (el !== fish._rareAnimalSprite) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
          }
        } catch (error) {}
      });

      const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];
      list.forEach(other => {
        if (!other || other === fish || other.caught || other.type === 'seahorse' || other.type === 'turtle' || other.type === 'shark') return;
        const dx = Number(fish.x || 0) - Number(other.x || 0);
        const dy = Number(fish.y || 0) - Number(other.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 96) {
          const direction = dx >= 0 ? 1 : -1;
          fish.x = Number(fish.x || 0) + direction * (96 - dist + 22);
          fish.y = Number(fish.y || 0) - 26;
        }
      });

      return fish;
    }

    function fixAllRareAnimalsBeforeRender() {
      const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];
      list.forEach(fish => {
        if (!fish) return;
        if (fish.type === 'seahorse') fixSeahorseSizeDirectionAndSeparation(fish);
      });
    }


    function showRareAnimalScoreFeedbackDirect(fish) {
      if (!fish || !(fish.type === 'seahorse' || fish.type === 'turtle' || fish.type === 'shark')) return;

      const asset = fish.type === 'seahorse'
        ? './assets/score-250.png'
        : fish.type === 'turtle'
          ? './assets/score-500.png'
          : './assets/score-1000.png';

      const container = document.getElementById('game') || document.body;
      const img = document.createElement('img');
      img.className = `rare-score-feedback ${fish.type}`;
      img.src = asset;
      img.alt = '';

      img.style.left = `${Number(fish.x || 0)}px`;
      img.style.top = `${Number(fish.y || 0)}px`;

      container.appendChild(img);
      setTimeout(() => img.remove(), 1050);
    }


    function triggerRareAnimalCatchFeedback(fish) {
      if (!fish || !(fish.type === 'seahorse' || fish.type === 'turtle' || fish.type === 'shark')) return;
      if (fish._rareScoreShown) return;
      fish._rareScoreShown = true;

      try {
        showRareAnimalScoreFeedbackDirect(fish);
        if (typeof showRareAnimalScoreFeedback === 'function') showRareAnimalScoreFeedback(fish.type, fish.x, fish.y);
      } catch (error) {}

      try {
        if (typeof playGoldSound === 'function') playGoldSound();
        else if (typeof playCoinSound === 'function') playCoinSound();
        else if (typeof playSound === 'function') playSound('gold');
      } catch (error) {}

      try {
        if (typeof triggerGoldFlash === 'function') triggerGoldFlash(fish.x, fish.y);
        if (typeof createSparkles === 'function') createSparkles(fish.x, fish.y);
        if (typeof showScorePopup === 'function') {
          const pts = fish.points || (fish.type === 'seahorse' ? 250 : fish.type === 'turtle' ? 500 : 1000);
          showScorePopup(pts, fish.x, fish.y);
        }
      } catch (error) {}
    }


    function updateRareAnimalSprites() {
      fixAllRareAnimalsBeforeRender();
      const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];

      list.forEach(fish => {
        if (fish && fish.caught && isRareAnimalType(fish.type) && !fish._rareScoreShown) { fish._rareScoreShown = true; playRareAnimalScoreIfNeeded(fish); }
        if (!fish || !isRareAnimalType(fish.type) || fish.caught || fish.removed) {
          if (fish && fish._rareAnimalSprite) {
            fish._rareAnimalSprite.remove();
            fish._rareAnimalSprite = null;
          }
          return;
        }

        const sprite = ensureRareAnimalSprite(fish);
        if (!sprite) return;

        const cfg = rareFishConfig[fish.type];
        const x = Number(fish.x || 0);
        const y = Number(fish.y || 0);
        const dir = Number(fish.vx || -1) < 0 ? 1 : -1;
        const width = Number(fish.width || cfg.width);

        sprite.style.left = `${x - width / 2}px`;
        sprite.style.top = `${y - width / 2}px`;
        sprite.style.width = `${width}px`;
        sprite.style.transform = Number(fish.vx || -1) < 0 ? 'scaleX(1)' : 'scaleX(-1)';
      });
    }

    function cleanupRareAnimalSprites() {
      document.querySelectorAll('.rare-fish-sprite').forEach(sprite => sprite.remove());
    }

    function spawnRareAnimalByEquipmentChance(fish) {
      if (!fish || fish.type !== 'normal') return fish;

      const unlocks = typeof getRareUnlocks === 'function' ? getRareUnlocks() : [];
      const canSeahorse = unlocks.includes('seahorse');
      const canTurtle = unlocks.includes('turtle');
      const canShark = unlocks.includes('shark');

      const multiplier = type => typeof getRareSpawnMultiplier === 'function' ? getRareSpawnMultiplier(type) : 1;

      const missionGoalForRare = typeof getPhaseCaptureGoalForPhase === 'function' ? getPhaseCaptureGoalForPhase(currentPhase) : null;
      const missionRareType = missionGoalForRare && (missionGoalForRare.type === 'seahorse' || missionGoalForRare.type === 'turtle' || missionGoalForRare.type === 'shark') ? missionGoalForRare.type : null;

      if (
        missionRareType &&
        unlocks.includes(missionRareType) &&
        Math.random() < 0.18
      ) {
        fish.type = missionRareType;
        applyRareAnimalStats(fish);
        if (fish.type === 'seahorse' && typeof fixSeahorseSizeDirectionAndSeparation === 'function') fixSeahorseSizeDirectionAndSeparation(fish);
        return fish;
      }


      const seahorseChance = canSeahorse ? Math.min(0.24, 0.055 * multiplier('seahorse')) : 0;
      const turtleChance = canTurtle ? Math.min(0.18, 0.035 * multiplier('turtle')) : 0;
      const sharkChance = canShark ? Math.min(0.12, 0.022 * multiplier('shark')) : 0;

      const roll = Math.random();

      if (roll < sharkChance) {
        fish.type = 'shark';
      } else if (roll < sharkChance + turtleChance) {
        fish.type = 'turtle';
      } else if (roll < sharkChance + turtleChance + seahorseChance) {
        fish.type = 'seahorse';
      }

      if (isRareAnimalType(fish.type)) {
        applyRareAnimalStats(fish);
        if (fish.type === 'seahorse') fixSeahorseSizeDirectionAndSeparation(fish);
        if (typeof clampSpecialSpawnPosition === 'function') {
          clampSpecialSpawnPosition(fish);
        }
      }

      return fish;
    }

    function applyRareAnimalSpawnRules() {
      const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];

      list.forEach(fish => {
        if (!fish || fish._rareAnimalChecked) return;

        spawnRareAnimalByEquipmentChance(fish);
        applyRareAnimalStats(fish);
        fish._rareAnimalChecked = true;
      });

      updateRareAnimalSprites();
    }


    function applyEquipmentSpawnRules(){
      const list=typeof fishes!=='undefined'?fishes:[];
      if(!Array.isArray(list)) return;
      list.forEach(fish=>{ if(!fish || fish._equipmentRulesApplied) return; maybeUpgradeFishToEquipmentRare(fish); fish._equipmentRulesApplied=true; });
    }
    function applyMagnetAttraction(){
      const e=getEquippedShopEffects(); if(!e.magnet) return;
      const list=typeof fishes!=='undefined'?fishes:[]; const hookEl=document.getElementById('hook');
      if(!Array.isArray(list) || !hookEl) return;
      const hx=Number(hookEl.x||hookEl.offsetLeft||0), hy=Number(hookEl.y||hookEl.offsetTop||0), radius=135*getCaptureRadiusMultiplier();
      list.forEach(fish=>{ if(!fish || fish.caught) return; const dx=hx-Number(fish.x||0), dy=hy-Number(fish.y||0), dist=Math.sqrt(dx*dx+dy*dy); if(dist>0 && dist<radius){ fish.x+=dx*.018; fish.y+=dy*.018; }});
    }

    function renderShop() {
      if (!shopContentEl) return;

      const state = getShopState();
      updateShopCoins();

      const items = shopItems[activeShopCategory] || [];
      shopContentEl.innerHTML = `<div class="shop-grid">${items.map(item => {
        const owned = state.owned.includes(item.id);
        const equipped = state.equipped[activeShopCategory] === item.id;
        const canBuy = Number(totalCoins || 0) >= item.price;

        const buttonLabel = equipped ? 'Equipado' : owned ? 'Equipar' : item.price === 0 ? 'Grátis' : 'Comprar';

        return `
          <div class="shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
            ${item.image ? `<img class="shop-item-asset" src="${item.image}" alt="${item.name}">` : `<div class="shop-item-icon" aria-hidden="true" style="font-size:58px;line-height:76px">${item.icon}</div>`}
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
            <div class="shop-price">
              <img src="./assets/estrela-missao.png" alt="">
              <span>${item.price === 0 ? 'GRÁTIS' : item.price.toLocaleString('pt-BR')}</span>
            </div>
            <button class="shop-buy-btn" data-shop-buy="${item.id}" ${(!owned && !canBuy) || equipped ? 'disabled' : ''}>${buttonLabel}</button>
          </div>
        `;
      }).join('')}</div>`;

      shopContentEl.querySelectorAll('[data-shop-buy]').forEach(btn => {
        btn.addEventListener('click', () => buyOrEquipShopItem(btn.dataset.shopBuy));
      });
    }

    function buyOrEquipShopItem(itemId) {
      const found = getShopItemById(itemId);
      if (!found) return;

      const { item, category } = found;
      const state = getShopState();
      const owned = state.owned.includes(item.id);

      if (!owned) {
        if (Number(totalCoins || 0) < item.price) {
          showShopMessage('Moedas insuficientes');
          return;
        }

        totalCoins -= item.price;
        localStorage.setItem('pescaria_total_coins', String(totalCoins));
        state.owned.push(item.id);
        showShopMessage('Item comprado!');
      } else {
        showShopMessage('Item equipado!');
      }

      if (category !== 'baits') {
        state.equipped[category] = item.id;
      } else {
        state.equipped.baits = item.id;
      }

      saveShopState(state);
      if (typeof updateCoinHud === 'function') updateCoinHud();
      applyEquipmentVisuals();
      renderShop();
    }

    function openShop() {
      setGameScreen('shop');
      setDepthUiVisible(false);
      if (!shopOverlay) return;
      shopOverlay.classList.remove('hidden');
      shopOverlay.setAttribute('aria-hidden', 'false');
      renderShop();
      updateShopButtonVisibility();
      refreshGameplayUiVisibility();
    }

    function closeShop() {
      if (!shopOverlay) return;
      shopOverlay.classList.add('hidden');
      shopOverlay.setAttribute('aria-hidden', 'true');
      updateShopButtonVisibility();
      refreshGameplayUiVisibility();
      setGameScreen(startOverlay && !startOverlay.classList.contains('hidden') ? 'start' : 'playing');
    }


    function startRound() {
      document.body.classList.remove('hud-coin-counting');
      updateHUDVisibilityV19();
      document.body.classList.remove('hud-coin-counting');
      updateHudScopeV17();
      document.body.classList.remove('hud-coin-counting');
      if (typeof window.requirePescariaLoginBeforeStart === 'function' && !window.requirePescariaLoginBeforeStart()) return false;
      cleanupRareAnimalSprites();
      forceHudLayout();
      setGameScreen('playing');
      forceHudLayout();
      updateMissionProgress();
      refreshGameplayUiVisibility();
      unlockMissionProgressSnapshot();
      clearFinalMissionResultSnapshot();
      setDepthUiVisible(true);
      updateDepthNumber();
      updateShopButtonVisibility();
      equippedShopEffects = getEquippedShopEffects();
      applyEquipmentVisuals();
      setTimeout(() => applyEquipmentVisuals(), 80);
      stopFinalResultMusic();
      missionNormalCaught = 0;
      missionGoldCaught = 0;
      missionSpecialCaught = 0;
      missionSeahorseCaught = 0;
      missionTurtleCaught = 0;
      missionSharkCaught = 0;
      const phaseCaptureGoal = getPhaseCaptureGoalForPhase(currentPhase);
      currentMission = {
        type: phaseCaptureGoal.type,
        target: phaseCaptureGoal.target,
        label: phaseCaptureGoal.text
      };
      hidePreLevelScreen();
      restoreHudForGameplay();
      
      
      
      
      cancelAnimationFrame(animationId);
      resize();
      score = 0;
      normalCaught = 0;
      goldCaught = 0;
      baiacuCaught = 0;
      specialCaught = 0;
      giantCaught = 0;
      bottleCaught = 0;
      chestCaught = 0;
      seahorseCaught = 0;
      turtleCaught = 0;
      sharkCaught = 0;
      specialSpawnState = {
        bottle: 0,
        chest: 0,
        giant: 0,
        activeId: null,
        giantEnabled: true
      };
      comboStreak = 0;
      lastMultiplier = 1;
      freezeTimer = 0;
      freezeSpawnTimer = 0;
      updateHud();
      updateCoinHud();
      updateMissionHud();
      updateMissionProgress();
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
      forceHudLayout();
      updateMissionProgress();
      renderAll();
      ensureVisibleEntityAssetsV8();
      animationId = requestAnimationFrame(update);
    }

    async function finishRound() {
      cleanupRareAnimalSprites();
      setGameScreen('result');
      keepHeaderVisibleOnResultV13();
      refreshGameplayUiVisibility();
      lockMissionProgressSnapshot();
      setDepthUiVisible(false);
      if (state === 'result') return;
      state = 'result';
      const phaseScoreBeforeConversion = score;
      lockFinalMissionResultSnapshot(phaseScoreBeforeConversion);
      const missionCompletedForMusic = checkMissionComplete();
      
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
      if (giantCountEl) giantCountEl.textContent = giantCaught;
      if (bottleCountEl) bottleCountEl.textContent = bottleCaught;
      if (chestCountEl) chestCountEl.textContent = chestCaught;
      renderFinalCatchSummaryDynamic();
      const missionCompleted = checkMissionComplete();
      setFinalButtonModeByMissionDirect(missionCompleted);
            if (resultTitleImageEl) {
        resultTitleImageEl.src = missionCompleted ? './assets/missao-concluida.png' : './assets/missao-nao-concluida.png';
        resultTitleImageEl.alt = missionCompleted ? 'Missão concluída!' : 'Missão não concluída!';
      }
      advanceOrRepeatPhase();
      if (missionResultTextEl) missionResultTextEl.textContent = `Pontuação da fase: ${phaseScoreBeforeConversion}`;
      renderFinalMissionStatusRows(phaseScoreBeforeConversion);
      updateRanking(phaseScoreBeforeConversion);
      playFinalResultMusic(missionCompletedForMusic);
      if (missionCompletedForMusic) {
        await animateCoinsConversion();
      } else {
        phaseCoinsEarned = 0;
        stopCoinDimOverlay && stopCoinDimOverlay();
      }
      hideHudForResultScreen();
      resultOverlay.classList.remove('hidden');
      updateShopButtonVisibility();
      setTimeout(() => stopFinalResultMusic(), 1800);
      renderAll();
    }


    function setFinalButtonModeByMissionDirect(missionCompleted) {
      if (!resultOverlay || !restartBtn) return;

      if (missionCompleted) {
        resultOverlay.classList.add('result-continue-mode');
        resultOverlay.classList.remove('result-retry-mode');
        restartBtn.textContent = 'CONTINUAR';
        restartBtn.setAttribute('aria-label', 'Continuar');
        restartBtn.style.setProperty('background-image', "url('./assets/btn-continuar.png')", 'important');
      } else {
        resultOverlay.classList.add('result-retry-mode');
        resultOverlay.classList.remove('result-continue-mode');
        restartBtn.textContent = 'JOGAR NOVAMENTE';
        restartBtn.setAttribute('aria-label', 'Jogar novamente');
        restartBtn.style.setProperty('background-image', "url('./assets/btn-jogar-novamente.png')", 'important');
      }
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

    /* startBtn agora abre o mapa */
    if (preLevelPlayBtn) preLevelPlayBtn.addEventListener('click', startRoundFromPreLevel);
    restartBtn.addEventListener('click', showPreLevelScreen);
    window.addEventListener('resize', resize);
    updateCoinHud(); // initial coins
    renderRanking();
    updateMissionHud();
    resize();
    renderAll();
     // hide hud on start screen
  
    /* shopOpenBtn removido: loja agora abre somente pelo botão LOJA do mapa */
    if (shopCloseBtn) shopCloseBtn.addEventListener('click', closeShop);
    if (shopOverlay) {
      shopOverlay.addEventListener('click', event => {
        if (event.target === shopOverlay || event.target.classList.contains('shop-backdrop')) closeShop();
      });
    }

    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeShopCategory = tab.dataset.shopCategory;
        document.querySelectorAll('.shop-tab').forEach(item => item.classList.toggle('active', item === tab));
        renderShop();
      });
    });


    hideHudForStartScreen(); // initial top hud hidden
    applyEquipmentVisuals(); // initial equipment visuals
    updateShopButtonVisibility(); // initial shop visibility
    setDepthUiVisible(false); // initial depth hidden
    setGameScreen('start');
    refreshGameplayUiVisibility(); // initial gameplay ui hidden
    setGameScreen('start'); // authoritative initial screen
    forceHudLayout();

    
    
/* CORREÇÃO FINAL - CAVALO-MARINHO: 250, direção, sem peixe normal grudado */
    function seahorseIsTypeFinal(fish) {
      return !!fish && String(fish.type || fish.kind || fish.name || '').toLowerCase().includes('seahorse');
    }

    function fixSeahorseObjectFinal(fish) {
      if (!seahorseIsTypeFinal(fish)) return fish;

      fish.type = 'seahorse';
      fish.points = 250;
      fish.score = 250;
      fish.value = 250;
      fish.width = 32;
      fish.height = 48;
      fish.isRareAnimal = true;
      fish.baseType = 'rareAnimal';

      const possibleBaseEls = [fish.el, fish.element, fish.sprite, fish.node, fish.dom, fish.img].filter(Boolean);
      possibleBaseEls.forEach(el => {
        try {
          if (el !== fish._rareAnimalSprite) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
          }
        } catch (error) {}
      });

      return fish;
    }

    function seahorseDirectionTransformFinal(fish) {
      // A arte do cavalo-marinho olha para a esquerda por padrão.
      return Number(fish && fish.vx || -1) < 0 ? 'scaleX(1)' : 'scaleX(-1)';
    }

    function showSeahorse250FeedbackFinal(fish) {
      if (!seahorseIsTypeFinal(fish)) return;

      const container = document.getElementById('game') || document.body;
      const img = document.createElement('img');
      img.className = 'rare-score-feedback seahorse';
      img.src = './assets/score-250.png';
      img.alt = '';
      img.style.left = `${Number(fish.x || 0)}px`;
      img.style.top = `${Number(fish.y || 0)}px`;

      container.appendChild(img);
      setTimeout(() => img.remove(), 1050);

      try {
        if (typeof playGoldSound === 'function') playGoldSound();
        else if (typeof playCoinSound === 'function') playCoinSound();
        else if (typeof playSound === 'function') playSound('gold');
      } catch (error) {}

      try {
        if (typeof triggerGoldFlash === 'function') triggerGoldFlash(fish.x, fish.y);
        if (typeof createSparkles === 'function') createSparkles(fish.x, fish.y);
      } catch (error) {}
    }

    function fixAllSeahorsesFinal() {
      const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];

      list.forEach(fish => {
        if (!seahorseIsTypeFinal(fish)) return;

        fixSeahorseObjectFinal(fish);

        // Separar de peixes normais próximos para não ficar grudado e não gerar popup 50.
        list.forEach(other => {
          if (!other || other === fish || other.caught) return;
          const otherType = String(other.type || '').toLowerCase();
          if (otherType === 'seahorse' || otherType === 'turtle' || otherType === 'shark') return;

          const dx = Number(fish.x || 0) - Number(other.x || 0);
          const dy = Number(fish.y || 0) - Number(other.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 105) {
            const direction = dx >= 0 ? 1 : -1;
            fish.x = Number(fish.x || 0) + direction * (105 - dist + 28);
            fish.y = Number(fish.y || 0) - 30;
          }
        });

        if (fish._rareAnimalSprite) {
          fish._rareAnimalSprite.style.setProperty('width', '32px', 'important');
          fish._rareAnimalSprite.style.setProperty('max-width', '42px', 'important');
          fish._rareAnimalSprite.style.transform = seahorseDirectionTransformFinal(fish);
        }
      });
    }

    const previousUpdateRareAnimalSpritesFinal = typeof updateRareAnimalSprites === 'function' ? updateRareAnimalSprites : null;
    if (previousUpdateRareAnimalSpritesFinal) {
      updateRareAnimalSprites = function(...args) {
        fixAllSeahorsesFinal();
        const result = previousUpdateRareAnimalSpritesFinal.apply(this, args);
        fixAllSeahorsesFinal();

        const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];
        list.forEach(fish => {
          if (!seahorseIsTypeFinal(fish)) return;

          if (fish.caught && !fish._seahorse250ShownFinal) {
            fish._seahorse250ShownFinal = true;
            showSeahorse250FeedbackFinal(fish);
          }
        });

        return result;
      };
    }

    const previousSpawnRareAnimalByEquipmentChanceFinal = typeof spawnRareAnimalByEquipmentChance === 'function' ? spawnRareAnimalByEquipmentChance : null;
    if (previousSpawnRareAnimalByEquipmentChanceFinal) {
      spawnRareAnimalByEquipmentChance = function(fish) {
        const result = previousSpawnRareAnimalByEquipmentChanceFinal(fish);
        if (seahorseIsTypeFinal(result)) fixSeahorseObjectFinal(result);
        if (seahorseIsTypeFinal(fish)) fixSeahorseObjectFinal(fish);
        return result;
      };
    }

    const previousShowScorePopupSeahorseFinal = typeof showScorePopup === 'function' ? showScorePopup : null;
    if (previousShowScorePopupSeahorseFinal) {
      showScorePopup = function(points, x, y, ...rest) {
        const list = typeof fishes !== 'undefined' && Array.isArray(fishes) ? fishes : [];
        const nearSeahorse = list.find(fish => {
          if (!seahorseIsTypeFinal(fish)) return false;
          const dx = Number(fish.x || 0) - Number(x || 0);
          const dy = Number(fish.y || 0) - Number(y || 0);
          return Math.sqrt(dx * dx + dy * dy) < 82;
        });

        if (nearSeahorse && Number(points) === 50) {
          fixSeahorseObjectFinal(nearSeahorse);
          if (!nearSeahorse._seahorse250ShownFinal) {
            nearSeahorse._seahorse250ShownFinal = true;
            showSeahorse250FeedbackFinal(nearSeahorse);
          }
          return;
        }

        return previousShowScorePopupSeahorseFinal.call(this, points, x, y, ...rest);
      };
    }

    const previousPlayRareAnimalScoreIfNeededFinal = typeof playRareAnimalScoreIfNeeded === 'function' ? playRareAnimalScoreIfNeeded : null;
    playRareAnimalScoreIfNeeded = function(fish) {
      if (seahorseIsTypeFinal(fish)) {
        fixSeahorseObjectFinal(fish);
        if (!fish._seahorse250ShownFinal) {
          fish._seahorse250ShownFinal = true;
          showSeahorse250FeedbackFinal(fish);
        }
        return;
      }

      if (previousPlayRareAnimalScoreIfNeededFinal) return previousPlayRareAnimalScoreIfNeededFinal(fish);
    };

    const previousRegisterMissionCaptureFinal = typeof registerMissionCapture === 'function' ? registerMissionCapture : null;
    if (previousRegisterMissionCaptureFinal) {
      registerMissionCapture = function(fishOrKind, ...rest) {
        if (seahorseIsTypeFinal(fishOrKind)) {
          fixSeahorseObjectFinal(fishOrKind);
          playRareAnimalScoreIfNeeded(fishOrKind);
        }
        return previousRegisterMissionCaptureFinal.call(this, fishOrKind, ...rest);
      };
    }

    setInterval(fixAllSeahorsesFinal, 100);




    /* CONTROLADOR ÚNICO FINAL DO MAPA/LOJA */
    (function(){
      const mapOverlayEl = document.getElementById('mapOverlay');
      const howToPopupEl = document.getElementById('howToPopup');
      const rankingPopupEl = document.getElementById('rankingPopup');
      const settingsPopupEl = document.getElementById('settingsPopup');
      const mapRankingListEl = document.getElementById('mapRankingList');
      const mapSoundToggleBtnEl = document.getElementById('mapSoundToggleBtn');

      let mapAudioMutedFinal = localStorage.getItem('pescariaAudioMuted') === '1';

      function mapSetScreen(name) {
        if (typeof setGameScreen === 'function') setGameScreen(name);
      }

      window.hideAllMapPopups = function() {
        [howToPopupEl, rankingPopupEl, settingsPopupEl].forEach(popup => {
          if (!popup) return;
          popup.classList.add('hidden');
          popup.setAttribute('aria-hidden', 'true');
        });
      };

      window.openMapPopup = function(popup) {
        hideAllMapPopups();
        if (!popup) return;
        popup.classList.remove('hidden');
        popup.setAttribute('aria-hidden', 'false');
      };

      window.renderMapRanking = function() {
        if (!mapRankingListEl) return;
        const ranking = typeof getRanking === 'function' ? getRanking() : [];
        if (!ranking.length) {
          mapRankingListEl.innerHTML = '<div class="ranking-empty">Nenhuma pescaria ainda</div>';
          return;
        }
        mapRankingListEl.innerHTML = ranking.slice(0, 5).map((item, index) => `
          <div class="ranking-item">
            <span>${index + 1}. ${item.name || item.playerName || item.date || 'Jogador'}</span>
            <strong>${item.score}</strong>
          </div>
        `).join('');
      };

      window.updateMapSoundButton = function() {
        if (!mapSoundToggleBtnEl) return;
        mapSoundToggleBtnEl.textContent = mapAudioMutedFinal ? 'SOM: DESLIGADO' : 'SOM: LIGADO';
        mapSoundToggleBtnEl.classList.toggle('sound-off', mapAudioMutedFinal);
      };

      window.showMapScreen = function() {
        if (typeof cleanupRareAnimalSprites === 'function') cleanupRareAnimalSprites();
        hideAllMapPopups();

        if (typeof stopCoinDimOverlay === 'function') stopCoinDimOverlay();
        if (typeof setTopGameUiVisible === 'function') setTopGameUiVisible(false);
        if (typeof setDepthUiVisible === 'function') setDepthUiVisible(false);
        if (typeof setMissionUiVisible === 'function') setMissionUiVisible(false);

        document.body.classList.remove('screen-start', 'screen-prelevel', 'screen-playing', 'screen-result', 'screen-shop');
        document.body.classList.add('screen-map');

        if (startOverlay) startOverlay.classList.add('hidden');
        if (resultOverlay) resultOverlay.classList.add('hidden');
        if (preLevelOverlay) {
          preLevelOverlay.classList.add('hidden');
          preLevelOverlay.setAttribute('aria-hidden', 'true');
        }
        if (shopOverlay) {
          shopOverlay.classList.add('hidden');
          shopOverlay.setAttribute('aria-hidden', 'true');
        }
        if (mapOverlayEl) {
          mapOverlayEl.classList.remove('hidden');
          mapOverlayEl.setAttribute('aria-hidden', 'false');
        }

        renderMapRanking();
        updateMapSoundButton();
        if (typeof refreshGameplayUiVisibility === 'function') refreshGameplayUiVisibility();
      };

      window.hideMapScreen = function() {
        if (mapOverlayEl) {
          mapOverlayEl.classList.add('hidden');
          mapOverlayEl.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('screen-map');
      };

      function closeShopToMap(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        }
        if (shopOverlay) {
          shopOverlay.classList.add('hidden');
          shopOverlay.setAttribute('aria-hidden', 'true');
        }
        window.__shopOpenedFromMap = false;
        window.__returnToMapAfterShop = false;
        showMapScreen();
      }

      function openShopFromMap() {
        window.__shopOpenedFromMap = true;
        window.__returnToMapAfterShop = true;
        hideAllMapPopups();
        hideMapScreen();

        if (typeof openShop === 'function') openShop();

        // remove o listener antigo do botão fechar clonando o botão
        const oldClose = document.getElementById('shopCloseBtn');
        if (oldClose && oldClose.parentNode) {
          const newClose = oldClose.cloneNode(true);
          oldClose.parentNode.replaceChild(newClose, oldClose);
          newClose.addEventListener('click', closeShopToMap, true);
          newClose.addEventListener('touchend', closeShopToMap, { capture: true, passive: false });
        }

        if (shopOverlay && !shopOverlay.__mapBackdropFixed) {
          shopOverlay.__mapBackdropFixed = true;
          shopOverlay.addEventListener('click', event => {
            if (event.target === shopOverlay || event.target.classList.contains('shop-backdrop')) {
              closeShopToMap(event);
            }
          }, true);
        }
      }

      function playFromMap() {
        window.__shopOpenedFromMap = false;
        window.__returnToMapAfterShop = false;
        hideMapScreen();
        if (typeof showPreLevelScreen === 'function') showPreLevelScreen();
      }

      function bindCleanButton(id, action) {
        const oldBtn = document.getElementById(id);
        if (!oldBtn || !oldBtn.parentNode) return;

        const newBtn = oldBtn.cloneNode(true);
        newBtn.dataset.cleanAction = action;
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);

        const handler = event => {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          }
          window.__lastMapAction = action;

          if (action === 'shop') openShopFromMap();
          if (action === 'help') openMapPopup(howToPopupEl);
          if (action === 'play') playFromMap();
          if (action === 'ranking') {
            renderMapRanking();
            openMapPopup(rankingPopupEl);
          }
          if (action === 'settings') {
            updateMapSoundButton();
            openMapPopup(settingsPopupEl);
          }
        };

        newBtn.addEventListener('click', handler, true);
        newBtn.addEventListener('touchend', handler, { capture: true, passive: false });
      }

      window.bindCleanMapButtons = function() {
        bindCleanButton('mapShopBtn', 'shop');
        bindCleanButton('mapHelpBtn', 'help');
        bindCleanButton('mapPlayBtn', 'play');
        bindCleanButton('mapRankingBtn', 'ranking');
        bindCleanButton('mapConfigBtn', 'settings');
      };

      bindCleanMapButtons();

      if (startBtn) {
        const startClone = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(startClone, startBtn);
        startClone.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          showMapScreen();
          bindCleanMapButtons();
        }, true);
      }

      const preBack = document.getElementById('preLevelBackBtn');
      if (preBack) {
        const preBackClone = preBack.cloneNode(true);
        preBack.parentNode.replaceChild(preBackClone, preBack);
        preBackClone.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          showMapScreen();
          bindCleanMapButtons();
        }, true);
      }

      if (mapSoundToggleBtnEl) {
        const soundClone = mapSoundToggleBtnEl.cloneNode(true);
        mapSoundToggleBtnEl.parentNode.replaceChild(soundClone, mapSoundToggleBtnEl);
        soundClone.addEventListener('click', () => {
          mapAudioMutedFinal = !mapAudioMutedFinal;
          localStorage.setItem('pescariaAudioMuted', mapAudioMutedFinal ? '1' : '0');
          updateMapSoundButton();
        });
      }
    })();


    /* FIX BOTÕES FECHAR DOS POPUPS DO MAPA */
    (function(){
      function closeAllMapPopupsFinal(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        }

        ['howToPopup', 'rankingPopup', 'settingsPopup'].forEach(id => {
          const popup = document.getElementById(id);
          if (!popup) return;
          popup.classList.add('hidden');
          popup.setAttribute('aria-hidden', 'true');
        });
      }

      window.closeAllMapPopupsFinal = closeAllMapPopupsFinal;

      document.querySelectorAll('[data-map-popup-close]').forEach(button => {
        const clean = button.cloneNode(true);
        button.parentNode.replaceChild(clean, button);
        clean.addEventListener('click', closeAllMapPopupsFinal, true);
        clean.addEventListener('touchend', closeAllMapPopupsFinal, { capture: true, passive: false });
      });

      ['howToPopup', 'rankingPopup', 'settingsPopup'].forEach(id => {
        const popup = document.getElementById(id);
        if (!popup || popup.__popupBackdropFixed) return;
        popup.__popupBackdropFixed = true;

        popup.addEventListener('click', event => {
          if (event.target === popup || event.target.classList.contains('map-popup-backdrop')) {
            closeAllMapPopupsFinal(event);
          }
        }, true);

        popup.addEventListener('touchend', event => {
          if (event.target === popup || event.target.classList.contains('map-popup-backdrop')) {
            closeAllMapPopupsFinal(event);
          }
        }, { capture: true, passive: false });
      });
    })();


    /* FIX REAL PEIXE GIGANTE VISÍVEL */
    function getFinalVisibleBoundsForGiant() {
      const bounds = typeof getVisibleGameBounds === 'function'
        ? getVisibleGameBounds()
        : { width: window.innerWidth || gameWidth || 390, height: window.innerHeight || gameHeight || 844 };

      return {
        width: bounds.width || gameWidth || 390,
        height: bounds.height || gameHeight || 844
      };
    }

    function finalSafeGiantScreenPosition() {
      const bounds = getFinalVisibleBoundsForGiant();
      const marginX = Math.max(78, bounds.width * 0.20);
      const safeTop = Math.max(150, bounds.height * 0.24);
      const safeBottom = Math.max(safeTop + 80, bounds.height * 0.48);

      return {
        x: marginX + Math.random() * Math.max(1, bounds.width - marginX * 2),
        screenY: safeTop + Math.random() * Math.max(1, safeBottom - safeTop)
      };
    }

    function clampSpecialSpawnPosition(item) {
      if (!item) return item;

      const raw = String(item.type || item.kind || item.name || item.id || '').toLowerCase();
      const isSpecial = raw.includes('giant') || raw.includes('bottle') || raw.includes('chest') || raw.includes('special') || raw.includes('garrafa') || raw.includes('bau') || raw.includes('baú');
      if (!isSpecial) return item;

      const bounds = getFinalVisibleBoundsForGiant();
      const marginX = Math.max(54, bounds.width * 0.12);
      const safeTop = Math.max(145, bounds.height * 0.20);
      const safeBottom = Math.max(safeTop + 70, bounds.height * 0.58);

      item.x = marginX + Math.random() * Math.max(1, bounds.width - marginX * 2);

      // IMPORTANTE: item.y é coordenada do mundo. Para aparecer na tela,
      // precisa ser cameraY + screenY, porque world recebe translateY(-cameraY).
      const screenY = safeTop + Math.random() * Math.max(1, safeBottom - safeTop);
      item.y = cameraY + screenY;

      if (item.vx) item.vx = Math.sign(item.vx) * Math.min(Math.abs(item.vx), 1.25);
      if (item.speed) item.speed = Math.sign(item.speed || 1) * Math.min(Math.abs(item.speed || 1), 72);

      item._safeSpecialPositioned = true;
      return item;
    }

    function clampGiantSpawnPosition(fish) {
      if (!fish || fish.type !== 'giant') return clampSpecialSpawnPosition(fish);

      const pos = finalSafeGiantScreenPosition();

      fish.x = pos.x;
      fish.y = cameraY + pos.screenY; // coordenada absoluta do mundo
      fish.dir = Math.random() < 0.5 ? 1 : -1;
      fish.speed = (24 + Math.random() * 14) * fish.dir;
      fish.vx = fish.speed;
      fish.width = 190;
      fish.height = 116;
      fish.value = 1500;
      fish._safeSpecialPositioned = true;
      fish._giantSafePositioned = true;
      fish.minVisibleUntil = Date.now() + 6000;

      if (fish.el) {
        fish.el.className = 'fish giant';
        fish.el.style.left = `${fish.x}px`;
        fish.el.style.top = `${fish.y}px`;
        fish.el.style.transform = fish.dir === -1 ? 'scaleX(-1)' : '';
        fish.el.style.opacity = '1';
        fish.el.style.display = 'block';
        fish.el.style.zIndex = '30';
      }

      return fish;
    }

    function enforceSpecialVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      const bounds = getFinalVisibleBoundsForGiant();
      const maxY = bounds.height * 0.62;
      const minY = bounds.height * 0.14;

      list.forEach(item => {
        if (!item || item.caught) return;
        const raw = String(item.type || item.kind || item.name || item.id || '').toLowerCase();
        const isSpecial = raw.includes('giant') || raw.includes('bottle') || raw.includes('chest') || raw.includes('special') || raw.includes('garrafa') || raw.includes('bau') || raw.includes('baú');
        if (!isSpecial) return;

        const screenY = Number(item.y || 0) - cameraY;
        const outY = screenY > maxY || screenY < minY;
        const outX = Number(item.x || 0) < 28 || Number(item.x || 0) > bounds.width - 28;

        if (item.type === 'giant') {
          const notReady = !item._giantSafePositioned || outY || outX;
          if (notReady) clampGiantSpawnPosition(item);
        } else if (outY || outX || !item._safeSpecialPositioned) {
          clampSpecialSpawnPosition(item);
        }
      });
    }

    function enforceGiantVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : (typeof fishList !== 'undefined' ? fishList : []);
      if (!Array.isArray(list)) return;

      const bounds = getFinalVisibleBoundsForGiant();

      list.forEach(fish => {
        if (!fish || fish.caught || fish.type !== 'giant') return;

        const screenY = fish.y - cameraY;
        const outOfSafeY = screenY > bounds.height * 0.52 || screenY < bounds.height * 0.16;
        const outOfSafeX = fish.x < 50 || fish.x > bounds.width - 50;

        if (outOfSafeY || outOfSafeX || !fish._giantSafePositioned) {
          clampGiantSpawnPosition(fish);
          if (!fish._giantAnnounced) {
            fish._giantAnnounced = true;
            if (typeof announceGiantSpawn === 'function') announceGiantSpawn();
          }
        }
      });
    }

    function spawnGuaranteedGiantFish() {
      if (!specialSpawnState.giantEnabled || specialSpawnState.giant >= 1 || specialSpawnState.activeId !== null) return false;

      const visibleGiant = fishes.some(fish => !fish.caught && fish.type === 'giant');
      if (visibleGiant) return true;

      const progress = Math.max(0, Math.min(1, hookWorldY / config.maxDepth));
      if (progress < 0.18) return false;

      const el = document.createElement('div');
      el.className = 'fish giant';
      world.appendChild(el);

      const pos = finalSafeGiantScreenPosition();
      const dir = Math.random() > 0.5 ? 1 : -1;
      const id = `giant-guaranteed-${Date.now()}-${Math.random()}`;

      const fish = {
        id,
        el,
        x: pos.x,
        y: cameraY + pos.screenY,
        speed: (24 + Math.random() * 14) * dir,
        vx: (24 + Math.random() * 14) * dir,
        dir,
        width: 190,
        height: 116,
        type: 'giant',
        value: 1500,
        caught: false,
        special: true,
        missionForced: true,
        guaranteedGiant: true,
        _safeSpecialPositioned: true,
        _giantSafePositioned: true,
        minVisibleUntil: Date.now() + 6000
      };

      fishes.push(fish);
      
      if (fish && fish.type === 'giant') notifyGiantSpawnV12(fish);
      el.style.left = `${fish.x}px`;
      el.style.top = `${fish.y}px`;
      el.style.opacity = '1';
      el.style.display = 'block';
      el.style.zIndex = '30';

      specialSpawnState.giant += 1;
      specialSpawnState.activeId = id;

      // O aviso só aparece depois do elemento existir no mundo e já estar posicionado na tela.
      if (typeof showGiantQuickNotice === 'function') showGiantQuickNotice();
      if (typeof announceGiantSpawn === 'function') announceGiantSpawn();

      return true;
    }


    /* FIX MOVIMENTO NATURAL: GIGANTE, RAROS E ITENS SEM TELEPORTE */
    function getNaturalVisibleBounds() {
      const bounds = typeof getVisibleGameBounds === 'function'
        ? getVisibleGameBounds()
        : { width: window.innerWidth || gameWidth || 390, height: window.innerHeight || gameHeight || 844 };

      return {
        width: bounds.width || gameWidth || 390,
        height: bounds.height || gameHeight || 844
      };
    }

    function naturalScreenYForLargeSpecial() {
      const bounds = getNaturalVisibleBounds();
      const safeTop = Math.max(155, bounds.height * 0.25);
      const safeBottom = Math.max(safeTop + 85, bounds.height * 0.50);
      return safeTop + Math.random() * Math.max(1, safeBottom - safeTop);
    }

    function naturalScreenYForSpecial() {
      const bounds = getNaturalVisibleBounds();
      const safeTop = Math.max(145, bounds.height * 0.23);
      const safeBottom = Math.max(safeTop + 90, bounds.height * 0.56);
      return safeTop + Math.random() * Math.max(1, safeBottom - safeTop);
    }

    function setNaturalElementPosition(fish) {
      if (!fish || !fish.el) return;
      const flip = fish.dir === -1 ? 'scaleX(-1)' : '';
      fish.el.style.left = `${fish.x}px`;
      fish.el.style.top = `${fish.y}px`;
      fish.el.style.transform = flip;
      fish.el.style.opacity = '1';
      fish.el.style.display = 'block';
    }

    function clampSpecialSpawnPosition(item) {
      if (!item) return item;

      const raw = String(item.type || item.kind || item.name || item.id || '').toLowerCase();
      const isSpecial = raw.includes('giant') || raw.includes('bottle') || raw.includes('chest') || raw.includes('special') || raw.includes('garrafa') || raw.includes('bau') || raw.includes('baú');
      if (!isSpecial) return item;

      // Só posiciona uma vez, no nascimento. Depois disso, NÃO reposiciona mais.
      if (item._naturalSpawnLocked) return item;

      const bounds = getNaturalVisibleBounds();
      const dir = item.dir || (Math.random() > 0.5 ? 1 : -1);
      item.dir = dir;

      item.x = dir === 1
        ? -Math.max(140, (item.width || 90) + 90)
        : bounds.width + Math.max(140, (item.width || 90) + 90);

      item.y = cameraY + naturalScreenYForSpecial();

      const speedAbs = Math.max(34, Math.min(72, Math.abs(item.speed || item.vx || 52)));
      item.speed = speedAbs * dir;
      item.vx = item.speed;
      item._safeSpecialPositioned = true;
      item._naturalSpawnLocked = true;
      item._naturalNoTeleport = true;

      setNaturalElementPosition(item);
      return item;
    }

    function clampGiantSpawnPosition(fish) {
      if (!fish || fish.type !== 'giant') return clampSpecialSpawnPosition(fish);

      // Só posiciona uma vez. Se reposicionar depois, ele "aparece do nada".
      if (fish._naturalSpawnLocked) return fish;

      const bounds = getNaturalVisibleBounds();
      const dir = fish.dir || (Math.random() > 0.5 ? 1 : -1);
      fish.dir = dir;

      fish.x = dir === 1 ? -280 : bounds.width + 280;
      fish.y = cameraY + naturalScreenYForLargeSpecial();
      fish.speed = (22 + Math.random() * 12) * dir;
      fish.vx = fish.speed;
      fish.width = 190;
      fish.height = 116;
      fish.value = 1500;
      fish._safeSpecialPositioned = true;
      fish._giantSafePositioned = true;
      fish._naturalSpawnLocked = true;
      fish._naturalNoTeleport = true;
      fish.minVisibleUntil = Date.now() + 8000;

      if (fish.el) {
        fish.el.className = 'fish giant';
        fish.el.style.zIndex = '30';
      }

      setNaturalElementPosition(fish);
      return fish;
    }

    function enforceSpecialVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      list.forEach(item => {
        if (!item || item.caught) return;

        const raw = String(item.type || item.kind || item.name || item.id || '').toLowerCase();
        const isSpecial = raw.includes('giant') || raw.includes('bottle') || raw.includes('chest') || raw.includes('special') || raw.includes('garrafa') || raw.includes('bau') || raw.includes('baú');
        if (!isSpecial) return;

        // Se já nasceu de forma natural, só mantém velocidade/estilo, sem teleporte.
        if (item._naturalSpawnLocked || item._naturalNoTeleport) {
          const dir = item.dir || (item.speed >= 0 ? 1 : -1);
          const minSpeed = item.type === 'giant' ? 22 : 34;
          const maxSpeed = item.type === 'giant' ? 36 : 72;
          const abs = Math.max(minSpeed, Math.min(maxSpeed, Math.abs(item.speed || item.vx || minSpeed)));
          item.dir = dir;
          item.speed = abs * dir;
          item.vx = item.speed;
          setNaturalElementPosition(item);
          return;
        }

        if (item.type === 'giant') clampGiantSpawnPosition(item);
        else clampSpecialSpawnPosition(item);
      });
    }

    function enforceGiantVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : (typeof fishList !== 'undefined' ? fishList : []);
      if (!Array.isArray(list)) return;

      list.forEach(fish => {
        if (!fish || fish.caught || fish.type !== 'giant') return;

        // Não reposiciona o gigante se ele já nasceu fora da tela e está nadando.
        if (fish._naturalSpawnLocked || fish._naturalNoTeleport) {
          fish._giantSafePositioned = true;
          const dir = fish.dir || (fish.speed >= 0 ? 1 : -1);
          const abs = Math.max(22, Math.min(36, Math.abs(fish.speed || fish.vx || 28)));
          fish.dir = dir;
          fish.speed = abs * dir;
          fish.vx = fish.speed;
          setNaturalElementPosition(fish);
          return;
        }

        clampGiantSpawnPosition(fish);
      });
    }

    function spawnGuaranteedGiantFish() {
      if (!specialSpawnState.giantEnabled || specialSpawnState.giant >= 1 || specialSpawnState.activeId !== null) return false;

      const visibleGiant = fishes.some(fish => !fish.caught && fish.type === 'giant');
      if (visibleGiant) return true;

      const progress = Math.max(0, Math.min(1, hookWorldY / config.maxDepth));
      if (progress < 0.18) return false;

      const bounds = getNaturalVisibleBounds();
      const el = document.createElement('div');
      el.className = 'fish giant';
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;
      const id = `giant-guaranteed-${Date.now()}-${Math.random()}`;

      const fish = {
        id,
        el,
        x: dir === 1 ? -280 : bounds.width + 280,
        y: cameraY + naturalScreenYForLargeSpecial(),
        speed: (22 + Math.random() * 12) * dir,
        vx: (22 + Math.random() * 12) * dir,
        dir,
        width: 190,
        height: 116,
        type: 'giant',
        value: 1500,
        caught: false,
        special: true,
        missionForced: true,
        guaranteedGiant: true,
        _safeSpecialPositioned: true,
        _giantSafePositioned: true,
        _naturalSpawnLocked: true,
        _naturalNoTeleport: true,
        minVisibleUntil: Date.now() + 8000
      };

      fishes.push(fish);
      
      if (fish && fish.type === 'giant') notifyGiantSpawnV12(fish);
      setNaturalElementPosition(fish);

      specialSpawnState.giant += 1;
      specialSpawnState.activeId = id;

      // O aviso aparece quando o peixe já existe e está vindo da lateral.
      if (typeof showGiantQuickNotice === 'function') showGiantQuickNotice();
      if (typeof announceGiantSpawn === 'function') announceGiantSpawn();

      return true;
    }

    // Corrige peixes raros/itens já existentes que possam ter sido marcados para reposicionamento repetido.
    function stabilizeRareAndSpecialMovement() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      list.forEach(fish => {
        if (!fish || fish.caught) return;

        const type = String(fish.type || '').toLowerCase();
        const isRare = type === 'seahorse' || type === 'turtle' || type === 'shark';
        const isSpecial = type === 'bottle' || type === 'chest' || type === 'giant';

        if (!isRare && !isSpecial) return;

        // Se já foi posicionado, nunca deve ser jogado para outro ponto.
        fish._naturalNoTeleport = true;

        const dir = fish.dir || (fish.speed >= 0 ? 1 : -1);
        const maxSpeed = type === 'giant' ? 36 : isRare ? 58 : 72;
        const minSpeed = type === 'giant' ? 22 : 26;
        const abs = Math.max(minSpeed, Math.min(maxSpeed, Math.abs(fish.speed || fish.vx || minSpeed)));

        fish.dir = dir;
        fish.speed = abs * dir;
        fish.vx = fish.speed;

        setNaturalElementPosition(fish);
      });
    }

    const originalRenderAllForNaturalMovement = typeof renderAll === 'function' ? renderAll : null;
    if (originalRenderAllForNaturalMovement && !renderAll.__naturalMovementWrapped) {
      renderAll = function(...args) {
        stabilizeRareAndSpecialMovement();
        return originalRenderAllForNaturalMovement.apply(this, args);
      };
      renderAll.__naturalMovementWrapped = true;
    }


    /* FIX FINAL: GIGANTE ENTRA VISÍVEL + RAROS SEM EXAGERO */
    function getBalancedBounds() {
      const bounds = typeof getVisibleGameBounds === 'function'
        ? getVisibleGameBounds()
        : { width: window.innerWidth || gameWidth || 390, height: window.innerHeight || gameHeight || 844 };
      return {
        width: bounds.width || gameWidth || 390,
        height: bounds.height || gameHeight || 844
      };
    }

    function balancedScreenY(type) {
      const bounds = getBalancedBounds();
      if (type === 'giant') {
        const top = Math.max(150, bounds.height * 0.24);
        const bottom = Math.max(top + 80, bounds.height * 0.46);
        return top + Math.random() * Math.max(1, bottom - top);
      }
      const top = Math.max(150, bounds.height * 0.24);
      const bottom = Math.max(top + 95, bounds.height * 0.58);
      return top + Math.random() * Math.max(1, bottom - top);
    }

    function setBalancedElementPosition(fish) {
      if (!fish || !fish.el) return;
      const flip = fish.dir === -1 ? 'scaleX(-1)' : '';
      fish.el.style.left = `${fish.x}px`;
      fish.el.style.top = `${fish.y}px`;
      fish.el.style.transform = flip;
      fish.el.style.opacity = '1';
      fish.el.style.display = 'block';
      if (fish.type === 'giant') fish.el.style.zIndex = '30';
    }

    function spawnGuaranteedGiantFish() {
      if (!specialSpawnState.giantEnabled || specialSpawnState.giant >= 1 || specialSpawnState.activeId !== null) return false;

      const existing = fishes.some(fish => !fish.caught && fish.type === 'giant');
      if (existing) return true;

      const progress = Math.max(0, Math.min(1, hookWorldY / config.maxDepth));
      if (progress < 0.18) return false;

      const bounds = getBalancedBounds();
      const el = document.createElement('div');
      el.className = 'fish giant';
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;
      const screenY = balancedScreenY('giant');
      const id = `giant-guaranteed-${Date.now()}-${Math.random()}`;

      const fish = {
        id,
        el,
        // Começa logo fora da tela, não no meio, mas entra em menos de 1 segundo.
        x: dir === 1 ? -205 : bounds.width + 205,
        y: cameraY + screenY,
        _screenYLock: screenY,
        _keepScreenY: true,
        speed: (95 + Math.random() * 22) * dir,
        vx: (95 + Math.random() * 22) * dir,
        dir,
        width: 190,
        height: 116,
        type: 'giant',
        value: 1500,
        caught: false,
        special: true,
        missionForced: true,
        guaranteedGiant: true,
        _safeSpecialPositioned: true,
        _giantSafePositioned: true,
        _naturalSpawnLocked: true,
        _naturalNoTeleport: true,
        minVisibleUntil: Date.now() + 9000
      };

      fishes.push(fish);
      
      if (fish && fish.type === 'giant') notifyGiantSpawnV12(fish);
      setBalancedElementPosition(fish);

      specialSpawnState.giant += 1;
      specialSpawnState.activeId = id;

      // Alerta apenas depois do sprite existir e já estar na rota visível.
      setTimeout(() => {
        if (!fish.caught) {
          if (typeof showGiantQuickNotice === 'function') showGiantQuickNotice();
          if (typeof announceGiantSpawn === 'function') announceGiantSpawn();
        }
      }, 350);

      return true;
    }

    function clampGiantSpawnPosition(fish) {
      if (!fish || fish.type !== 'giant') return fish;
      if (fish._naturalSpawnLocked) return fish;

      const bounds = getBalancedBounds();
      const dir = fish.dir || (Math.random() > 0.5 ? 1 : -1);
      const screenY = balancedScreenY('giant');

      fish.dir = dir;
      fish.x = dir === 1 ? -205 : bounds.width + 205;
      fish.y = cameraY + screenY;
      fish._screenYLock = screenY;
      fish._keepScreenY = true;
      fish.speed = (95 + Math.random() * 22) * dir;
      fish.vx = fish.speed;
      fish.width = 190;
      fish.height = 116;
      fish._giantSafePositioned = true;
      fish._safeSpecialPositioned = true;
      fish._naturalSpawnLocked = true;
      fish._naturalNoTeleport = true;
      setBalancedElementPosition(fish);
      return fish;
    }

    function enforceGiantVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      list.forEach(fish => {
        if (!fish || fish.caught || fish.type !== 'giant') return;

        if (fish._keepScreenY && Number.isFinite(fish._screenYLock)) {
          fish.y = cameraY + fish._screenYLock;
        }

        const dir = fish.dir || (fish.speed >= 0 ? 1 : -1);
        const abs = Math.max(88, Math.min(125, Math.abs(fish.speed || fish.vx || 96)));
        fish.dir = dir;
        fish.speed = abs * dir;
        fish.vx = fish.speed;
        fish._giantSafePositioned = true;
        fish._safeSpecialPositioned = true;
        fish._naturalNoTeleport = true;

        setBalancedElementPosition(fish);
      });
    }

    function enforceSpecialVisibleSpawnZone() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      list.forEach(item => {
        if (!item || item.caught) return;

        const type = String(item.type || '').toLowerCase();
        const isSpecial = type === 'giant' || type === 'bottle' || type === 'chest';
        if (!isSpecial) return;

        if (type === 'giant') {
          enforceGiantVisibleSpawnZone();
          return;
        }

        // Garrafa/baú: não reposiciona depois de aparecer, apenas mantém movimento estável.
        const dir = item.dir || (item.speed >= 0 ? 1 : -1);
        const abs = Math.max(34, Math.min(70, Math.abs(item.speed || item.vx || 46)));
        item.dir = dir;
        item.speed = abs * dir;
        item.vx = item.speed;
        item._naturalNoTeleport = true;
        setBalancedElementPosition(item);
      });
    }

    function stabilizeRareAndSpecialMovement() {
      const list = typeof fishes !== 'undefined' ? fishes : [];
      if (!Array.isArray(list)) return;

      const currentGoal = typeof getPhaseCaptureGoalForPhase === 'function'
        ? getPhaseCaptureGoalForPhase(currentPhase)
        : null;

      const rareTypes = ['seahorse', 'turtle', 'shark'];

      rareTypes.forEach(type => {
        const active = list.filter(fish => fish && !fish.caught && fish.type === type);
        const isMissionType = currentGoal && currentGoal.type === type;

        // Missões de raros: no máximo 2 visíveis por vez.
        // Fora de missão: no máximo 1 visível por tipo.
        const maxVisible = isMissionType ? 2 : 1;

        active.forEach((fish, index) => {
          if (index >= maxVisible) {
            if (fish.el) fish.el.remove();
            fish.caught = true;
            return;
          }

          const dir = fish.dir || (fish.speed >= 0 ? 1 : -1);
          const abs = Math.max(24, Math.min(48, Math.abs(fish.speed || fish.vx || 32)));

          fish.dir = dir;
          fish.speed = abs * dir;
          fish.vx = fish.speed;
          fish._naturalNoTeleport = true;

          // Evita “saltos” verticais causados por correções antigas.
          if (!Number.isFinite(fish._screenYLock)) {
            fish._screenYLock = Math.max(150, Math.min((gameHeight || 844) * 0.62, fish.y - cameraY));
          }
          fish.y = cameraY + fish._screenYLock;

          setBalancedElementPosition(fish);
        });
      });

      list.forEach(fish => {
        if (!fish || fish.caught) return;
        if (fish.type === 'giant') return;

        const type = String(fish.type || '').toLowerCase();
        if (type !== 'bottle' && type !== 'chest') return;

        const dir = fish.dir || (fish.speed >= 0 ? 1 : -1);
        const abs = Math.max(34, Math.min(70, Math.abs(fish.speed || fish.vx || 46)));

        fish.dir = dir;
        fish.speed = abs * dir;
        fish.vx = fish.speed;
        fish._naturalNoTeleport = true;

        if (!Number.isFinite(fish._screenYLock)) {
          fish._screenYLock = Math.max(150, Math.min((gameHeight || 844) * 0.62, fish.y - cameraY));
        }
        fish.y = cameraY + fish._screenYLock;

        setBalancedElementPosition(fish);
      });
    }

    const previousRenderAllBalancedFinal = typeof renderAll === 'function' ? renderAll : null;
    if (previousRenderAllBalancedFinal && !renderAll.__balancedRareGiantWrapped) {
      renderAll = function(...args) {
        stabilizeRareAndSpecialMovement();
        return previousRenderAllBalancedFinal.apply(this, args);
      };
      renderAll.__balancedRareGiantWrapped = true;
    }



    /* FIX REAL: CAPTURA DO GIGANTE SEM TRAVAR */
    function playGiant1500SoundNoFreeze() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = audioCtx || new Ctx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(78, now);
        osc.frequency.exponentialRampToValueAtTime(44, now + 0.18);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(480, now);
        filter.frequency.exponentialRampToValueAtTime(160, now + 0.24);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.34);
      } catch (error) {}
    }

    function showGiant1500SplashNoFreeze(fish) {
      try {
        const splash = document.createElement('div');
        splash.className = 'score-splash giant-score-1500';
        splash.textContent = '1500';

        const x = fish && Number.isFinite(fish.x) ? fish.x : hookWorldX;
        const y = fish && Number.isFinite(fish.y) ? fish.y - cameraY : (hookWorldY - cameraY);

        splash.style.position = 'absolute';
        splash.style.left = `${x}px`;
        splash.style.top = `${y}px`;
        splash.style.pointerEvents = 'none';

        game.appendChild(splash);
        setTimeout(() => {
          if (splash && splash.parentNode) splash.remove();
        }, 950);
      } catch (error) {}
    }

    function giantCaptureNoFreeze(fish) {
      if (!fish || fish.type !== 'giant') return false;
      if (fish.__giantCaptureHandled) return true;

      fish.__giantCaptureHandled = true;
      notifyGiantCaptureScoreV12(fish);
      
      

      playGiant1500SoundNoFreeze();
      showGiant1500SplashNoFreeze(fish);

      try {
        game.classList.add('screen-shake');
        setTimeout(() => game.classList.remove('screen-shake'), 260);
      } catch (error) {}

      return true;
    }

    function triggerGiantImpactFeedback(fish) {
      if (fish && typeof fish === 'object' && fish.type === 'giant') giantCaptureNoFreeze(fish);
    };

    function sweepCapturedGiantNoFreeze() {
      try {
        if (typeof fishes === 'undefined' || !Array.isArray(fishes)) return;
        fishes.forEach(fish => {
          if (fish && fish.type === 'giant' && fish.caught && !fish.__giantCaptureHandled) {
            giantCaptureNoFreeze(fish);
          }
        });
      } catch (error) {}
    }

    const originalUpdateFishesGiantNoFreeze = typeof updateFishes === 'function' ? updateFishes : null;
    if (originalUpdateFishesGiantNoFreeze && !updateFishes.__giantNoFreezeWrapped) {
      updateFishes = function(dt) {
        const result = originalUpdateFishesGiantNoFreeze.call(this, dt);
        sweepCapturedGiantNoFreeze();
        return result;
      };
      updateFishes.__giantNoFreezeWrapped = true;
    }

    const originalRenderAllGiantNoFreeze = typeof renderAll === 'function' ? renderAll : null;
    if (originalRenderAllGiantNoFreeze && !renderAll.__giantNoFreezeWrapped) {
      renderAll = function(...args) {
        sweepCapturedGiantNoFreeze();
        return originalRenderAllGiantNoFreeze.apply(this, args);
      };
      renderAll.__giantNoFreezeWrapped = true;
    }


    /* MOEDAS NO MAPA, BOTÃO CONTINUAR E SPLASH ÚNICO DO GIGANTE */
    function getCurrentCoinsForMapHud() {
      try {
        if (typeof totalCoins !== 'undefined' && Number.isFinite(totalCoins)) return totalCoins;
        const stored = Number(localStorage.getItem('pescariaCoins') || localStorage.getItem('coins') || 0);
        return Number.isFinite(stored) ? stored : 0;
      } catch (error) {
        return 0;
      }
    }

    function updateMapCoinsHud() {
      const target = document.getElementById('mapCoinsValue');
      if (!target) return;
      target.textContent = String(Math.max(0, Math.floor(getCurrentCoinsForMapHud())));
    }

    const oldShowMapScreenCoinsHud = typeof showMapScreen === 'function' ? showMapScreen : null;
    if (oldShowMapScreenCoinsHud && !showMapScreen.__coinsHudWrapped) {
      showMapScreen = function(...args) {
        const result = oldShowMapScreenCoinsHud.apply(this, args);
        updateMapCoinsHud();
        return result;
      };
      showMapScreen.__coinsHudWrapped = true;
    }

    updateMapCoinsHud();

    function setFinalButtonModeByMission(missionCompleted) {
      const resultOverlayEl = document.getElementById('resultOverlay');
      const restartButtonEl = document.getElementById('restartBtn');
      if (!resultOverlayEl || !restartButtonEl) return;

      if (missionCompleted) {
        resultOverlayEl.classList.add('result-continue-mode');
        resultOverlayEl.classList.remove('result-retry-mode');
        restartButtonEl.textContent = 'CONTINUAR';
        restartButtonEl.setAttribute('aria-label', 'Continuar');
      } else {
        resultOverlayEl.classList.add('result-retry-mode');
        resultOverlayEl.classList.remove('result-continue-mode');
        restartButtonEl.textContent = 'JOGAR NOVAMENTE';
        restartButtonEl.setAttribute('aria-label', 'Jogar novamente');
      }
    }

    function detectMissionCompletedForFinalButton() {
      try {
        if (typeof currentMissionCompleted !== 'undefined') return !!currentMissionCompleted;
        if (typeof missionCompleted !== 'undefined') return !!missionCompleted;
        if (typeof levelCompleted !== 'undefined') return !!levelCompleted;
        if (typeof lastMissionCompleted !== 'undefined') return !!lastMissionCompleted;

        const resultText = (
          (document.getElementById('missionResultText') && document.getElementById('missionResultText').textContent) ||
          (document.getElementById('resultTitle') && document.getElementById('resultTitle').textContent) ||
          ''
        ).toLowerCase();

        if (resultText.includes('não conclu') || resultText.includes('derrota') || resultText.includes('falhou')) return false;
        if (resultText.includes('conclu') || resultText.includes('parabéns') || resultText.includes('missão conclu')) return true;
      } catch (error) {}

      return false;
    }

    function refreshFinalButtonMode() {
      setFinalButtonModeByMission(detectMissionCompletedForFinalButton());
    }

    const oldShowResultScreenFinalButton = typeof showResultScreen === 'function' ? showResultScreen : null;
    if (oldShowResultScreenFinalButton && !showResultScreen.__continueButtonWrapped) {
      showResultScreen = function(...args) {
        const result = oldShowResultScreenFinalButton.apply(this, args);
        setTimeout(refreshFinalButtonMode, 0);
        setTimeout(refreshFinalButtonMode, 80);
        return result;
      };
      showResultScreen.__continueButtonWrapped = true;
    }

    const oldEndRunFinalButton = typeof endRun === 'function' ? endRun : null;
    if (oldEndRunFinalButton && !endRun.__continueButtonWrapped) {
      endRun = function(...args) {
        const result = oldEndRunFinalButton.apply(this, args);
        setTimeout(refreshFinalButtonMode, 0);
        setTimeout(refreshFinalButtonMode, 80);
        updateMapCoinsHud();
        return result;
      };
      endRun.__continueButtonWrapped = true;
    }
/* SINCRONIZAR HUD DE MISSÃO NO PERFIL */
    function ensureMissionProfileHudImage() {
      try {
        const label = document.getElementById('missionProgressLabel') || document.getElementById('missionText');
        if (!label) return;
        const container = label.closest('.mission-hud, #missionHud, .mission-bar, #missionBar') || label.parentElement;
        if (!container || document.getElementById('missionProfileImage')) return;
        const img = document.createElement('img');
        img.src = './assets/hud-missao-perfil-final.png';
        img.alt = '';
        img.className = 'mission-profile-image';
        img.id = 'missionProfileImage';
        container.insertBefore(img, container.firstChild);
      } catch (error) {}
    }

    function syncMissionProfileHudFinal() {
      ensureMissionProfileHudImage();
      try {
        if (typeof currentPhase !== 'undefined' && phaseNumberEl) {
          phaseNumberEl.textContent = String(currentPhase);
        }
        if (missionProgressLabelEl && missionTextEl && !missionProgressLabelEl.textContent.trim()) {
          missionProgressLabelEl.textContent = missionTextEl.textContent;
        }
      } catch (error) {}
    }

    const oldUpdateMissionHudProfileFinal = typeof updateMissionHud === 'function' ? updateMissionHud : null;
    if (oldUpdateMissionHudProfileFinal && !updateMissionHud.__profileHudFinalWrapped) {
      updateMissionHud = function(...args) {
        const result = oldUpdateMissionHudProfileFinal.apply(this, args);
        syncMissionProfileHudFinal();
        return result;
      };
      updateMissionHud.__profileHudFinalWrapped = true;
    }

    const oldRenderAllProfileHudFinal = typeof renderAll === 'function' ? renderAll : null;
    if (oldRenderAllProfileHudFinal && !renderAll.__profileHudFinalWrapped) {
      renderAll = function(...args) {
        syncMissionProfileHudFinal();
        return oldRenderAllProfileHudFinal.apply(this, args);
      };
      renderAll.__profileHudFinalWrapped = true;
    }

    syncMissionProfileHudFinal();


    /* GARANTIR PERFIL ATRÁS DA MISSÃO */
    function ensureMissionProfileBehind() {
      try {
        const label = document.getElementById('missionProgressLabel') || document.getElementById('missionText');
        if (!label) return;
        const container = label.closest('.mission-hud, #missionHud, .mission-bar, #missionBar') || label.parentElement;
        if (!container || document.getElementById('missionProfileBehind')) return;

        const img = document.createElement('img');
        img.src = './assets/hud-missao-perfil-final.png';
        img.alt = '';
        img.className = 'mission-profile-behind';
        img.id = 'missionProfileBehind';
        container.insertBefore(img, container.firstChild);
      } catch (error) {}
    }

    const oldUpdateMissionHudProfileBehind = typeof updateMissionHud === 'function' ? updateMissionHud : null;
    if (oldUpdateMissionHudProfileBehind && !updateMissionHud.__profileBehindWrapped) {
      updateMissionHud = function(...args) {
        const result = oldUpdateMissionHudProfileBehind.apply(this, args);
        ensureMissionProfileBehind();
        return result;
      };
      updateMissionHud.__profileBehindWrapped = true;
    }

    ensureMissionProfileBehind();


    /* HUD MISSÃO DEFINITIVO: INSERE ARTE NO CONTAINER REAL */
    function getMissionHudContainerFinal() {
      const label = document.getElementById('missionProgressLabel') || document.getElementById('missionText');
      if (!label) return null;
      return label.closest('.mission-hud, #missionHud, .mission-bar, #missionBar, .mission-card, #missionCard') || label.parentElement;
    }

    function ensureCorrectMissionHudFinal() {
      try {
        const container = getMissionHudContainerFinal();
        if (!container) return;

        container.classList.add('mission-hud');

        let img = document.getElementById('missionProfileArt');
        if (!img) {
          img = document.createElement('img');
          img.src = './assets/hud-missao-perfil-final.png';
          img.alt = '';
          img.id = 'missionProfileArt';
          img.className = 'mission-profile-art';
          container.insertBefore(img, container.firstChild);
        } else if (img.parentElement !== container) {
          container.insertBefore(img, container.firstChild);
        }

        if (typeof currentPhase !== 'undefined' && phaseNumberEl) {
          phaseNumberEl.textContent = String(currentPhase);
        }
      } catch (error) {}
    }

    const previousUpdateMissionHudFinalCorrect = typeof updateMissionHud === 'function' ? updateMissionHud : null;
    if (previousUpdateMissionHudFinalCorrect && !updateMissionHud.__correctHudWrapped) {
      updateMissionHud = function(...args) {
        const result = previousUpdateMissionHudFinalCorrect.apply(this, args);
        ensureCorrectMissionHudFinal();
        return result;
      };
      updateMissionHud.__correctHudWrapped = true;
    }

    const previousRenderAllMissionHudFinalCorrect = typeof renderAll === 'function' ? renderAll : null;
    if (previousRenderAllMissionHudFinalCorrect && !renderAll.__correctHudWrapped) {
      renderAll = function(...args) {
        ensureCorrectMissionHudFinal();
        return previousRenderAllMissionHudFinalCorrect.apply(this, args);
      };
      renderAll.__correctHudWrapped = true;
    }

    ensureCorrectMissionHudFinal();



    /* HUD MISSÃO DIRETA: SEM LAYERS E SEM INTERFERIR NO LOOP */
    function disabled_syncCleanMissionHud(){try{const mission=document.getElementById('missionProgress');if(mission){mission.style.left='12px';mission.style.top='10px';mission.style.width='clamp(380px,44vw,470px)';mission.style.right='auto';mission.style.transform='none';}if(typeof currentPhase!=='undefined'&&phaseNumberEl){phaseNumberEl.textContent=String(currentPhase);}}catch(error){}}
    const oldUpdateMissionProgressCleanHud=typeof updateMissionProgress==='function'?updateMissionProgress:null;
    if(oldUpdateMissionProgressCleanHud&&!updateMissionProgress.__cleanHudWrapped){updateMissionProgress=function(...args){const result=oldUpdateMissionProgressCleanHud.apply(this,args);disabled_syncCleanMissionHud();return result;};updateMissionProgress.__cleanHudWrapped=true;}
    disabled_syncCleanMissionHud();


    /* MISSÕES DE ANIMAIS RAROS: SPAWN CONTROLADO E PEIXE AZUL PRESERVADO */
    function getVisibleMissionRareCount(type) {
      if (!Array.isArray(fishes)) return 0;
      return fishes.filter(fish => fish && !fish.caught && fish.type === type).length;
    }

    function getMissionRareCaughtCount(type) {
      if (type === 'seahorse') return missionSeahorseCaught || 0;
      if (type === 'turtle') return missionTurtleCaught || 0;
      if (type === 'shark') return missionSharkCaught || 0;
      return 0;
    }

    function spawnForcedMissionRareAnimal(type) {
      if (!type || !world) return false;
      const el = document.createElement('div');
      el.className = `fish ${type}`;
      world.appendChild(el);

      const dir = Math.random() > 0.5 ? 1 : -1;
      const boundsW = gameWidth || 390;
      const safeTop = Math.max(155, gameHeight * 0.30);
      const safeBottom = Math.min(gameHeight - 165, gameHeight * 0.62);
      const screenY = safeTop + Math.random() * Math.max(40, safeBottom - safeTop);

      const cfg = rareFishConfig && rareFishConfig[type] ? rareFishConfig[type] : { points: 250, width: 64, speed: 42 };
      const fish = {
        id: `${type}-mission-${Date.now()}-${Math.random()}`,
        el,
        x: dir === 1 ? -120 : boundsW + 120,
        y: cameraY + screenY,
        _screenYLock: screenY,
        _keepScreenY: true,
        speed: (type === 'seahorse' ? 42 : type === 'turtle' ? 36 : 58) * dir,
        vx: (type === 'seahorse' ? 42 : type === 'turtle' ? 36 : 58) * dir,
        dir,
        width: type === 'seahorse' ? 40 : type === 'turtle' ? 120 : 170,
        height: type === 'seahorse' ? 70 : type === 'turtle' ? 78 : 92,
        type,
        value: cfg.points || (type === 'seahorse' ? 250 : type === 'turtle' ? 500 : 1000),
        points: cfg.points || (type === 'seahorse' ? 250 : type === 'turtle' ? 500 : 1000),
        caught: false,
        isRareAnimal: true,
        missionForced: true,
        _rareAnimalChecked: true,
        _equipmentRulesApplied: true
      };

      applyRareAnimalStats(fish);
      if (type === 'seahorse' && typeof fixSeahorseSizeDirectionAndSeparation === 'function') {
        fixSeahorseSizeDirectionAndSeparation(fish);
      }
      fishes.push(fish);
      
      if (fish && fish.type === 'giant') notifyGiantSpawnV12(fish);
      return true;
    }

    function ensureMissionRareVisibleControlled() {
      const goal = typeof getPhaseCaptureGoalForPhase === 'function' ? getPhaseCaptureGoalForPhase(currentPhase) : null;
      if (!goal || !['seahorse', 'turtle', 'shark'].includes(goal.type)) return;
      if (!getRareUnlocks().includes(goal.type)) return;

      const caught = getMissionRareCaughtCount(goal.type);
      if (caught >= goal.target) return;

      const visible = getVisibleMissionRareCount(goal.type);
      const remaining = Math.max(0, goal.target - caught - visible);
      const maxVisible = goal.type === 'seahorse' ? 2 : 1;
      const need = Math.min(remaining, Math.max(0, maxVisible - visible));

      for (let i = 0; i < need; i++) {
        spawnForcedMissionRareAnimal(goal.type);
      }
    }

    function preserveMinimumBlueFishVisible() {
      if (!Array.isArray(fishes)) return;
      const activeBlue = fishes.filter(fish => fish && !fish.caught && fish.type === 'normal').length;
      if (activeBlue >= 8) return;

      const needed = Math.min(4, 8 - activeBlue);
      for (let i = 0; i < needed; i++) {
        const el = document.createElement('div');
        el.className = 'fish normal';
        world.appendChild(el);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const screenY = Math.max(150, gameHeight * 0.30) + Math.random() * Math.max(80, gameHeight * 0.42);
        fishes.push({
          el,
          x: dir === 1 ? -130 : (gameWidth || 390) + 130,
          y: cameraY + screenY,
          speed: (60 + Math.random() * 65) * dir,
          dir,
          width: 72,
          height: 54,
          type: 'normal',
          value: 50,
          caught: false,
          _rareAnimalChecked: true,
          _equipmentRulesApplied: true
        });
      }
    }

    const originalRenderAllMissionRareControlled = typeof renderAll === 'function' ? renderAll : null;
    if (originalRenderAllMissionRareControlled && !renderAll.__missionRareControlledWrapped) {
      renderAll = function(...args) {
        ensureMissionRareVisibleControlled();
        preserveMinimumBlueFishVisible();
        return originalRenderAllMissionRareControlled.apply(this, args);
      };
      renderAll.__missionRareControlledWrapped = true;
    }


    /* SINCRONIA FINAL DO HUD DA MISSÃO */
    function disabled_syncFinalMissionHudLayout() {
      try {
        const mission = document.getElementById('missionProgress');
        if (mission) {
          mission.style.left = '10px';
          mission.style.top = '8px';
          mission.style.right = 'auto';
          mission.style.width = 'clamp(560px, 56vw, 650px)';
          mission.style.height = 'auto';
          mission.style.transform = 'none';
          mission.style.backgroundImage = "url('./assets/hud-missao-perfil-final.png')";
          mission.style.backgroundSize = 'contain';
          mission.style.backgroundRepeat = 'no-repeat';
          mission.style.backgroundPosition = 'left top';
        }

        if (typeof currentPhase !== 'undefined' && phaseNumberEl) {
          phaseNumberEl.textContent = String(currentPhase);
        }
      } catch (error) {}
    }

    const originalUpdateMissionProgressFinalHud = typeof updateMissionProgress === 'function' ? updateMissionProgress : null;
    if (originalUpdateMissionProgressFinalHud && !updateMissionProgress.__finalHudLayoutWrapped) {
      updateMissionProgress = function(...args) {
        const result = originalUpdateMissionProgressFinalHud.apply(this, args);
        disabled_syncFinalMissionHudLayout();
        return result;
      };
      updateMissionProgress.__finalHudLayoutWrapped = true;
    }

    disabled_syncFinalMissionHudLayout();

    



    /* PATCH EXTRA TESTADO: substitui os bindings globais antigos, não apenas window.* */
    (function(){
      function stable(){ if (typeof window.__disabledApplyMissionHudStable === 'function') window.__disabledApplyMissionHudStable(); }
      try { disabledFinalHudForceLayout = stable; } catch(e) {}
      try { disabled_finalAlignHudSameLine = stable; } catch(e) {}
      try { disabled_syncCleanMissionHud = stable; } catch(e) {}
      try { disabled_syncFinalMissionHudLayout = stable; } catch(e) {}
      try { forceHudLayout = function(){ stable(); try{const score=document.getElementById('liveScore'); if(score){score.style.left='50%';score.style.right='auto';score.style.top='38px';score.style.transform='translateX(-50%)';score.style.textAlign='center';}}catch(e){} }; } catch(e) {}
      const _stableStart = typeof startRound === 'function' ? startRound : null;
      if (_stableStart && !_stableStart.__lexicalStableHudWrapped) {
        startRound = function(...args) {
          stable();
          const r = _stableStart.apply(this,args);
          stable();
          requestAnimationFrame(stable);
          setTimeout(stable,0);
          setTimeout(stable,20);
          setTimeout(stable,80);
          setTimeout(stable,180);
          return r;
        };
        startRound.__lexicalStableHudWrapped = true;
      }
      const _stableUpdate = typeof updateMissionProgress === 'function' ? updateMissionProgress : null;
      if (_stableUpdate && !_stableUpdate.__lexicalStableHudWrapped) {
        updateMissionProgress = function(...args){ const r=_stableUpdate.apply(this,args); stable(); return r; };
        updateMissionProgress.__lexicalStableHudWrapped = true;
      }
    })();


    /* PATCH EXTRA TESTADO 2: bloqueia qualquer rotina antiga que tente voltar a HUD pequena */
    (function(){
      function stable(){ if (typeof window.__disabledApplyMissionHudStable === 'function') window.__disabledApplyMissionHudStable(); }
      let guarding=false;
      function guardHudFor(ms){
        if(guarding) return;
        guarding=true;
        const end=performance.now()+ms;
        function tick(){
          stable();
          if(performance.now()<end) requestAnimationFrame(tick); else guarding=false;
        }
        requestAnimationFrame(tick);
      }
      const mission=document.getElementById('missionProgress');
      if(mission){
        const observer=new MutationObserver(()=>{ if(document.body.classList.contains('screen-playing')) stable(); });
        observer.observe(mission,{attributes:true,attributeFilter:['style','class']});
      }
      const oldStart=typeof startRound==='function'?startRound:null;
      if(oldStart&&!startRound.__stableGuardWrapped){
        startRound=function(...args){
          stable();
          const r=oldStart.apply(this,args);
          stable();
          guardHudFor(1800);
          return r;
        };
        startRound.__stableGuardWrapped=true;
      }
      const oldUpdate=typeof updateMissionProgress==='function'?updateMissionProgress:null;
      if(oldUpdate&&!updateMissionProgress.__stableGuardWrapped){
        updateMissionProgress=function(...args){const r=oldUpdate.apply(this,args); stable(); guardHudFor(300); return r;};
        updateMissionProgress.__stableGuardWrapped=true;
      }
      guardHudFor(300);
    })();


    

    /* HUD MISSÃO FINAL - 230PX FIXO */
    function applyHud230Fixed() {
      try {
        const mission = document.getElementById('missionProgress');
        const label = document.getElementById('missionProgressLabel');
        const fill = document.getElementById('missionProgressFill');
        const phase = document.getElementById('phaseNumber');
        const isPlaying = document.body.classList.contains('screen-playing');

        if (mission) {
          mission.style.setProperty('position', 'absolute', 'important');
          mission.style.setProperty('left', '10px', 'important');
          mission.style.setProperty('top', '10px', 'important');
          mission.style.setProperty('right', 'auto', 'important');
          mission.style.setProperty('bottom', 'auto', 'important');
          mission.style.setProperty('width', '230px', 'important');
          mission.style.setProperty('min-width', '230px', 'important');
          mission.style.setProperty('max-width', '230px', 'important');
          mission.style.setProperty('height', 'auto', 'important');
          mission.style.setProperty('aspect-ratio', '1307 / 548', 'important');
          mission.style.setProperty('display', isPlaying ? 'block' : 'none', 'important');
          mission.style.setProperty('visibility', isPlaying ? 'visible' : 'hidden', 'important');
          mission.style.setProperty('opacity', isPlaying ? '1' : '0', 'important');
          mission.style.setProperty('overflow', 'visible', 'important');
          mission.style.setProperty('background', "transparent url('./assets/hud-missao-perfil-final.png') left top / contain no-repeat", 'important');
          mission.style.setProperty('transform', 'none', 'important');
          mission.style.setProperty('z-index', '120', 'important');
        }

        if (fill) {
          fill.style.setProperty('left', '35.6%', 'important');
          fill.style.setProperty('top', '36.1%', 'important');
          fill.style.setProperty('height', '18%', 'important');
          fill.style.setProperty('max-width', '53.5%', 'important');
        }

        if (label) {
          label.style.setProperty('left', '35%', 'important');
          label.style.setProperty('top', '29.2%', 'important');
          label.style.setProperty('width', '54%', 'important');
          label.style.setProperty('height', '29%', 'important');
          label.style.setProperty('font-size', '11px', 'important');
          label.style.setProperty('display', 'flex', 'important');
          label.style.setProperty('align-items', 'center', 'important');
          label.style.setProperty('justify-content', 'center', 'important');
          label.style.setProperty('overflow', 'hidden', 'important');
        }

        if (phase) {
          phase.style.setProperty('left', '12px', 'important');
          phase.style.setProperty('top', '61px', 'important');
          phase.style.setProperty('width', '20px', 'important');
          phase.style.setProperty('height', '17px', 'important');
          phase.style.setProperty('font-size', '12px', 'important');
        }
      } catch(e) {}
    }

    const oldStartHud230 = typeof startRound === 'function' ? startRound : null;
    if (oldStartHud230 && !startRound.__hud230Wrapped) {
      startRound = function(...args) {
        const result = oldStartHud230.apply(this, args);
        applyHud230Fixed();
        requestAnimationFrame(applyHud230Fixed);
        setTimeout(applyHud230Fixed, 50);
        setTimeout(applyHud230Fixed, 180);
        return result;
      };
      startRound.__hud230Wrapped = true;
    }

    const oldUpdateHud230 = typeof updateMissionProgress === 'function' ? updateMissionProgress : null;
    if (oldUpdateHud230 && !updateMissionProgress.__hud230Wrapped) {
      updateMissionProgress = function(...args) {
        const result = oldUpdateHud230.apply(this, args);
        applyHud230Fixed();
        return result;
      };
      updateMissionProgress.__hud230Wrapped = true;
    }

    const oldScreenHud230 = typeof setGameScreen === 'function' ? setGameScreen : null;
    if (oldScreenHud230 && !setGameScreen.__hud230Wrapped) {
      setGameScreen = function(...args) {
        const result = oldScreenHud230.apply(this, args);
        applyHud230Fixed();
        return result;
      };
      setGameScreen.__hud230Wrapped = true;
    }

    window.addEventListener('resize', applyHud230Fixed);
    applyHud230Fixed();



    /* MISSÃO: GARANTIA DE FONTE CONSTANTE ANTES/DEPOIS DO INÍCIO */
    function forceMissionLabelConstant14() {
      try {
        const label = document.getElementById('missionProgressLabel');
        if (!label) return;
        label.style.setProperty('font-size', '11px', 'important');
        label.style.setProperty('line-height', '1', 'important');
        label.style.setProperty('text-align', 'left', 'important');
        label.style.setProperty('justify-content', 'flex-start', 'important');
        label.style.setProperty('align-items', 'center', 'important');
        label.style.setProperty('transform', 'none', 'important');
        label.style.setProperty('margin-left', '0', 'important');
        label.style.setProperty('padding-left', '0', 'important');
        label.style.setProperty('white-space', 'nowrap', 'important');
        label.style.setProperty('overflow', 'visible', 'important');
        label.style.setProperty('text-overflow', 'clip', 'important');
        label.style.setProperty('transition', 'none', 'important');
        label.style.setProperty('animation', 'none', 'important');
      } catch (error) {}
    }

    const previousSetGameScreenLabelConstant = typeof setGameScreen === 'function' ? setGameScreen : null;
    if (previousSetGameScreenLabelConstant && !setGameScreen.__labelConstant14Wrapped) {
      setGameScreen = function(...args) {
        const result = previousSetGameScreenLabelConstant.apply(this, args);
        forceMissionLabelConstant14();
        requestAnimationFrame(forceMissionLabelConstant14);
        return result;
      };
      setGameScreen.__labelConstant14Wrapped = true;
    }

    const previousStartRoundLabelConstant = typeof startRound === 'function' ? startRound : null;
    if (previousStartRoundLabelConstant && !startRound.__labelConstant14Wrapped) {
      startRound = function(...args) {
        forceMissionLabelConstant14();
        const result = previousStartRoundLabelConstant.apply(this, args);
        forceMissionLabelConstant14();
        requestAnimationFrame(forceMissionLabelConstant14);
        setTimeout(forceMissionLabelConstant14, 20);
        setTimeout(forceMissionLabelConstant14, 80);
        setTimeout(forceMissionLabelConstant14, 180);
        return result;
      };
      startRound.__labelConstant14Wrapped = true;
    }

    const previousUpdateMissionProgressLabelConstant = typeof updateMissionProgress === 'function' ? updateMissionProgress : null;
    if (previousUpdateMissionProgressLabelConstant && !updateMissionProgress.__labelConstant14Wrapped) {
      updateMissionProgress = function(...args) {
        const result = previousUpdateMissionProgressLabelConstant.apply(this, args);
        forceMissionLabelConstant14();
        return result;
      };
      updateMissionProgress.__labelConstant14Wrapped = true;
    }

    document.addEventListener('DOMContentLoaded', forceMissionLabelConstant14);
    window.addEventListener('load', forceMissionLabelConstant14);
    window.addEventListener('resize', forceMissionLabelConstant14);
    forceMissionLabelConstant14();



    /* FASE NA ESTRELA: CORREÇÃO LEVE SEM TRAVAR O JOGO */
    function fixPhaseNumberStarPosition() {
      try {
        const mission = document.getElementById('missionProgress');
        if (!mission) return;

        let phase = document.getElementById('phaseNumber');
        if (!phase) {
          phase = document.createElement('div');
          phase.id = 'phaseNumber';
          phase.className = 'phase-number';
          mission.appendChild(phase);
        } else if (phase.parentElement !== mission) {
          mission.appendChild(phase);
        }

        if (typeof currentPhase !== 'undefined' && currentPhase) {
          phase.textContent = String(currentPhase);
        }

        phase.style.setProperty('position', 'absolute', 'important');
        phase.style.setProperty('left', '12px', 'important');
        phase.style.setProperty('top', '61px', 'important');
        phase.style.setProperty('width', '24px', 'important');
        phase.style.setProperty('height', '20px', 'important');
        phase.style.setProperty('font-size', '12px', 'important');
        phase.style.setProperty('line-height', '1', 'important');
        phase.style.setProperty('transform', 'none', 'important');
        phase.style.setProperty('margin', '0', 'important');
        phase.style.setProperty('padding', '0', 'important');
        phase.style.setProperty('display', 'flex', 'important');
        phase.style.setProperty('align-items', 'center', 'important');
        phase.style.setProperty('justify-content', 'center', 'important');
        phase.style.setProperty('text-align', 'center', 'important');
        phase.style.setProperty('transition', 'none', 'important');
        phase.style.setProperty('animation', 'none', 'important');
        phase.style.setProperty('visibility', 'visible', 'important');
        phase.style.setProperty('opacity', '1', 'important');
        phase.style.setProperty('z-index', '99999', 'important');
        phase.style.setProperty('pointer-events', 'none', 'important');
      } catch (error) {}
    }

    const oldUpdatePhaseStarSimple = typeof updateMissionProgress === 'function' ? updateMissionProgress : null;
    if (oldUpdatePhaseStarSimple && !updateMissionProgress.__phaseStarSimpleWrapped) {
      updateMissionProgress = function(...args) {
        const result = oldUpdatePhaseStarSimple.apply(this, args);
        fixPhaseNumberStarPosition();
        requestAnimationFrame(fixPhaseNumberStarPosition);
        return result;
      };
      updateMissionProgress.__phaseStarSimpleWrapped = true;
    }

    const oldStartPhaseStarSimple = typeof startRound === 'function' ? startRound : null;
    if (oldStartPhaseStarSimple && !startRound.__phaseStarSimpleWrapped) {
      startRound = function(...args) {
        const result = oldStartPhaseStarSimple.apply(this, args);
        fixPhaseNumberStarPosition();
        requestAnimationFrame(fixPhaseNumberStarPosition);
        setTimeout(fixPhaseNumberStarPosition, 80);
        return result;
      };
      startRound.__phaseStarSimpleWrapped = true;
    }

    const oldScreenPhaseStarSimple = typeof setGameScreen === 'function' ? setGameScreen : null;
    if (oldScreenPhaseStarSimple && !setGameScreen.__phaseStarSimpleWrapped) {
      setGameScreen = function(...args) {
        const result = oldScreenPhaseStarSimple.apply(this, args);
        fixPhaseNumberStarPosition();
        return result;
      };
      setGameScreen.__phaseStarSimpleWrapped = true;
    }

    document.addEventListener('DOMContentLoaded', fixPhaseNumberStarPosition);
    window.addEventListener('load', fixPhaseNumberStarPosition);
    window.addEventListener('resize', fixPhaseNumberStarPosition);
    fixPhaseNumberStarPosition();


    /* PEIXE GIGANTE: PONTUAÇÃO ÚNICA POR CAPTURA */
    const giantScoredKeys = new Set();

    function getGiantScoreKey(fish) {
      if (!fish) return null;
      if (fish.__giantScoreKey) return fish.__giantScoreKey;
      const key = fish.id || fish.uid || fish.spawnId || (fish.el && (fish.el.dataset.giantId || fish.el.dataset.id));
      fish.__giantScoreKey = key || `giant-${Date.now()}-${Math.random()}`;
      if (fish.el) {
        fish.el.dataset.giantId = fish.__giantScoreKey;
      }
      return fish.__giantScoreKey;
    }

    function canScoreGiantOnce(fish) {
      const key = getGiantScoreKey(fish);
      if (!key) return false;
      if (fish.__giantAlreadyScored || giantScoredKeys.has(key)) return false;
      fish.__giantAlreadyScored = true;
      giantScoredKeys.add(key);
      return true;
    }

    function markGiantCollectedAndSafe(fish) {
      try {
        if (!fish) return;
        fish.caught = true;
        fish.removed = true;
        fish.active = false;
        fish.__remove = true;
        fish.__giantAlreadyScored = true;
        if (fish.el) {
          fish.el.style.pointerEvents = 'none';
          fish.el.style.display = 'none';
          fish.el.classList.add('caught', 'hidden', 'removed');
        }
      } catch (error) {}
    }


    /* RESUMO FINAL DINÂMICO: FIXOS + DESBLOQUEÁVEIS CAPTURADOS */
    function renderFinalCatchSummaryDynamic() {
      try {
        const grid = document.getElementById('finalCatchGrid') || document.querySelector('.fish-count-grid');
        if (!grid) return;

        const items = [
          { key: 'normal', img: './assets/fish-normal.png', alt: 'Peixe azul', count: normalCaught || 0, always: true },
          { key: 'gold', img: './assets/fish-gold.png', alt: 'Peixe dourado', count: goldCaught || 0, always: true },
          { key: 'giant', img: './assets/fish-giant.png', alt: 'Peixe gigante', count: giantCaught || 0, always: true },
          { key: 'bottle', img: './assets/item-bottle.png', alt: 'Garrafa', count: bottleCaught || 0, always: true },
          { key: 'chest', img: './assets/item-chest.png', alt: 'Baú', count: chestCaught || 0, always: true },
          { key: 'seahorse', img: './assets/cavalo-marinho.png', alt: 'Cavalo-marinho', count: seahorseCaught || 0, always: false },
          { key: 'turtle', img: './assets/tartaruga-marinha.png', alt: 'Tartaruga marinha', count: turtleCaught || 0, always: false },
          { key: 'shark', img: './assets/tubarao.png', alt: 'Tubarão', count: sharkCaught || 0, always: false }
        ];

        grid.innerHTML = items
          .filter(item => item.always || item.count > 0)
          .map(item => `
            <div class="fish-count-item final-catch-${item.key}">
              <img src="${item.img}" alt="${item.alt}">
              <strong id="${item.key}Count">${item.count}</strong>
            </div>
          `)
          .join('');
      } catch (error) {}
    }


    


    /* CORREÇÃO DEFINITIVA VIA INLINE STYLE: barras de missão com texto completo */
    function fixFinalMissionBarsTextFull() {
      try {
        const list = document.getElementById('finalMissionStatusList');
        if (!list) return;

        list.style.setProperty('width', '560px', 'important');
        list.style.setProperty('max-width', 'calc(100% - 80px)', 'important');
        list.style.setProperty('margin-left', 'auto', 'important');
        list.style.setProperty('margin-right', 'auto', 'important');
        list.style.setProperty('align-items', 'center', 'important');

        list.querySelectorAll('.final-mission-row').forEach(row => {
          row.style.setProperty('width', '560px', 'important');
          row.style.setProperty('max-width', '100%', 'important');
          row.style.setProperty('min-height', '38px', 'important');
          row.style.setProperty('height', '38px', 'important');
          row.style.setProperty('box-sizing', 'border-box', 'important');
          row.style.setProperty('padding', '5px 16px 5px 46px', 'important');
          row.style.setProperty('font-size', '18px', 'important');
          row.style.setProperty('line-height', '1', 'important');
          row.style.setProperty('overflow', 'visible', 'important');
          row.style.setProperty('justify-content', 'flex-start', 'important');
        });

        list.querySelectorAll('.final-mission-text').forEach(text => {
          text.style.setProperty('display', 'block', 'important');
          text.style.setProperty('font-size', '18px', 'important');
          text.style.setProperty('line-height', '1', 'important');
          text.style.setProperty('white-space', 'nowrap', 'important');
          text.style.setProperty('overflow', 'visible', 'important');
          text.style.setProperty('text-overflow', 'clip', 'important');
          text.style.setProperty('max-width', 'none', 'important');
          text.style.setProperty('width', 'auto', 'important');
          text.style.setProperty('text-align', 'left', 'important');
        });

        list.querySelectorAll('.final-mission-progress').forEach(progress => {
          progress.remove();
        });
      } catch (error) {}
    }

    const oldRenderFinalMissionStatusRowsTextFull = typeof renderFinalMissionStatusRows === 'function' ? renderFinalMissionStatusRows : null;
    if (oldRenderFinalMissionStatusRowsTextFull && !renderFinalMissionStatusRows.__textFullWrapped) {
      renderFinalMissionStatusRows = function(...args) {
        const result = oldRenderFinalMissionStatusRowsTextFull.apply(this, args);
        fixFinalMissionBarsTextFull();
        requestAnimationFrame(fixFinalMissionBarsTextFull);
        setTimeout(fixFinalMissionBarsTextFull, 60);
        return result;
      };
      renderFinalMissionStatusRows.__textFullWrapped = true;
    }

    document.addEventListener('DOMContentLoaded', fixFinalMissionBarsTextFull);
    window.addEventListener('load', fixFinalMissionBarsTextFull);


    
    /* TELA FINAL: DUAS MISSÕES COM BARRAS, CHECK E X */
    function disabled_renderFinalMissionStatusRows_old(phaseScoreValue) {
      try {
        const target = document.getElementById('finalMissionStatusList');
        if (!target) return;

        const captureGoal = typeof getPhaseCaptureGoalForPhase === 'function'
          ? getPhaseCaptureGoalForPhase(currentPhase)
          : { text: 'Complete a missão', target: 1 };

        const captureCurrent = typeof getPhaseCaptureProgress === 'function'
          ? getPhaseCaptureProgress()
          : 0;

        const captureTarget = Number(captureGoal && captureGoal.target ? captureGoal.target : 1);
        const captureDone = captureCurrent >= captureTarget;

        const scoreTarget = typeof getPhaseScoreRequiredForPhase === 'function'
          ? getPhaseScoreRequiredForPhase(currentPhase)
          : 0;

        const finalScoreValue = Number.isFinite(Number(phaseScoreValue)) ? Number(phaseScoreValue) : score;
        const scoreDone = finalScoreValue >= scoreTarget;

        const captureText = captureGoal && captureGoal.text
          ? String(captureGoal.text)
          : `Complete ${captureTarget} capturas`;

        const rows = [
          { done: captureDone, label: captureText },
          { done: scoreDone, label: `Ganhe ${scoreTarget} pontos` }
        ];

        target.className = 'final-mission-status-list';
        target.innerHTML = rows.map(row => `
          <div class="final-mission-row ${row.done ? 'completed' : 'failed'}">
            <span class="final-mission-icon">${row.done ? '✓' : '×'}</span>
            <span class="final-mission-text">${row.label}</span>
          </div>
        `).join('');

        forceFinalMissionBarsRestored();
      } catch (error) {}
    }



    /* OVERRIDE DEFINITIVO: BARRAS DE MISSÃO DA TELA FINAL */
    function disabled_renderFinalMissionStatusRows_old(phaseScoreValue) {
      try {
        const target = document.getElementById('finalMissionStatusList');
        if (!target) return;

        const captureGoal = typeof getPhaseCaptureGoalForPhase === 'function'
          ? getPhaseCaptureGoalForPhase(currentPhase)
          : { text: 'Complete a missão', target: 1 };

        const captureCurrent = typeof getPhaseCaptureProgress === 'function'
          ? getPhaseCaptureProgress()
          : 0;

        const captureTarget = Number(captureGoal && captureGoal.target ? captureGoal.target : 1);
        const captureDone = captureCurrent >= captureTarget;

        const scoreTarget = typeof getPhaseScoreRequiredForPhase === 'function'
          ? getPhaseScoreRequiredForPhase(currentPhase)
          : 0;

        const finalScoreValue = Number.isFinite(Number(phaseScoreValue)) ? Number(phaseScoreValue) : score;
        const scoreDone = finalScoreValue >= scoreTarget;

        const captureText = captureGoal && captureGoal.text
          ? String(captureGoal.text)
          : `Complete ${captureTarget} capturas`;

        const rows = [
          { done: captureDone, label: captureText },
          { done: scoreDone, label: `Ganhe ${scoreTarget} pontos` }
        ];

        target.innerHTML = "";
        target.className = "final-mission-status-list";
        target.style.cssText = "width:660px!important;max-width:92%!important;margin:12px auto 10px auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;";

        rows.forEach(row => {
          const bar = document.createElement("div");
          bar.className = "final-mission-row " + (row.done ? "completed" : "failed");
          bar.style.cssText = [
            "position:relative!important",
            "width:660px!important",
            "max-width:100%!important",
            "min-height:42px!important",
            "box-sizing:border-box!important",
            "border-radius:22px!important",
            "display:flex!important",
            "align-items:center!important",
            "justify-content:flex-start!important",
            "padding:6px 20px 6px 54px!important",
            "overflow:hidden!important",
            "box-shadow:inset 0 3px 0 rgba(255,255,255,.26),0 5px 0 rgba(0,0,0,.18),0 8px 14px rgba(0,0,0,.18)!important",
            "font-family:Arial Black,Impact,system-ui,sans-serif!important",
            "color:#fff!important",
            "text-shadow:0 2px 0 rgba(0,0,0,.48),0 0 5px rgba(0,0,0,.35)!important",
            "background:" + (row.done ? "linear-gradient(180deg,#5de45d 0%,#22ba36 100%)" : "linear-gradient(180deg,#ff3535 0%,#dc0018 100%)") + "!important"
          ].join(";");

          const icon = document.createElement("span");
          icon.className = "final-mission-icon";
          icon.textContent = row.done ? "✓" : "×";
          icon.style.cssText = "position:absolute!important;left:4px!important;top:50%!important;transform:translateY(-50%)!important;width:36px!important;height:36px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important;line-height:1!important;font-weight:900!important;color:#fff!important;background:rgba(255,255,255,.20)!important;text-shadow:0 3px 0 rgba(0,0,0,.30)!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.24)!important;";

          const text = document.createElement("span");
          text.className = "final-mission-text";
          text.textContent = row.label;
          text.style.cssText = "display:block!important;flex:1 1 auto!important;width:auto!important;max-width:none!important;min-width:0!important;font-size:14px!important;line-height:1!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;text-align:left!important;color:#fff!important;";

          bar.appendChild(icon);
          bar.appendChild(text);
          target.appendChild(bar);
        });
      } catch (error) {}
    }


    /* FUNÇÃO FINAL ÚNICA: BARRAS DE MISSÃO SEM CONFLITO */
    

function renderFinalMissionStatusRows(phaseScoreValue) {
      try {
        const target = document.getElementById('finalMissionStatusList');
        if (!target) return;

        const snapshot = finalMissionResultSnapshot || {};
        const captureGoal = snapshot.captureGoal || (typeof getPhaseCaptureGoalForPhase === 'function'
          ? getPhaseCaptureGoalForPhase(currentPhase)
          : { label: 'Complete a missão', target: 1 });

        const captureCurrent = Number.isFinite(Number(snapshot.captureProgress))
          ? Number(snapshot.captureProgress)
          : (typeof getPhaseCaptureProgress === 'function' ? Number(getPhaseCaptureProgress() || 0) : 0);

        const captureTarget = Number(captureGoal && captureGoal.target ? captureGoal.target : 1);
        const captureDone = captureCurrent >= captureTarget;

        const scoreTarget = Number.isFinite(Number(snapshot.scoreTarget))
          ? Number(snapshot.scoreTarget)
          : (typeof getPhaseScoreRequiredForPhase === 'function' ? Number(getPhaseScoreRequiredForPhase(currentPhase) || 0) : 0);

        const scoreValue = Number.isFinite(Number(snapshot.scoreValue))
          ? Number(snapshot.scoreValue)
          : (Number.isFinite(Number(phaseScoreValue)) ? Number(phaseScoreValue) : Number(score || 0));

        const scoreDone = scoreValue >= scoreTarget;

        const captureLabel = captureGoal && (captureGoal.label || captureGoal.text || captureGoal.title)
          ? (captureGoal.label || captureGoal.text || captureGoal.title)
          : 'Complete a missão';

        const rows = [
          { done: captureDone, label: captureLabel },
          { done: scoreDone, label: `Ganhe ${scoreTarget} pontos` }
        ];

        target.innerHTML = rows.map(row => `
          <div class="final-mission-row ${row.done ? 'completed' : 'failed'}">
            <span class="final-mission-icon">${row.done ? '✓' : '×'}</span>
            <span class="final-mission-text">${row.label}</span>
          </div>
        `).join('');

        if (typeof forceFinalMissionBarsRestored === 'function') forceFinalMissionBarsRestored();
        if (typeof fixFinalMissionBarsTextFull === 'function') fixFinalMissionBarsTextFull();
        if (typeof window.fixFinalMissionTextSizeV19 === 'function') window.fixFinalMissionTextSizeV19();
      } catch (error) {
        console.warn('Erro ao renderizar missões finais:', error);
      }
    }


    /* CORREÇÃO MISSÕES DE TARTARUGA: SPAWN GARANTIDO */
    function isCurrentMissionTurtleGoal() {
      try {
        const goal = typeof getPhaseCaptureGoalForPhase === 'function'
          ? getPhaseCaptureGoalForPhase(currentPhase)
          : null;
        const text = String((goal && goal.text) || '').toLowerCase();
        return text.includes('tartaruga') || text.includes('tartarugas') || (goal && goal.kind === 'turtle');
      } catch (error) {
        return false;
      }
    }

    function getCurrentMissionTargetSafe() {
      try {
        const goal = typeof getPhaseCaptureGoalForPhase === 'function'
          ? getPhaseCaptureGoalForPhase(currentPhase)
          : null;
        return Number(goal && goal.target ? goal.target : 0);
      } catch (error) {
        return 0;
      }
    }

    function getCurrentTurtleCaughtSafe() {
      try {
        if (typeof missionTurtleCaught !== 'undefined') return missionTurtleCaught || 0;
        if (typeof turtleCaught !== 'undefined') return turtleCaught || 0;
      } catch (error) {}
      return 0;
    }

    function countVisibleTurtlesSafe() {
      try {
        return fishes.filter(fish => fish && !fish.caught && !fish.removed && fish.type === 'turtle').length;
      } catch (error) {
        return 0;
      }
    }

    function spawnMissionTurtleGuaranteed() {
      try {
        if (!isPlaying || !isCurrentMissionTurtleGoal()) return false;
        if (typeof fishes === 'undefined' || typeof world === 'undefined') return false;

        const target = getCurrentMissionTargetSafe();
        const caught = getCurrentTurtleCaughtSafe();
        const remaining = Math.max(0, target - caught);
        if (remaining <= 0) return false;

        const visible = countVisibleTurtlesSafe();

        // Mantém sempre pelo menos 3 tartarugas visíveis enquanto faltar completar.
        // Se faltarem poucas, ainda deixa pelo menos 2 para não depender de uma única aparição.
        const desiredVisible = remaining >= 3 ? 3 : Math.max(2, remaining);
        if (visible >= desiredVisible) return false;

        const gameW = typeof gameWidth !== 'undefined' ? gameWidth : 480;
        const gameH = typeof gameHeight !== 'undefined' ? gameHeight : 800;
        const camY = typeof cameraY !== 'undefined' ? cameraY : 0;

        const el = document.createElement('div');
        el.className = 'fish turtle mission-forced-turtle';
        world.appendChild(el);

        const dir = Math.random() > 0.5 ? 1 : -1;
        const safeTop = Math.max(135, gameH * 0.22);
        const safeBottom = Math.min(gameH - 170, gameH * 0.68);
        const screenY = safeTop + Math.random() * Math.max(40, safeBottom - safeTop);

        fishes.push({
          id: `mission-turtle-${Date.now()}-${Math.random()}`,
          el,
          x: dir === 1 ? -140 : gameW + 140,
          y: camY + screenY,
          speed: (34 + Math.random() * 12) * dir,
          dir,
          width: 86,
          height: 62,
          type: 'turtle',
          value: 250,
          caught: false,
          special: true,
          missionForced: true
        });

        return true;
      } catch (error) {
        return false;
      }
    }

    function maintainMissionTurtleSpawns() {
      try {
        if (!isPlaying || !isCurrentMissionTurtleGoal()) return;
        spawnMissionTurtleGuaranteed();
      } catch (error) {}
    }

    const oldStartRoundTurtleMissionFix = typeof startRound === 'function' ? startRound : null;
    if (oldStartRoundTurtleMissionFix && !startRound.__turtleMissionFixWrapped) {
      startRound = function(...args) {
        const result = oldStartRoundTurtleMissionFix.apply(this, args);
        setTimeout(maintainMissionTurtleSpawns, 300);
        setTimeout(maintainMissionTurtleSpawns, 900);
        setTimeout(maintainMissionTurtleSpawns, 1600);
        return result;
      };
      startRound.__turtleMissionFixWrapped = true;
    }

    const oldUpdateTurtleMissionFix = typeof updateGame === 'function' ? updateGame : null;
    if (oldUpdateTurtleMissionFix && !updateGame.__turtleMissionFixWrapped) {
      let __lastTurtleMissionSpawnCheck = 0;
      updateGame = function(...args) {
        const result = oldUpdateTurtleMissionFix.apply(this, args);
        try {
          const now = performance.now();
          if (now - __lastTurtleMissionSpawnCheck > 850) {
            __lastTurtleMissionSpawnCheck = now;
            maintainMissionTurtleSpawns();
          }
        } catch (error) {}
        return result;
      };
      updateGame.__turtleMissionFixWrapped = true;
    }

    const oldRegisterMissionCaptureTurtleFix = typeof registerMissionCapture === 'function' ? registerMissionCapture : null;
    if (oldRegisterMissionCaptureTurtleFix && !registerMissionCapture.__turtleMissionFixWrapped) {
      registerMissionCapture = function(...args) {
        const result = oldRegisterMissionCaptureTurtleFix.apply(this, args);
        setTimeout(maintainMissionTurtleSpawns, 120);
        return result;
      };
      registerMissionCapture.__turtleMissionFixWrapped = true;
    }

function updateHudScopeV16() { try { updateHUDVisibilityV19(); } catch(error) {} }
