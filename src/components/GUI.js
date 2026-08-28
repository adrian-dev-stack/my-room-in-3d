import GUI from 'lil-gui';

export function createGUI(lighting, furniture, pcSetup, onCameraPresetChange) {
  const gui = new GUI({ title: 'baked', width: 280 });

  const bakedFolder = gui.addFolder('lighting controls');

  // Lighting Preset
  bakedFolder.add(lighting.state, 'preset', ['Cyberpunk Night', 'Sunset Studio', 'Clean Daylight', 'Cozy Lo-Fi'])
    .name('preset')
    .onChange((val) => {
      lighting.applyPreset(val);
      if (pcSetup && pcSetup.fanLedMat) {
        pcSetup.fanLedMat.color.set(lighting.state.pcColor);
      }
    });

  // uNightMix Slider
  bakedFolder.add(lighting.state, 'uNightMix', 0, 1, 0.01)
    .name('uNightMix')
    .listen()
    .onChange(() => lighting.update());

  // uNeutralMix Slider
  bakedFolder.add(lighting.state, 'uNeutralMix', 0, 1, 0.01)
    .name('uNeutralMix')
    .onChange(() => lighting.update());

  // Discord Screen Light
  bakedFolder.addColor(lighting.state, 'screenColor')
    .name('screen')
    .listen()
    .onChange(() => lighting.update());

  bakedFolder.add(lighting.state, 'uLightScreenStrength', 0, 4, 0.05)
    .name('uLightScreenStrength')
    .listen()
    .onChange(() => lighting.update());

  // Desk Light Bar
  bakedFolder.addColor(lighting.state, 'deskColor')
    .name('desk')
    .listen()
    .onChange(() => lighting.update());

  bakedFolder.add(lighting.state, 'uLightDeskStrength', 0, 4, 0.05)
    .name('uLightDeskStrength')
    .listen()
    .onChange(() => lighting.update());

  // PC RGB Light
  bakedFolder.addColor(lighting.state, 'pcColor')
    .name('pc')
    .listen()
    .onChange((val) => {
      lighting.update();
      if (pcSetup && pcSetup.fanLedMat) {
        pcSetup.fanLedMat.color.set(val);
      }
    });

  bakedFolder.add(lighting.state, 'uLightPcStrength', 0, 4, 0.05)
    .name('uLightPcStrength')
    .listen()
    .onChange(() => lighting.update());

  // Animations & Fan
  const animFolder = gui.addFolder('interactivity');

  const animParams = {
    standingFan: true,
    fanSpeed: 1.0,
    cameraView: 'Isometric'
  };

  animFolder.add(animParams, 'standingFan')
    .name('standingFan')
    .onChange(() => furniture.toggleFan());

  animFolder.add(animParams, 'fanSpeed', 0.1, 3.0, 0.1)
    .name('fanSpeed')
    .onChange((val) => furniture.setFanSpeed(val));

  animFolder.add(animParams, 'cameraView', ['Isometric', 'Desk Setup', 'Bed Corner', 'Top Down'])
    .name('cameraView')
    .onChange((val) => {
      if (onCameraPresetChange) onCameraPresetChange(val);
    });

  return { gui, animParams };
}
