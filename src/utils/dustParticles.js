/**
 * DustParticles — Ambient floating particles for atmospheric 3D depth.
 * Creates 400 tiny neon-glinting particles drifting slowly through the room.
 */
import * as THREE from 'three';

export class DustParticles {
  constructor(scene) {
    this.scene = scene;
    this.count = 400;

    // Room bounds (matching Room.js ROOM_SIZE = 7.2, WALL_HEIGHT = 4.2)
    this.boundsX = 3.4;
    this.boundsY = [0.05, 4.0];
    this.boundsZ = 3.4;

    this._initParticles();
  }

  _initParticles() {
    const positions = new Float32Array(this.count * 3);
    const colors    = new Float32Array(this.count * 3);
    const sizes     = new Float32Array(this.count);

    // Velocity per particle (dx, dy, dz)
    this._velocities = new Float32Array(this.count * 3);

    const colorPalette = [
      new THREE.Color('#00e5ff'), // cyan
      new THREE.Color('#a855f7'), // purple
      new THREE.Color('#ff007f'), // pink
      new THREE.Color('#38bdf8'), // sky blue
      new THREE.Color('#ffffff')  // white dust
    ];

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Random position within room volume
      positions[i3]     = (Math.random() - 0.5) * this.boundsX * 2;
      positions[i3 + 1] = this.boundsY[0] + Math.random() * (this.boundsY[1] - this.boundsY[0]);
      positions[i3 + 2] = (Math.random() - 0.5) * this.boundsZ * 2;

      // Slow random drift velocities (units/sec)
      this._velocities[i3]     = (Math.random() - 0.5) * 0.04;
      this._velocities[i3 + 1] = 0.008 + Math.random() * 0.025; // slight upward bias
      this._velocities[i3 + 2] = (Math.random() - 0.5) * 0.04;

      // Random neon color from palette
      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3]     = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      // Random size
      sizes[i] = 0.5 + Math.random() * 2.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for soft glowing points
    const material = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this._points = new THREE.Points(geometry, material);
    this._points.name = 'DustParticles';
    this.scene.add(this._points);

    this._posAttr = geometry.attributes.position;
  }

  update(delta) {
    const pos = this._posAttr.array;
    const vel = this._velocities;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      pos[i3]     += vel[i3]     * delta;
      pos[i3 + 1] += vel[i3 + 1] * delta;
      pos[i3 + 2] += vel[i3 + 2] * delta;

      // Wrap around Y axis — when particle floats above ceiling, reset to floor
      if (pos[i3 + 1] > this.boundsY[1]) {
        pos[i3 + 1] = this.boundsY[0];
        pos[i3]     = (Math.random() - 0.5) * this.boundsX * 2;
        pos[i3 + 2] = (Math.random() - 0.5) * this.boundsZ * 2;
      }

      // Wrap X/Z if out of bounds
      if (Math.abs(pos[i3]) > this.boundsX) {
        pos[i3] = -Math.sign(pos[i3]) * this.boundsX;
      }
      if (Math.abs(pos[i3 + 2]) > this.boundsZ) {
        pos[i3 + 2] = -Math.sign(pos[i3 + 2]) * this.boundsZ;
      }
    }

    this._posAttr.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this._points);
    this._points.geometry.dispose();
    this._points.material.dispose();
  }
}
