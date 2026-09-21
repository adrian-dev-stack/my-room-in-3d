/**
 * RhythmBeatGame — Neon Guitar-Hero-style Rhythm Game for the 3D Monitor
 *
 * Features:
 * - 4 neon lane columns (A / S / D / F)
 * - Notes fall from top to strike zone at bottom
 * - PERFECT / GOOD / MISS rating with timing window
 * - Combo multiplier & streak tracking
 * - Hit sparks, lane flash, combo display
 * - High score via localStorage
 * - CRT scanline + bloom aesthetic
 * - BPM-linked note generation (default 85 BPM lo-fi feel)
 */

export class RhythmBeatGame {
  constructor(soundEngine = null) {
    this.soundEngine = soundEngine;

    // Lane config
    this.LANE_COUNT = 4;
    this.LANE_KEYS  = ['KeyA', 'KeyS', 'KeyD', 'KeyF'];
    this.LANE_LABELS = ['A', 'S', 'D', 'F'];
    this.LANE_COLORS = ['#ff007f', '#a855f7', '#00e5ff', '#10b981'];
    this.LANE_GLOW   = ['rgba(255,0,127,', 'rgba(168,85,247,', 'rgba(0,229,255,', 'rgba(16,185,129,'];

    // Game state
    this.state = 'READY'; // 'READY' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.active = false;

    // BPM / timing
    this.bpm    = 85;
    this.beat   = 60 / this.bpm;       // seconds per beat
    this.speed  = 340;                 // pixels per second (canvas px)
    this.spawnTimer = 0;
    this.songTimer  = 0;

    // Stored notes
    this.notes    = [];
    this.sparks   = [];
    this.laneFlash = [0, 0, 0, 0];    // flash timer per lane

    // Score
    this.score     = 0;
    this.combo     = 0;
    this.maxCombo  = 0;
    this.highScore = 0;
    this._loadHS();

    // Rating display
    this.ratingText  = '';
    this.ratingTimer = 0;
    this.ratingColor = '#ffffff';

    // Blink timer
    this.blinkTimer = 0;

    // Pattern generator state
    this._patternIdx = 0;
    this._patterns = this._buildPatterns();
  }

