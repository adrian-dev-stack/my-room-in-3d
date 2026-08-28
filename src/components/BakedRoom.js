import * as THREE from 'three';
import { bakedVertexShader, bakedFragmentShader } from '../shaders/bakedShader.js';

export function createBakedRoom(scene, items) {
  const bakedDayTexture = items.bakedDayTexture;
  bakedDayTexture.colorSpace = THREE.SRGBColorSpace;
  bakedDayTexture.flipY = false;

  const bakedNightTexture = items.bakedNightTexture;
  bakedNightTexture.colorSpace = THREE.SRGBColorSpace;
  bakedNightTexture.flipY = false;

  const bakedNeutralTexture = items.bakedNeutralTexture;
  bakedNeutralTexture.colorSpace = THREE.SRGBColorSpace;
  bakedNeutralTexture.flipY = false;

  const lightMapTexture = items.lightMapTexture;
  lightMapTexture.flipY = false;

  const colors = {
    tv: '#ff115e',
    desk: '#ff6700',
    pc: '#0082ff'
  };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uBakedDayTexture: { value: bakedDayTexture },
      uBakedNightTexture: { value: bakedNightTexture },
      uBakedNeutralTexture: { value: bakedNeutralTexture },
      uLightMapTexture: { value: lightMapTexture },

      uNightMix: { value: 0.91 },
      uNeutralMix: { value: 0.0 },

      uLightTvColor: { value: new THREE.Color(colors.tv) },
      uLightTvStrength: { value: 1.47 },

      uLightDeskColor: { value: new THREE.Color(colors.desk) },
      uLightDeskStrength: { value: 1.90 },

      uLightPcColor: { value: new THREE.Color(colors.pc) },
      uLightPcStrength: { value: 1.40 }
    },
    vertexShader: bakedVertexShader,
    fragmentShader: bakedFragmentShader
  });

  const roomGroup = items.roomModel.scene;
  roomGroup.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
    }
  });

  scene.add(roomGroup);

  return {
    mesh: roomGroup,
    material,
    colors
  };
}
