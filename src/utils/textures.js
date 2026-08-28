import * as THREE from 'three';

// 1. Warm Orange-Brown Wood Floor (Matching Photos 2, 3, 4)
export function createWoodFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankHeight = 64;
  const planksCount = 1024 / plankHeight;

  for (let i = 0; i < planksCount; i++) {
    const y = i * plankHeight;
    const hueOffset = (Math.random() - 0.5) * 5;
    const lumOffset = (Math.random() - 0.5) * 6;
    ctx.fillStyle = `hsl(${32 + hueOffset}, 78%, ${38 + lumOffset}%)`;
    ctx.fillRect(0, y, 1024, plankHeight);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.2;
    for (let g = 0; g < 6; g++) {
      ctx.beginPath();
      const gy = y + Math.random() * plankHeight;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(340, gy + (Math.random() - 0.5) * 4, 680, gy + (Math.random() - 0.5) * 4, 1024, gy);
      ctx.stroke();
    }

    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, y, 1024, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, y + 2, 1024, 1);

    const jointsCount = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < jointsCount; j++) {
      const jx = ((j + 1) * (1024 / (jointsCount + 1))) + (Math.random() - 0.5) * 50;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(jx, y, 2, plankHeight);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(jx + 2, y, 1, plankHeight);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createWoodFloorBumpMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const plankHeight = 32;
  for (let y = 0; y < 512; y += plankHeight) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, 512, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, y + 2, 512, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 2. Zebra Window Blinds (Matching Photo 1 & 4)
export function createZebraBlindsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const stripeHeight = 22;
  for (let y = 0; y < 512; y += stripeHeight * 2) {
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, y, 512, stripeHeight);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, y + stripeHeight, 512, stripeHeight);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Patterned Damask Fabric Texture for Sofa (Matching Photo 4)
export function createSofaPatternTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#232730';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  const step = 32;
  for (let x = 0; x < 256; x += step) {
    for (let y = 0; y < 256; y += step) {
      ctx.beginPath();
      ctx.arc(x + step / 2, y + step / 2, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 4. Ultra-Crisp High-DPI Main Monitor Texture (2048x1152 - Photo 3)
export function createCodeEditorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');

  // Modern Dark IDE Window Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, 2048, 1152);

  // Top Titlebar
  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, 2048, 72);

  // Window Controls Dots
  ctx.fillStyle = '#ff5f56';
  ctx.beginPath();
  ctx.arc(36, 36, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffbd2e';
  ctx.beginPath();
  ctx.arc(68, 36, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#27c93f';
  ctx.beginPath();
  ctx.arc(100, 36, 10, 0, Math.PI * 2);
  ctx.fill();

  // Title text
  ctx.fillStyle = '#8b949e';
  ctx.font = 'bold 24px "Fira Code", monospace';
  ctx.fillText('my-room-in-3d - Visual Studio Code', 140, 44);

  // Active Tab
  ctx.fillStyle = '#1f242c';
  ctx.fillRect(0, 72, 340, 56);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 125, 340, 3);
  ctx.fillStyle = '#f0f6fc';
  ctx.font = '22px "Fira Code", monospace';
  ctx.fillText('Room.tsx  ✕', 40, 108);

  // Sidebar Separator
  ctx.fillStyle = '#21262d';
  ctx.fillRect(0, 128, 2048, 2);

  // Code editor lines
  ctx.font = '28px "Fira Code", monospace';
  const lines = [
    { text: 'import { Scene, PerspectiveCamera, WebGLRenderer } from "three";', color: '#ff7b72' },
    { text: 'import { createMyRoom } from "./components/MyRoom.js";', color: '#ff7b72' },
    { text: '', color: '#fff' },
    { text: '// FiveM Player Real Room 3D Experience', color: '#8b949e' },
    { text: 'const room = createMyRoom({', color: '#79c0ff' },
    { text: '  workstation: "Dual Monitors + LED Light Bar",', color: '#a5d6ff' },
    { text: '  pcRig: "Gaming PC + Live Digital Clock",', color: '#a5d6ff' },
    { text: '  shelves: ["Logitech G304", "Logitech G435"],', color: '#a5d6ff' },
    { text: '  bed: "Corner Bed + Zebra Blinds Window",', color: '#a5d6ff' },
    { text: '  status: "Faithfully Rendered 1:1 ✨"', color: '#7ee787' },
    { text: '});', color: '#79c0ff' }
  ];

  let startY = 190;
  lines.forEach((line, idx) => {
    // Line Numbers
    ctx.fillStyle = '#484f58';
    ctx.fillText(`${idx + 1}`.padStart(2, ' '), 40, startY);

    // Code
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, 110, startY);
    startY += 52;
  });

  // Glowing cursor
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.fillRect(800, startY - 44, 16, 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// 5. Ultra-Crisp High-DPI Vertical Discord Texture (1080x1920 - Photo 3)
export function createDiscordTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1e1f22';
  ctx.fillRect(0, 0, 1080, 1920);

  // Left Server Icon Bar (Width 120px)
  ctx.fillStyle = '#141517';
  ctx.fillRect(0, 0, 120, 1920);

  const serverColors = ['#5865F2', '#3ba55c', '#faa61a', '#ed4245', '#eb459e', '#00c3ff'];
  serverColors.forEach((col, idx) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(60, 80 + idx * 100, 32, 0, Math.PI * 2);
    ctx.fill();
  });

  // Channels Column (Width 280px)
  ctx.fillStyle = '#2b2d31';
  ctx.fillRect(120, 0, 280, 1920);

  ctx.fillStyle = '#f2f3f5';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('FiveM Community', 140, 60);

  ctx.fillStyle = '#949ba4';
  ctx.font = '22px sans-serif';
  ctx.fillText('# general', 140, 120);
  ctx.fillText('# voice-lounge', 140, 175);
  ctx.fillText('# room-setup', 140, 230);
  ctx.fillText('# gaming-clips', 140, 285);

  // Magenta Voice Call Box (Top of Chat Area - Photo 3)
  ctx.fillStyle = '#db2777';
  ctx.beginPath();
  ctx.roundRect(430, 40, 620, 320, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('🔊 Voice Connected', 470, 120);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#fbcfe8';
  ctx.fillText('FiveM Player / Studio Voice', 470, 170);

  // Small avatar circles in voice call
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(520, 260, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#db2777';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('FM', 500, 270);

  // Chat Area Header
  ctx.fillStyle = '#313338';
  ctx.fillRect(400, 380, 680, 1540);

  ctx.fillStyle = '#2b2d31';
  ctx.fillRect(400, 380, 680, 70);
  ctx.fillStyle = '#f2f3f5';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('# room-setup', 430, 425);

  // Chat Messages
  const chats = [
    { name: 'FiveM', color: '#FEE75C', msg: 'My dual monitors & LED bar looking clean!' },
    { name: 'Alex', color: '#57F287', msg: 'Door is removed, wall looks super clean now.' },
    { name: 'DevBot', color: '#5865F2', msg: 'Live clock is synchronized to real time.' },
    { name: 'GamerX', color: '#EB459E', msg: 'Zebra blinds & Logitech shelves active!' }
  ];

  let cy = 500;
  chats.forEach((chat) => {
    // Avatar
    ctx.fillStyle = chat.color;
    ctx.beginPath();
    ctx.arc(460, cy + 16, 24, 0, Math.PI * 2);
    ctx.fill();

    // Username
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(chat.name, 500, cy + 10);

    // Message
    ctx.fillStyle = '#dbdee1';
    ctx.font = '22px sans-serif';
    ctx.fillText(chat.msg, 500, cy + 44);

    cy += 110;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// 6. Live Digital LED Clock (Photo 3)
export class LiveClockTexture {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.update();
  }

  update() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;

    this.ctx.fillStyle = '#05070a';
    this.ctx.fillRect(0, 0, 512, 256);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 24;
    this.ctx.font = 'bold 120px "Fira Code", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const colon = (Math.floor(now.getTime() / 500) % 2 === 0) ? ':' : ' ';
    this.ctx.fillText(`${h}${colon}${m}`, 256, 128);

    this.texture.needsUpdate = true;
  }
}

// 7. Checkered Blue/White Plaid Pillow (Photo 1)
export function createCheckeredPillowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const size = 32;
  for (let x = 0; x < 256; x += size) {
    for (let y = 0; y < 256; y += size) {
      const isEven = (x / size + y / size) % 2 === 0;
      ctx.fillStyle = isEven ? '#60a5fa' : '#f8fafc';
      ctx.fillRect(x, y, size, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// 8. Logitech G304 and G435 Box Textures (Photo 4)
export function createLogitechBoxTexture(model, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e2530';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#00c3ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.fillStyle = '#00c3ff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(model, 128, 110);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(subtitle, 128, 150);

  ctx.fillStyle = '#00c3ff';
  ctx.beginPath();
  ctx.arc(128, 55, 18, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