  // ── Patterns ─────────────────────────────────────────────────────────────
  _buildPatterns() {
    // Arrays of beat-offsets + lane indices for variety
    return [
      // Single notes
      [{ beat: 0, lane: 0 }, { beat: 1, lane: 2 }, { beat: 2, lane: 1 }, { beat: 3, lane: 3 }],
      [{ beat: 0, lane: 1 }, { beat: 0.5, lane: 3 }, { beat: 1, lane: 0 }, { beat: 1.5, lane: 2 }, { beat: 2, lane: 3 }],
      [{ beat: 0, lane: 0 }, { beat: 0, lane: 2 }, { beat: 1, lane: 1 }, { beat: 1, lane: 3 }],
      [{ beat: 0, lane: 2 }, { beat: 0.5, lane: 0 }, { beat: 1, lane: 3 }, { beat: 1.5, lane: 1 }, { beat: 2, lane: 2 }],
      [{ beat: 0, lane: 0 }, { beat: 0.25, lane: 1 }, { beat: 0.5, lane: 2 }, { beat: 0.75, lane: 3 }],
      [{ beat: 0, lane: 3 }, { beat: 0.25, lane: 2 }, { beat: 0.5, lane: 1 }, { beat: 0.75, lane: 0 }],
    ];
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  _loadHS() {
    try {
      this.highScore = parseInt(localStorage.getItem('rhythm_highscore') || '0', 10);
    } catch (_) { this.highScore = 0; }
  }

  _saveHS() {
    try {
      localStorage.setItem('rhythm_highscore', String(this.highScore));
    } catch (_) {}
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  start() {
    this.state = 'PLAYING';
    this.notes    = [];
    this.sparks   = [];
    this.score    = 0;
    this.combo    = 0;
    this.maxCombo = 0;
    this.spawnTimer = 0;
    this.songTimer  = 0;
    this._patternIdx = 0;
    this.laneFlash   = [0, 0, 0, 0];
    this.ratingText  = '';
    this._schedulePattern();
  }

  _schedulePattern() {
    const pattern = this._patterns[this._patternIdx % this._patterns.length];
    this._patternIdx++;
    const tOffset = this.songTimer;
    const travelTime = this._travelTime();

    pattern.forEach(({ beat, lane }) => {
      const arriveAt = tOffset + beat * this.beat;
      const spawnAt  = arriveAt - travelTime;
      this.notes.push({
        lane,
        spawnAt,
        arriveAt,
        y: -50,          // will be computed each frame
        hit: false,
        missed: false,
      });
    });
  }

  _travelTime() {
    // How long it takes a note to travel from spawn to strike zone
    // We compute based on canvas height when render is called; store rough estimate
    return this._canvasH ? (this._canvasH * 0.78) / this.speed : 1.8;
  }

  // ── Key Input ─────────────────────────────────────────────────────────────
  handleKeyDown(code) {
    if (!this.active) return;

    if (this.state === 'READY' || this.state === 'GAMEOVER') {
      if (['Space', 'Enter', 'KeyA', 'KeyS', 'KeyD', 'KeyF'].includes(code)) {
        this.start();
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    const laneIdx = this.LANE_KEYS.indexOf(code);
    if (laneIdx === -1) return;

    this.laneFlash[laneIdx] = 0.12; // flash duration in seconds
    this._checkHit(laneIdx);
  }

  handleKeyUp(code) {
    // reserved for hold-notes (future)
  }

  _checkHit(lane) {
    const now = this.songTimer;
    const PERFECT_WINDOW = 0.065; // ±65ms
    const GOOD_WINDOW    = 0.14;  // ±140ms

    let bestNote = null;
    let bestDelta = Infinity;

    for (const note of this.notes) {
      if (note.lane !== lane || note.hit || note.missed) continue;
      const delta = Math.abs(note.arriveAt - now);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestNote  = note;
      }
    }

    if (!bestNote || bestDelta > GOOD_WINDOW) {
      // Empty press — no note near
      this._showRating('EARLY', '#64748b');
      return;
    }

    bestNote.hit = true;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const multiplier = Math.min(8, 1 + Math.floor(this.combo / 10));

    if (bestDelta <= PERFECT_WINDOW) {
      const pts = 300 * multiplier;
      this.score += pts;
      this._showRating('PERFECT ✦', '#00e5ff');
      this._spawnSpark(lane, true);
    } else {
      const pts = 100 * multiplier;
      this.score += pts;
      this._showRating('GOOD', '#a855f7');
      this._spawnSpark(lane, false);
    }

    this._playHitSound(bestDelta <= PERFECT_WINDOW);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHS();
    }
  }

  _playHitSound(isPerfect) {
    if (this.soundEngine) {
      if (isPerfect && this.soundEngine.playArcadeBeep) {
        this.soundEngine.playArcadeBeep('point');
      } else if (this.soundEngine.playMechanicalKey) {
        this.soundEngine.playMechanicalKey('normal');
      }
    }
  }

  _showRating(text, color) {
    this.ratingText  = text;
    this.ratingColor = color;
    this.ratingTimer = 0.7;
  }

  // ── Sparks ────────────────────────────────────────────────────────────────
  _spawnSpark(lane, isPerfect) {
    const count = isPerfect ? 18 : 9;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      this.sparks.push({
        lane,
        angle,
        speed: 60 + Math.random() * 120,
        life:  0.55 + Math.random() * 0.25,
        maxLife: 0.55 + Math.random() * 0.25,
        perfect: isPerfect,
        x: 0, y: 0 // set during render based on lane position
      });
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update(delta) {
    if (!this.active) return;

    this.blinkTimer += delta;

    if (this.state !== 'PLAYING') return;

    this.songTimer  += delta;
    this.ratingTimer = Math.max(0, this.ratingTimer - delta);

    // Spawn next pattern
    const nextPatternTime = this._patternIdx * this.beat * 4;
    if (this.songTimer >= nextPatternTime - this._travelTime() - 0.1) {
      this._schedulePattern();
    }

    // Lane flash decay
    for (let i = 0; i < this.LANE_COUNT; i++) {
      this.laneFlash[i] = Math.max(0, this.laneFlash[i] - delta);
    }

    // Update sparks
    this.sparks = this.sparks.filter(s => {
      s.life -= delta;
      s.x += Math.cos(s.angle) * s.speed * delta;
      s.y += Math.sin(s.angle) * s.speed * delta;
      return s.life > 0;
    });

    // Check misses
    for (const note of this.notes) {
      if (!note.hit && !note.missed && this.songTimer > note.arriveAt + 0.18) {
        note.missed = true;
        this.combo  = 0;
        this._showRating('MISS ✗', '#ef4444');
        if (this.soundEngine && this.soundEngine.playArcadeBeep) {
          this.soundEngine.playArcadeBeep('crash');
        }
      }
    }

    // Prune old notes
    this.notes = this.notes.filter(n => !(n.hit || (n.missed && this.songTimer > n.arriveAt + 1.0)));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  render(ctx, w, h) {
    this._canvasH = h;

    // ── Background ──
    ctx.fillStyle = '#04060e';
    ctx.fillRect(0, 0, w, h);

    // CRT scanlines
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y, w, 2);
    }

    // ── Lane layout ──
    const laneMargin = w * 0.08;
    const totalW     = w - laneMargin * 2;
    const laneW      = totalW / this.LANE_COUNT;
    const strikeY    = h * 0.82;
    const noteH      = h * 0.045;
    const noteRadius = noteH * 0.38;

    // ── Lane backgrounds ──
    for (let l = 0; l < this.LANE_COUNT; l++) {
      const lx = laneMargin + l * laneW;

      // Lane column
      ctx.fillStyle = `rgba(10,14,28,0.6)`;
      ctx.fillRect(lx, 0, laneW, h);

      // Lane border lines
      ctx.strokeStyle = `rgba(255,255,255,0.06)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.stroke();

      // Flash highlight when lane is pressed
      if (this.laneFlash[l] > 0) {
        const alpha = this.laneFlash[l] / 0.12;
        ctx.fillStyle = `${this.LANE_GLOW[l]}${(alpha * 0.22).toFixed(3)})`;
        ctx.fillRect(lx, 0, laneW, h);
      }

      // ── Strike Zone ──
      const strikeX = lx + laneW * 0.12;
      const strikeW = laneW * 0.76;

      // Outer glow
      ctx.save();
      ctx.shadowColor  = this.LANE_COLORS[l];
      ctx.shadowBlur   = this.laneFlash[l] > 0 ? 28 : 10;
      ctx.strokeStyle  = this.LANE_COLORS[l];
      ctx.lineWidth    = 3;
      ctx.beginPath();
      ctx.roundRect(strikeX, strikeY - noteH / 2, strikeW, noteH, noteRadius);
      ctx.stroke();

      // Inner fill
      const flashAlpha = this.laneFlash[l] > 0 ? 0.55 : 0.12;
      ctx.fillStyle    = `${this.LANE_GLOW[l]}${flashAlpha.toFixed(2)})`;
      ctx.fill();
      ctx.restore();

      // Lane key label inside strike zone
      ctx.fillStyle = this.LANE_COLORS[l];
      ctx.font      = `bold ${Math.round(h * 0.03)}px "Fira Code", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(this.LANE_LABELS[l], lx + laneW / 2, strikeY + h * 0.011);
    }

    // ── Notes ──
    const now = this.state === 'PLAYING' ? this.songTimer : 0;
    const travelTime = this._travelTime();

    for (const note of this.notes) {
      if (note.hit || note.missed) continue;

      // t=0 → just spawned (y≈-noteH), t=1 → at strikeY
      const t = (now - note.spawnAt) / travelTime;
      const noteY = -noteH + t * (strikeY + noteH);

      const lx = laneMargin + note.lane * laneW;
      const nx = lx + laneW * 0.12;
      const nw = laneW * 0.76;

      ctx.save();
      ctx.shadowColor = this.LANE_COLORS[note.lane];
      ctx.shadowBlur  = 22;

      // Note body gradient
      const grad = ctx.createLinearGradient(nx, noteY, nx, noteY + noteH);
      grad.addColorStop(0, this.LANE_COLORS[note.lane]);
      grad.addColorStop(1, `${this.LANE_GLOW[note.lane]}0.4)`);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(nx, noteY, nw, noteH, noteRadius);
      ctx.fill();

      // Bright top edge
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.roundRect(nx + 2, noteY + 2, nw - 4, noteH * 0.25, noteRadius * 0.5);
      ctx.fill();
      ctx.restore();
    }

    // ── Sparks ──
    for (const s of this.sparks) {
      const lx = laneMargin + s.lane * laneW + laneW / 2;
      const baseY = strikeY;

      const alpha = s.life / s.maxLife;
      const col = this.LANE_COLORS[s.lane];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = col;
      ctx.shadowBlur  = s.perfect ? 16 : 8;
      ctx.fillStyle   = s.perfect ? '#ffffff' : col;
      const sz = s.perfect ? 5 : 3;
      ctx.fillRect(lx + s.x - sz / 2, baseY + s.y - sz / 2, sz, sz);
      ctx.restore();
    }

    // ── HUD (Score / Combo) ──
    // Header bar
    const headerH = h * 0.09;
    ctx.fillStyle = 'rgba(4,6,14,0.85)';
    ctx.fillRect(0, 0, w, headerH);

    // Score
    ctx.fillStyle = '#f8fafc';
    ctx.font      = `bold ${Math.round(h * 0.04)}px "Fira Code", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE  ${this.score.toLocaleString()}`, w * 0.04, headerH * 0.7);

