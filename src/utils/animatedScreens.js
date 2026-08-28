import * as THREE from 'three';

/**
 * AnimatedScreenManager
 * Renders live animated content to Canvas textures for the 3D monitors.
 * Supports multiple switchable modes per screen with smooth transitions.
 */

// ============================================================================
// MAIN MONITOR SCREEN MODES
// ============================================================================

const MAIN_MODES = ['vscode', 'terminal', 'fivem', 'portfolio'];
const VERT_MODES = ['discord', 'spotify', 'chat-log'];

export class AnimatedScreenManager {
  constructor() {
    // Main monitor canvas (landscape 16:9)
    this.mainCanvas = document.createElement('canvas');
    this.mainCanvas.width = 2048;
    this.mainCanvas.height = 1152;
    this.mainCtx = this.mainCanvas.getContext('2d');
    this.mainTexture = new THREE.CanvasTexture(this.mainCanvas);
    this.mainTexture.generateMipmaps = true;
    this.mainTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // Vertical monitor canvas (portrait 9:16)
    this.vertCanvas = document.createElement('canvas');
    this.vertCanvas.width = 1080;
    this.vertCanvas.height = 1920;
    this.vertCtx = this.vertCanvas.getContext('2d');
    this.vertTexture = new THREE.CanvasTexture(this.vertCanvas);
    this.vertTexture.generateMipmaps = true;
    this.vertTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // Current mode indices
    this.mainModeIndex = 0;
    this.vertModeIndex = 0;

    // Animation state
    this.elapsed = 0;
    this.cursorBlink = true;
    this.typingOffset = 0;

    // Terminal typing state
    this.termLines = [];
    this.termLineIndex = 0;
    this.termCharIndex = 0;
    this.termTimer = 0;

    // Chat log state
    this.chatScrollY = 0;

    this._initTerminal();
  }

  get mainMode() { return MAIN_MODES[this.mainModeIndex]; }
  get vertMode() { return VERT_MODES[this.vertModeIndex]; }

  cycleMainMode() {
    this.mainModeIndex = (this.mainModeIndex + 1) % MAIN_MODES.length;
    this.typingOffset = 0;
    this._initTerminal();
    return this.mainMode;
  }

  cycleVertMode() {
    this.vertModeIndex = (this.vertModeIndex + 1) % VERT_MODES.length;
    this.chatScrollY = 0;
    return this.vertMode;
  }

  _initTerminal() {
    this.termLines = [];
    this.termLineIndex = 0;
    this.termCharIndex = 0;
    this.termTimer = 0;
  }

  /**
   * Call once per frame with delta time
   */
  update(delta) {
    this.elapsed += delta;
    this.cursorBlink = Math.floor(this.elapsed * 2) % 2 === 0;
    this.typingOffset += delta * 12;

    this._renderMainScreen(delta);
    this._renderVertScreen(delta);

    this.mainTexture.needsUpdate = true;
    this.vertTexture.needsUpdate = true;
  }

  // ==========================================================================
  // MAIN MONITOR RENDERERS
  // ==========================================================================

  _renderMainScreen(delta) {
    const mode = this.mainMode;
    if (mode === 'vscode') this._drawVSCode();
    else if (mode === 'terminal') this._drawTerminal(delta);
    else if (mode === 'fivem') this._drawFiveM();
    else if (mode === 'portfolio') this._drawPortfolio();
  }

  _drawVSCode() {
    const ctx = this.mainCtx;
    const W = 2048, H = 1152;

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Title bar
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, W, 68);

    // Traffic lights
    const dots = [['#ff5f56', 32], ['#ffbd2e', 62], ['#27c93f', 92]];
    dots.forEach(([col, x]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, 34, 9, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#8b949e';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('my-room-in-3d — Visual Studio Code', 130, 42);

    // Tab bar
    ctx.fillStyle = '#21262d';
    ctx.fillRect(0, 68, W, 48);
    ctx.fillStyle = '#1f242c';
    ctx.fillRect(0, 68, 320, 48);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 114, 320, 2);
    ctx.fillStyle = '#f0f6fc';
    ctx.font = '500 20px "Fira Code", monospace';
    ctx.fillText('  Room.tsx', 20, 98);

    // Separator
    ctx.fillStyle = '#30363d';
    ctx.fillRect(0, 116, W, 1);

    // Line numbers gutter
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 117, 80, H);

