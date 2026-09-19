import * as THREE from 'three';

/**
 * RoomPet - Interactive Virtual Cyber Cat Companion
 * Features:
 * - Low-poly procedural feline model with articulated head, tail, and legs
 * - Autonomous behavioral state machine: Roaming, Rug Resting, Bed Napping
 * - Cursor head-tracking and RC Car play reaction
 * - Interactive petting with Web Audio purr sound and heart particle effects
 */

export function createRoomPet(scene, soundEngine = null) {
  const petGroup = new THREE.Group();
  petGroup.name = 'CyberCat';

  // =========================================================================
  // 1. 3D MODEL CONSTRUCTION (Stylized Low-Poly Cyber Feline)
  // =========================================================================

  // Materials
  const furMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0', // Soft pearl white
    roughness: 0.65,
    metalness: 0.05
  });

  const patchMat = new THREE.MeshStandardMaterial({
    color: '#334155', // Slate calico patches
    roughness: 0.65
  });

  const pinkMat = new THREE.MeshStandardMaterial({
    color: '#f472b6', // Nose & ear inner
    roughness: 0.5
  });

  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: '#00e5ff',
    emissive: '#00e5ff',
    emissiveIntensity: 1.8,
    roughness: 0.2
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: '#ff007f',
    emissive: '#ff007f',
    emissiveIntensity: 1.2
  });

  // Torso / Body
  const bodyGeo = new THREE.BoxGeometry(0.24, 0.22, 0.44);
  const body = new THREE.Mesh(bodyGeo, furMat);
  body.position.y = 0.24;
  body.castShadow = true;
  petGroup.add(body);

  // Calico back patch
  const patchGeo = new THREE.BoxGeometry(0.242, 0.12, 0.22);
  const patch = new THREE.Mesh(patchGeo, patchMat);
  patch.position.set(0, 0.28, -0.04);
  petGroup.add(patch);

  // Head Group (Articulated for looking around)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0.24);

  const headGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
  const head = new THREE.Mesh(headGeo, furMat);
  head.castShadow = true;
  headGroup.add(head);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.06, 0.11, 4);
  earGeo.rotateY(Math.PI / 4);

  const earL = new THREE.Mesh(earGeo, patchMat);
  earL.position.set(-0.08, 0.14, 0.02);
  earL.rotation.z = 0.15;
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, furMat);
  earR.position.set(0.08, 0.14, 0.02);
  earR.rotation.z = -0.15;
  headGroup.add(earR);

  // Snout & Nose
  const snoutGeo = new THREE.BoxGeometry(0.1, 0.06, 0.06);
  const snout = new THREE.Mesh(snoutGeo, furMat);
  snout.position.set(0, -0.03, 0.12);
  headGroup.add(snout);

  const noseGeo = new THREE.BoxGeometry(0.03, 0.02, 0.015);
  const nose = new THREE.Mesh(noseGeo, pinkMat);
  nose.position.set(0, -0.015, 0.152);
  headGroup.add(nose);

  // Eyes (Glowing Cyber Cyan)
  const eyeGeo = new THREE.BoxGeometry(0.04, 0.035, 0.015);
  const eyeL = new THREE.Mesh(eyeGeo, eyeGlowMat);
  eyeL.position.set(-0.06, 0.025, 0.112);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeGlowMat);
  eyeR.position.set(0.06, 0.025, 0.112);
  headGroup.add(eyeR);

  // Collar with Bell
  const collarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12);
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.set(0, -0.09, 0.04);
  headGroup.add(collar);

  const bellGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const bellMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.2 });
  const bell = new THREE.Mesh(bellGeo, bellMat);
  bell.position.set(0, -0.1, 0.15);
  headGroup.add(bell);

  petGroup.add(headGroup);

  // Tail (Segmented Pivot)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.28, -0.22);

  const tailGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.35, 8);
  tailGeo.translate(0, 0.17, 0);
  tailGeo.rotateX(Math.PI / 3);
  const tail = new THREE.Mesh(tailGeo, patchMat);
  tail.castShadow = true;
  tailGroup.add(tail);
  petGroup.add(tailGroup);

  // 4 Legs
  function createLeg(x, z, mat) {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.22, z);

    const legGeo = new THREE.BoxGeometry(0.06, 0.22, 0.06);
    legGeo.translate(0, -0.11, 0);
    const leg = new THREE.Mesh(legGeo, mat);
    leg.castShadow = true;
    legGroup.add(leg);

    // Paw
    const pawGeo = new THREE.BoxGeometry(0.065, 0.03, 0.08);
    const paw = new THREE.Mesh(pawGeo, pinkMat);
    paw.position.set(0, -0.21, 0.02);
    legGroup.add(paw);

    petGroup.add(legGroup);
    return legGroup;
  }

  const legFL = createLeg(-0.09, 0.15, furMat);
  const legFR = createLeg(0.09, 0.15, patchMat);
  const legRL = createLeg(-0.09, -0.15, patchMat);
  const legRR = createLeg(0.09, -0.15, furMat);

  // =========================================================================
  // 2. PETTING PARTICLES (Floating Hearts / Sparkles)
  // =========================================================================
  const heartParticles = [];
  const heartGeo = new THREE.PlaneGeometry(0.12, 0.12);
  const heartMat = new THREE.MeshBasicMaterial({
    color: '#ff007f',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 8; i++) {
    const hp = new THREE.Mesh(heartGeo, heartMat.clone());
    hp.visible = false;
    scene.add(hp);
    heartParticles.push(hp);
  }

  function spawnHearts(pos) {
    heartParticles.forEach((hp, idx) => {
      hp.visible = true;
      hp.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y + 0.3 + Math.random() * 0.2,
        pos.z + (Math.random() - 0.5) * 0.3
      );
      hp.material.opacity = 1.0;
      hp.scale.setScalar(0.6 + Math.random() * 0.4);
      hp.userData = {
        life: 0,
        maxLife: 0.8 + idx * 0.1,
        vy: 0.4 + Math.random() * 0.3
      };
    });
  }

  function updateHearts(delta) {
    heartParticles.forEach((hp) => {
      if (!hp.visible) return;
      hp.userData.life += delta;
      if (hp.userData.life >= hp.userData.maxLife) {
        hp.visible = false;
        return;
      }
      hp.position.y += hp.userData.vy * delta;
      const progress = hp.userData.life / hp.userData.maxLife;
      hp.material.opacity = (1 - progress);
      hp.scale.multiplyScalar(1.01);
      hp.rotation.z += delta * 2;
    });
  }

  // =========================================================================
  // 3. BEHAVIOR STATE MACHINE
  // =========================================================================
  const state = {
    mode: 'ROAM', // 'ROAM', 'REST_RUG', 'NAP_BED'
    x: -0.8,
    y: 0,
    z: 0.5,
    heading: 0,
    targetX: 0,
    targetZ: 0,
    speed: 0.7,
    stateTimer: 4.0,
    walkCycle: 0,
    tailCycle: 0,
    isHappy: false,
    happyTimer: 0
  };

  // Safe walking destinations
  const waypoints = [
    { x: -0.8, z: 0.6, name: 'RugCenter' },
    { x: 0.8, z: 0.2, name: 'FloorCenter' },
    { x: 1.5, z: 1.2, name: 'NearWindow' },
    { x: -0.4, z: -0.8, name: 'UnderDeskArea' },
    { x: -2.0, z: 2.0, name: 'BedNap' }
  ];

  function pickNewWaypoint() {
    const wp = waypoints[Math.floor(Math.random() * waypoints.length)];
    state.targetX = wp.x;
    state.targetZ = wp.z;

    if (wp.name === 'BedNap') {
      state.mode = 'NAP_BED';
      state.stateTimer = 12.0; // Nap for 12 seconds
    } else if (wp.name === 'RugCenter' && Math.random() > 0.5) {
      state.mode = 'REST_RUG';
      state.stateTimer = 8.0; // Rest on rug
    } else {
      state.mode = 'ROAM';
      state.stateTimer = 6.0;
    }
  }

  pickNewWaypoint();
  petGroup.position.set(state.x, state.y, state.z);
  scene.add(petGroup);

  function pet() {
    state.isHappy = true;
    state.happyTimer = 3.0;
    spawnHearts(petGroup.position);
    if (soundEngine && soundEngine.playPurr) {
      soundEngine.playPurr();
    }
  }

  // =========================================================================
  // 4. ANIMATION UPDATE LOOP
  // =========================================================================
  function update(delta, rcCar = null) {
    updateHearts(delta);

    state.tailCycle += delta * (state.mode === 'ROAM' ? 5 : 2.5);
    tailGroup.rotation.y = Math.sin(state.tailCycle) * 0.35;
    tailGroup.rotation.z = Math.cos(state.tailCycle * 0.7) * 0.15;

    // React to petting
    if (state.isHappy) {
      state.happyTimer -= delta;
      headGroup.rotation.x = -0.1 + Math.sin(Date.now() * 0.01) * 0.08;
      if (state.happyTimer <= 0) state.isHappy = false;
    }

    // Reaction if RC Car gets close
    if (rcCar && rcCar.state) {
      const distToCar = Math.hypot(state.x - rcCar.state.posX, state.z - rcCar.state.posZ);
      if (distToCar < 0.9 && rcCar.state.active) {
        // Look directly at the car
        const angleToCar = Math.atan2(rcCar.state.posX - state.x, rcCar.state.posZ - state.z);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, angleToCar - state.heading, 0.12);
        // Playful tail flick
        tailGroup.rotation.y = Math.sin(Date.now() * 0.02) * 0.6;
      }
    }

    // State machine tick
    state.stateTimer -= delta;
    if (state.stateTimer <= 0) {
      pickNewWaypoint();
    }

    if (state.mode === 'ROAM') {
      const dx = state.targetX - state.x;
      const dz = state.targetZ - state.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.15) {
        const targetHeading = Math.atan2(dx, dz);
        // Smooth heading turn
        let diff = targetHeading - state.heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        state.heading += diff * Math.min(1.0, delta * 3.5);

        const moveDist = Math.min(dist, state.speed * delta);
        state.x += Math.sin(state.heading) * moveDist;
        state.z += Math.cos(state.heading) * moveDist;
        state.y = 0.0;

        // Walk cycle leg swings
        state.walkCycle += delta * 9.0;
        const swing = Math.sin(state.walkCycle) * 0.45;
        legFL.rotation.x = swing;
        legFR.rotation.x = -swing;
        legRL.rotation.x = -swing;
        legRR.rotation.x = swing;

        body.position.y = 0.24 + Math.abs(Math.sin(state.walkCycle * 2)) * 0.02;
      } else {
        // Reached destination, relax
        legFL.rotation.x = 0;
        legFR.rotation.x = 0;
        legRL.rotation.x = 0;
        legRR.rotation.x = 0;
      }
    } else if (state.mode === 'REST_RUG') {
      // Sitting position
      state.y = -0.04;
      legFL.rotation.x = 0.2;
      legFR.rotation.x = 0.2;
      legRL.rotation.x = -0.8;
      legRR.rotation.x = -0.8;
      // Gentle breathing
      body.scale.y = 1.0 + Math.sin(Date.now() * 0.003) * 0.04;
    } else if (state.mode === 'NAP_BED') {
      // On bed surface (bed top y is approx 0.65)
      state.y = 0.65;
      legFL.rotation.x = -0.5;
      legFR.rotation.x = -0.5;
      legRL.rotation.x = -0.8;
      legRR.rotation.x = -0.8;
      // Sleeping breathing motion
      body.scale.y = 1.0 + Math.sin(Date.now() * 0.002) * 0.05;
      headGroup.rotation.x = 0.25;
    }

    petGroup.position.set(state.x, state.y, state.z);
    petGroup.rotation.y = state.heading;
  }

  return {
    group: petGroup,
    state,
    pet,
    update
  };
}
