/**
 * Digger Web Audio Synthesizer Engine
 * Authentic retro chiptune synthesizer using Web Audio API:
 * - "Popcorn" background melody (Gershon Kingsley)
 * - "William Tell Overture" bonus mode melody (Rossini)
 * - "Funeral March" death jingle (Chopin)
 * - Authentic PC Speaker & Retro Arcade Sound Effects
 */

class DiggerAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.soundEnabled = true;
    this.musicEnabled = true;
    this.volume = 0.7;

    this.currentTrack = null;
    this.musicTimeout = null;
    this.musicStep = 0;
    this.isInitialized = false;

    // Load preferences from localStorage if available
    try {
      const savedSound = localStorage.getItem('digger_sound_enabled');
      const savedMusic = localStorage.getItem('digger_music_enabled');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    } catch (e) {}
  }

  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 1.0 : 0.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0.0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    try { localStorage.setItem('digger_sound_enabled', this.soundEnabled); } catch (e) {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 1.0 : 0.0, this.ctx.currentTime);
    }
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    try { localStorage.setItem('digger_music_enabled', this.musicEnabled); } catch (e) {}
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0.0, this.ctx.currentTime);
    }
    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (this.currentTrack) {
      this.playMusic(this.currentTrack);
    }
    return this.musicEnabled;
  }

  // --- Sound Effects ---

  // Digging dirt: crunchy, rhythmic retro thud
  playDig() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Rapid pitch drop
    osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Emerald pickup: single crystalline note, ascending pitch with streak (1..8)
  playEmerald(streak = 1) {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Diatonic scale frequencies from C5 to C6: C, D, E, F, G, A, B, C
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    const noteIdx = Math.min(Math.max(streak - 1, 0), scale.length - 1);
    const freq = scale[noteIdx];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Octave bonus fanfare: plays when 8 emeralds are eaten consecutively!
  playOctaveBonus() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  // Bag Wobble: dual alternating vibrating tone
  playBagWobble() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.setValueAtTime(220, t + 0.04);
    osc.frequency.setValueAtTime(160, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Bag Falling: continuous downward whistle
  playBagFall() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Bag Crash: bag hits ground or crushes enemy, burst sound
  playBagCrash() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Low metallic thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);

    // Noise burst for shatter
    this.playNoise(0.15, 0.35);
  }

  // Gold coins pickup (500 pts)
  playGoldPickup() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const arpeggio = [659.25, 830.61, 987.77, 1318.51];
    arpeggio.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  // Fireball shot: classic retro laser sweep
  playFire() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.16);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Monster killed (by fireball or crushed by bag)
  playExplode() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.28);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.28);

    this.playNoise(0.25, 0.4);
  }

  // Eating monster in bonus mode
  playChomp(multiplier = 1) {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 220 * multiplier;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Bonus Cherry pickup
  playCherryPickup() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  // Weapon recharged notification
  playRecharged() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [1046.50, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.09);
    });
  }

  // Level Clear Fanfare
  playLevelClear() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.stopMusic();

    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.50, d: 0.25 }, // C6
      { f: 880.00, d: 0.14 }, // A5
      { f: 1046.50, d: 0.40 } // C6
    ];

    let offset = 0;
    melody.forEach((note) => {
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d);

      offset += note.d * 1.05;
    });
  }

  // Noise generator helper for explosions and crashes
  playNoise(duration, peakGain = 0.3) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peakGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // --- Background Music Engines ---

  playMusic(trackName) {
    this.currentTrack = trackName;
    if (!this.musicEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.stopMusic(false);

    if (trackName === 'popcorn') {
      this.playPopcornLoop();
    } else if (trackName === 'bonus') {
      this.playWilliamTellLoop();
    } else if (trackName === 'death') {
      this.playFuneralMarch();
    }
  }

  stopMusic(clearTrack = true) {
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    if (clearTrack) {
      this.currentTrack = null;
    }
  }

  // Note frequency calculation: semitones from A4 (440Hz)
  noteFreq(noteStr) {
    const notes = {
      'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
      'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1,
      'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
    };
    if (noteStr === '-' || noteStr === 'R') return 0; // rest

    const regex = /^([A-G][b#]?)([0-8])$/;
    const match = noteStr.match(regex);
    if (!match) return 440;

    const key = match[1];
    const octave = parseInt(match[2], 10);
    const semitones = notes[key] + (octave - 4) * 12;
    return 440 * Math.pow(2, semitones / 12);
  }

  // Popcorn by Gershon Kingsley (Main Digger theme)
  playPopcornLoop() {
    if (!this.musicEnabled || this.currentTrack !== 'popcorn') return;
    this.ensureContext();
    if (!this.ctx) return;

    // Popcorn main sequence (16th notes at ~125 BPM)
    // Part A: Bb4, Ab4, Bb4, F4, Db4, F4, Bb3 ...
    const partA1 = ['Bb4', 'Ab4', 'Bb4', 'F4', 'Db4', 'F4', 'Bb3', 'R'];
    const partA2 = ['Bb4', 'Ab4', 'Bb4', 'F4', 'Db4', 'F4', 'Bb3', 'R'];
    const partA3 = ['Bb4', 'C5', 'Db5', 'C5', 'Db5', 'Bb4', 'C5', 'Bb4', 'C5', 'A4', 'F4', 'A4', 'C4', 'R', 'R', 'R'];
    const partA4 = ['Bb4', 'C5', 'Db5', 'C5', 'Db5', 'Bb4', 'C5', 'Bb4', 'C5', 'A4', 'F4', 'A4', 'Bb4', 'R', 'R', 'R'];

    const melody = [
      ...partA1, ...partA2, ...partA3,
      ...partA1, ...partA2, ...partA4
    ];

    // Bassline for Popcorn
    const bass = [
      'Bb2', 'R', 'F2', 'R', 'Bb2', 'R', 'F2', 'R',
      'Bb2', 'R', 'F2', 'R', 'Bb2', 'R', 'F2', 'R',
      'Eb2', 'R', 'Bb2', 'R', 'F2', 'R', 'C2', 'R',
      'Bb2', 'R', 'F2', 'R', 'Bb2', 'R', 'F2', 'R',
      'Bb2', 'R', 'F2', 'R', 'Bb2', 'R', 'F2', 'R',
      'Eb2', 'R', 'Bb2', 'R', 'F2', 'R', 'Bb2', 'R'
    ];

    const sixteenthDuration = 0.118; // approx 127 BPM
    const totalDuration = melody.length * sixteenthDuration;
    const startTime = this.ctx.currentTime + 0.05;

    // Schedule melody notes
    melody.forEach((note, i) => {
      if (note !== 'R') {
        const freq = this.noteFreq(note);
        const t = startTime + i * sixteenthDuration;
        this.scheduleChiptuneNote(freq, t, sixteenthDuration * 0.75, 'square', 0.22);
      }
    });

    // Schedule bass notes (every 8th note)
    const eighthDuration = sixteenthDuration * 2;
    bass.forEach((note, i) => {
      if (note !== 'R') {
        const freq = this.noteFreq(note);
        const t = startTime + i * eighthDuration;
        this.scheduleChiptuneNote(freq, t, eighthDuration * 0.7, 'triangle', 0.35);
      }
    });

    // Repeat loop seamlessly
    this.musicTimeout = setTimeout(() => {
      if (this.currentTrack === 'popcorn') {
        this.playPopcornLoop();
      }
    }, totalDuration * 1000 - 30);
  }

  // William Tell Overture (Rossini) - Bonus mode gallop
  playWilliamTellLoop() {
    if (!this.musicEnabled || this.currentTrack !== 'bonus') return;
    this.ensureContext();
    if (!this.ctx) return;

    // Gallop rhythm: da-da-dum da-da-dum da-da-dum-dum-dum
    const melody = [
      'G4', 'G4', 'G4', 'C5', 'R',
      'G4', 'G4', 'G4', 'E5', 'R',
      'G4', 'G4', 'G4', 'C5', 'E5', 'G5', 'F5', 'D5', 'R',
      'G4', 'G4', 'G4', 'C5', 'R',
      'G4', 'G4', 'G4', 'E5', 'R',
      'G4', 'G4', 'G4', 'D5', 'E5', 'D5', 'C5', 'R', 'R'
    ];

    const noteDurations = [
      0.08, 0.08, 0.08, 0.22, 0.08,
      0.08, 0.08, 0.08, 0.22, 0.08,
      0.08, 0.08, 0.08, 0.12, 0.12, 0.14, 0.12, 0.24, 0.12,
      0.08, 0.08, 0.08, 0.22, 0.08,
      0.08, 0.08, 0.08, 0.22, 0.08,
      0.08, 0.08, 0.08, 0.12, 0.12, 0.12, 0.32, 0.16, 0.16
    ];

    let totalDuration = 0;
    const startTime = this.ctx.currentTime + 0.05;

    melody.forEach((note, i) => {
      const dur = noteDurations[i];
      if (note !== 'R') {
        const freq = this.noteFreq(note);
        this.scheduleChiptuneNote(freq, startTime + totalDuration, dur * 0.85, 'square', 0.26);
      }
      totalDuration += dur;
    });

    this.musicTimeout = setTimeout(() => {
      if (this.currentTrack === 'bonus') {
        this.playWilliamTellLoop();
      }
    }, totalDuration * 1000 - 30);
  }

  // Funeral March (Chopin) - Player death jingle
  playFuneralMarch() {
    this.ensureContext();
    if (!this.ctx) return;
    this.stopMusic(false);

    const notes = [
      { n: 'Bb3', d: 0.45 },
      { n: 'Bb3', d: 0.45 },
      { n: 'Bb3', d: 0.45 },
      { n: 'Bb3', d: 0.65 },
      { n: 'Db4', d: 0.25 },
      { n: 'C4',  d: 0.35 },
      { n: 'C4',  d: 0.25 },
      { n: 'Bb3', d: 0.45 },
      { n: 'Bb3', d: 0.35 },
      { n: 'A3',  d: 0.25 },
      { n: 'Bb3', d: 0.80 }
    ];

    let offset = 0;
    const startTime = this.ctx.currentTime + 0.05;

    notes.forEach((item) => {
      const freq = this.noteFreq(item.n);
      const t = startTime + offset;
      this.scheduleChiptuneNote(freq, t, item.d * 0.9, 'sawtooth', 0.25);
      offset += item.d;
    });
  }

  // Chiptune note scheduler with snappy retro envelope
  scheduleChiptuneNote(freq, startTime, duration, type = 'square', peakGain = 0.25) {
    if (!this.ctx || !this.musicEnabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.setValueAtTime(peakGain * 0.8, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

// Global audio singleton
window.diggerAudio = new DiggerAudio();
