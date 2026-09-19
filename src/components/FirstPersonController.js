import * as THREE from 'three';

/**
 * FirstPersonController
 * Provides an immersive first-person walkthrough mode inside the 3D room.
 * Features:
 * - PointerLock mouse-look controls with pitch/yaw clamping
 * - Smooth WASD movement + sprint (Shift)
 * - Furniture and room boundary collision detection
 * - Camera head-bobbing and procedural footsteps sound integration
 */

export class FirstPersonController {
  constructor(camera, domElement, soundEngine = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.soundEngine = soundEngine;

    this.active = false;
    this.isLocked = false;

    // Player physical properties (meters)
    this.height = 1.65;
    this.radius = 0.32;
    this.position = new THREE.Vector3(0.5, this.height, 0.8);

    this.velocity = new THREE.Vector3();
    this.moveSpeed = 2.4;
    this.sprintSpeed = 4.2;

    // Camera rotation (Euler pitch & yaw)
    this.yaw = -Math.PI / 4;
    this.pitch = -0.15;

    // Head bobbing
    this.bobTimer = 0;
    this.bobAmount = 0.045;
    this.footstepTimer = 0;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };

    // Collision boundaries matching room geometry
    this.colliders = [
      { minX: -1.35, maxX: 1.35, minZ: -3.4, maxZ: -1.75, name: 'Desk' },
      { minX: -3.5, maxX: -0.55, minZ: 0.45, maxZ: 3.65, name: 'Bed' },
      { minX: 0.75, maxX: 1.6, minZ: -3.4, maxZ: -2.0, name: 'PCCabinet' },
      { minX: -3.6, maxX: -1.65, minZ: -1.4, maxZ: 0.15, name: 'Sofa' },
      { cx: 2.2, cz: 2.2, r: 0.48, isCircle: true, name: 'StandingFan' },
      { minX: 2.4, maxX: 3.7, minZ: -3.7, maxZ: -1.4, name: 'Wardrobe' }
    ];

    this._initListeners();
    this._createHUD();
  }

  _createHUD() {
    if (typeof document === 'undefined') return;

    // Crosshair dot
    let crosshair = document.getElementById('fps-crosshair');
    if (!crosshair) {
      crosshair = document.createElement('div');
      crosshair.id = 'fps-crosshair';
      crosshair.className = 'fps-crosshair hidden';
      crosshair.innerHTML = '<span class="crosshair-dot"></span>';
      document.body.appendChild(crosshair);
    }
    this.crosshair = crosshair;

    // FPS Walk HUD
    let hud = document.getElementById('fps-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'fps-hud';
      hud.className = 'fps-hud hidden';
      hud.innerHTML = `
        <div class="fps-hud-pill">
          <span class="fps-hud-icon">🚶</span>
          <span class="fps-hud-title">FIRST PERSON MODE</span>
          <div class="fps-hud-keys">
            <span class="hud-key">W/A/S/D</span> Walk
            <span class="hud-key">Shift</span> Sprint
            <span class="hud-key">Mouse</span> Look
          </div>
          <button class="fps-hud-exit" id="fps-exit-btn" title="Exit First Person (Esc)">✕ Exit</button>
        </div>
      `;
      document.body.appendChild(hud);

      document.getElementById('fps-exit-btn')?.addEventListener('click', () => {
        this.disable();
      });
    }
    this.hud = hud;
  }

  _initListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    this.onMouseMove = (e) => {
      if (!this.active || !this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.yaw -= movementX * 0.0022;
      this.pitch -= movementY * 0.0022;

      // Clamp vertical look to -85 deg and +85 deg
      const maxPitch = Math.PI / 2 - 0.08;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    };

    this.onKeyDown = (e) => {
      if (!this.active) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      else if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      else if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;
      else if (e.code === 'Escape') {
        this.disable();
      }
    };

    this.onKeyUp = (e) => {
      if (!this.active) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      else if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      else if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
    };

    this.onPointerLockChange = () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (!this.isLocked && this.active) {
        // Pointer unlocked by user press of ESC
      }
    };

    this.onCanvasClick = () => {
      if (this.active && !this.isLocked) {
        this.domElement.requestPointerLock?.();
      }
    };

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.domElement?.addEventListener('click', this.onCanvasClick);
  }

  checkCollisions(x, z) {
    const roomLimit = 3.65;

    // Room outer walls
    if (x - this.radius < -roomLimit) return { hit: true };
    if (x + this.radius > roomLimit) return { hit: true };
    if (z - this.radius < -roomLimit) return { hit: true };
    if (z + this.radius > roomLimit) return { hit: true };

    // Furniture bounding boxes
    for (const c of this.colliders) {
      if (c.isCircle) {
        const dist = Math.hypot(x - c.cx, z - c.cz);
        if (dist < this.radius + c.r) return { hit: true };
      } else {
        if (
          x + this.radius > c.minX &&
          x - this.radius < c.maxX &&
          z + this.radius > c.minZ &&
          z - this.radius < c.maxZ
        ) {
          return { hit: true };
        }
      }
    }

    return { hit: false };
  }

  enable() {
    this.active = true;
    this.position.set(0.6, this.height, 0.8);
    this.yaw = -Math.PI / 4;
    this.pitch = -0.15;
    this.velocity.set(0, 0, 0);

    if (this.crosshair) this.crosshair.classList.remove('hidden');
    if (this.hud) this.hud.classList.remove('hidden');

    if (this.domElement && typeof document !== 'undefined') {
      this.domElement.requestPointerLock?.();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fps-mode-change', { detail: { active: true } }));
    }
  }

  disable() {
    this.active = false;
    this.isLocked = false;

    if (typeof document !== 'undefined' && document.exitPointerLock) {
      document.exitPointerLock();
    }

    if (this.crosshair) this.crosshair.classList.add('hidden');
    if (this.hud) this.hud.classList.add('hidden');

    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.sprint = false;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fps-mode-change', { detail: { active: false } }));
    }
  }

  update(delta) {
    if (!this.active) return;

    // Movement direction vector relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();
      const curSpeed = this.keys.sprint ? this.sprintSpeed : this.moveSpeed;
      this.velocity.x = moveDir.x * curSpeed;
      this.velocity.z = moveDir.z * curSpeed;

      // Head bobbing & footsteps
      this.bobTimer += delta * (this.keys.sprint ? 14 : 9);
      this.footstepTimer += delta * (this.keys.sprint ? 1.6 : 1.0);

      if (this.footstepTimer >= 0.42) {
        this.footstepTimer = 0;
        if (this.soundEngine && this.soundEngine.playFootstep) {
          this.soundEngine.playFootstep();
        }
      }
    } else {
      this.velocity.set(0, 0, 0);
      this.bobTimer = 0;
      this.footstepTimer = 0;
    }

    // Step along X
    const newX = this.position.x + this.velocity.x * delta;
    if (!this.checkCollisions(newX, this.position.z).hit) {
      this.position.x = newX;
    }

    // Step along Z
    const newZ = this.position.z + this.velocity.z * delta;
    if (!this.checkCollisions(this.position.x, newZ).hit) {
      this.position.z = newZ;
    }

    // Calculate eye height with subtle head bob
    const bobOffset = isMoving ? Math.sin(this.bobTimer) * this.bobAmount : 0;
    const eyeY = this.height + bobOffset;

    // Update Three.js camera position and look rotation
    this.camera.position.set(this.position.x, eyeY, this.position.z);

    const target = new THREE.Vector3(
      this.position.x - Math.sin(this.yaw) * Math.cos(this.pitch),
      eyeY + Math.sin(this.pitch),
      this.position.z - Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(target);
  }
}