    // Code lines with syntax highlighting
    const lines = [
      { parts: [['import ', '#ff7b72'], ['{ Scene, Camera, Renderer } ', '#c9d1d9'], ['from ', '#ff7b72'], ['"three"', '#a5d6ff'], [';', '#c9d1d9']] },
      { parts: [['import ', '#ff7b72'], ['{ createRoom } ', '#c9d1d9'], ['from ', '#ff7b72'], ['"./Room"', '#a5d6ff'], [';', '#c9d1d9']] },
      { parts: [] },
      { parts: [['// 🏠 FiveM Player Interactive 3D Room', '#6e7681']] },
      { parts: [['const ', '#ff7b72'], ['room ', '#79c0ff'], ['= ', '#c9d1d9'], ['createRoom', '#d2a8ff'], ['({', '#c9d1d9']] },
      { parts: [['  workstation', '#79c0ff'], [': ', '#c9d1d9'], ['"Dual Monitors + LED Light Bar"', '#a5d6ff'], [',', '#c9d1d9']] },
      { parts: [['  pcRig', '#79c0ff'], [': ', '#c9d1d9'], ['"Gaming Tower + Live Clock"', '#a5d6ff'], [',', '#c9d1d9']] },
      { parts: [['  audio', '#79c0ff'], [': ', '#c9d1d9'], ['"Lo-Fi Radio + Mech Keyboard SFX"', '#a5d6ff'], [',', '#c9d1d9']] },
      { parts: [['  shelves', '#79c0ff'], [': ', '#c9d1d9'], ['[', '#c9d1d9'], ['"G304"', '#a5d6ff'], [', ', '#c9d1d9'], ['"G435"', '#a5d6ff'], [']', '#c9d1d9'], [',', '#c9d1d9']] },
      { parts: [['  status', '#79c0ff'], [': ', '#c9d1d9'], ['"Rendered 1:1 ✨"', '#7ee787']] },
      { parts: [['});', '#c9d1d9']] },
      { parts: [] },
      { parts: [['room', '#79c0ff'], ['.', '#c9d1d9'], ['animate', '#d2a8ff'], ['();', '#c9d1d9']] },
    ];

    ctx.font = '26px "Fira Code", monospace';
    const maxChars = Math.floor(this.typingOffset);
    let charCount = 0;
    let cursorX = 90, cursorY = 0;

    lines.forEach((line, idx) => {
      const y = 155 + idx * 48;

      // Line number
      ctx.fillStyle = '#484f58';
      ctx.fillText(`${idx + 1}`.padStart(3, ' '), 10, y);

      // Code parts
      let x = 90;
      for (const [text, color] of line.parts) {
        for (let i = 0; i < text.length; i++) {
          if (charCount < maxChars) {
            ctx.fillStyle = color;
            ctx.fillText(text[i], x, y);
          }
          charCount++;
          cursorX = x + 16;
          cursorY = y;
          x += 16;
        }
      }
    });

    // Blinking cursor
    if (this.cursorBlink && charCount > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillRect(cursorX, cursorY - 26, 14, 32);
      ctx.shadowBlur = 0;
    }

    // Bottom status bar
    ctx.fillStyle = '#0078d4';
    ctx.fillRect(0, H - 36, W, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('  ⌥ main   ✓ Prettier   TypeScript React   UTF-8   LF   Ln 13, Col 18', 10, H - 12);
  }

