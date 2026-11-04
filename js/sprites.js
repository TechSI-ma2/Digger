/**
 * Digger Sprite & Graphics Engine
 * Supports both "Modern Retro" and authentic "Classic CGA Retro" color palettes.
 * Renders procedural, highly responsive pixel-perfect game entities.
 */

class DiggerSprites {
  constructor() {
    this.paletteMode = 'modern'; // 'modern' or 'cga'
    this.animationTimer = 0;

    // Load saved palette preference
    try {
      const savedPalette = localStorage.getItem('digger_palette_mode');
      if (savedPalette) this.paletteMode = savedPalette;
    } catch (e) {}

    // Color definitions
    this.colors = {
      modern: {
        bg: '#0c0d14',
        dirt: '#7b441f',
        dirtDark: '#5a2e12',
        dirtLight: '#9e592b',
        dirtPebble: '#40200c',
        tunnel: '#0c0d14',
        diggerBody: '#ffcc00',
        diggerShade: '#e69500',
        diggerCockpit: '#00d2ff',
        diggerWheel: '#2b2d42',
        diggerScoop: '#e71d36',
        nobbinBody: '#e63946',
        nobbinEye: '#ffffff',
        nobbinPupil: '#1d3557',
        hobbinBody: '#2ec4b6',
        hobbinDark: '#0e7c7b',
        hobbinTeeth: '#ffffff',
        scaredMonster: '#4361ee',
        scaredFlash: '#f72585',
        emerald: '#06d6a0',
        emeraldDark: '#048a66',
        emeraldHighlight: '#e0fbfc',
        bag: '#f4a261',
        bagDark: '#e76f51',
        bagRope: '#d4a373',
        goldCoin: '#ffd166',
        goldDark: '#f77f00',
        cherry: '#d90429',
        cherryStem: '#55a630',
        fireball: '#ff9f1c',
        fireballCore: '#ffffff'
      },
      cga: {
        bg: '#000000',
        dirt: '#aa5500', // CGA brown
        dirtDark: '#552a00',
        dirtLight: '#ffff55',
        dirtPebble: '#555555',
        tunnel: '#000000',
        diggerBody: '#ffff55', // CGA bright yellow
        diggerShade: '#ff5555',
        diggerCockpit: '#55ffff', // CGA cyan
        diggerWheel: '#000000',
        diggerScoop: '#ff5555', // CGA red/magenta
        nobbinBody: '#ff5555', // CGA light red
        nobbinEye: '#ffffff',
        nobbinPupil: '#000000',
        hobbinBody: '#55ff55', // CGA light green
        hobbinDark: '#00aa00',
        hobbinTeeth: '#ffffff',
        scaredMonster: '#55ffff', // CGA cyan
        scaredFlash: '#ffffff',
        emerald: '#55ff55', // CGA bright green
        emeraldDark: '#00aa00',
        emeraldHighlight: '#ffffff',
        bag: '#ffff55', // CGA yellow
        bagDark: '#aa5500',
        bagRope: '#ffffff',
        goldCoin: '#ffff55',
        goldDark: '#ff5555',
        cherry: '#ff5555',
        cherryStem: '#55ff55',
        fireball: '#ff5555',
        fireballCore: '#ffffff'
      }
    };
  }

  togglePalette() {
    this.paletteMode = this.paletteMode === 'modern' ? 'cga' : 'modern';
    try {
      localStorage.setItem('digger_palette_mode', this.paletteMode);
    } catch (e) {}
    return this.paletteMode;
  }

  c(name) {
    const pal = this.colors[this.paletteMode] || this.colors.modern;
    return pal[name] || '#ffffff';
  }

  update(dt) {
    this.animationTimer += dt;
  }

