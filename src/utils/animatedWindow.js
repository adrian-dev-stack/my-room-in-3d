import * as THREE from 'three';

/**
 * AnimatedWindow
 * Manages the zebra blinds canvas texture, adding animated rain streaks,
 * lightning flashes, and day/night backdrop colors.
 */
export class AnimatedWindow {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');
    
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    
    this.weatherState = {
      isDay: true,
      condition: 'clear'
    };
    
    this.raindrops = [];
    this.elapsed = 0;
    this.lightningFlash = 0;
    this.lastLightning = 0;
    
    this._initRaindrops();
    this._render(0);
  }

  _initRaindrops() {
    for (let i = 0; i < 150; i++) {
      this.raindrops.push({
        x: Math.random() * 1024,
        y: Math.random() * 1024,
        length: 20 + Math.random() * 40,
        speed: 800 + Math.random() * 600,
        width: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.4
      });
    }
  }

  setWeather(weatherData) {
    this.weatherState = weatherData;
  }

  update(delta) {
    this.elapsed += delta;
    let needsUpdate = false;
    
    // Animate raindrops if raining
    if (this.weatherState.condition === 'rain' || this.weatherState.condition === 'snow') {
      this.raindrops.forEach(drop => {
        const speedMult = this.weatherState.condition === 'snow' ? 0.2 : 1.0;
        drop.y += drop.speed * speedMult * delta;
        if (drop.y > 1024 + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * 1024;
        }
      });
      needsUpdate = true;
      
      // Random lightning
      if (this.weatherState.condition === 'rain' && this.elapsed - this.lastLightning > 5) {
        if (Math.random() < 0.005) { // Rare frame chance
          this.lightningFlash = 1.0;
          this.lastLightning = this.elapsed;
        }
      }
    }
    
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - delta * 2.5);
      needsUpdate = true;
    }
    
    // Always render to handle day/night transitions smoothly (could be optimized, but ok for now)
    this._render(delta);
    this.texture.needsUpdate = true;
  }

  _render(delta) {
    const W = 1024;
    const H = 1024;
    
    // Base sky color based on time and weather
    let skyColor = '#161920'; // Default dark
    if (this.weatherState.isDay) {
      if (this.weatherState.condition === 'clear') skyColor = '#38bdf8'; // Bright blue
      else if (this.weatherState.condition === 'cloudy') skyColor = '#94a3b8'; // Overcast
      else if (this.weatherState.condition === 'rain') skyColor = '#64748b'; // Darker grey
      else if (this.weatherState.condition === 'snow') skyColor = '#cbd5e1'; // White-ish grey
    } else {
      if (this.weatherState.condition === 'clear') skyColor = '#0f172a'; // Deep night
      else skyColor = '#020617'; // Pitch black overcast night
    }
    
    // Lightning flash override
    if (this.lightningFlash > 0) {
      const flashRgb = 255;
      this.ctx.fillStyle = `rgba(${flashRgb}, ${flashRgb}, ${flashRgb}, ${this.lightningFlash})`;
      this.ctx.fillRect(0, 0, W, H);
      // We don't return, we blend it on top of sky color or blend sky color with it
      // Actually let's draw sky color, then flash, then blinds
    }
    
    this.ctx.fillStyle = skyColor;
    this.ctx.fillRect(0, 0, W, H);
    
    // Add lightning flash
    if (this.lightningFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash})`;
      this.ctx.fillRect(0, 0, W, H);
    }
    
    // Draw raindrops if raining
    if (this.weatherState.condition === 'rain' || this.weatherState.condition === 'snow') {
      const isSnow = this.weatherState.condition === 'snow';
      this.ctx.fillStyle = isSnow ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
      
      this.ctx.beginPath();
      this.raindrops.forEach(drop => {
        if (isSnow) {
          this.ctx.moveTo(drop.x, drop.y);
          this.ctx.arc(drop.x + Math.sin(this.elapsed * 2 + drop.x) * 10, drop.y, drop.width * 1.5, 0, Math.PI * 2);
        } else {
          this.ctx.rect(drop.x, drop.y, drop.width, drop.length);
        }
      });
      this.ctx.fill();
    }
    
    // Draw Zebra Blinds over the sky (dark bars + bright/transparent bars)
    const stripeHeight = 44;
    for (let y = 0; y < H; y += stripeHeight * 2) {
      // Dark opaque stripe
      this.ctx.fillStyle = '#111318';
      this.ctx.fillRect(0, y, W, stripeHeight);

      // Light semi-transparent stripe (lets sky and rain show through)
      this.ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      this.ctx.fillRect(0, y + stripeHeight, W, stripeHeight);
    }
  }
}

