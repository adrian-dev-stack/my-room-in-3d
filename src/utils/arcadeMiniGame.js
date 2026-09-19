/**
 * ArcadeMiniGame - Playable Cyber Snake Mini-Game on 3D Monitor
 * Rendered to the 2D canvas of the main workstation monitor.
 * Features:
 * - Real-time grid movement and collision logic
 * - Cyberpunk aesthetic with scanlines, neon bloom, and glowing food tokens
 * - Sound effects integration with Web Audio API
 * - LocalStorage high score tracking
 */

export class ArcadeMiniGame {
  constructor(soundEngine = null) {
    this.soundEngine = soundEngine;
    this.cols = 36;
    this.rows = 20;

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = { x: 10, y: 10 };
    this.bonusFood = null;
    this.bonusTimer = 0;

    this.score = 0;
    this.highScore = 0;
    if (typeof localStorage !== 'undefined') {
      this.highScore = parseInt(localStorage.getItem('arcade_highscore') || '0', 10);
    }

    this.state = 'READY'; // 'READY', 'PLAYING', 'GAMEOVER'
    this.speed = 0.085; // Seconds per tick
    this.timer = 0;
    this.blinkTimer = 0;
    this.active = false;

    this.reset();
  }

  reset() {
    this.snake = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.state = 'READY';
    this.timer = 0;
    this.spawnFood();
  }

  start() {
    this.reset();
    this.state = 'PLAYING';
    if (this.soundEngine && this.soundEngine.playArcadeBeep) {
      this.soundEngine.playArcadeBeep('point');
    }
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      this.food = {
        x: Math.floor(Math.random() * (this.cols - 2)) + 1,
        y: Math.floor(Math.random() * (this.rows - 2)) + 1
      };
      valid = !this.snake.some((s) => s.x === this.food.x && s.y === this.food.y);
    }
  }

  handleKeyDown(key) {
    if (!this.active) return;

    if (this.state === 'READY' || this.state === 'GAMEOVER') {
      if (key === 'Enter' || key === 'Space' || key === 'KeyW' || key === 'KeyS' || key === 'ArrowUp') {
        this.start();
        return;
      }
    }

    if (this.state !== 'PLAYING') return;

    if ((key === 'ArrowUp' || key === 'KeyW') && this.dir.y === 0) {
      this.nextDir = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 'KeyS') && this.dir.y === 0) {
      this.nextDir = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'KeyA') && this.dir.x === 0) {
      this.nextDir = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'KeyD') && this.dir.x === 0) {
      this.nextDir = { x: 1, y: 0 };
    }
  }

  update(delta) {
    if (!this.active) return;

    this.blinkTimer += delta;

    if (this.state !== 'PLAYING') return;

    this.timer += delta;
    if (this.timer >= this.speed) {
      this.timer -= this.speed;
      this.tick();
    }
  }

  tick() {
    this.dir = { ...this.nextDir };
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    // Wall collision (wrap-around or wall death: let's do walls)
    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
      this.gameOver();
      return;
    }

    // Self collision
    if (this.snake.some((s) => s.x === head.x && s.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 100;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('arcade_highscore', String(this.highScore));
        }
      }
      if (this.soundEngine && this.soundEngine.playArcadeBeep) {
        this.soundEngine.playArcadeBeep('point');
      }
      this.spawnFood();
      // Increase speed slightly
      this.speed = Math.max(0.045, 0.085 - Math.floor(this.score / 500) * 0.006);
    } else {
      this.snake.pop();
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    if (this.soundEngine && this.soundEngine.playArcadeBeep) {
      this.soundEngine.playArcadeBeep('crash');
    }
  }

  render(ctx, w, h) {
    // 1. Dark CRT Arcade Background
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    const cellW = w / this.cols;
    const cellH = h / this.rows;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, h);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(w, r * cellH);
      ctx.stroke();
    }

    // Outer neon arcade border
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    // 2. Render Food (Pulsing Cyber Core)
    const foodX = this.food.x * cellW + cellW / 2;
    const foodY = this.food.y * cellH + cellH / 2;
    const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.25;

    ctx.save();
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(
      foodX - (cellW * 0.4 * pulse),
      foodY - (cellH * 0.4 * pulse),
      cellW * 0.8 * pulse,
      cellH * 0.8 * pulse
    );

    // Bright inner core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(foodX - 4, foodY - 4, 8, 8);
    ctx.restore();

    // 3. Render Snake
    this.snake.forEach((s, idx) => {
      const sx = s.x * cellW;
      const sy = s.y * cellH;

      ctx.save();
      if (idx === 0) {
        // Head
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(sx + 2, sy + 2, cellW - 4, cellH - 4);

        // Head Eyes
        ctx.fillStyle = '#ffffff';
        const eyeSize = 4;
        ctx.fillRect(sx + cellW * 0.3, sy + cellH * 0.25, eyeSize, eyeSize);
        ctx.fillRect(sx + cellW * 0.7 - eyeSize, sy + cellH * 0.25, eyeSize, eyeSize);
      } else {
        // Body with gradient fade
        const alpha = Math.max(0.4, 1.0 - (idx / this.snake.length) * 0.6);
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.fillRect(sx + 3, sy + 3, cellW - 6, cellH - 6);
      }
      ctx.restore();
    });

    // 4. Score Header HUD
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 32, 54);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff007f';
    ctx.fillText(`HIGH: ${this.highScore}`, w - 32, 54);

    // 5. State Overlays
    if (this.state === 'READY') {
      ctx.fillStyle = 'rgba(5, 7, 14, 0.75)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#00e5ff';
      ctx.font = '800 64px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('⚡ CYBER RUNNER 2077', w / 2, h / 2 - 40);

      const blink = Math.sin(this.blinkTimer * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#ff007f';
        ctx.font = '600 32px "Fira Code", monospace';
        ctx.fillText('PRESS [SPACE] OR [ENTER] TO PLAY', w / 2, h / 2 + 35);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 24px "Fira Code", monospace';
      ctx.fillText('USE [W/A/S/D] OR [ARROWS] TO NAVIGATE', w / 2, h / 2 + 90);
    } else if (this.state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(15, 7, 14, 0.82)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 72px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('💥 SYSTEM OVERRIDE (GAME OVER)', w / 2, h / 2 - 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 36px "Fira Code", monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}`, w / 2, h / 2 + 15);

      const blink = Math.sin(this.blinkTimer * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#00e5ff';
        ctx.font = '600 28px "Fira Code", monospace';
        ctx.fillText('PRESS [SPACE] OR [ENTER] TO RESTART', w / 2, h / 2 + 80);
      }
    }
  }
}
