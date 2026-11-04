/**
 * Digger Main Game Engine - Polished, Faithful & Responsive
 * 15x10 grid arcade simulation with smooth controls, physics, AI & mobile touch support.
 */

class DiggerGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Logical dimensions
    this.COLS = 15;
    this.ROWS = 10;
    this.cellSize = 32; // will be scaled dynamically
    this.viewWidth = 480;
    this.viewHeight = 320;

    // Game state
    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'LIFE_LOST', 'LEVEL_CLEAR', 'GAME_OVER'
    this.levelIndex = 0;
    this.score = 0;
    this.highScore = 0;
    this.lives = 3;
    this.extraLifeAwarded = false;

    // Grid data
    this.dirt = [];      // 2D boolean: true if dirt exists
    this.emeralds = [];  // 2D boolean: true if emerald exists

    // Entities
    this.digger = null;
    this.bags = [];
    this.monsters = [];
    this.fireball = null;
    this.cherry = null;
    this.particles = [];
    this.floatingTexts = [];

    // Level progression
    this.remainingEmeralds = 0;
    this.totalEmeralds = 0;
    this.monstersSpawned = 0;
    this.monstersRemaining = 0;
    this.monsterSpawnTimer = 0;
    this.bonusActive = false;
    this.bonusTimer = 0;
    this.bonusEatenCount = 0;

    // Emerald streak tracking
    this.emeraldStreak = 0;
    this.lastEmeraldTime = 0;

    // Weapon recharge
    this.weaponCooldown = 8.5; // seconds
    this.weaponTimer = 0;      // 0 = ready

    // Timing
    this.lastTime = 0;
    this.stateTimer = 0;

    // Input tracking
    this.activeKeys = new Set();
    this.touchHeldDir = null;
    this.touchStartPos = null;

    // Load High Score
    try {
      this.highScore = parseInt(localStorage.getItem('digger_high_score') || '0', 10);
    } catch (e) {}

    this.initDOM();
    this.initEvents();
    this.resizeCanvas();
    this.updateHUD();

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initDOM() {
    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudLevel = document.getElementById('hud-level');
    this.hudLives = document.getElementById('hud-lives');
    this.hudWeapon = document.getElementById('hud-weapon');
    this.fireBtn = document.getElementById('btn-fire');
    this.fireFill = document.getElementById('fire-charge-fill');
  }

  initEvents() {
    // Window resize
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Canvas swipe & tap gestures for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.touchStartPos || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - this.touchStartPos.x;
      const dy = e.touches[0].clientY - this.touchStartPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.setDirection(dx > 0 ? 0 : 2); // 0: Right, 2: Left
        } else {
          this.setDirection(dy > 0 ? 1 : 3); // 1: Down, 3: Up
        }
        this.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.touchStartPos = null;
      if (this.digger && this.activeKeys.size === 0 && this.touchHeldDir === null) {
        this.digger.wantStop = true;
      }
    });

    // Virtual D-Pad buttons
    const bindBtn = (id, dir) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const onPress = (e) => {
        e.preventDefault();
        window.diggerAudio.ensureContext();
        this.touchHeldDir = dir;
        this.setDirection(dir);
      };

      const onRelease = (e) => {
        e.preventDefault();
        if (this.touchHeldDir === dir) {
          this.touchHeldDir = null;
          this.checkStopMovement();
        }
      };

      btn.addEventListener('pointerdown', onPress);
      btn.addEventListener('pointerup', onRelease);
      btn.addEventListener('pointercancel', onRelease);
      btn.addEventListener('pointerleave', onRelease);
    };

    bindBtn('btn-up', 3);
    bindBtn('btn-down', 1);
    bindBtn('btn-left', 2);
    bindBtn('btn-right', 0);

    // Fire button
    if (this.fireBtn) {
      const onFire = (e) => {
        e.preventDefault();
        window.diggerAudio.ensureContext();
        this.fireWeapon();
      };
      this.fireBtn.addEventListener('pointerdown', onFire);
    }

    // Modal & toolbar buttons
    document.getElementById('btn-sound')?.addEventListener('click', () => {
      window.diggerAudio.toggleSound();
      this.updateAudioIcons();
    });

    document.getElementById('btn-music')?.addEventListener('click', () => {
      window.diggerAudio.toggleMusic();
      this.updateAudioIcons();
    });

    document.getElementById('btn-palette')?.addEventListener('click', () => {
      const p = window.diggerSprites.togglePalette();
      const el = document.getElementById('palette-text');
      if (el) el.textContent = p === 'modern' ? 'VIBRANT' : 'CGA RETRO';
    });

    document.getElementById('btn-crt')?.addEventListener('click', () => {
      const wrapper = document.getElementById('game-wrapper');
      wrapper.classList.toggle('crt-effect');
    });

    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('btn-help')?.addEventListener('click', () => {
      this.showModal('modal-help');
    });

    document.getElementById('btn-leaderboard')?.addEventListener('click', () => {
      this.showLeaderboard();
    });

    // Start Game buttons
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      this.hideModal('modal-start');
      this.startNewGame();
    });

    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      this.hideModal('modal-gameover');
      this.startNewGame();
    });

    // Close buttons for modals
    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.game-modal');
        if (modal) modal.classList.add('hidden');
        if (this.state === 'PAUSED') {
          this.state = 'PLAYING';
          window.diggerAudio.playMusic(this.bonusActive ? 'bonus' : 'popcorn');
        }
      });
    });
  }

  updateAudioIcons() {
    const sBtn = document.getElementById('sound-icon');
    const mBtn = document.getElementById('music-icon');
    if (sBtn) sBtn.textContent = window.diggerAudio.soundEnabled ? '🔊' : '🔇';
    if (mBtn) mBtn.textContent = window.diggerAudio.musicEnabled ? '🎵' : '🚫';
  }

  showModal(id) {
    if (this.state === 'PLAYING') this.state = 'PAUSED';
    document.getElementById(id)?.classList.remove('hidden');
  }

  hideModal(id) {
    document.getElementById(id)?.classList.add('hidden');
  }

  handleKeyDown(e) {
    window.diggerAudio.ensureContext();

    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.togglePause();
      return;
    }

    if (e.code === 'KeyM') {
      window.diggerAudio.toggleMusic();
      this.updateAudioIcons();
      return;
    }

    if (this.state !== 'PLAYING') return;

    let dir = null;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') dir = 0;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') dir = 1;
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') dir = 2;
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') dir = 3;

    if (dir !== null) {
      e.preventDefault();
      this.activeKeys.add(e.code);
      this.setDirection(dir);
    } else if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'Enter' || e.code === 'F1') {
      e.preventDefault();
      this.fireWeapon();
    }
  }

  handleKeyUp(e) {
    this.activeKeys.delete(e.code);
    this.checkStopMovement();
  }

  checkStopMovement() {
    if (this.activeKeys.size === 0 && this.touchHeldDir === null) {
      if (this.digger) {
        this.digger.wantStop = true;
      }
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      window.diggerAudio.stopMusic(false);
      this.showModal('modal-pause');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.hideModal('modal-pause');
      window.diggerAudio.playMusic(this.bonusActive ? 'bonus' : 'popcorn');
    }
  }

  setDirection(dir) {
    if (!this.digger || this.digger.isDead) return;
    this.digger.nextDir = dir;
    this.digger.isMoving = true;
    this.digger.wantStop = false;
  }

  resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const aspect = this.COLS / this.ROWS; // 15 / 10 = 1.5

    let w = rect.width;
    let h = rect.height;

    if (w / h > aspect) {
      w = h * aspect;
    } else {
      h = w / aspect;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${Math.floor(w)}px`;
    this.canvas.style.height = `${Math.floor(h)}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    this.viewWidth = w;
    this.viewHeight = h;
    this.cellSize = w / this.COLS;
  }

  // --- Game Lifecycle ---

  startNewGame() {
    window.diggerAudio.ensureContext();
    this.levelIndex = 0;
    this.score = 0;
    this.lives = 3;
    this.extraLifeAwarded = false;
    this.weaponTimer = 0;
    this.loadLevel(this.levelIndex);
  }

  loadLevel(idx) {
    const levelData = DIGGER_LEVELS[idx % DIGGER_LEVELS.length];

    this.state = 'PLAYING';
    this.bonusActive = false;
    this.bonusTimer = 0;
    this.bonusEatenCount = 0;
    this.emeraldStreak = 0;
    this.activeKeys.clear();
    this.touchHeldDir = null;

    this.monstersSpawned = 0;
    this.monstersRemaining = levelData.monsterTotal;
    this.monsterSpawnTimer = 0.5; // spawn first monster immediately!

    // Initialize 2D grid arrays
    this.dirt = [];
    this.emeralds = [];
    this.bags = [];
    this.monsters = [];
    this.particles = [];
    this.floatingTexts = [];
    this.fireball = null;
    this.cherry = null;

    this.remainingEmeralds = 0;

    let startX = 7;
    let startY = 9;

    for (let r = 0; r < this.ROWS; r++) {
      this.dirt[r] = [];
      this.emeralds[r] = [];
      const rowStr = levelData.map[r] || '';

      for (let c = 0; c < this.COLS; c++) {
        const char = rowStr[c] || ' ';

        if (char === 'E') {
          this.dirt[r][c] = true;
          this.emeralds[r][c] = true;
          this.remainingEmeralds++;
        } else if (char === '.') {
          this.dirt[r][c] = true;
          this.emeralds[r][c] = false;
        } else if (char === 'B') {
          this.dirt[r][c] = false;
          this.emeralds[r][c] = false;
          this.bags.push({
            x: c,
            y: r,
            state: 'IDLE', // IDLE, WOBBLING, FALLING, BROKEN
            wobbleTimer: 0,
            fallDist: 0,
            pushDir: null,
            pushProgress: 0
          });
        } else if (char === 'S') {
          this.dirt[r][c] = false;
          this.emeralds[r][c] = false;
          startX = c;
          startY = r;
        } else {
          // Open tunnel ' ' or 'M'
          this.dirt[r][c] = false;
          this.emeralds[r][c] = false;
        }
      }
    }

    this.totalEmeralds = this.remainingEmeralds;

    // Create Digger Player
    this.digger = {
      x: startX,
      y: startY,
      dir: 0,       // 0: Right, 1: Down, 2: Left, 3: Up
      nextDir: 0,
      isMoving: false,
      wantStop: false,
      isDigging: false,
      isDead: false,
      deathProgress: 0,
      pushingBag: null,
      digSoundTimer: 0
    };

    this.updateHUD();
    window.diggerAudio.playMusic('popcorn');
  }

  // --- Game Loop ---

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
    } else if (this.state === 'LIFE_LOST') {
      this.updateLifeLost(dt);
    } else if (this.state === 'LEVEL_CLEAR') {
      this.updateLevelClear(dt);
    }

    window.diggerSprites.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Update Simulation ---

  update(dt) {
    // 1. Weapon Recharge Timer
    if (this.weaponTimer > 0) {
      const prev = this.weaponTimer;
      this.weaponTimer = Math.max(0, this.weaponTimer - dt);
      if (prev > 0 && this.weaponTimer === 0) {
        window.diggerAudio.playRecharged();
      }
      this.updateWeaponUI();
    }

    // 2. Bonus Mode Timer
    if (this.bonusActive) {
      this.bonusTimer -= dt;
      if (this.bonusTimer <= 0) {
        this.bonusActive = false;
        window.diggerAudio.playMusic('popcorn');
      }
    }

    // 3. Update Digger Player
    this.updateDigger(dt);

    // 4. Update Gold Bags
    this.updateBags(dt);

    // 5. Update Monsters & Spawner
    this.updateMonsters(dt);

    // 6. Update Fireball Projectile
    this.updateFireball(dt);

    // 7. Update Particles & Floating Text
    this.updateParticles(dt);

    // 8. Check Level Clear Condition
    if (this.remainingEmeralds <= 0 || (this.monstersSpawned >= this.currentLevelData().monsterTotal && this.monsters.length === 0)) {
      this.triggerLevelClear();
    }
  }

  currentLevelData() {
    return DIGGER_LEVELS[this.levelIndex % DIGGER_LEVELS.length];
  }

  // --- Player Digger Physics & Input ---

  updateDigger(dt) {
    if (!this.digger || this.digger.isDead) return;

    const d = this.digger;
    const speed = d.isDigging ? 2.8 : d.pushingBag ? 2.0 : 3.7; // cells per second

    if (!d.isMoving) {
      d.isDigging = false;
      d.pushingBag = null;
      return;
    }

    // Try to turn if nextDir is queued
    if (d.nextDir !== d.dir) {
      const canTurn = this.canTurnTo(d.x, d.y, d.dir, d.nextDir);
      if (canTurn) {
        if (d.nextDir === 0 || d.nextDir === 2) {
          d.y = Math.round(d.y);
        } else {
          d.x = Math.round(d.x);
        }
        d.dir = d.nextDir;
      }
    }

    // If wantStop is true, stop upon reaching integer grid line
    if (d.wantStop) {
      if (Math.abs(d.x - Math.round(d.x)) < 0.12 && Math.abs(d.y - Math.round(d.y)) < 0.12) {
        d.x = Math.round(d.x);
        d.y = Math.round(d.y);
        d.isMoving = false;
        d.wantStop = false;
        d.isDigging = false;
        d.pushingBag = null;
        return;
      }
    }

    // Move in current direction
    const vx = d.dir === 0 ? 1 : d.dir === 2 ? -1 : 0;
    const vy = d.dir === 1 ? 1 : d.dir === 3 ? -1 : 0;

    let targetX = d.x + vx * speed * dt;
    let targetY = d.y + vy * speed * dt;

    // Boundaries
    targetX = Math.max(0, Math.min(this.COLS - 1, targetX));
    targetY = Math.max(0, Math.min(this.ROWS - 1, targetY));

    // Check interaction with Bags (pushing or blocked)
    d.pushingBag = null;
    const checkX = d.dir === 0 ? Math.ceil(targetX) : d.dir === 2 ? Math.floor(targetX) : Math.round(targetX);
    const checkY = d.dir === 1 ? Math.ceil(targetY) : d.dir === 3 ? Math.floor(targetY) : Math.round(targetY);
    const bagAhead = this.findBagAt(checkX, checkY);

    if (bagAhead && bagAhead.state !== 'BROKEN') {
      if (d.dir === 0 || d.dir === 2) {
        const canPush = this.tryPushBag(bagAhead, d.dir, dt);
        if (canPush) {
          d.pushingBag = bagAhead;
        } else {
          targetX = d.x;
          targetY = d.y;
          d.isMoving = false;
        }
      } else {
        targetX = d.x;
        targetY = d.y;
        d.isMoving = false;
      }
    }

    d.x = targetX;
    d.y = targetY;

    // Carve dirt and collect emeralds at current cell
    const cellX = Math.round(d.x);
    const cellY = Math.round(d.y);

    let diggingNow = false;
    if (this.dirt[cellY]?.[cellX]) {
      this.dirt[cellY][cellX] = false;
      diggingNow = true;

      d.digSoundTimer = (d.digSoundTimer || 0) - dt;
      if (d.digSoundTimer <= 0) {
        window.diggerAudio.playDig();
        d.digSoundTimer = 0.16;
      }

      this.spawnDirtParticles(cellX, cellY);
    }
    d.isDigging = diggingNow;

    // Emerald collection
    if (this.emeralds[cellY]?.[cellX]) {
      this.emeralds[cellY][cellX] = false;
      this.collectEmerald(cellX, cellY);
    }

    // Broken Bag collection (Gold coins)
    const brokenBagIdx = this.bags.findIndex((b) => b.state === 'BROKEN' && Math.hypot(b.x - d.x, b.y - d.y) < 0.6);
    if (brokenBagIdx !== -1) {
      this.collectGold(this.bags[brokenBagIdx]);
      this.bags.splice(brokenBagIdx, 1);
    }

    // Cherry collection
    if (this.cherry && Math.hypot(this.cherry.x - d.x, this.cherry.y - d.y) < 0.6) {
      this.collectCherry();
    }
  }

  canTurnTo(x, y, currentDir, targetDir) {
    if ((currentDir === 0 && targetDir === 2) || (currentDir === 2 && targetDir === 0) ||
        (currentDir === 1 && targetDir === 3) || (currentDir === 3 && targetDir === 1)) {
      return true;
    }

    const alignTolerance = 0.38;
    if (targetDir === 0 || targetDir === 2) {
      return Math.abs(y - Math.round(y)) < alignTolerance;
    } else {
      return Math.abs(x - Math.round(x)) < alignTolerance;
    }
  }

  // --- Emerald & Gold Collection ---

  collectEmerald(cx, cy) {
    this.remainingEmeralds--;

    const now = performance.now() / 1000;
    if (now - this.lastEmeraldTime < 2.2) {
      this.emeraldStreak++;
    } else {
      this.emeraldStreak = 1;
    }
    this.lastEmeraldTime = now;

    if (this.emeraldStreak === 8) {
      this.addScore(250);
      window.diggerAudio.playOctaveBonus();
      this.addFloatingText(cx, cy, '+250 OCTAVE!', '#ffd166');
      this.spawnSparkleParticles(cx, cy, '#ffd166');
      this.vibrate([30, 40, 50]);
      this.emeraldStreak = 0;
    } else {
      this.addScore(25);
      window.diggerAudio.playEmerald(this.emeraldStreak);
      this.addFloatingText(cx, cy, '+25', '#06d6a0');
      this.vibrate(15);
    }

    this.updateHUD();
  }

  collectGold(bag) {
    this.addScore(500);
    window.diggerAudio.playGoldPickup();
    this.addFloatingText(bag.x, bag.y, '+500 GOLD!', '#ffd166');
    this.spawnSparkleParticles(bag.x, bag.y, '#ffd166');
    this.vibrate(35);
    this.updateHUD();
  }

  collectCherry() {
    this.cherry = null;
    this.addScore(1000);
    window.diggerAudio.playCherryPickup();
    this.addFloatingText(14, 0, '+1000 CHERRY!', '#ff0055');

    const lvl = this.currentLevelData();
    this.bonusActive = true;
    this.bonusTimer = lvl.bonusDuration || 11.0;
    this.bonusEatenCount = 0;

    this.monsters.forEach((m) => {
      m.isScared = true;
      m.isHobbin = false;
    });

    window.diggerAudio.playMusic('bonus');
    this.vibrate([40, 60, 40]);
  }

  // --- Bag Mechanics ---

  updateBags(dt) {
    for (let i = this.bags.length - 1; i >= 0; i--) {
      const b = this.bags[i];

      if (b.state === 'BROKEN') continue;

      const belowY = Math.floor(b.y) + 1;
      const cellX = Math.round(b.x);

      const hasDirtBelow = belowY < this.ROWS && this.dirt[belowY]?.[cellX];
      const hasGroundBelow = belowY >= this.ROWS;
      const otherBagBelow = this.bags.find((other) =>
        other !== b &&
        Math.round(other.x) === cellX &&
        Math.round(other.y) === belowY &&
        other.state !== 'FALLING'
      );

      const isSupported = hasDirtBelow || hasGroundBelow || otherBagBelow;

      if (b.state === 'IDLE') {
        if (!isSupported) {
          b.state = 'WOBBLING';
          b.wobbleTimer = 0.75;
          window.diggerAudio.playBagWobble();
        }
      } else if (b.state === 'WOBBLING') {
        b.wobbleTimer -= dt;
        if (b.wobbleTimer <= 0) {
          b.state = 'FALLING';
          b.fallDist = 0;
          window.diggerAudio.playBagFall();
        }
      } else if (b.state === 'FALLING') {
        const fallSpeed = 8.5;
        const move = fallSpeed * dt;
        b.y += move;
        b.fallDist += move;

        // Crush Monsters underneath
        for (let m = this.monsters.length - 1; m >= 0; m--) {
          const mon = this.monsters[m];
          if (Math.abs(mon.x - b.x) < 0.65 && Math.abs(mon.y - b.y) < 0.65) {
            this.killMonster(m, 'squashed');
          }
        }

        // Crush Digger Player underneath
        if (this.digger && !this.digger.isDead) {
          if (Math.abs(this.digger.x - b.x) < 0.65 && Math.abs(this.digger.y - b.y) < 0.65) {
            this.killDigger('squashed');
          }
        }

        // Check landing impact
        const nextY = b.y + 0.5;
        const targetCellY = Math.floor(nextY);
        const hitDirt = targetCellY < this.ROWS && this.dirt[targetCellY]?.[cellX];
        const hitBottom = nextY >= this.ROWS - 0.1;
        const hitBag = this.bags.find((o) => o !== b && Math.round(o.x) === cellX && Math.abs(o.y - b.y) < 0.8);

        if (hitDirt || hitBottom || hitBag) {
          b.y = Math.round(b.y);
          if (b.fallDist >= 1.0) {
            b.state = 'BROKEN';
            window.diggerAudio.playBagCrash();
            this.spawnSparkleParticles(b.x, b.y, '#ffd166');
            this.vibrate(30);
          } else {
            b.state = 'IDLE';
          }
        }
      }
    }
  }

  tryPushBag(bag, pushDir, dt) {
    const nextX = pushDir === 0 ? Math.round(bag.x) + 1 : Math.round(bag.x) - 1;
    const currentY = Math.round(bag.y);

    if (nextX < 0 || nextX >= this.COLS) return false;
    if (this.dirt[currentY]?.[nextX]) return false;
    if (this.findBagAt(nextX, currentY)) return false;

    const pushSpeed = 2.0;
    const move = (pushDir === 0 ? 1 : -1) * pushSpeed * dt;
    bag.x += move;

    const cellBelowY = currentY + 1;
    const roundedX = Math.round(bag.x);
    if (cellBelowY < this.ROWS && !this.dirt[cellBelowY]?.[roundedX]) {
      if (Math.abs(bag.x - roundedX) < 0.25) {
        bag.x = roundedX;
        bag.state = 'FALLING';
        bag.fallDist = 0;
        window.diggerAudio.playBagFall();
      }
    }

    return true;
  }

  findBagAt(cx, cy) {
    return this.bags.find((b) => Math.round(b.x) === cx && Math.round(b.y) === cy);
  }

  // --- Active Monster AI & BFS Tunnel Chasing Engine ---

  /**
   * Computes a full BFS distance map from Digger through open tunnels.
   * dist[y][x] = shortest step distance from (x, y) to Digger through open tunnels.
   */
  computeTunnelDistanceMap(targetX, targetY) {
    const dist = [];
    for (let r = 0; r < this.ROWS; r++) {
      dist[r] = new Array(this.COLS).fill(Infinity);
    }

    if (targetX < 0 || targetX >= this.COLS || targetY < 0 || targetY >= this.ROWS) {
      return dist;
    }

    dist[targetY][targetX] = 0;
    const queue = [{ x: targetX, y: targetY }];

    while (queue.length > 0) {
      const cur = queue.shift();
      const curDist = dist[cur.y][cur.x];

      const neighbors = [
        { x: cur.x + 1, y: cur.y },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x, y: cur.y - 1 }
      ];

      for (let i = 0; i < neighbors.length; i++) {
        const n = neighbors[i];
        if (n.x >= 0 && n.x < this.COLS && n.y >= 0 && n.y < this.ROWS) {
          // Passable if open tunnel and not blocked by a solid bag
          if (!this.dirt[n.y][n.x]) {
            const bag = this.findBagAt(n.x, n.y);
            if (!bag || bag.state === 'BROKEN') {
              if (dist[n.y][n.x] === Infinity) {
                dist[n.y][n.x] = curDist + 1;
                queue.push(n);
              }
            }
          }
        }
      }
    }

    return dist;
  }

  /**
   * Computes a full BFS distance map for Hobbins through BOTH dirt and open tunnels.
   * Hobbins chew through dirt directly towards Digger!
   */
  computeHobbinDistanceMap(targetX, targetY) {
    const dist = [];
    for (let r = 0; r < this.ROWS; r++) {
      dist[r] = new Array(this.COLS).fill(Infinity);
    }

    if (targetX < 0 || targetX >= this.COLS || targetY < 0 || targetY >= this.ROWS) {
      return dist;
    }

    dist[targetY][targetX] = 0;
    const queue = [{ x: targetX, y: targetY }];

    while (queue.length > 0) {
      const cur = queue.shift();
      const curDist = dist[cur.y][cur.x];

      const neighbors = [
        { x: cur.x + 1, y: cur.y },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x, y: cur.y - 1 }
      ];

      for (let i = 0; i < neighbors.length; i++) {
        const n = neighbors[i];
        if (n.x >= 0 && n.x < this.COLS && n.y >= 0 && n.y < this.ROWS) {
          if (dist[n.y][n.x] === Infinity) {
            dist[n.y][n.x] = curDist + 1;
            queue.push(n);
          }
        }
      }
    }

    return dist;
  }

  updateMonsters(dt) {
    const lvl = this.currentLevelData();

    // 1. Monster Spawning
    if (this.monstersSpawned < lvl.monsterTotal && this.monsters.length < lvl.monsterMaxActive) {
      this.monsterSpawnTimer -= dt;
      if (this.monsterSpawnTimer <= 0) {
        this.spawnMonster();
        this.monsterSpawnTimer = 3.5;
      }
    }

    // 2. Spawn Cherry once all level monsters have appeared
    if (this.monstersSpawned >= lvl.monsterTotal && !this.cherry && !this.bonusActive) {
      this.cherry = { x: 14, y: 0 };
    }

    // 3. Precompute distance maps to Digger for all monsters
    const dCellX = this.digger ? Math.round(this.digger.x) : 7;
    const dCellY = this.digger ? Math.round(this.digger.y) : 9;
    const tunnelDistMap = this.computeTunnelDistanceMap(dCellX, dCellY);
    const hobbinDistMap = this.computeHobbinDistanceMap(dCellX, dCellY);

    // 4. Update and move each monster
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];

      // Hobbin mutation timer
      if (!this.bonusActive) {
        m.hobbinTimer += dt;
        const maxHobbinWait = lvl.hobbinTime || 9.0;
        if (!m.isHobbin && (m.hobbinTimer > maxHobbinWait || m.stuckTimer > 2.5)) {
          m.isHobbin = true;
          m.hobbinTimer = 0;
          m.stuckTimer = 0;
        } else if (m.isHobbin && m.hobbinTimer > (lvl.hobbinDuration || 9.0)) {
          m.isHobbin = false;
          m.hobbinTimer = 0;
        }
      } else {
        m.isHobbin = false;
        m.isScared = true;
      }

      // Base speed calculation
      const baseSpeed = lvl.monsterSpeed || 2.2;
      const speed = this.bonusActive ? baseSpeed * 0.75 : m.isHobbin ? baseSpeed * 0.85 : baseSpeed;

      // Move monster towards target cell
      this.moveMonster(m, speed, dt, tunnelDistMap, hobbinDistMap);

      // Hobbin chews dirt and eats emeralds in its way!
      if (m.isHobbin) {
        const mcx = Math.round(m.x);
        const mcy = Math.round(m.y);
        if (this.dirt[mcy]?.[mcx]) {
          this.dirt[mcy][mcx] = false;
          this.spawnDirtParticles(mcx, mcy);
        }
        if (this.emeralds[mcy]?.[mcx]) {
          this.emeralds[mcy][mcx] = false;
          this.remainingEmeralds--;
        }
      }

      // Collision with Digger
      if (this.digger && !this.digger.isDead) {
        if (Math.hypot(m.x - this.digger.x, m.y - this.digger.y) < 0.65) {
          if (this.bonusActive && m.isScared) {
            // Digger eats scared monster!
            this.bonusEatenCount++;
            const points = [100, 200, 400, 800][Math.min(this.bonusEatenCount - 1, 3)];
            this.addScore(points);
            window.diggerAudio.playChomp(this.bonusEatenCount);
            this.addFloatingText(m.x, m.y, `+${points}`, '#4361ee');
            this.vibrate(25);
            this.monsters.splice(i, 1);
            continue;
          } else {
            // Monster kills Digger!
            this.killDigger('monster');
          }
        }
      }
    }
  }

  spawnMonster() {
    const m = {
      x: 14,
      y: 0,
      cellX: 14,
      cellY: 0,
      targetX: 14,
      targetY: 0,
      dir: 2, // Left
      isHobbin: false,
      isScared: false,
      hobbinTimer: 0,
      stuckTimer: 0
    };

    const dCellX = this.digger ? Math.round(this.digger.x) : 7;
    const dCellY = this.digger ? Math.round(this.digger.y) : 9;
    const tunnelDistMap = this.computeTunnelDistanceMap(dCellX, dCellY);
    const hobbinDistMap = this.computeHobbinDistanceMap(dCellX, dCellY);
    this.chooseNextMonsterTarget(m, tunnelDistMap, hobbinDistMap);

    this.monsters.push(m);
    this.monstersSpawned++;
  }

  /**
   * Smooth, glitch-free cell-to-cell movement with optimal pathfinding at intersections.
   */
  moveMonster(m, speed, dt, tunnelDistMap, hobbinDistMap) {
    const dx = m.targetX - m.x;
    const dy = m.targetY - m.y;
    const dist = Math.hypot(dx, dy);
    const step = speed * dt;

    if (dist <= step || dist < 0.001) {
      // Reached target intersection cleanly
      m.x = m.targetX;
      m.y = m.targetY;
      m.cellX = m.targetX;
      m.cellY = m.targetY;

      // Select next target cell towards Digger
      this.chooseNextMonsterTarget(m, tunnelDistMap, hobbinDistMap);
    } else {
      // Step continuously along path
      m.x += (dx / dist) * step;
      m.y += (dy / dist) * step;
    }
  }

  /**
   * Active chaser AI: uses shortest-path BFS to hunt Digger through tunnels,
   * or direct burrowing if Hobbin, or fleeing if Scared.
   */
  chooseNextMonsterTarget(m, tunnelDistMap, hobbinDistMap) {
    const cx = m.cellX;
    const cy = m.cellY;

    // 4 possible cardinal moves
    const candidateDirs = [
      { dir: 0, x: cx + 1, y: cy }, // Right
      { dir: 1, x: cx, y: cy + 1 }, // Down
      { dir: 2, x: cx - 1, y: cy }, // Left
      { dir: 3, x: cx, y: cy - 1 }  // Up
    ];

    const oppositeDir = (m.dir + 2) % 4;

    // Filter valid moves
    const validMoves = candidateDirs.filter((n) => {
      if (n.x < 0 || n.x >= this.COLS || n.y < 0 || n.y >= this.ROWS) return false;

      // Hobbins can chew through dirt
      if (m.isHobbin) return true;

      // Nobbins only move through open tunnels
      if (this.dirt[n.y][n.x]) return false;

      // Blocked by solid bag
      const bag = this.findBagAt(n.x, n.y);
      if (bag && bag.state !== 'BROKEN') return false;

      return true;
    });

    // If completely trapped, stay in place and build stuck timer
    if (validMoves.length === 0) {
      m.targetX = cx;
      m.targetY = cy;
      m.stuckTimer += 0.2;
      return;
    }

    const dCellX = this.digger ? Math.round(this.digger.x) : 7;
    const dCellY = this.digger ? Math.round(this.digger.y) : 9;

    // 1. Scared Monster Mode: FLEE from Digger!
    if (this.bonusActive && m.isScared) {
      validMoves.sort((a, b) => {
        const distA = tunnelDistMap[a.y]?.[a.x] ?? Math.hypot(a.x - dCellX, a.y - dCellY);
        const distB = tunnelDistMap[b.y]?.[b.x] ?? Math.hypot(b.x - dCellX, b.y - dCellY);
        if (distA !== distB) return distB - distA; // maximize distance
        if (a.dir === oppositeDir) return 1;
        if (b.dir === oppositeDir) return -1;
        return 0;
      });
      const chosen = validMoves[0];
      m.targetX = chosen.x;
      m.targetY = chosen.y;
      m.dir = chosen.dir;
      return;
    }

    // 2. Hobbin Mode: Chew directly towards Digger!
    if (m.isHobbin) {
      validMoves.sort((a, b) => {
        const dA = hobbinDistMap[a.y]?.[a.x] ?? Math.hypot(a.x - dCellX, a.y - dCellY);
        const dB = hobbinDistMap[b.y]?.[b.x] ?? Math.hypot(b.x - dCellX, b.y - dCellY);
        if (dA !== dB) return dA - dB; // minimize distance
        if (a.dir === oppositeDir) return 1;
        if (b.dir === oppositeDir) return -1;
        return 0;
      });
      const chosen = validMoves[0];
      m.targetX = chosen.x;
      m.targetY = chosen.y;
      m.dir = chosen.dir;

      // If moving into dirt, chew it out immediately
      if (this.dirt[chosen.y]?.[chosen.x]) {
        this.dirt[chosen.y][chosen.x] = false;
        this.spawnDirtParticles(chosen.x, chosen.y);
      }
      return;
    }

    // 3. Nobbin Active Chasing Mode (BFS tunnel pathfinding)
    const currentTunnelDist = tunnelDistMap[cy]?.[cx] ?? Infinity;

    if (currentTunnelDist < Infinity) {
      // Digger is reachable through open tunnels! Chase along shortest path!
      validMoves.sort((a, b) => {
        const distA = tunnelDistMap[a.y]?.[a.x] ?? Infinity;
        const distB = tunnelDistMap[b.y]?.[b.x] ?? Infinity;
        if (distA !== distB) return distA - distB;
        if (a.dir === oppositeDir) return 1;
        if (b.dir === oppositeDir) return -1;
        return 0;
      });
      m.stuckTimer = 0;
    } else {
      // Digger is behind dirt: move to the closest tunnel spot to Digger!
      validMoves.sort((a, b) => {
        const distA = Math.hypot(a.x - dCellX, a.y - dCellY);
        const distB = Math.hypot(b.x - dCellX, b.y - dCellY);
        if (Math.abs(distA - distB) > 0.01) return distA - distB;
        if (a.dir === oppositeDir) return 1;
        if (b.dir === oppositeDir) return -1;
        return 0;
      });
      m.stuckTimer += 0.2; // Nobbin gets impatient when blocked by dirt!
    }

    const chosen = validMoves[0];
    m.targetX = chosen.x;
    m.targetY = chosen.y;
    m.dir = chosen.dir;
  }

  killMonster(index, cause = 'fireball') {
    const m = this.monsters[index];
    if (!m) return;

    this.addScore(250);
    window.diggerAudio.playExplode();
    this.addFloatingText(m.x, m.y, '+250', '#ff5555');
    this.spawnExplosionParticles(m.x, m.y, '#e63946');
    this.vibrate(30);

    this.monsters.splice(index, 1);
  }

  // --- Weapon (Fireball) ---

  fireWeapon() {
    if (this.state !== 'PLAYING' || !this.digger || this.digger.isDead) return;
    if (this.weaponTimer > 0 || this.fireball) return;

    this.weaponTimer = this.weaponCooldown;
    this.updateWeaponUI();

    window.diggerAudio.playFire();
    this.vibrate(20);

    const d = this.digger;
    this.fireball = {
      x: d.x,
      y: d.y,
      dir: d.dir,
      speed: 12.0
    };
  }

  updateFireball(dt) {
    if (!this.fireball) return;

    const fb = this.fireball;
    const vx = fb.dir === 0 ? 1 : fb.dir === 2 ? -1 : 0;
    const vy = fb.dir === 1 ? 1 : fb.dir === 3 ? -1 : 0;

    fb.x += vx * fb.speed * dt;
    fb.y += vy * fb.speed * dt;

    const cx = Math.round(fb.x);
    const cy = Math.round(fb.y);

    if (cx < 0 || cx >= this.COLS || cy < 0 || cy >= this.ROWS || this.dirt[cy]?.[cx]) {
      this.fireball = null;
      return;
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (Math.hypot(m.x - fb.x, m.y - fb.y) < 0.65) {
        this.killMonster(i, 'fireball');
        this.fireball = null;
        return;
      }
    }
  }

  updateWeaponUI() {
    if (this.hudWeapon) {
      const pct = Math.max(0, Math.min(100, Math.round((1 - this.weaponTimer / this.weaponCooldown) * 100)));
      this.hudWeapon.textContent = pct === 100 ? 'READY' : `${pct}%`;
      this.hudWeapon.className = pct === 100 ? 'hud-value ready' : 'hud-value charging';
    }

    if (this.fireFill) {
      const pct = Math.max(0, Math.min(100, Math.round((1 - this.weaponTimer / this.weaponCooldown) * 100)));
      this.fireFill.style.height = `${pct}%`;
    }
  }

  // --- Player Death & Respawn ---

  killDigger(cause) {
    if (this.digger.isDead) return;

    this.digger.isDead = true;
    this.digger.deathProgress = 0;
    this.state = 'LIFE_LOST';
    this.stateTimer = 2.4;

    window.diggerAudio.playFuneralMarch();
    this.vibrate([80, 50, 100]);
  }

  updateLifeLost(dt) {
    this.stateTimer -= dt;
    if (this.digger) {
      this.digger.deathProgress = Math.min(1.0, 1.0 - this.stateTimer / 2.4);
    }

    if (this.stateTimer <= 0) {
      this.lives--;
      this.updateHUD();

      if (this.lives <= 0) {
        this.triggerGameOver();
      } else {
        const lvl = this.currentLevelData();
        let startX = 7, startY = 9;
        for (let r = 0; r < this.ROWS; r++) {
          const idx = lvl.map[r]?.indexOf('S');
          if (idx !== -1) { startX = idx; startY = r; break; }
        }

        this.digger = {
          x: startX,
          y: startY,
          dir: 0,
          nextDir: 0,
          isMoving: false,
          wantStop: false,
          isDigging: false,
          isDead: false,
          deathProgress: 0,
          pushingBag: null,
          digSoundTimer: 0
        };

        // Reset active monsters back to spawner to give player breathing room
        this.monsters.forEach((m) => {
          m.x = 14;
          m.y = 0;
          m.cellX = 14;
          m.cellY = 0;
          m.targetX = 13;
          m.targetY = 0;
          m.dir = 2;
          m.isHobbin = false;
        });

        this.state = 'PLAYING';
        window.diggerAudio.playMusic('popcorn');
      }
    }
  }

  // --- Level Completion & Game Over ---

  triggerLevelClear() {
    this.state = 'LEVEL_CLEAR';
    this.stateTimer = 2.8;

    const levelBonus = 1000 * (this.levelIndex + 1);
    this.addScore(levelBonus);
    window.diggerAudio.playLevelClear();

    this.addFloatingText(7, 4, `STAGE CLEAR! +${levelBonus}`, '#ffd166');
    this.vibrate([40, 40, 80]);
  }

  updateLevelClear(dt) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.levelIndex++;
      this.loadLevel(this.levelIndex);
    }
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    window.diggerAudio.stopMusic();

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      try {
        localStorage.setItem('digger_high_score', this.highScore.toString());
      } catch (e) {}
    }

    this.saveScoreToLeaderboard(this.score, this.levelIndex + 1);

    document.getElementById('gameover-score').textContent = this.score;
    document.getElementById('gameover-level').textContent = this.levelIndex + 1;
    const badge = document.getElementById('new-high-badge');
    if (badge) badge.style.display = isNewHigh ? 'inline-block' : 'none';

    this.showModal('modal-gameover');
  }

  saveScoreToLeaderboard(score, level) {
    try {
      const records = JSON.parse(localStorage.getItem('digger_leaderboard') || '[]');
      records.push({
        score,
        level,
        date: new Date().toLocaleDateString()
      });
      records.sort((a, b) => b.score - a.score);
      const top5 = records.slice(0, 5);
      localStorage.setItem('digger_leaderboard', JSON.stringify(top5));
    } catch (e) {}
  }

  showLeaderboard() {
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem('digger_leaderboard') || '[]');
    } catch (e) {}

    const list = document.getElementById('leaderboard-list');
    if (list) {
      if (records.length === 0) {
        list.innerHTML = '<p class="empty-list">No scores recorded yet. Play a game!</p>';
      } else {
        list.innerHTML = records.map((r, i) => `
          <div class="leaderboard-item">
            <span class="rank">#${i + 1}</span>
            <span class="score">${r.score} PTS</span>
            <span class="level">LVL ${r.level}</span>
            <span class="date">${r.date}</span>
          </div>
        `).join('');
      }
    }
    this.showModal('modal-leaderboard');
  }

  // --- Scoring & HUD ---

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    if (!this.extraLifeAwarded && this.score >= 20000) {
      this.lives++;
      this.extraLifeAwarded = true;
      this.addFloatingText(this.digger.x, this.digger.y, '1UP EXTRA LIFE!', '#00ffcc');
      this.vibrate([50, 50, 50]);
    }

    this.updateHUD();
  }

  updateHUD() {
    if (this.hudScore) this.hudScore.textContent = this.score;
    if (this.hudHighScore) this.hudHighScore.textContent = this.highScore;
    if (this.hudLevel) this.hudLevel.textContent = this.levelIndex + 1;

    if (this.hudLives) {
      let lifeIcons = '';
      for (let i = 0; i < Math.max(0, this.lives); i++) {
        lifeIcons += '<span class="life-icon">🚜</span>';
      }
      this.hudLives.innerHTML = lifeIcons || '<span>0</span>';
    }
  }

  // --- Particles & Floating FX ---

  spawnDirtParticles(cx, cy) {
    const s = this.cellSize;
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: cx * s + s / 2,
        y: cy * s + s / 2,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        color: '#7b441f',
        size: Math.random() * 3 + 2,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  spawnSparkleParticles(cx, cy, color) {
    const s = this.cellSize;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: cx * s + s / 2,
        y: cy * s + s / 2,
        vx: (Math.random() - 0.5) * 110,
        vy: (Math.random() - 0.5) * 110,
        color: color,
        size: Math.random() * 4 + 2,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  spawnExplosionParticles(cx, cy, color) {
    const s = this.cellSize;
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: cx * s + s / 2,
        y: cy * s + s / 2,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.5) * 150,
        color: i % 2 === 0 ? color : '#ffd166',
        size: Math.random() * 5 + 2,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  addFloatingText(cx, cy, text, color = '#ffffff') {
    const s = this.cellSize;
    this.floatingTexts.push({
      x: cx * s + s / 2,
      y: cy * s,
      text: text,
      color: color,
      life: 0.8,
      maxLife: 0.8
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  vibrate(pattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  // --- Rendering ---

  render() {
    const ctx = this.ctx;
    const s = this.cellSize;
    const sprites = window.diggerSprites;

    ctx.fillStyle = sprites.c('bg');
    ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

    // 1. Draw Dirt Matrix
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.dirt[r]?.[c]) {
          sprites.drawDirtTile(ctx, c * s, r * s, s, r * 15 + c);
        }
      }
    }

    // 2. Draw Emeralds
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.emeralds[r]?.[c]) {
          sprites.drawEmerald(ctx, c * s, r * s, s);
        }
      }
    }

    // 3. Draw Gold Bags
    this.bags.forEach((bag) => {
      let wobbleAngle = 0;
      if (bag.state === 'WOBBLING') {
        wobbleAngle = Math.sin(bag.wobbleTimer * 28) * 0.22;
      }
      sprites.drawBag(ctx, bag.x * s, bag.y * s, s, bag.state, wobbleAngle);
    });

    // 4. Draw Bonus Cherry
    if (this.cherry) {
      sprites.drawCherry(ctx, this.cherry.x * s, this.cherry.y * s, s);
    }

    // 5. Draw Digger Player
    if (this.digger) {
      sprites.drawDigger(
        ctx,
        this.digger.x * s,
        this.digger.y * s,
        s,
        this.digger.dir,
        this.digger.isDigging,
        this.digger.isDead,
        this.digger.deathProgress
      );
    }

    // 6. Draw Monsters
    this.monsters.forEach((m) => {
      const scaredFlash = this.bonusActive && this.bonusTimer < 3.0 && Math.floor(this.bonusTimer * 6) % 2 === 0;

      if (m.isHobbin) {
        sprites.drawHobbin(ctx, m.x * s, m.y * s, s, m.dir, true);
      } else {
        sprites.drawNobbin(ctx, m.x * s, m.y * s, s, m.dir, m.isScared, scaredFlash);
      }
    });

    // 7. Draw Fireball Projectile
    if (this.fireball) {
      sprites.drawFireball(ctx, this.fireball.x * s, this.fireball.y * s, s, this.fireball.dir);
    }

    // 8. Draw Particles
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // 9. Draw Floating Scores
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.floor(s * 0.45)}px 'Press Start 2P', monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 10. Bonus Mode Screen Banner
    if (this.bonusActive) {
      ctx.save();
      ctx.fillStyle = 'rgba(67, 97, 238, 0.12)';
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      const barW = (this.bonusTimer / (this.currentLevelData().bonusDuration || 11.0)) * this.viewWidth;
      ctx.fillStyle = this.bonusTimer < 3.0 ? '#ff0055' : '#4361ee';
      ctx.fillRect(0, this.viewHeight - 4, barW, 4);
      ctx.restore();
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.diggerGame = new DiggerGame();
});