  // Draw Digger Vehicle with animated scoop and wheels
  drawDigger(ctx, x, y, size, dir, isDigging = false, isDead = false, deathProgress = 0) {
    if (isDead) {
      this.drawDiggerDeath(ctx, x, y, size, deathProgress);
      return;
    }

    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    // Rotate according to direction: 0: right, 1: down, 2: left, 3: up
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    ctx.rotate(angles[dir] || 0);

    const s = size;
    const half = s / 2;

    // Wheel animation cycle
    const wheelOffset = Math.sin(this.animationTimer * 16) * (s * 0.06);

    // Tread Wheels (top & bottom)
    ctx.fillStyle = this.c('diggerWheel');
    // Top tread
    ctx.fillRect(-half * 0.7, -half * 0.9, s * 0.7, s * 0.22);
    // Bottom tread
    ctx.fillRect(-half * 0.7, half * 0.9 - s * 0.22, s * 0.7, s * 0.22);

    // Tread rungs
    ctx.fillStyle = this.c('diggerBody');
    const rungW = s * 0.08;
    for (let i = -half * 0.6; i < half * 0.6; i += s * 0.22) {
      const rx = i + wheelOffset;
      if (rx > -half * 0.65 && rx < half * 0.55) {
        ctx.fillRect(rx, -half * 0.9, rungW, s * 0.22);
        ctx.fillRect(rx, half * 0.9 - s * 0.22, rungW, s * 0.22);
      }
    }

    // Main Cabin Body
    ctx.fillStyle = this.c('diggerBody');
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-half * 0.65, -half * 0.65, s * 0.75, s * 0.7, s * 0.12)
                   : ctx.fillRect(-half * 0.65, -half * 0.65, s * 0.75, s * 0.7);
    ctx.fill();

    // Body shading
    ctx.fillStyle = this.c('diggerShade');
    ctx.fillRect(-half * 0.65, half * 0.05, s * 0.75, s * 0.25);

    // Driver Cockpit / Windshield
    ctx.fillStyle = this.c('diggerCockpit');
    ctx.beginPath();
    ctx.arc(half * 0.05, -half * 0.1, s * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Scoop / Drill at front
    const scoopAngle = isDigging ? Math.sin(this.animationTimer * 30) * 0.45 : Math.sin(this.animationTimer * 8) * 0.15;
    ctx.save();
    ctx.translate(half * 0.45, 0);

    ctx.fillStyle = this.c('diggerScoop');
    // Upper jaw/blade
    ctx.save();
    ctx.rotate(scoopAngle);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.18);
    ctx.lineTo(s * 0.35, -s * 0.06);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Lower jaw/blade
    ctx.save();
    ctx.rotate(-scoopAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.35, s * 0.06);
    ctx.lineTo(0, s * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    ctx.restore();
  }

  // Digger death explosion animation
  drawDiggerDeath(ctx, x, y, size, progress) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + progress * 2;
      const dist = progress * size * 1.4;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const pSize = Math.max(1, size * 0.22 * (1 - progress));