    // High score
    ctx.fillStyle = '#ff007f';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST  ${this.highScore.toLocaleString()}`, w * 0.96, headerH * 0.7);

    // Combo
    if (this.combo > 1) {
      const cx = w / 2;
      const cy = h * 0.095;
      ctx.textAlign = 'center';

      // Combo number (big)
      const comboSize = Math.min(h * 0.07, 56);
      ctx.font      = `800 ${Math.round(comboSize)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = this.combo >= 20 ? '#ff007f' : '#00e5ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur  = 20;
      ctx.fillText(`x${this.combo}`, cx, cy + comboSize * 0.9);
      ctx.shadowBlur  = 0;

      ctx.font      = `600 ${Math.round(h * 0.022)}px "Fira Code", monospace`;
      ctx.fillStyle = '#64748b';
      ctx.fillText('COMBO', cx, cy + comboSize * 0.9 + h * 0.03);
    }

    // Rating popup
    if (this.ratingTimer > 0 && this.ratingText) {
      const rAlpha = Math.min(1, this.ratingTimer / 0.4);
      const rY     = h * 0.56 - (1 - this.ratingTimer / 0.7) * h * 0.06;

      ctx.save();
      ctx.globalAlpha = rAlpha;
      ctx.textAlign   = 'center';
      const rSize = Math.min(h * 0.075, 60);
      ctx.font        = `800 ${Math.round(rSize)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle   = this.ratingColor;
      ctx.shadowColor = this.ratingColor;
      ctx.shadowBlur  = 30;
      ctx.fillText(this.ratingText, w / 2, rY);
      ctx.restore();
    }

    // ── State Overlays ──
    if (this.state === 'READY') {
      ctx.fillStyle = 'rgba(4,6,14,0.78)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign   = 'center';
      ctx.fillStyle   = '#a855f7';
      ctx.font        = `800 ${Math.round(h * 0.09)}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur  = 40;
      ctx.fillText('RHYTHM BEAT', w / 2, h * 0.38);
      ctx.shadowBlur  = 0;

      ctx.fillStyle = '#00e5ff';
      ctx.font      = `700 ${Math.round(h * 0.045)}px "Fira Code", monospace`;
      ctx.fillText('4-LANE NEON RHYTHM GAME', w / 2, h * 0.50);

      const blink = Math.sin(this.blinkTimer * 4.5) > 0;
      if (blink) {
        ctx.fillStyle = '#ff007f';
        ctx.font      = `600 ${Math.round(h * 0.034)}px "Fira Code", monospace`;
        ctx.fillText('PRESS [A][S][D][F] OR [SPACE] TO START', w / 2, h * 0.63);
      }

      ctx.fillStyle = '#475569';
      ctx.font      = `500 ${Math.round(h * 0.026)}px "Fira Code", monospace`;
      ctx.fillText(`BEST SCORE: ${this.highScore.toLocaleString()}`, w / 2, h * 0.73);
    } else if (this.state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(10,4,14,0.85)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign   = 'center';
      ctx.fillStyle   = '#ef4444';
      ctx.font        = `800 ${Math.round(h * 0.09)}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur  = 40;
      ctx.fillText('GAME OVER', w / 2, h * 0.38);
      ctx.shadowBlur  = 0;

      ctx.fillStyle = '#f8fafc';
      ctx.font      = `700 ${Math.round(h * 0.05)}px "Fira Code", monospace`;
      ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, w / 2, h * 0.50);

      if (this.maxCombo > 0) {
        ctx.fillStyle = '#a855f7';
        ctx.font      = `600 ${Math.round(h * 0.032)}px "Fira Code", monospace`;
        ctx.fillText(`MAX COMBO: x${this.maxCombo}`, w / 2, h * 0.60);
      }

      const blink = Math.sin(this.blinkTimer * 4.5) > 0;
      if (blink) {
        ctx.fillStyle = '#00e5ff';
        ctx.font      = `600 ${Math.round(h * 0.03)}px "Fira Code", monospace`;
        ctx.fillText('PRESS [A][S][D][F] TO PLAY AGAIN', w / 2, h * 0.73);
      }
    }
  }
}
