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

  function syncWithWeather(weather) {
    state.preset = 'Weather Synced';
    if (weather.isDay) {
      if (weather.condition === 'clear') {
        state.uNightMix = 0.05;
        state.pcColor = '#38bdf8';
        state.deskColor = '#ffffff';
        state.screenColor = '#60a5fa';
        state.uLightPcStrength = 1.2;
        state.uLightDeskStrength = 1.5;
      } else { // cloudy / rain / snow
        state.uNightMix = 0.35;
        state.pcColor = '#60a5fa';
        state.deskColor = '#f8fafc';
        state.screenColor = '#94a3b8';
        state.uLightPcStrength = 1.8;
        state.uLightDeskStrength = 2.0;
      }
    } else {
      // Night time
      state.uNightMix = 0.92;
      state.pcColor = '#0082ff';
      state.deskColor = '#ffaa44';
      state.screenColor = '#818cf8';
      state.uLightPcStrength = 2.8;
      state.uLightDeskStrength = 2.8;
    }
    updateLighting();
  }

  function updateLighting() {
    const ease = 0.12;
    const t = 1.0 - state.uNightMix;
    const baseR = 0.05, baseG = 0.07, baseB = 0.12;
    const dayR = 1.0, dayG = 1.0, dayB = 1.0;

    ambientLight.color.setRGB(
      baseR + (dayR - baseR) * t * 0.9,
      baseG + (dayG - baseG) * t * 0.9,
      baseB + (dayB - baseB) * t * 0.9
    );

    const sunTargetIntensity = 0.1 + state.sunStrength * t * 1.5;
    sunLight.intensity += (sunTargetIntensity - sunLight.intensity) * ease;
    sunLight.color.setRGB(
      0.2 + 0.8 * t,
      0.3 + 0.7 * t,
      0.7 + 0.3 * t
    );

    rimLight.intensity += ((0.3 + 0.45 * t) - rimLight.intensity) * ease;
    windowLight.intensity += ((0.4 + 1.0 * t) - windowLight.intensity) * ease;

    const tmpCol = new THREE.Color();
    tmpCol.set(state.pcColor);
    pcLight.color.lerp(tmpCol, ease);
    pcLight.intensity += (state.uLightPcStrength - pcLight.intensity) * ease;

    tmpCol.set(state.deskColor);
    deskLight.color.lerp(tmpCol, ease);
    deskLight.intensity += (state.uLightDeskStrength - deskLight.intensity) * ease;

    tmpCol.set(state.screenColor);
    screenLight.color.lerp(tmpCol, ease);
    screenLight.intensity += (state.uLightScreenStrength - screenLight.intensity) * ease;
  }

  updateLighting();

  return {
    group: lightsGroup,
    state,
    applyPreset,
    syncWithWeather,
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