      ctx.fillStyle = i % 2 === 0 ? this.c('diggerBody') : this.c('diggerScoop');
      ctx.fillRect(px - pSize / 2, py - pSize / 2, pSize, pSize);
    }

    // Center smoke / flash
    if (progress < 0.6) {
      ctx.fillStyle = progress < 0.2 ? '#ffffff' : this.c('fireball');
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.4 * (1 - progress / 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Nobbin (standard red monster)
  drawNobbin(ctx, x, y, size, dir = 0, isScared = false, scaredFlash = false) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const s = size;
    const wobble = Math.sin(this.animationTimer * 12) * (s * 0.05);

    // Body color: red, or scared blue/flashing white
    let bodyColor = this.c('nobbinBody');
    if (isScared) {
      bodyColor = scaredFlash ? this.c('scaredFlash') : this.c('scaredMonster');
    }

    // Outer Body (Squishy round shape)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, wobble, s * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Little feet
    const footOffset = Math.sin(this.animationTimer * 16) * (s * 0.08);
    ctx.beginPath();
    ctx.arc(-s * 0.2 + footOffset, s * 0.35, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.2 - footOffset, s * 0.35, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    if (!isScared) {
      // Big Eyes
      const eyeDirX = dir === 0 ? s * 0.08 : dir === 2 ? -s * 0.08 : 0;
      const eyeDirY = dir === 1 ? s * 0.08 : dir === 3 ? -s * 0.08 : 0;

      // Sclera (White)
      ctx.fillStyle = this.c('nobbinEye');
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.06 + wobble, s * 0.14, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.06 + wobble, s * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (looking towards movement direction)
      ctx.fillStyle = this.c('nobbinPupil');
      ctx.beginPath();
      ctx.arc(-s * 0.15 + eyeDirX, -s * 0.06 + eyeDirY + wobble, s * 0.07, 0, Math.PI * 2);
      ctx.arc(s * 0.15 + eyeDirX, -s * 0.06 + eyeDirY + wobble, s * 0.07, 0, Math.PI * 2);
      ctx.fill();

      // Cute mouth
      ctx.strokeStyle = this.c('nobbinPupil');
      ctx.lineWidth = Math.max(1.5, s * 0.06);
      ctx.beginPath();
      ctx.arc(0, s * 0.15 + wobble, s * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else {
      // Scared eyes (small dots) & wavy mouth
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.08 + wobble, s * 0.06, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.08 + wobble, s * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, s * 0.06);
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, s * 0.15 + wobble);
      ctx.lineTo(-s * 0.08, s * 0.1 + wobble);
      ctx.lineTo(s * 0.08, s * 0.18 + wobble);
      ctx.lineTo(s * 0.2, s * 0.12 + wobble);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Hobbin (burrowing aggressive green monster)
  drawHobbin(ctx, x, y, size, dir = 0, isDigging = false) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const s = size;
    const jawOpen = isDigging ? Math.abs(Math.sin(this.animationTimer * 22)) * (s * 0.18)
                              : Math.abs(Math.sin(this.animationTimer * 10)) * (s * 0.08);

    // Stomping feet
    const step = Math.sin(this.animationTimer * 18) * (s * 0.1);
    ctx.fillStyle = this.c('hobbinDark');
    ctx.fillRect(-s * 0.35 + step, s * 0.25, s * 0.25, s * 0.18);
    ctx.fillRect(s * 0.1 - step, s * 0.25, s * 0.25, s * 0.18);

    // Main Green Body
    ctx.fillStyle = this.c('hobbinBody');
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-s * 0.38, -s * 0.35, s * 0.76, s * 0.65, s * 0.14)
                   : ctx.fillRect(-s * 0.38, -s * 0.35, s * 0.76, s * 0.65);
    ctx.fill();

    // Horns / Spikes on head
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.35);
    ctx.lineTo(-s * 0.38, -s * 0.48);
    ctx.lineTo(-s * 0.18, -s * 0.35);
    ctx.moveTo(s * 0.18, -s * 0.35);
    ctx.lineTo(s * 0.38, -s * 0.48);
    ctx.lineTo(s * 0.3, -s * 0.35);
    ctx.fillStyle = this.c('hobbinDark');
    ctx.fill();

    // Fierce Angular Eyes
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.18);
    ctx.lineTo(-s * 0.1, -s * 0.1);
    ctx.lineTo(-s * 0.28, -s * 0.06);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(s * 0.28, -s * 0.18);
    ctx.lineTo(s * 0.1, -s * 0.1);
    ctx.lineTo(s * 0.28, -s * 0.06);
    ctx.closePath();
    ctx.fill();

    // Large Chomping Mouth with sharp fangs
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-s * 0.28, s * 0.02 - jawOpen / 2, s * 0.56, s * 0.14 + jawOpen);

    // Teeth (top & bottom)
    ctx.fillStyle = this.c('hobbinTeeth');
    const teethW = s * 0.09;
    for (let tx = -s * 0.26; tx < s * 0.26; tx += teethW) {
      // Top fang pointing down
      ctx.beginPath();
      ctx.moveTo(tx, s * 0.02 - jawOpen / 2);
      ctx.lineTo(tx + teethW / 2, s * 0.08);
      ctx.lineTo(tx + teethW, s * 0.02 - jawOpen / 2);
      ctx.fill();

      // Bottom fang pointing up
      ctx.beginPath();
      ctx.moveTo(tx, s * 0.16 + jawOpen / 2);
      ctx.lineTo(tx + teethW / 2, s * 0.10);
      ctx.lineTo(tx + teethW, s * 0.16 + jawOpen / 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Emerald (green faceted jewel with periodic sparkle)
  drawEmerald(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const s = size * 0.75;
    const half = s / 2;

    // Faceted polygon gem
    // Outer shape (rhombus / diamond with beveled sides)
    ctx.fillStyle = this.c('emeraldDark');
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(half, 0);
    ctx.lineTo(0, half);
    ctx.lineTo(-half, 0);
    ctx.closePath();
    ctx.fill();

    // Top-left facet (bright highlight)
    ctx.fillStyle = this.c('emeraldHighlight');
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(0, 0);
    ctx.lineTo(-half, 0);
    ctx.closePath();
    ctx.fill();

    // Inner facet (vibrant green)
    ctx.fillStyle = this.c('emerald');
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.65);
    ctx.lineTo(half * 0.65, 0);
    ctx.lineTo(0, half * 0.65);
    ctx.lineTo(-half * 0.65, 0);
    ctx.closePath();
    ctx.fill();

    // Twinkle / glint flash every 2.5s
    const twinkleTime = (this.animationTimer + (x * 7 + y * 13) * 0.05) % 2.5;
    if (twinkleTime < 0.3) {
      const glintScale = Math.sin((twinkleTime / 0.3) * Math.PI);
      ctx.fillStyle = '#ffffff';
      const gw = s * 0.25 * glintScale;
      ctx.fillRect(-half * 0.3 - gw / 2, -half * 0.3 - gw / 8, gw, gw / 4);
      ctx.fillRect(-half * 0.3 - gw / 8, -half * 0.3 - gw / 2, gw / 4, gw);
    }

    ctx.restore();
  }

  // Draw Gold Bag (wobbling, falling, or shattered gold coins)
  drawBag(ctx, x, y, size, state = 'IDLE', wobbleAngle = 0) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const s = size;

    if (state === 'BROKEN') {
      // Pile of shiny gold coins & nuggets
      this.drawGoldPile(ctx, s);
      ctx.restore();
      return;
    }

    // Apply wobble rotation if wobbling
    if (state === 'WOBBLING') {
      ctx.rotate(wobbleAngle);
    } else if (state === 'FALLING') {
      // Slightly stretched while dropping
      ctx.scale(0.9, 1.12);
    }

    // Bag main body (burlap sack)
    ctx.fillStyle = this.c('bag');
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Bag shadow / crease
    ctx.fillStyle = this.c('bagDark');
    ctx.beginPath();
    ctx.arc(s * 0.05, s * 0.12, s * 0.35, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.fill();

    // Tied sack neck
    ctx.fillStyle = this.c('bag');
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.42);
    ctx.lineTo(-s * 0.08, -s * 0.24);
    ctx.lineTo(s * 0.08, -s * 0.24);
    ctx.lineTo(s * 0.22, -s * 0.42);
    ctx.closePath();
    ctx.fill();

    // Rope tie
    ctx.fillStyle = this.c('bagRope');
    ctx.fillRect(-s * 0.16, -s * 0.25, s * 0.32, s * 0.09);

    // Dollar sign '$' on bag
    ctx.fillStyle = this.c('bagDark');
    ctx.font = `bold ${Math.floor(s * 0.36)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, s * 0.1);

    ctx.restore();
  }

  // Draw broken sack with pile of gold coins
  drawGoldPile(ctx, s) {
    // Shredded sack base
    ctx.fillStyle = this.c('bagDark');
    ctx.beginPath();
    ctx.ellipse(0, s * 0.25, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glittering gold coins and chunks
    const coins = [
      { x: -s * 0.22, y: s * 0.2, r: s * 0.12 },
      { x: s * 0.2, y: s * 0.18, r: s * 0.11 },
      { x: -s * 0.08, y: s * 0.08, r: s * 0.14 },
      { x: s * 0.09, y: s * 0.06, r: s * 0.13 },
      { x: 0, y: -s * 0.08, r: s * 0.15 }
    ];

    coins.forEach((c) => {
      ctx.fillStyle = this.c('goldDark');
      ctx.beginPath();
      ctx.arc(c.x, c.y + 1, c.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.c('goldCoin');
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();

      // Coin shine dot
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x - c.r * 0.4, c.y - c.r * 0.4, c.r * 0.4, c.r * 0.4);
    });
  }

  // Draw Bonus Cherry
  drawCherry(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const s = size;
    const bounce = Math.sin(this.animationTimer * 8) * (s * 0.06);

    // Green stem
    ctx.strokeStyle = this.c('cherryStem');
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.38 + bounce);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.2 + bounce, -s * 0.18, s * 0.05 + bounce);
    ctx.moveTo(s * 0.1, -s * 0.38 + bounce);
    ctx.quadraticCurveTo(s * 0.15, -s * 0.15 + bounce, s * 0.18, s * 0.05 + bounce);
    ctx.stroke();

    // Little leaf
    ctx.fillStyle = this.c('cherryStem');
    ctx.beginPath();
    ctx.ellipse(s * 0.18, -s * 0.32 + bounce, s * 0.14, s * 0.07, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cherry 1 (Left)
    ctx.fillStyle = this.c('cherry');
    ctx.beginPath();
    ctx.arc(-s * 0.18, s * 0.1 + bounce, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 0.23, s * 0.05 + bounce, s * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Cherry 2 (Right)
    ctx.fillStyle = this.c('cherry');
    ctx.beginPath();
    ctx.arc(s * 0.18, s * 0.12 + bounce, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.13, s * 0.07 + bounce, s * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Fireball Projectile
  drawFireball(ctx, x, y, size, dir) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const s = size * 0.55;
    const pulse = Math.sin(this.animationTimer * 25) * 0.15 + 1;

    // Outer flame glow
    ctx.fillStyle = this.c('fireball');
    ctx.beginPath();
    ctx.arc(0, 0, (s / 2) * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = this.c('fireballCore');
    ctx.beginPath();
    ctx.arc(0, 0, (s / 3.5), 0, Math.PI * 2);
    ctx.fill();

    // Trailing sparks
    const trailOffset = dir === 0 ? -s * 0.8 : dir === 2 ? s * 0.8 : 0;
    const trailOffsetY = dir === 1 ? -s * 0.8 : dir === 3 ? s * 0.8 : 0;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(trailOffset, trailOffsetY, s * 0.35, s * 0.35);

    ctx.restore();
  }

  // Draw Dirt Tile with realistic earthen speckles
  drawDirtTile(ctx, x, y, size, seed) {
    const s = size;
    ctx.fillStyle = this.c('dirt');
    ctx.fillRect(x, y, s, s);

    // Subtle texture specks based on stable cell coordinate seed
    ctx.fillStyle = this.c('dirtDark');
    const r1 = ((seed * 9301 + 49297) % 233280) / 233280;
    const r2 = ((seed * 49297 + 9301) % 233280) / 233280;
    const r3 = ((seed * 12345 + 67891) % 233280) / 233280;

    const speckSize = Math.max(1, s * 0.1);
    ctx.fillRect(x + r1 * (s - speckSize), y + r2 * (s - speckSize), speckSize, speckSize);
    ctx.fillRect(x + r2 * (s - speckSize), y + r3 * (s - speckSize), speckSize, speckSize);

    ctx.fillStyle = this.c('dirtLight');
    ctx.fillRect(x + r3 * (s - speckSize), y + r1 * (s - speckSize), speckSize, speckSize);
  }
}

// Global sprites singleton
window.diggerSprites = new DiggerSprites();
