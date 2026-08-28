import * as THREE from 'three';

export function createTopChair(scene, items, bakedMaterial) {
  const group = items.topChairModel.scene;

  group.traverse((child) => {
    if (child.isMesh) {
      child.material = bakedMaterial;
    }
  });

  scene.add(group);

  return {
    group,
    update: (elapsed) => {
      group.rotation.y = Math.sin(elapsed * 0.0005) * 0.5;
    }
  };
}

export function createScreens(scene, items) {
  // 1. PC Screen
  const pcVideo = document.createElement('video');
  pcVideo.muted = true;
  pcVideo.loop = true;
  pcVideo.playsInline = true;
  pcVideo.autoplay = true;
  pcVideo.setAttribute('muted', '');
  pcVideo.setAttribute('playsinline', '');
  pcVideo.src = '/assets/videoPortfolio.mp4';
  pcVideo.play().catch(() => {});

  const pcTexture = new THREE.VideoTexture(pcVideo);
  pcTexture.colorSpace = THREE.SRGBColorSpace;
  pcTexture.flipY = false;

  const pcScreenMaterial = new THREE.MeshBasicMaterial({ map: pcTexture });
  const pcGroup = items.pcScreenModel.scene;
  pcGroup.traverse((child) => {
    if (child.isMesh) child.material = pcScreenMaterial;
  });
  scene.add(pcGroup);

  // 2. Mac Screen
  const macVideo = document.createElement('video');
  macVideo.muted = true;
  macVideo.loop = true;
  macVideo.playsInline = true;
  macVideo.autoplay = true;
  macVideo.setAttribute('muted', '');
  macVideo.setAttribute('playsinline', '');
  macVideo.src = '/assets/videoStream.mp4';
  macVideo.play().catch(() => {});

  const macTexture = new THREE.VideoTexture(macVideo);
  macTexture.colorSpace = THREE.SRGBColorSpace;
  macTexture.flipY = false;

  const macScreenMaterial = new THREE.MeshBasicMaterial({ map: macTexture });
  const macGroup = items.macScreenModel.scene;
  macGroup.traverse((child) => {
    if (child.isMesh) child.material = macScreenMaterial;
  });
  scene.add(macGroup);

  return {
    pcGroup,
    macGroup
  };
}

export function createGoogleLeds(scene, items) {
  const colors = ['#196aff', '#ff0000', '#ff5d00', '#7db81b'];
  const texture = items.googleHomeLedMaskTexture;
  const group = items.googleHomeLedsModel.scene;

  const itemsList = [];
  let idx = 0;
  group.traverse((child) => {
    if (child.isMesh) {
      const col = colors[idx % colors.length];
      const material = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        alphaMap: texture
      });
      child.material = material;
      itemsList.push({ mesh: child, material, index: idx });
      idx++;
    }
  });

  scene.add(group);

  return {
    itemsList,
    update: (elapsed) => {
      itemsList.forEach((item) => {
        item.material.opacity = Math.sin(elapsed * 0.002 - item.index * 0.5) * 0.5 + 0.5;
      });
    }
  };
}

export function createLoupedeckButtons(scene, items, bakedMaterial) {
  const group = items.loupedeckButtonsModel.scene;
  group.traverse((child) => {
    if (child.isMesh) child.material = bakedMaterial;
  });
  scene.add(group);
}

export function createElgatoLight(scene, items, bakedMaterial) {
  const group = items.elgatoLightModel.scene;
  group.traverse((child) => {
    if (child.isMesh) child.material = bakedMaterial;
  });
  scene.add(group);
}

export function createBouncingLogo(scene, items) {
  const group = new THREE.Group();
  group.position.set(4.2, 2.717, 1.63);
  scene.add(group);

  const texture = items.threejsJourneyLogoTexture;
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(4, 1);
  geometry.rotateY(-Math.PI * 0.5);

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    premultipliedAlpha: true,
    map: texture
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(1, 0.359, 0.424);
  group.add(mesh);

  const state = {
    z: 0,
    y: 0,
    speedZ: 0.00061,
    speedY: 0.00037,
    limitZ: { min: -1.076, max: 1.454 },
    limitY: { min: -1.055, max: 0.947 }
  };

  return {
    group,
    mesh,
    update: (delta) => {
      state.z += state.speedZ * delta * 1000;
      state.y += state.speedY * delta * 1000;

      if (state.z > state.limitZ.max) {
        state.z = state.limitZ.max;
        state.speedZ *= -1;
      }
      if (state.z < state.limitZ.min) {
        state.z = state.limitZ.min;
        state.speedZ *= -1;
      }
      if (state.y > state.limitY.max) {
        state.y = state.limitY.max;
        state.speedY *= -1;
      }
      if (state.y < state.limitY.min) {
        state.y = state.limitY.min;
        state.speedY *= -1;
      }

      mesh.position.z = state.z;
      mesh.position.y = state.y;
    }
  };
}
