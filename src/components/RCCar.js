import * as THREE from 'three';

/**
 * RCCar - Interactive Drivable RC Cyber Rover
 * Features:
 * - Real-time physics (acceleration, reverse, steering, drift, friction)
 * - Jump ramp integration with gravity and airtime
 * - Bounding-box collision detection with room walls and furniture
 * - Working dual LED headlights with Three.js SpotLights
 * - Responsive steering wheels and rolling tire rotation
 * - Dynamic tire drift dust particle system
 * - Engine audio, horn (H), and tire skid SFX integration
 */

export function createRCCar(scene, soundEngine) {
  const carGroup = new THREE.Group();
  carGroup.name = 'RCCar';

  // =========================================================================
  // 1. CAR 3D MESH MODELING (Cyberpunk Aerodynamic Buggy)
  // =========================================================================

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: '#00e5ff',
    metalness: 0.85,
    roughness: 0.2,
    envMapIntensity: 1.2
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.9,
    roughness: 0.3
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85
  });

  const wheelRubberMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.9,
    metalness: 0.1
  });

  const rimNeonMat = new THREE.MeshStandardMaterial({
    color: '#ff007f',
    emissive: '#ff007f',
    emissiveIntensity: 1.5,
    roughness: 0.3
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 2.5
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: '#ff1744',
    emissive: '#ff1744',
    emissiveIntensity: 1.0
  });

  // Chassis / Main Body
  const chassisGeo = new THREE.BoxGeometry(0.46, 0.14, 0.78);
  const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
  chassis.position.y = 0.14;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  carGroup.add(chassis);

  // Wedge Nose Front
  const noseGeo = new THREE.CylinderGeometry(0.18, 0.23, 0.25, 4);
  const nose = new THREE.Mesh(noseGeo, bodyMaterial);
  nose.rotation.y = Math.PI / 4;
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.12, 0.44);
  nose.castShadow = true;
  carGroup.add(nose);

  // Cockpit / Canopy
  const cockpitGeo = new THREE.BoxGeometry(0.34, 0.13, 0.38);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMaterial);
  cockpit.position.set(0, 0.24, -0.04);
  cockpit.castShadow = true;
  carGroup.add(cockpit);

  // Rear Spoiler / Wing
  const spoilerWingGeo = new THREE.BoxGeometry(0.48, 0.025, 0.12);
  const spoiler = new THREE.Mesh(spoilerWingGeo, accentMaterial);
  spoiler.position.set(0, 0.31, -0.38);
  spoiler.castShadow = true;
  carGroup.add(spoiler);

  const strutGeo = new THREE.BoxGeometry(0.02, 0.12, 0.04);
  const strutL = new THREE.Mesh(strutGeo, accentMaterial);
  strutL.position.set(-0.16, 0.25, -0.38);
  const strutR = strutL.clone();
  strutR.position.x = 0.16;
  carGroup.add(strutL, strutR);

  // Antenna with LED Tip
  const antennaGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.35);
  const antennaMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8 });
  const antenna = new THREE.Mesh(antennaGeo, antennaMat);
  antenna.position.set(-0.14, 0.35, -0.28);
  antenna.rotation.x = -0.15;
  carGroup.add(antenna);

  const antennaLedGeo = new THREE.SphereGeometry(0.016, 8, 8);
  const antennaLedMat = new THREE.MeshStandardMaterial({
    color: '#00e5ff',
    emissive: '#00e5ff',
    emissiveIntensity: 2.0
  });
  const antennaLed = new THREE.Mesh(antennaLedGeo, antennaLedMat);
  antennaLed.position.set(0, 0.18, 0);
  antenna.add(antennaLed);

  // Headlight Lenses
  const headLensGeo = new THREE.BoxGeometry(0.08, 0.04, 0.03);
  const headLensL = new THREE.Mesh(headLensGeo, headlightMat);
  headLensL.position.set(-0.15, 0.13, 0.44);
  const headLensR = headLensL.clone();
  headLensR.position.x = 0.15;
  carGroup.add(headLensL, headLensR);

  // Active Spotlights (Dual Headlights)
  const spotL = new THREE.SpotLight('#cffafe', 3.5, 7.0, 0.45, 0.5, 1.2);
  spotL.position.set(-0.15, 0.14, 0.45);
  const spotTargetL = new THREE.Object3D();
  spotTargetL.position.set(-0.15, 0.0, 3.5);
  carGroup.add(spotTargetL);
  spotL.target = spotTargetL;
  carGroup.add(spotL);

  const spotR = new THREE.SpotLight('#cffafe', 3.5, 7.0, 0.45, 0.5, 1.2);
  spotR.position.set(0.15, 0.14, 0.45);
  const spotTargetR = new THREE.Object3D();
  spotTargetR.position.set(0.15, 0.0, 3.5);
  carGroup.add(spotTargetR);
  spotR.target = spotTargetR;
  carGroup.add(spotR);

  // Taillight Strips
  const tailGeo = new THREE.BoxGeometry(0.12, 0.035, 0.02);
  const tailL = new THREE.Mesh(tailGeo, taillightMat);
  tailL.position.set(-0.16, 0.15, -0.40);
  const tailR = tailL.clone();
  tailR.position.x = 0.16;
  carGroup.add(tailL, tailR);

  // 4 Wheels
  function createWheelMesh(isFront = false) {
    const wheelGroup = new THREE.Group();
    const tireRadius = 0.11;
    const tireWidth = 0.08;
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 16);
    tireGeo.rotateZ(Math.PI / 2);

    const tireMesh = new THREE.Mesh(tireGeo, wheelRubberMat);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.55, tireRadius * 0.55, tireWidth + 0.004, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimNeonMat);
    wheelGroup.add(rimMesh);

    return { wheelGroup, tireMesh };
  }

  // Front Left Steering Group
  const frontLeftSteer = new THREE.Group();
  frontLeftSteer.position.set(-0.25, 0.11, 0.26);
  const { wheelGroup: flWheel, tireMesh: flTire } = createWheelMesh(true);
  frontLeftSteer.add(flWheel);
  carGroup.add(frontLeftSteer);

  // Front Right Steering Group
  const frontRightSteer = new THREE.Group();
  frontRightSteer.position.set(0.25, 0.11, 0.26);
  const { wheelGroup: frWheel, tireMesh: frTire } = createWheelMesh(true);
  frontRightSteer.add(frWheel);
  carGroup.add(frontRightSteer);

  // Rear Left Wheel
  const { wheelGroup: rlWheel, tireMesh: rlTire } = createWheelMesh(false);
  rlWheel.position.set(-0.25, 0.11, -0.26);
  carGroup.add(rlWheel);

  // Rear Right Wheel
  const { wheelGroup: rrWheel, tireMesh: rrTire } = createWheelMesh(false);
  rrWheel.position.set(0.25, 0.11, -0.26);
  carGroup.add(rrWheel);

  // =========================================================================
  // 2. FLOOR JUMP RAMP
  // =========================================================================
  const rampGroup = new THREE.Group();
  rampGroup.name = 'RCRamp';
  rampGroup.position.set(0.2, 0.0, 0.9);
  rampGroup.rotation.y = -Math.PI / 3;

  const rampShape = new THREE.Shape();
  rampShape.moveTo(0, 0);
  rampShape.lineTo(0.9, 0);
  rampShape.lineTo(0, 0.26);
  rampShape.closePath();

  const rampExtrude = new THREE.ExtrudeGeometry(rampShape, {
    depth: 0.7,
    bevelEnabled: false
  });
  rampExtrude.rotateY(Math.PI / 2);
  rampExtrude.translate(-0.35, 0, 0);

  const rampMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    roughness: 0.4,
    metalness: 0.2
  });
  const rampMesh = new THREE.Mesh(rampExtrude, rampMat);
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  rampGroup.add(rampMesh);

  // Neon arrows on ramp
  const arrowGeo = new THREE.PlaneGeometry(0.3, 0.08);
  arrowGeo.rotateX(-Math.PI / 2 + 0.28);
  const arrowMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const arrow1 = new THREE.Mesh(arrowGeo, arrowMat);
  arrow1.position.set(0, 0.08, -0.25);
  rampGroup.add(arrow1);

  scene.add(rampGroup);

  // =========================================================================
  // 3. DRIFT DUST PARTICLE SYSTEM
  // =========================================================================
  const maxParticles = 30;
  const particleGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const particleMat = new THREE.MeshBasicMaterial({
    color: '#00e5ff',
    transparent: true,
    opacity: 0.6
  });

  const particles = [];
  for (let i = 0; i < maxParticles; i++) {
    const p = new THREE.Mesh(particleGeo, particleMat.clone());
    p.visible = false;
    p.userData = { life: 0, maxLife: 0.6, vx: 0, vy: 0, vz: 0 };
    scene.add(p);
    particles.push(p);
  }

  function spawnDriftParticles(pos, isDrifting) {
    for (let i = 0; i < 2; i++) {
      const p = particles.find((item) => !item.visible);
      if (!p) break;
      p.visible = true;
      p.position.set(
        pos.x + (Math.random() - 0.5) * 0.2,
        0.05 + Math.random() * 0.05,
        pos.z + (Math.random() - 0.5) * 0.2
      );
      p.material.opacity = isDrifting ? 0.75 : 0.4;
      p.material.color.set(isDrifting ? '#ff007f' : '#00e5ff');
      p.scale.setScalar(1.0);
      p.userData.life = 0;
      p.userData.maxLife = 0.45 + Math.random() * 0.25;
      p.userData.vx = (Math.random() - 0.5) * 0.4;
      p.userData.vy = 0.25 + Math.random() * 0.2;
      p.userData.vz = (Math.random() - 0.5) * 0.4;
    }
  }

  function updateParticles(delta) {
    particles.forEach((p) => {
      if (!p.visible) return;
      p.userData.life += delta;
      if (p.userData.life >= p.userData.maxLife) {
        p.visible = false;
        return;
      }
      p.position.x += p.userData.vx * delta;
      p.position.y += p.userData.vy * delta;
      p.position.z += p.userData.vz * delta;
      const progress = p.userData.life / p.userData.maxLife;
      p.material.opacity = (1 - progress) * 0.7;
      p.scale.setScalar(1.0 + progress * 2.2);
    });
  }

  // =========================================================================
  // 4. PHYSICS & MOVEMENT LOGIC
  // =========================================================================
  const state = {
    posX: 0.0,
    posY: 0.0,
    posZ: -0.2,
    velocity: 0.0,
    heading: 0.0, // Radians
    steerAngle: 0.0,
    vertVelocity: 0.0,
    isGrounded: true,
    isDrifting: false,
    active: false,
    // Physics constants
    accel: 11.5,
    maxSpeed: 4.8,
    reverseSpeed: -2.2,
    damping: 0.95,
    brakeDamping: 0.82,
    turnRate: 3.2,
    gravity: 9.8
  };

  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false
  };

  // Furniture Colliders
  const colliders = [
    { minX: -1.35, maxX: 1.35, minZ: -3.4, maxZ: -1.75, name: 'Desk' },
    { minX: -3.5, maxX: -0.55, minZ: 0.45, maxZ: 3.65, name: 'Bed' },
    { minX: 0.75, maxX: 1.6, minZ: -3.4, maxZ: -2.0, name: 'PCCabinet' },
    { minX: -3.6, maxX: -1.65, minZ: -1.4, maxZ: 0.15, name: 'Sofa' },
    { cx: 2.2, cz: 2.2, r: 0.45, isCircle: true, name: 'StandingFan' },
    { minX: 2.4, maxX: 3.7, minZ: -3.7, maxZ: -1.4, name: 'Wardrobe' }
  ];

  function checkCollisions(x, z) {
    const carRadius = 0.26;
    const roomLimit = 3.65;

    // Room outer walls
    if (x < -roomLimit) return { hit: true, nx: 1, nz: 0, name: 'WestWall' };
    if (x > roomLimit) return { hit: true, nx: -1, nz: 0, name: 'EastWall' };
    if (z < -roomLimit) return { hit: true, nx: 0, nz: 1, name: 'NorthWall' };
    if (z > roomLimit) return { hit: true, nx: 0, nz: -1, name: 'SouthWall' };

    // Furniture boxes
    for (const c of colliders) {
      if (c.isCircle) {
        const dist = Math.hypot(x - c.cx, z - c.cz);
        if (dist < carRadius + c.r) {
          const nx = (x - c.cx) / (dist || 1);
          const nz = (z - c.cz) / (dist || 1);
          return { hit: true, nx, nz, name: c.name };
        }
      } else {
        if (
          x + carRadius > c.minX &&
          x - carRadius < c.maxX &&
          z + carRadius > c.minZ &&
          z - carRadius < c.maxZ
        ) {
          const overlapL = (x + carRadius) - c.minX;
          const overlapR = c.maxX - (x - carRadius);
          const overlapT = (z + carRadius) - c.minZ;
          const overlapB = c.maxZ - (z - carRadius);

          const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
          let nx = 0, nz = 0;
          if (minOverlap === overlapL) nx = -1;
          else if (minOverlap === overlapR) nx = 1;
          else if (minOverlap === overlapT) nz = -1;
          else nz = 1;

          return { hit: true, nx, nz, name: c.name };
        }
      }
    }

    return { hit: false };
  }

  // Key event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (!state.active) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        keys.forward = true;
        e.preventDefault();
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        keys.backward = true;
        e.preventDefault();
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keys.left = true;
        e.preventDefault();
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keys.right = true;
        e.preventDefault();
      } else if (e.code === 'Space') {
        keys.drift = true;
        e.preventDefault();
      } else if (e.code === 'KeyH') {
        if (soundEngine && soundEngine.playCarHorn) {
          soundEngine.playCarHorn();
        }
      } else if (e.code === 'Escape') {
        setActive(false);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!state.active) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = false;
      else if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = false;
      else if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
      else if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
      else if (e.code === 'Space') keys.drift = false;
    });
  }

  // UI HUD Badge for RC Mode
  let hudBadge = null;
  if (typeof document !== 'undefined') {
    hudBadge = document.getElementById('rc-car-hud');
    if (!hudBadge) {
      hudBadge = document.createElement('div');
      hudBadge.id = 'rc-car-hud';
      hudBadge.className = 'rc-car-hud hidden';
      hudBadge.innerHTML = `
        <div class="rc-hud-pill">
          <span class="rc-hud-icon">🏎️</span>
          <span class="rc-hud-title">RC CYBER ROVER</span>
          <div class="rc-hud-keys">
            <span class="hud-key">W/S</span> Throttle
            <span class="hud-key">A/D</span> Steer
            <span class="hud-key">Space</span> Drift
            <span class="hud-key">H</span> Horn
          </div>
          <button class="rc-hud-exit" id="rc-exit-btn" title="Exit Drive Mode (Esc)">✕ Exit</button>
        </div>
      `;
      document.body.appendChild(hudBadge);

      document.getElementById('rc-exit-btn')?.addEventListener('click', () => {
        setActive(false);
      });
    }
  }

  function setActive(isActive) {
    state.active = isActive;
    if (hudBadge) {
      if (isActive) hudBadge.classList.remove('hidden');
      else hudBadge.classList.add('hidden');
    }

    if (isActive) {
      if (soundEngine && soundEngine.setEngineSound) {
        soundEngine.setEngineSound(true, 0.1);
      }
    } else {
      if (soundEngine && soundEngine.setEngineSound) {
        soundEngine.setEngineSound(false, 0);
      }
      keys.forward = false;
      keys.backward = false;
      keys.left = false;
      keys.right = false;
      keys.drift = false;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rc-mode-change', { detail: { active: isActive } }));
    }
  }

  // Initial placement
  carGroup.position.set(state.posX, state.posY, state.posZ);
  scene.add(carGroup);

  // =========================================================================
  // 5. UPDATE LOOP (Every Frame)
  // =========================================================================
  let driftSoundCooldown = 0;

  function update(delta) {
    updateParticles(delta);

    // Antenna LED pulse
    antennaLedMat.emissiveIntensity = 1.2 + Math.sin(Date.now() * 0.008) * 0.8;

    if (!state.active) {
      return;
    }

    // Acceleration & Reverse
    if (keys.forward) {
      state.velocity += state.accel * delta;
      if (state.velocity > state.maxSpeed) state.velocity = state.maxSpeed;
    } else if (keys.backward) {
      state.velocity -= state.accel * 0.8 * delta;
      if (state.velocity < state.reverseSpeed) state.velocity = state.reverseSpeed;
    } else {
      state.velocity *= Math.pow(state.damping, delta * 60);
      if (Math.abs(state.velocity) < 0.01) state.velocity = 0;
    }

    // Handbrake / Drift
    state.isDrifting = keys.drift && Math.abs(state.velocity) > 0.8;
    if (keys.drift) {
      state.velocity *= Math.pow(state.brakeDamping, delta * 60);
      taillightMat.emissiveIntensity = 3.0;
    } else if (keys.backward && state.velocity > 0) {
      taillightMat.emissiveIntensity = 2.5;
    } else {
      taillightMat.emissiveIntensity = 1.0;
    }

    // Steering
    let targetSteer = 0;
    if (keys.left) targetSteer += 0.55;
    if (keys.right) targetSteer -= 0.55;
    state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1.0, delta * 12);

    frontLeftSteer.rotation.y = state.steerAngle;
    frontRightSteer.rotation.y = state.steerAngle;

    // Apply turn to car heading
    if (Math.abs(state.velocity) > 0.05) {
      const turnMultiplier = state.isDrifting ? 1.4 : 1.0;
      const dir = state.velocity >= 0 ? 1 : -1;
      state.heading += state.steerAngle * state.turnRate * dir * turnMultiplier * delta;
    }

    // Wheel roll rotation based on linear movement
    const rollDelta = (state.velocity * delta) / 0.11;
    flTire.rotation.x += rollDelta;
    frTire.rotation.x += rollDelta;
    rlTire.rotation.x += rollDelta;
    rrTire.rotation.x += rollDelta;

    // Compute proposed new coordinates
    const moveDist = state.velocity * delta;
    const newX = state.posX + Math.sin(state.heading) * moveDist;
    const newZ = state.posZ + Math.cos(state.heading) * moveDist;

    // Check ramp contact for jump
    const rampDist = Math.hypot(newX - rampGroup.position.x, newZ - rampGroup.position.z);
    if (rampDist < 0.55 && state.velocity > 1.2 && state.isGrounded) {
      state.vertVelocity = state.velocity * 0.75 + 1.2;
      state.isGrounded = false;
    }

    // Vertical jump physics
    if (!state.isGrounded) {
      state.vertVelocity -= state.gravity * delta;
      state.posY += state.vertVelocity * delta;
      if (state.posY <= 0) {
        state.posY = 0;
        state.vertVelocity = 0;
        state.isGrounded = true;
      }
    }

    // Collision Detection
    const col = checkCollisions(newX, newZ);
    if (col.hit) {
      state.velocity *= -0.3;
      if (soundEngine && soundEngine.playMechanicalKey) {
        soundEngine.playMechanicalKey('space');
      }
    } else {
      state.posX = newX;
      state.posZ = newZ;
    }

    // Apply transformed coordinates to Three.js group
    carGroup.position.set(state.posX, state.posY, state.posZ);
    carGroup.rotation.y = state.heading;

    // Drift particles and tire screech
    driftSoundCooldown -= delta;
    if (state.isDrifting) {
      spawnDriftParticles(carGroup.position, true);
      if (driftSoundCooldown <= 0) {
        if (soundEngine && soundEngine.playTireSkid) {
          soundEngine.playTireSkid();
        }
        driftSoundCooldown = 0.28;
      }
    } else if (Math.abs(state.velocity) > 3.0 && Math.abs(state.steerAngle) > 0.3) {
      spawnDriftParticles(carGroup.position, false);
    }

    // Engine sound modulation
    if (soundEngine && soundEngine.setEngineSound) {
      const speedRatio = Math.abs(state.velocity) / state.maxSpeed;
      soundEngine.setEngineSound(true, speedRatio);
    }
  }

  return {
    group: carGroup,
    rampGroup,
    state,
    setActive,
    update,
    checkCollisions
  };
}