  _drawTerminal(delta) {
    const ctx = this.mainCtx;
    const W = 2048, H = 1152;

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    // Title bar
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, 0, W, 56);
    const dots = [['#ff5f56', 28], ['#ffbd2e', 56], ['#27c93f', 84]];
    dots.forEach(([col, x]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, 28, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#8b949e';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Terminal — zsh — 120×40', 120, 36);

    const termContent = [
      { prompt: true, text: 'neofetch' },
      { prompt: false, text: '  ╔══════════════════════════════════════╗' },
      { prompt: false, text: '  ║   🖥️  FiveM Player Workstation       ║' },
      { prompt: false, text: '  ║   OS: Windows 11 Pro 64-bit          ║' },
      { prompt: false, text: '  ║   Shell: zsh 5.9 + oh-my-zsh         ║' },
      { prompt: false, text: '  ║   Terminal: Windows Terminal          ║' },
      { prompt: false, text: '  ║   CPU: AMD Ryzen 7 / Intel i7        ║' },
      { prompt: false, text: '  ║   GPU: NVIDIA RTX Series              ║' },
      { prompt: false, text: '  ║   Uptime: Always On 🟢               ║' },
      { prompt: false, text: '  ╚══════════════════════════════════════╝' },
      { prompt: false, text: '' },
      { prompt: true, text: 'npm run dev' },
      { prompt: false, text: '' },
      { prompt: false, text: '  VITE v5.4  ready in 342 ms' },
      { prompt: false, text: '' },
      { prompt: false, text: '  ➜  Local:   http://localhost:5173/' },
      { prompt: false, text: '  ➜  Network: http://192.168.1.42:5173/' },
      { prompt: false, text: '' },
      { prompt: true, text: '' },
    ];

    // Typing animation
    this.termTimer += delta;
    const charsPerSec = 28;
    const totalTyped = Math.floor(this.termTimer * charsPerSec);

    ctx.font = '24px "Fira Code", monospace';
    let charBudget = totalTyped;
    let y = 90;

    for (const line of termContent) {
      if (charBudget <= 0) break;

      if (line.prompt) {
        ctx.fillStyle = '#10b981';
        ctx.fillText('❯', 30, y);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(' ~/my-room-in-3d ', 56, y);
        const promptLen = 20;
        charBudget -= promptLen;

        // Command text typed char by char
        const visibleChars = Math.min(line.text.length, Math.max(0, charBudget));
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(line.text.substring(0, visibleChars), 330, y);
        charBudget -= line.text.length;

        if (visibleChars < line.text.length && this.cursorBlink) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fillRect(330 + visibleChars * 14.4, y - 20, 12, 26);
          ctx.shadowBlur = 0;
        }
      } else {
        const visibleChars = Math.min(line.text.length, Math.max(0, charBudget));
        ctx.fillStyle = '#c9d1d9';
        ctx.fillText(line.text.substring(0, visibleChars), 30, y);
        charBudget -= Math.max(line.text.length, 1);
      }

      y += 44;
    }

    // Cursor at end
    if (charBudget >= 0 && this.cursorBlink) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillRect(330, y - 44 - 20, 12, 26);
      ctx.shadowBlur = 0;
    }
  }

  _drawFiveM() {
    const ctx = this.mainCtx;
    const W = 2048, H = 1152;

    // Dark gradient background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0a1a');
    bg.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Animated grid floor
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.lineWidth = 1;
    const gridOffset = (this.elapsed * 30) % 60;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.5);
      ctx.lineTo(x - 200, H);
      ctx.stroke();
    }
    for (let y = H * 0.5; y < H; y += 30 + gridOffset * 0.3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // FiveM Logo Area
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 40;
    ctx.font = 'bold 120px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FIVEM', W / 2, 260);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('GTA V Multiplayer Framework', W / 2, 330);

    // Server status cards
    const cards = [
      { icon: '🌐', label: 'Server', value: 'Online', color: '#10b981' },
      { icon: '👥', label: 'Players', value: `${Math.floor(32 + Math.sin(this.elapsed) * 8)}/64`, color: '#38bdf8' },
      { icon: '⚡', label: 'Ping', value: `${Math.floor(18 + Math.sin(this.elapsed * 3) * 5)}ms`, color: '#a855f7' },
      { icon: '🗺️', label: 'Map', value: 'Los Santos', color: '#f59e0b' },
    ];

    ctx.textAlign = 'left';
    cards.forEach((card, i) => {
      const cx = 300 + i * 380;
      const cy = 480;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.roundRect(cx, cy, 340, 160, 16);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '36px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${card.icon}  ${card.label}`, cx + 24, cy + 55);

      ctx.fillStyle = card.color;
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 12;
      ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(card.value, cx + 24, cy + 120);
      ctx.shadowBlur = 0;
    });

    // Bottom bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FiveM Development Server • Lua / JavaScript • Real-Time Sync Active', W / 2, H - 22);

    ctx.textAlign = 'left';
  }

  _drawPortfolio() {
    const ctx = this.mainCtx;
    const W = 2048, H = 1152;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Animated floating particles
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(this.elapsed * 0.3 + i * 1.7) * 0.5 + 0.5) * W;
      const py = (Math.cos(this.elapsed * 0.2 + i * 2.3) * 0.5 + 0.5) * H;
      const r = 2 + Math.sin(this.elapsed + i) * 1.5;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 72px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FiveM Player', W / 2, 240);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Full-Stack Developer • 3D Web Experiences • FiveM Scripting', W / 2, 310);

    // Skill cards
    const skills = [
      { name: 'Three.js', pct: 92, color: '#38bdf8' },
      { name: 'JavaScript', pct: 95, color: '#f59e0b' },
      { name: 'FiveM / Lua', pct: 88, color: '#f97316' },
      { name: 'React', pct: 85, color: '#818cf8' },
      { name: 'Node.js', pct: 90, color: '#10b981' },
    ];

    const barW = 300, barH = 24, startX = (W - skills.length * (barW + 40)) / 2 + 20;
    skills.forEach((skill, i) => {
      const x = startX + i * (barW + 40);
      const y = 450;

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(skill.name, x, y);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(x, y + 12, barW, barH, 12);
      ctx.fill();

      const animPct = Math.min(skill.pct, this.typingOffset * 2);
      ctx.fillStyle = skill.color;
      ctx.shadowColor = skill.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(x, y + 12, barW * (animPct / 100), barH, 12);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${skill.pct}%`, x + barW, y);
    });

    // Project cards
    const projects = [
      { name: '🏠 My Room in 3D', desc: 'Interactive isometric room with real-time lighting', tech: 'Three.js • GSAP • Web Audio' },
      { name: '🚗 FiveM RP Server', desc: 'Custom GTA V multiplayer framework', tech: 'Lua • JS • MySQL' },
      { name: '📻 Lo-Fi Radio Engine', desc: 'Procedural Web Audio generative synth player', tech: 'Web Audio API' },
    ];

    ctx.textAlign = 'left';
    projects.forEach((proj, i) => {
      const px = 220 + i * 560;
      const py = 620;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(px, py, 500, 220, 16);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(proj.name, px + 24, py + 50);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(proj.desc, px + 24, py + 100);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '500 18px "Fira Code", monospace';
      ctx.fillText(proj.tech, px + 24, py + 155);
    });

    // Bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('github.com/fivem-player  •  Click monitor to switch screen modes', W / 2, H - 60);
    ctx.textAlign = 'left';
  }

  // ==========================================================================
  // VERTICAL MONITOR RENDERERS
  // ==========================================================================

  _renderVertScreen(delta) {
    const mode = this.vertMode;
    if (mode === 'discord') this._drawDiscord();
    else if (mode === 'spotify') this._drawSpotify();
    else if (mode === 'chat-log') this._drawChatLog(delta);
  }

  _drawDiscord() {
    const ctx = this.vertCtx;
    const W = 1080, H = 1920;

    ctx.fillStyle = '#1e1f22';
    ctx.fillRect(0, 0, W, H);

    // Server icon sidebar
    ctx.fillStyle = '#141517';
    ctx.fillRect(0, 0, 110, H);

    const serverColors = ['#5865F2', '#3ba55c', '#faa61a', '#ed4245', '#eb459e', '#00c3ff'];
    serverColors.forEach((col, idx) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(55, 75 + idx * 95, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    // Active indicator
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(-3, 55, 6, 40, 3);
    ctx.fill();

    // Channels sidebar
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(110, 0, 260, H);

    ctx.fillStyle = '#f2f3f5';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FiveM Community', 130, 55);

    ctx.fillStyle = '#949ba4';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    const channels = ['# general', '# voice-lounge', '# room-setup', '# dev-logs', '# gaming-clips'];
    channels.forEach((ch, i) => {
      ctx.fillStyle = i === 2 ? '#f2f3f5' : '#949ba4';
      if (i === 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(118, 80 + i * 48, 244, 40, 6);
        ctx.fill();
        ctx.fillStyle = '#f2f3f5';
      }
      ctx.fillText(ch, 135, 108 + i * 48);
    });

    // Voice call box
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.roundRect(390, 30, W - 410, 280, 14);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🔊 Voice Connected', 420, 100);
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fbcfe8';
    ctx.fillText('FiveM Player / Studio Voice', 420, 145);

    // Avatars in voice
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(470, 230, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#db2777';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FM', 452, 238);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(560, 230, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillText('AX', 542, 238);

    // Chat area
    ctx.fillStyle = '#313338';
    ctx.fillRect(370, 330, W - 370, H - 330);

    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(370, 330, W - 370, 60);
    ctx.fillStyle = '#f2f3f5';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('# room-setup', 395, 367);

    // Chat messages with animated timestamp
    const chats = [
      { name: 'FiveM', color: '#FEE75C', msg: 'Dual monitors & LED bar looking clean! 🖥️' },
      { name: 'Alex', color: '#57F287', msg: 'The wall is super clean without the door.' },
      { name: 'DevBot', color: '#5865F2', msg: 'Live clock synced. Lo-Fi radio streaming 🎵' },
      { name: 'GamerX', color: '#EB459E', msg: 'Zebra blinds & Logitech shelves active! 🎮' },
      { name: 'Studio', color: '#00c3ff', msg: 'New animated video screens deployed ✨' },
      { name: 'FiveM', color: '#FEE75C', msg: 'Mech keyboard SFX is so satisfying ⌨️' },
    ];

    let cy = 440;
    chats.forEach((chat) => {
      ctx.fillStyle = chat.color;
      ctx.beginPath();
      ctx.arc(420, cy + 12, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = chat.color;
      ctx.fillText(chat.name, 452, cy + 8);

      ctx.fillStyle = '#949ba4';
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      const h = new Date().getHours();
      const m = String(new Date().getMinutes()).padStart(2, '0');
      ctx.fillText(`Today at ${h}:${m}`, 452 + chat.name.length * 12 + 16, cy + 8);

      ctx.fillStyle = '#dbdee1';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(chat.msg, 452, cy + 40);

      cy += 95;
    });
  }

  _drawSpotify() {
    const ctx = this.vertCtx;
    const W = 1080, H = 1920;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a1a2e');
    bg.addColorStop(0.4, '#121212');
    bg.addColorStop(1, '#121212');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top section: Now playing
    ctx.fillStyle = '#fff';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOW PLAYING', W / 2, 80);

    // Album art (gradient square)
    const artSize = 500;
    const artX = (W - artSize) / 2;
    const artY = 140;
    const albumGrad = ctx.createLinearGradient(artX, artY, artX + artSize, artY + artSize);
    albumGrad.addColorStop(0, '#6366f1');
    albumGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = albumGrad;
    ctx.beginPath();
    ctx.roundRect(artX, artY, artSize, artSize, 20);
    ctx.fill();

    // Album art icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '200px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('♪', W / 2, artY + 330);

    // Song info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Lo-Fi Chill Beats Vol. 3', W / 2, artY + artSize + 70);

    ctx.fillStyle = '#b3b3b3';
    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FiveM Player Radio', W / 2, artY + artSize + 115);

    // Progress bar
    const barY = artY + artSize + 170;
    const barW = W - 160;
    const progress = (Math.sin(this.elapsed * 0.2) + 1) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(80, barY, barW, 6, 3);
    ctx.fill();

    ctx.fillStyle = '#1DB954';
    ctx.beginPath();
    ctx.roundRect(80, barY, barW * progress, 6, 3);
    ctx.fill();

    // Time labels
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '500 18px "Fira Code", monospace';
    ctx.textAlign = 'left';
    const mins = Math.floor(progress * 4);
    const secs = Math.floor((progress * 240) % 60);
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 80, barY + 35);
    ctx.textAlign = 'right';
    ctx.fillText('4:00', W - 80, barY + 35);

    // Player controls
    ctx.textAlign = 'center';
    ctx.font = '44px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#b3b3b3';
    ctx.fillText('⏮', W / 2 - 120, barY + 110);
    ctx.fillStyle = '#fff';
    ctx.fillText('▶', W / 2, barY + 110);
    ctx.fillStyle = '#b3b3b3';
    ctx.fillText('⏭', W / 2 + 120, barY + 110);

    // Queue list
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Up Next', 80, barY + 200);

    const queue = [
      { title: 'Midnight Cozy Lo-Fi', artist: 'Room Radio' },
      { title: 'Cyberpunk Synthwave', artist: 'Neon Dreams' },
      { title: 'Coffee Shop Rain', artist: 'Ambient Mix' },
      { title: 'Sunset Drive', artist: 'Lo-Fi Collection' },
    ];

    queue.forEach((track, i) => {
      const ty = barY + 250 + i * 80;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(60, ty, W - 120, 65, 10);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(track.title, 100, ty + 28);

      ctx.fillStyle = '#b3b3b3';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(track.artist, 100, ty + 52);
    });

    ctx.textAlign = 'left';
  }

  _drawChatLog(delta) {
    const ctx = this.vertCtx;
    const W = 1080, H = 1920;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = '#f0f6fc';
    ctx.font = 'bold 24px "Fira Code", monospace';
    ctx.fillText('  server.log — Room Console', 20, 45);

    // Log entries that scroll up
    this.chatScrollY += delta * 22;
    const logEntries = [];
    const templates = [
      ['INFO', '#10b981', '3D scene initialized successfully'],
      ['INFO', '#10b981', 'WebGL context created (high-performance)'],
      ['AUDIO', '#38bdf8', 'SoundEngine: AudioContext unlocked'],
      ['AUDIO', '#38bdf8', 'Lo-Fi Radio: Channel set to "Chill Beats"'],
      ['RENDER', '#a855f7', 'UnrealBloomPass attached (strength: 0.35)'],
      ['INPUT', '#f59e0b', 'Mechanical keyboard SFX: active'],
      ['ANIM', '#ec4899', 'Fan blades rotation: 20 rad/s'],
      ['CLOCK', '#00e5ff', `Live clock synced: ${new Date().toLocaleTimeString()}`],
      ['NET', '#10b981', 'Vercel deployment: READY'],
      ['PERF', '#f59e0b', 'FPS: 60 | Draw calls: 142 | Triangles: 28.4k'],
      ['INFO', '#10b981', 'Camera preset: Isometric (7.5, 6.5, 7.5)'],
      ['AUDIO', '#38bdf8', 'Fan ambient noise: pink noise + 58Hz hum'],
      ['RENDER', '#a855f7', 'Speaker LED ring: pulsing to audio level'],
      ['INFO', '#10b981', 'Room furniture loaded: 7 objects'],
      ['INPUT', '#f59e0b', 'Raycaster: 6 interactive hotspots registered'],
    ];

    // Generate enough entries to fill the screen
    for (let i = 0; i < 40; i++) {
      logEntries.push(templates[i % templates.length]);
    }

    ctx.font = '18px "Fira Code", monospace';
    const lineH = 42;
    const offsetY = -(this.chatScrollY % (logEntries.length * lineH));

    logEntries.forEach((entry, i) => {
      const y = 100 + i * lineH + offsetY;
      if (y < 65 || y > H + 20) return;

      const [level, color, msg] = entry;
      const ts = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`;

      ctx.fillStyle = '#484f58';
      ctx.fillText(ts, 20, y);

      ctx.fillStyle = color;
      ctx.fillText(`[${level}]`, 200, y);

      ctx.fillStyle = '#c9d1d9';
      ctx.fillText(msg, 340, y);
    });
  }
}

