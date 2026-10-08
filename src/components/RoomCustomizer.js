import { createWoodMaterialTextures } from '../utils/materialTextures.js';

/**
 * RoomCustomizer - Real-time Room Aesthetic Sandbox
 * Features:
 * - Dynamic floor finish switching (Walnut, Oak, Cyber Hex, Obsidian Marble)
 * - Dynamic wall color switching (Charcoal, Tokyo Indigo, Warm Greige, Emerald, Clean)
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

export class RoomCustomizer {
  constructor(room, soundEngine = null, { createUI = true } = {}) {
    this.room = room;
    this.soundEngine = soundEngine;

    // Default settings
    this.settings = {
      floor: 'walnut',
      wall: 'slate'
    };

    this._loadSettings();
    this._applyAllSettings();
    if (createUI) this._createDrawerUI();
  }

  _loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('room_customizer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (FLOOR_STYLES[settings.floor]) this.settings.floor = settings.floor;
        if (WALL_COLORS[settings.wall]) this.settings.wall = settings.wall;
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
