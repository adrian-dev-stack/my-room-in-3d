import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  createCheckeredPillowTexture,
  createLogitechBoxTexture,
  createSofaPatternTexture
} from '../utils/textures.js';
import { soundEngine } from '../utils/soundEngine.js';

export function createFurniture() {
  const furnitureGroup = new THREE.Group();
  furnitureGroup.name = 'RoomFurniture';

  // Authentic Materials from your photos
  const blackSheetMat = new THREE.MeshStandardMaterial({
    color: '#16181f', // Black bed sheets (photo 1)
    roughness: 0.85,
    metalness: 0.02
  });

  const blanketMat = new THREE.MeshStandardMaterial({
    color: '#2b313e',
    roughness: 0.9
  });

  const bedWoodMat = new THREE.MeshStandardMaterial({
    color: '#7a421d',
    roughness: 0.45,
    metalness: 0.08
  });

  const whiteFurnitureMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.28,
    metalness: 0.05
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: '#12141a',
    roughness: 0.3,
    metalness: 0.85
  });

  // Damask patterned fabric sofa (photo 4)
  const sofaPattern = createSofaPatternTexture();
  const darkSofaMat = new THREE.MeshStandardMaterial({
    map: sofaPattern,
    roughness: 0.92
  });

  // 1. Bed (Corner near window, facing sofa bed bench - Photo 1 & 4)
  const bedGroup = new THREE.Group();
  bedGroup.name = 'Bed';

  const BED_W = 1.6;
  const BED_L = 2.6;

  // Bed wooden platform
  const bedBaseGeo = new RoundedBoxGeometry(BED_W, 0.28, BED_L, 4, 0.03);
  const bedBase = new THREE.Mesh(bedBaseGeo, bedWoodMat);
  bedBase.position.y = 0.14;
  bedBase.castShadow = true;
  bedBase.receiveShadow = true;
  bedGroup.add(bedBase);

  // Soft Mattress
  const mattressGeo = new RoundedBoxGeometry(BED_W - 0.06, 0.36, BED_L - 0.06, 4, 0.04);
  const mattress = new THREE.Mesh(mattressGeo, blackSheetMat);
  mattress.position.y = 0.44;
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  // Folded 3D Duvet / Blanket across foot of bed
  const blanketGeo = new RoundedBoxGeometry(BED_W - 0.04, 0.06, 1.1, 4, 0.02);
  const blanket = new THREE.Mesh(blanketGeo, blanketMat);
  blanket.position.set(0, 0.63, -0.7);
  blanket.castShadow = true;
  bedGroup.add(blanket);

  // Gingham Checkered Pillow (Photo 1)
  const plaidTex = createCheckeredPillowTexture();
  const plaidPillowMat = new THREE.MeshStandardMaterial({ map: plaidTex, roughness: 0.75 });
  const pillowGeo = new RoundedBoxGeometry(0.66, 0.18, 0.46, 4, 0.06);

  const pillow1 = new THREE.Mesh(pillowGeo, plaidPillowMat);
  pillow1.position.set(-0.35, 0.68, 0.95);
  pillow1.rotation.x = 0.2;
  pillow1.castShadow = true;
  bedGroup.add(pillow1);

  // Secondary Pillow
  const pastelPillowMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.75 });
  const pillow2 = new THREE.Mesh(pillowGeo, pastelPillowMat);
  pillow2.position.set(0.35, 0.68, 0.95);
  pillow2.rotation.x = 0.2;
  pillow2.castShadow = true;
  bedGroup.add(pillow2);

  bedGroup.rotation.y = -Math.PI / 2;
  bedGroup.position.set(-1.6, 0, 2.3);
  furnitureGroup.add(bedGroup);

  // 2. White 4-Drawer Cabinet (holds PC Rig - Photo 3)
  const cabinetGroup = new THREE.Group();
  cabinetGroup.name = 'SideCabinet';

  const CAB_W = 1.05;
  const CAB_H = 0.95;
  const CAB_D = 1.0;

  const cabBodyGeo = new RoundedBoxGeometry(CAB_W, CAB_H, CAB_D, 4, 0.025);
  const cabBody = new THREE.Mesh(cabBodyGeo, whiteFurnitureMat);
  cabBody.position.y = CAB_H / 2;
  cabBody.castShadow = true;
  cabBody.receiveShadow = true;
  cabinetGroup.add(cabBody);

  // 4 Horizontal Drawer panels matching photo 3
  for (let d = 0; d < 4; d++) {
    const drawerPanelGeo = new RoundedBoxGeometry(CAB_W - 0.04, 0.2, 0.02, 2, 0.006);
    const drawerPanel = new THREE.Mesh(drawerPanelGeo, whiteFurnitureMat);
    drawerPanel.position.set(0, 0.13 + d * 0.23, CAB_D / 2 + 0.01);
    drawerPanel.castShadow = true;
    cabinetGroup.add(drawerPanel);

    // Minimalist groove shadow
    const grooveGeo = new THREE.BoxGeometry(CAB_W - 0.06, 0.008, 0.025);
    const groove = new THREE.Mesh(grooveGeo, blackMetalMat);
    groove.position.set(0, 0.23 + d * 0.23, CAB_D / 2 + 0.015);
    cabinetGroup.add(groove);
  }

  cabinetGroup.position.set(1.15, 0, -2.7);
  furnitureGroup.add(cabinetGroup);

  // 3. 3-Tier Floating Wall Shelves with Logitech Boxes (Photo 4)
  const shelvesGroup = new THREE.Group();
  shelvesGroup.name = 'WallShelves';

  const g304Tex = createLogitechBoxTexture('G304', 'LIGHTSPEED');
  const g435Tex = createLogitechBoxTexture('G435', 'WIRELESS');
  const g304Mat = new THREE.MeshStandardMaterial({ map: g304Tex });
  const g435Mat = new THREE.MeshStandardMaterial({ map: g435Tex });

  const shelfGeo = new RoundedBoxGeometry(0.86, 0.035, 0.28, 4, 0.008);

  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Mesh(shelfGeo, blackMetalMat);
    shelf.position.set(0, s * 0.45, 0);
    shelf.castShadow = true;
    shelvesGroup.add(shelf);

    // Wall brackets
    const bracketGeo = new RoundedBoxGeometry(0.02, 0.12, 0.24, 2, 0.004);
    const b1 = new THREE.Mesh(bracketGeo, blackMetalMat);
    b1.position.set(-0.32, s * 0.45 - 0.06, -0.01);
    shelvesGroup.add(b1);

    const b2 = new THREE.Mesh(bracketGeo, blackMetalMat);
    b2.position.set(0.32, s * 0.45 - 0.06, -0.01);
    shelvesGroup.add(b2);
  }

  // Top Shelf: Logitech G304 & G435 packaging boxes (Photo 4)
  const box1Geo = new RoundedBoxGeometry(0.18, 0.24, 0.12, 4, 0.008);
  const box1 = new THREE.Mesh(box1Geo, g304Mat);
  box1.position.set(-0.2, 0.45 * 2 + 0.13, -0.02);
  box1.castShadow = true;
  shelvesGroup.add(box1);

  const box2Geo = new RoundedBoxGeometry(0.2, 0.26, 0.14, 4, 0.008);
  const box2 = new THREE.Mesh(box2Geo, g435Mat);
  box2.position.set(0.18, 0.45 * 2 + 0.14, -0.02);
  box2.castShadow = true;
  shelvesGroup.add(box2);

  shelvesGroup.position.set(3.3, 2.2, -0.5);
  shelvesGroup.rotation.y = -Math.PI / 2;
  furnitureGroup.add(shelvesGroup);

  // 4. Low Patterned Sofa Bed Couch (Underneath Shelves - Photo 4)
  const sofaGroup = new THREE.Group();
  sofaGroup.name = 'RoomSofa';

  const sofaBaseGeo = new RoundedBoxGeometry(1.65, 0.35, 0.8, 4, 0.03);
  const sofaBase = new THREE.Mesh(sofaBaseGeo, darkSofaMat);
  sofaBase.position.y = 0.175;
  sofaBase.castShadow = true;
  sofaBase.receiveShadow = true;
  sofaGroup.add(sofaBase);

  // Dual Cushions
  const cushionGeo = new RoundedBoxGeometry(0.76, 0.16, 0.72, 4, 0.04);
  const c1 = new THREE.Mesh(cushionGeo, darkSofaMat);
  c1.position.set(-0.39, 0.42, 0.02);
  c1.castShadow = true;
  sofaGroup.add(c1);

  const c2 = new THREE.Mesh(cushionGeo, darkSofaMat);
  c2.position.set(0.39, 0.42, 0.02);
  c2.castShadow = true;
  sofaGroup.add(c2);

  // Backrest
  const backrestGeo = new RoundedBoxGeometry(1.65, 0.46, 0.22, 4, 0.04);
  const backrest = new THREE.Mesh(backrestGeo, darkSofaMat);
  backrest.position.set(0, 0.65, -0.28);
  backrest.castShadow = true;
  sofaGroup.add(backrest);

  sofaGroup.position.set(2.7, 0, -0.5);
  sofaGroup.rotation.y = -Math.PI / 2;
  furnitureGroup.add(sofaGroup);

  // 5. Standing Pedestal Fan (Near bed foot area - Photo 2)
  const fanGroup = new THREE.Group();
  fanGroup.name = 'StandingFan';

  const baseGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.06, 24);
  const fanBase = new THREE.Mesh(baseGeo, blackMetalMat);
  fanBase.position.y = 0.03;
  fanBase.castShadow = true;
  fanGroup.add(fanBase);

  const poleGeo = new THREE.CylinderGeometry(0.026, 0.026, 1.4, 16);
  const fanPole = new THREE.Mesh(poleGeo, blackMetalMat);
  fanPole.position.y = 0.73;
  fanPole.castShadow = true;
  fanGroup.add(fanPole);

  const motorGeo = new RoundedBoxGeometry(0.16, 0.16, 0.22, 4, 0.03);
  const fanMotor = new THREE.Mesh(motorGeo, blackMetalMat);
  fanMotor.position.set(0, 1.42, -0.02);
  fanMotor.castShadow = true;
  fanGroup.add(fanMotor);

  const cageRingGeo = new THREE.TorusGeometry(0.34, 0.014, 12, 32);
  const fanCageFront = new THREE.Mesh(cageRingGeo, blackMetalMat);
  fanCageFront.position.set(0, 1.42, 0.14);
  fanGroup.add(fanCageFront);

  const fanCageBack = new THREE.Mesh(cageRingGeo, blackMetalMat);
  fanCageBack.position.set(0, 1.42, 0.06);
  fanGroup.add(fanCageBack);

  const bladesGroup = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#384152',
    roughness: 0.25,
    transparent: true,
    opacity: 0.88
  });

  for (let b = 0; b < 3; b++) {
    const bladeGeo = new RoundedBoxGeometry(0.08, 0.28, 0.01, 2, 0.003);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.14;
    blade.rotation.z = (b * Math.PI * 2) / 3;
    blade.rotation.x = 0.15;
    bladesGroup.add(blade);
  }
  bladesGroup.position.set(0, 1.42, 0.1);
  fanGroup.add(bladesGroup);

  fanGroup.position.set(0.2, 0, 1.2);
  fanGroup.rotation.y = -0.6;
  furnitureGroup.add(fanGroup);

  // 6. Compact Floor Air Appliance (Photo 2)
  const airUnitGeo = new RoundedBoxGeometry(0.28, 0.44, 0.28, 4, 0.03);
  const airUnit = new THREE.Mesh(airUnitGeo, whiteFurnitureMat);
  airUnit.position.set(0.1, 0.22, 2.2);
  airUnit.castShadow = true;
  furnitureGroup.add(airUnit);

  // 7. White Desk Chair (Facing Workstation - Photo 3 & 4)
  const chairGroup = new THREE.Group();
  chairGroup.name = 'DeskChair';

  const seatGeo = new RoundedBoxGeometry(0.56, 0.09, 0.54, 4, 0.03);
  const seat = new THREE.Mesh(seatGeo, whiteFurnitureMat);
  seat.position.y = 0.52;
  seat.castShadow = true;
  chairGroup.add(seat);

  const chairBackGeo = new RoundedBoxGeometry(0.52, 0.6, 0.06, 4, 0.03);
  const chairBack = new THREE.Mesh(chairBackGeo, whiteFurnitureMat);
  chairBack.position.set(0, 0.84, 0.24);
  chairBack.rotation.x = 0.1;
  chairBack.castShadow = true;
  chairGroup.add(chairBack);

  const chairPoleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.48, 16);
  const chairPole = new THREE.Mesh(chairPoleGeo, blackMetalMat);
  chairPole.position.y = 0.24;
  chairGroup.add(chairPole);

  const baseLegGeo = new RoundedBoxGeometry(0.56, 0.032, 0.05, 2, 0.008);
  for (let l = 0; l < 5; l++) {
    const angle = (l * Math.PI * 2) / 5;
    const baseLeg = new THREE.Mesh(baseLegGeo, blackMetalMat);
    baseLeg.rotation.y = angle;
    baseLeg.position.y = 0.045;
    chairGroup.add(baseLeg);

    const wheelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12);
    const wheel = new THREE.Mesh(wheelGeo, blackMetalMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.sin(angle) * 0.26, 0.02, Math.cos(angle) * 0.26);
    chairGroup.add(wheel);
  }

  chairGroup.position.set(-0.6, 0, -1.6);
  furnitureGroup.add(chairGroup);

  let fanRunning = true;
  let fanSpeed = 1.0;

  return {
    group: furnitureGroup,
    getFanRunning: () => fanRunning,
    toggleFan: () => {
      fanRunning = !fanRunning;
      return fanRunning;
    },
    setFanSpeed: (val) => {
      fanSpeed = val;
      if (fanRunning) {
        soundEngine.setFanState(true, fanSpeed);
      }
    },
    update: (delta) => {
      if (fanRunning) {
        bladesGroup.rotation.z += delta * 20 * fanSpeed;
      }
    }
  };
}
