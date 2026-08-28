import * as THREE from 'three';

export function createLighting(scene) {
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'RoomLighting';

  // 1. Ambient Fill Light
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.9);
  lightsGroup.add(ambientLight);

  // 2. Main Sun / Key Light with Soft PCF Cascading Shadows
  const sunLight = new THREE.DirectionalLight('#fff8f0', 2.0);
  sunLight.position.set(6.5, 9.5, 5.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 30;
  sunLight.shadow.camera.left = -6.5;
  sunLight.shadow.camera.right = 6.5;
  sunLight.shadow.camera.top = 6.5;
  sunLight.shadow.camera.bottom = -6.5;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.025;
  lightsGroup.add(sunLight);

  // 3. Opposing Rim / Silhouette Highlight
  const rimLight = new THREE.DirectionalLight('#93c5fd', 0.75);
  rimLight.position.set(-6.5, 7.5, -6.5);
  lightsGroup.add(rimLight);

  // 4. Desk Light Bar Downward Spotlight (Warm focused desk illumination)
  const deskLight = new THREE.PointLight('#ffaa44', 2.8, 3.8, 1.1);
  deskLight.position.set(-0.75, 2.35, -2.75);
  deskLight.castShadow = true;
  lightsGroup.add(deskLight);

  // 5. Gaming PC Neon Glow (RGB Fan Light from Glass Case)
  const pcLight = new THREE.PointLight('#0082ff', 2.8, 3.8, 1.1);
  pcLight.position.set(1.15, 1.6, -2.7);
  pcLight.castShadow = false;
  lightsGroup.add(pcLight);

  // 6. Discord Screen Glow (Purple/Magenta)
  const screenLight = new THREE.PointLight('#818cf8', 1.8, 2.8, 1.2);
  screenLight.position.set(-1.65, 1.85, -2.7);
  screenLight.castShadow = false;
  lightsGroup.add(screenLight);

  // 7. Window Outside Fill Light
  const windowLight = new THREE.PointLight('#93c5fd', 1.4, 4.2);
  windowLight.position.set(-2.0, 2.4, 3.2);
  lightsGroup.add(windowLight);

  scene.add(lightsGroup);

  const state = {
    uNightMix: 0.85,
    uNeutralMix: 0.0,
    preset: 'Cyberpunk Night',
    pcColor: '#0082ff',
    uLightPcStrength: 2.8,
    deskColor: '#ffaa44',
    uLightDeskStrength: 2.8,
    screenColor: '#818cf8',
    uLightScreenStrength: 1.8,
    sunStrength: 2.0
  };

  function applyPreset(presetName) {
    state.preset = presetName;
    if (presetName === 'Cyberpunk Night') {
      state.uNightMix = 0.92;
      state.pcColor = '#0082ff';
      state.deskColor = '#ff6700';
      state.screenColor = '#a855f7';
      state.uLightPcStrength = 3.0;
      state.uLightDeskStrength = 2.4;
    } else if (presetName === 'Sunset Studio') {
      state.uNightMix = 0.45;
      state.pcColor = '#f59e0b';
      state.deskColor = '#fb923c';
      state.screenColor = '#38bdf8';
      state.uLightPcStrength = 2.4;
      state.uLightDeskStrength = 3.2;
    } else if (presetName === 'Clean Daylight') {
      state.uNightMix = 0.05;
      state.pcColor = '#38bdf8';
      state.deskColor = '#ffffff';
      state.screenColor = '#60a5fa';
      state.uLightPcStrength = 1.2;
      state.uLightDeskStrength = 1.5;
    } else if (presetName === 'Cozy Lo-Fi') {
      state.uNightMix = 0.88;
      state.pcColor = '#ff7849';
      state.deskColor = '#f59e0b';
      state.screenColor = '#f43f5e';
      state.uLightPcStrength = 2.2;
      state.uLightDeskStrength = 3.4;
    }
    updateLighting();
  }

  function updateLighting() {
    const night = state.uNightMix;

    // Ambient
    const dayAmb = new THREE.Color('#ffffff');
    const nightAmb = new THREE.Color('#0a0e1a');
    ambientLight.color.copy(dayAmb).lerp(nightAmb, night);
    ambientLight.intensity = THREE.MathUtils.lerp(1.3, 0.4, night);

    // Sun / Moon
    const daySun = new THREE.Color('#fff7ed');
    const nightSun = new THREE.Color('#38bdf8');
    sunLight.color.copy(daySun).lerp(nightSun, night);
    sunLight.intensity = THREE.MathUtils.lerp(state.sunStrength, 0.25, night);

    // Rim light
    rimLight.intensity = THREE.MathUtils.lerp(0.5, 0.95, night);

    // Desk Light
    deskLight.color.set(state.deskColor);
    deskLight.intensity = state.uLightDeskStrength * (0.4 + night * 0.9);

    // PC Light
    pcLight.color.set(state.pcColor);
    pcLight.intensity = state.uLightPcStrength * (0.5 + night * 0.95);

    // Screen Light
    screenLight.color.set(state.screenColor);
    screenLight.intensity = state.uLightScreenStrength * (0.4 + night * 0.9);
  }

  updateLighting();

  return {
    group: lightsGroup,
    state,
    applyPreset,
    ambientLight,
    sunLight,
    rimLight,
    deskLight,
    pcLight,
    screenLight,
    windowLight,
    update: updateLighting
  };
}
