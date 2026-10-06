import * as THREE from 'three';
import { createWoodMaterialTextures } from '../utils/materialTextures.js';

/**
 * RoomCustomizer - Real-time Room Aesthetic Sandbox
 * Features:
 * - Dynamic floor finish switching (Walnut, Oak, Cyber Hex, Obsidian Marble)
 * - Dynamic wall color switching (Charcoal, Tokyo Indigo, Warm Greige, Emerald, Clean)
 * - Custom Wall Neon Sign with real-time text input & emissive bloom color selection
 * - LocalStorage persistence of user preferences
 * - Interactive glassmorphic customization drawer UI
 */

export const FLOOR_STYLES = {
  walnut: { name: 'Dark Walnut', color: '#1c130d', roughness: 0.42, metalness: 0.08 },
  oak: { name: 'Japanese Oak', color: '#c49a6c', roughness: 0.55, metalness: 0.02 },
  hex: { name: 'Cyber Hex Grid', color: '#090d16', roughness: 0.28, metalness: 0.65 },
  marble: { name: 'Obsidian Marble', color: '#030712', roughness: 0.12, metalness: 0.82 }
};

export const WALL_COLORS = {
  slate: { name: 'Charcoal Slate', color: '#1e2530' },
  tokyo: { name: 'Tokyo Midnight', color: '#150c28' },
  greige: { name: 'Warm Greige', color: '#2c2825' },
  emerald: { name: 'Emerald Velvet', color: '#062319' },
  clean: { name: 'Clean Studio', color: '#e4e7eb' }
};

export const NEON_COLORS = {
  cyan: { name: 'Cyber Cyan', color: '#00e5ff' },
  pink: { name: 'Hot Pink', color: '#ff007f' },
  green: { name: 'Acid Green', color: '#10b981' },
  amber: { name: 'Amber Gold', color: '#f59e0b' },
  purple: { name: 'Neon Violet', color: '#a855f7' }
};

export class RoomCustomizer {
  constructor(room, soundEngine = null, { createUI = true } = {}) {
    this.room = room;
    this.soundEngine = soundEngine;

    // Default settings
    this.settings = {
      floor: 'walnut',
      wall: 'slate',
      neonText: 'FIVEM PLAYER',
      neonColor: 'cyan'
    };

    this.neonCanvas = null;
    this.neonTexture = null;
    this.neonMesh = null;
    this.neonLight = null;

    this._loadSettings();
    this._createNeonSignMesh();
    this._applyAllSettings();
    if (createUI) this._createDrawerUI();
  }

  _loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('room_customizer_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load customizer settings:', e);
    }
  }

  saveSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('room_customizer_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save customizer settings:', e);
    }
  }

  _createNeonSignMesh() {
    if (typeof document === 'undefined') return;

    this.neonCanvas = document.createElement('canvas');
    this.neonCanvas.width = 1024;
    this.neonCanvas.height = 256;
    this.neonCtx = this.neonCanvas.getContext('2d');

    this.neonTexture = new THREE.CanvasTexture(this.neonCanvas);
    this.neonTexture.colorSpace = THREE.SRGBColorSpace;
    this.neonTexture.generateMipmaps = false;
    this.neonTexture.minFilter = THREE.LinearFilter;
    this.neonTexture.magFilter = THREE.LinearFilter;

    const neonMat = new THREE.MeshStandardMaterial({
      map: this.neonTexture,
      transparent: true,
      roughness: 0.2,
      metalness: 0.1,
      emissive: '#ffffff',
      emissiveMap: this.neonTexture,
      emissiveIntensity: 1.6
    });

    const neonGeo = new THREE.PlaneGeometry(2.4, 0.6);
    this.neonMesh = new THREE.Mesh(neonGeo, neonMat);
    // Placed on the back wall above the bed
    this.neonMesh.position.set(-1.8, 3.1, -3.388);
    this.neonMesh.name = 'CustomNeonSign';

    // Emissive ambient point light radiating from neon sign
    this.neonLight = new THREE.PointLight('#00e5ff', 1.8, 4.5);
    this.neonLight.position.set(-1.8, 3.1, -3.2);

    if (this.room && this.room.group) {
      this.room.group.add(this.neonMesh);
      this.room.group.add(this.neonLight);
    }

    this._renderNeonCanvas();
  }

  _renderNeonCanvas() {
    if (!this.neonCtx) return;
    const ctx = this.neonCtx;
    const w = 1024;
    const h = 256;

    ctx.clearRect(0, 0, w, h);

    const activeColorObj = NEON_COLORS[this.settings.neonColor] || NEON_COLORS.cyan;
    const hexColor = activeColorObj.color;

    // Glowing border frame
    ctx.save();
    ctx.shadowColor = hexColor;
    ctx.shadowBlur = 24;
    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Neon text glow passes
    const text = this.settings.neonText.toUpperCase() || 'MY ROOM 3D';
    ctx.font = '900 68px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow
    ctx.shadowColor = hexColor;
    ctx.shadowBlur = 36;
    ctx.fillStyle = hexColor;
    ctx.fillText(text, w / 2, h / 2);

    // Inner bright white tube
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2);

    ctx.restore();

    if (this.neonTexture) {
      this.neonTexture.needsUpdate = true;
    }
    if (this.neonLight) {
      this.neonLight.color.set(hexColor);
    }
  }

  setFloor(floorKey) {
    if (!FLOOR_STYLES[floorKey] || this.settings.floor === floorKey) return;
    this.settings.floor = floorKey;
    this._applyFloor();
    this.saveSettings();
  }

  setWall(wallKey) {
    if (!WALL_COLORS[wallKey]) return;
    this.settings.wall = wallKey;
    this._applyWall();
    this.saveSettings();
  }

  setNeonText(text) {
    this.settings.neonText = text.slice(0, 20); // Cap at 20 chars
    this._renderNeonCanvas();
    this.saveSettings();
  }

  setNeonColor(colorKey) {
    if (!NEON_COLORS[colorKey]) return;
    this.settings.neonColor = colorKey;
    this._renderNeonCanvas();
    this.saveSettings();
  }

  _applyFloor() {
    if (!this.room) return;
    const style = FLOOR_STYLES[this.settings.floor];
    if (this.room.floorMaterial) {
      const material = this.room.floorMaterial;
      if (material.userData.pbrWood && ['walnut', 'oak'].includes(this.settings.floor)) {
        const textures = createWoodMaterialTextures({
          planks: true,
          color: this.settings.floor === 'walnut' ? '#805637' : '#c99d67'
        });
        for (const [key, texture] of Object.entries(textures)) {
          material[key]?.dispose();
          material[key] = texture.clone();
          material[key].repeat.set(4, 4);
        }
        material.color.set('#ffffff');
      } else {
        material.color.set(style.color);
      }
      const woodFinish = material.userData.pbrWood && ['walnut', 'oak'].includes(this.settings.floor);
      material.roughness = woodFinish ? 0.85 : style.roughness;
      material.metalness = woodFinish ? 0 : style.metalness;
      this.room.floorMaterial.needsUpdate = true;
    }
  }

  _applyWall() {
    if (!this.room) return;
    const style = WALL_COLORS[this.settings.wall];
    if (this.room.wallMaterial) {
      this.room.wallMaterial.color.set(style.color);
      this.room.wallMaterial.needsUpdate = true;
    }
  }

  _applyAllSettings() {
    this._applyFloor();
    this._applyWall();
    this._renderNeonCanvas();
  }

  _createDrawerUI() {
    if (typeof document === 'undefined') return;

    let drawer = document.getElementById('customizer-drawer');
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.id = 'customizer-drawer';
      drawer.className = 'customizer-drawer closed';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-label', 'Customize room');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;

      drawer.innerHTML = `
        <div class="drawer-header">
          <div class="drawer-title-group">
            <span class="drawer-title">Make it yours</span>
          </div>
          <button class="drawer-close" id="drawer-close-btn" aria-label="Close Customizer">✕</button>
        </div>

        <div class="drawer-body">
          <!-- Floor Section -->
          <div class="custom-section">
            <div class="custom-label">Floor material</div>
            <div class="custom-grid" id="floor-options">
              ${Object.entries(FLOOR_STYLES)
                .map(
                  ([k, v]) => `
                <button class="custom-tile ${k === this.settings.floor ? 'active' : ''}" data-floor="${k}" aria-pressed="${k === this.settings.floor}">
                  <span class="tile-swatch" style="background: ${v.color};"></span>
                  <span class="tile-name">${v.name}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Wall Color Section -->
          <div class="custom-section">
            <div class="custom-label">Wall finish</div>
            <div class="custom-grid" id="wall-options">
              ${Object.entries(WALL_COLORS)
                .map(
                  ([k, v]) => `
                <button class="custom-tile ${k === this.settings.wall ? 'active' : ''}" data-wall="${k}" aria-pressed="${k === this.settings.wall}">
                  <span class="tile-swatch" style="background: ${v.color};"></span>
                  <span class="tile-name">${v.name}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Custom Neon Sign Section -->
          <div class="custom-section">
            <label class="custom-label" for="neon-text-input">Neon wall sign</label>
            <input type="text" id="neon-text-input" class="custom-input" maxlength="20" placeholder="Your sign text" />

            <div class="neon-color-row" id="neon-colors">
              ${Object.entries(NEON_COLORS)
                .map(
                  ([k, v]) => `
                <button class="neon-color-btn ${k === this.settings.neonColor ? 'active' : ''}" data-neon="${k}" aria-label="${v.name}" aria-pressed="${k === this.settings.neonColor}" title="${v.name}" style="--neon-col: ${v.color};">
                  <span class="neon-swatch" style="background: ${v.color};"></span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(drawer);

      // Event listeners
      document.getElementById('drawer-close-btn')?.addEventListener('click', () => {
        this.toggleDrawer(false);
      });

      // Floor tiles click
      drawer.querySelectorAll('[data-floor]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.soundEngine) this.soundEngine.playSwitchClick();
          drawer.querySelectorAll('[data-floor]').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          this.setFloor(btn.getAttribute('data-floor'));
        });
      });

      // Wall tiles click
      drawer.querySelectorAll('[data-wall]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.soundEngine) this.soundEngine.playSwitchClick();
          drawer.querySelectorAll('[data-wall]').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          this.setWall(btn.getAttribute('data-wall'));
        });
      });

      // Neon colors click
      drawer.querySelectorAll('[data-neon]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.soundEngine) this.soundEngine.playSwitchClick();
          drawer.querySelectorAll('[data-neon]').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          this.setNeonColor(btn.getAttribute('data-neon'));
        });
      });

      // Neon text input
      const textInput = document.getElementById('neon-text-input');
      textInput.value = this.settings.neonText;
      textInput?.addEventListener('input', (e) => {
        this.setNeonText(e.target.value);
      });
    }

    this.drawer = drawer;
    document.getElementById('btn-customizer')?.setAttribute('aria-controls', 'customizer-drawer');
    document.getElementById('btn-customizer')?.setAttribute('aria-expanded', 'false');
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.drawer.classList.contains('closed')) this.toggleDrawer(false);
    });
  }

  toggleDrawer(open = null) {
    if (!this.drawer) return;
    const shouldOpen = open !== null ? open : this.drawer.classList.contains('closed');
    this.drawer.inert = !shouldOpen;
    this.drawer.setAttribute('aria-hidden', String(!shouldOpen));
    document.getElementById('btn-customizer')?.setAttribute('aria-expanded', String(shouldOpen));
    window.dispatchEvent(new CustomEvent('room-customizer-change', { detail: { open: shouldOpen } }));
    if (shouldOpen) {
      this.returnFocus = document.activeElement;
      this.drawer.classList.remove('closed');
      this.drawer.querySelector('#drawer-close-btn')?.focus();
    } else {
      this.drawer.classList.add('closed');
      this.returnFocus?.focus?.();
    }
  }
}
