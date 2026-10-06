import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  createCheckeredPillowTexture,
  createLogitechBoxTexture,
  createSofaPatternTexture
} from '../utils/textures.js';
import {
  createFabricMaterialTextures,
  createPaintMaterialTextures,
  createWoodMaterialTextures
} from '../utils/materialTextures.js';
import { soundEngine } from '../utils/soundEngine.js';

function createClothGeometry(width, depth, surface, thickness = 0.008, columns = 32, rows = 24) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const layerSize = (columns + 1) * (rows + 1);

  for (let layer = 0; layer < 2; layer++) {
    for (let row = 0; row <= rows; row++) {
      for (let column = 0; column <= columns; column++) {
        const u = column / columns * 2 - 1;
        const v = row / rows * 2 - 1;
        const point = surface(u, v, layer);
        positions.push(point.x * width / 2, point.y - layer * thickness, point.z * depth / 2);
        uvs.push(column / columns, row / rows);
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
      indices.push(a + layerSize, b + layerSize, c + layerSize,
        b + layerSize, d + layerSize, c + layerSize);
    }
  }

  const perimeter = [];
  for (let column = 0; column <= columns; column++) perimeter.push(column);
  for (let row = 1; row <= rows; row++) perimeter.push(row * (columns + 1) + columns);
  for (let column = columns - 1; column >= 0; column--) perimeter.push(rows * (columns + 1) + column);
  for (let row = rows - 1; row > 0; row--) perimeter.push(row * (columns + 1));
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i];
    const b = perimeter[(i + 1) % perimeter.length];
    indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function cushionPoint(u, v, height, layer, irregularity = 1) {
  const edge = Math.max(0, (1 - u ** 4) * (1 - v ** 4));
  const fullness = height / 2 * (0.1 + 0.9 * Math.sqrt(edge));
  const crease = 0.006 * irregularity * Math.sin(u * 17 + v * 5) * Math.exp(-(((Math.abs(v) - 0.78) / 0.16) ** 2)) * edge;
  return {
    x: u * Math.sqrt(1 - v * v * 0.11),
    y: (layer === 0 ? 1 : -1) * fullness + crease,
    z: v * Math.sqrt(1 - u * u * 0.11)
  };
}

function createCushionGeometry(width, height, depth, irregularity = 1) {
  return createClothGeometry(width, depth,
    (u, v, layer) => cushionPoint(u, v, height, layer, irregularity), 0, 28, 22);
}

function createCushionPiping(width, depth, material) {
  const points = [];
  const addPoint = (u, v) => {
    const point = cushionPoint(u, v, 0, 0, 0);
    points.push(new THREE.Vector3(point.x * width / 2, 0, point.z * depth / 2));
  };
  for (let i = 0; i < 24; i++) addPoint(-1 + i / 12, -1);
  for (let i = 0; i < 24; i++) addPoint(1, -1 + i / 12);
  for (let i = 0; i < 24; i++) addPoint(1 - i / 12, 1);
  for (let i = 0; i < 24; i++) addPoint(-1, 1 - i / 12);
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.0022, 5, true), material);
}

function createMattressPiping(width, depth, material) {
  const points = [];
  const radius = 0.045;
  for (let corner = 0; corner < 4; corner++) {
    const centerX = corner === 0 || corner === 3 ? width / 2 - radius : -width / 2 + radius;
    const centerZ = corner < 2 ? depth / 2 - radius : -depth / 2 + radius;
    for (let step = 0; step <= 12; step++) {
      const angle = corner * Math.PI / 2 + step / 12 * Math.PI / 2;
      points.push(new THREE.Vector3(centerX + Math.cos(angle) * radius, 0, centerZ + Math.sin(angle) * radius));
    }
  }
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 112, 0.0025, 5, true), material);
}

export function createFurniture() {
  const furnitureGroup = new THREE.Group();
  furnitureGroup.name = 'RoomFurniture';

  const sheetTextures = createFabricMaterialTextures({ color: '#16181f' });
  const blanketTextures = createFabricMaterialTextures({ color: '#2b313e' });
  const pillowTextures = createFabricMaterialTextures({ color: '#cbd5e1' });
  const sofaTextures = createFabricMaterialTextures({ color: '#232730' });
  const paintTextures = createPaintMaterialTextures();

  const blackSheetMat = new THREE.MeshStandardMaterial({
    ...sheetTextures,
    normalScale: new THREE.Vector2(0.24, 0.24),
    roughness: 0.92
  });

  const blanketMat = new THREE.MeshStandardMaterial({
    ...blanketTextures,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughness: 0.96
  });

  const bedWoodMat = new THREE.MeshStandardMaterial({
    ...createWoodMaterialTextures({ color: '#7a421d' }),
    normalScale: new THREE.Vector2(0.16, 0.16),
    roughness: 0.52
  });

  const whiteFurnitureMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    ...paintTextures,
    normalScale: new THREE.Vector2(0.12, 0.12),
    roughness: 0.36,
    metalness: 0.02
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: '#12141a',
    roughness: 0.3,
    metalness: 0.85
  });

  // Damask patterned fabric sofa (photo 4)
  const sofaPattern = createSofaPatternTexture();
  sofaPattern.colorSpace = THREE.SRGBColorSpace;
  const darkSofaMat = new THREE.MeshStandardMaterial({
    map: sofaPattern,
    normalMap: sofaTextures.normalMap,
    roughnessMap: sofaTextures.roughnessMap,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughness: 0.92
  });
  const sofaSeamMat = new THREE.MeshStandardMaterial({ color: '#292d36', roughness: 0.96 });

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

  const mattressSeamMat = new THREE.MeshStandardMaterial({ color: '#2a2d36', roughness: 0.96 });
  const mattressPiping = createMattressPiping(BED_W - 0.06, BED_L - 0.06, mattressSeamMat);
  mattressPiping.position.y = 0.565;
  bedGroup.add(mattressPiping);

  // Cloth hangs over the mattress edges, with broad folds and a rolled upper hem.
  const blanketGeo = createClothGeometry(1.72, 1.12, (u, v) => {
    const edgeDrop = Math.max(0, (Math.abs(u) - 0.82) / 0.18);
    const folds = 0.016 * Math.sin(u * 13 + v * 2) * (0.5 + 0.5 * Math.cos(v * 2));
    const diagonalFold = 0.022 * Math.exp(-(((u - v * 0.35 + 0.17) / 0.16) ** 2));
    const upperHem = 0.018 * Math.exp(-(((v - 0.93) / 0.07) ** 2));
    return { x: u, y: 0.017 + folds + diagonalFold + upperHem - 0.13 * edgeDrop ** 2, z: v };
  }, 0.008, 44, 28);
  const blanket = new THREE.Mesh(blanketGeo, blanketMat);
  blanket.position.set(0, 0.63, -0.7);
  blanket.castShadow = true;
  blanket.receiveShadow = true;
  bedGroup.add(blanket);

  // Gingham Checkered Pillow (Photo 1)
  const plaidTex = createCheckeredPillowTexture();
  plaidTex.colorSpace = THREE.SRGBColorSpace;
  const plaidPillowMat = new THREE.MeshStandardMaterial({
    map: plaidTex,
    normalMap: pillowTextures.normalMap,
    roughnessMap: pillowTextures.roughnessMap,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.92
  });
  const pillowGeo = createCushionGeometry(0.66, 0.18, 0.46);
  const pillowSeamMat = new THREE.MeshStandardMaterial({ color: '#adb4bc', roughness: 0.94 });

  const pillow1 = new THREE.Mesh(pillowGeo, plaidPillowMat);
  pillow1.position.set(-0.35, 0.68, 0.95);
  pillow1.rotation.x = 0.2;
  pillow1.castShadow = true;
  pillow1.receiveShadow = true;
  pillow1.add(createCushionPiping(0.66, 0.46, pillowSeamMat));
  bedGroup.add(pillow1);

  // Secondary Pillow
  const pastelPillowMat = new THREE.MeshStandardMaterial({
    ...pillowTextures,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.92
  });
  const pillow2 = new THREE.Mesh(pillowGeo, pastelPillowMat);
  pillow2.position.set(0.35, 0.68, 0.95);
  pillow2.rotation.x = 0.2;
  pillow2.castShadow = true;
  pillow2.receiveShadow = true;
  pillow2.add(createCushionPiping(0.66, 0.46, pillowSeamMat));
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

  const drawerGapMat = new THREE.MeshStandardMaterial({ color: '#575b61', roughness: 0.82 });
  const drawerPullMat = new THREE.MeshStandardMaterial({ color: '#d1d4d6', roughness: 0.34, metalness: 0.68 });
  const pullGeo = new RoundedBoxGeometry(0.22, 0.018, 0.025, 2, 0.006);

  // 4 Horizontal Drawer panels matching photo 3
  for (let d = 0; d < 4; d++) {
    const drawerPanelGeo = new RoundedBoxGeometry(CAB_W - 0.04, 0.2, 0.02, 2, 0.006);
    const drawerPanel = new THREE.Mesh(drawerPanelGeo, whiteFurnitureMat);
    drawerPanel.position.set(0, 0.13 + d * 0.23, CAB_D / 2 + 0.01);
    drawerPanel.castShadow = true;
    cabinetGroup.add(drawerPanel);

    // Minimalist groove shadow
    const grooveGeo = new THREE.BoxGeometry(CAB_W - 0.06, 0.008, 0.025);
    const groove = new THREE.Mesh(grooveGeo, drawerGapMat);
    groove.position.set(0, 0.23 + d * 0.23, CAB_D / 2 + 0.015);
    cabinetGroup.add(groove);

    const pull = new THREE.Mesh(pullGeo, drawerPullMat);
    pull.position.set(0, 0.175 + d * 0.23, CAB_D / 2 + 0.04);
    pull.castShadow = true;
    cabinetGroup.add(pull);
  }

  cabinetGroup.position.set(1.15, 0, -2.7);
  furnitureGroup.add(cabinetGroup);

  // 3. 3-Tier Floating Wall Shelves with Logitech Boxes (Photo 4)
  const shelvesGroup = new THREE.Group();
  shelvesGroup.name = 'WallShelves';

  const g304Tex = createLogitechBoxTexture('G304', 'LIGHTSPEED');
  const g435Tex = createLogitechBoxTexture('G435', 'WIRELESS');
  g304Tex.colorSpace = THREE.SRGBColorSpace;
  g435Tex.colorSpace = THREE.SRGBColorSpace;
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
  const cushionGeo = createCushionGeometry(0.76, 0.16, 0.72, 0.6);
  const c1 = new THREE.Mesh(cushionGeo, darkSofaMat);
  c1.position.set(-0.39, 0.42, 0.02);
  c1.castShadow = true;
  c1.receiveShadow = true;
  c1.add(createCushionPiping(0.76, 0.72, sofaSeamMat));
  sofaGroup.add(c1);

  const c2 = new THREE.Mesh(cushionGeo, darkSofaMat);
  c2.position.set(0.39, 0.42, 0.02);
  c2.castShadow = true;
  c2.receiveShadow = true;
  c2.add(createCushionPiping(0.76, 0.72, sofaSeamMat));
  sofaGroup.add(c2);

  // Backrest
  const backrestGeo = createCushionGeometry(1.65, 0.22, 0.46, 0.3);
  const backrest = new THREE.Mesh(backrestGeo, darkSofaMat);
  backrest.position.set(0, 0.65, -0.28);
  backrest.rotation.x = Math.PI / 2;
  backrest.castShadow = true;
  backrest.receiveShadow = true;
  backrest.add(createCushionPiping(1.65, 0.46, sofaSeamMat));
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

  for (let wire = 0; wire < 24; wire++) {
    const angle = wire / 24 * Math.PI * 2;
    const points = [
      new THREE.Vector3(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, 0.192),
      new THREE.Vector3(Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, 0.184),
      new THREE.Vector3(Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0.14)
    ];
    const guardWire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 8, 0.002, 4, false), blackMetalMat);
    guardWire.position.y = 1.42;
    fanGroup.add(guardWire);
  }
  for (const radius of [0.14, 0.25]) {
    const guardRing = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.002, 5, 48), blackMetalMat);
    guardRing.position.set(0, 1.42, radius === 0.14 ? 0.188 : 0.172);
    fanGroup.add(guardRing);
  }
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.025, 24), blackMetalMat);
  fanHub.rotation.x = Math.PI / 2;
  fanHub.position.set(0, 1.42, 0.194);
  fanGroup.add(fanHub);

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

  const chairUpholsteryMat = new THREE.MeshStandardMaterial({
    ...createFabricMaterialTextures({ color: '#e7e8e6' }),
    normalScale: new THREE.Vector2(0.2, 0.2),
    roughness: 0.88
  });
  const chairSeamMat = new THREE.MeshStandardMaterial({ color: '#c9cdcc', roughness: 0.9 });
  const seatGeo = createCushionGeometry(0.56, 0.105, 0.54, 0.25);
  const seat = new THREE.Mesh(seatGeo, chairUpholsteryMat);
  seat.position.y = 0.52;
  seat.castShadow = true;
  seat.receiveShadow = true;
  seat.add(createCushionPiping(0.56, 0.54, chairSeamMat));
  chairGroup.add(seat);

  const seatShell = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.04, 0.51, 3, 0.017), whiteFurnitureMat);
  seatShell.position.y = 0.486;
  seatShell.castShadow = true;
  chairGroup.add(seatShell);

  const chairBackGeo = new RoundedBoxGeometry(0.52, 0.6, 0.06, 4, 0.03);
  const chairBack = new THREE.Mesh(chairBackGeo, whiteFurnitureMat);
  chairBack.position.set(0, 0.84, 0.24);
  chairBack.rotation.x = 0.1;
  chairBack.castShadow = true;
  chairGroup.add(chairBack);

  const backPad = new THREE.Mesh(createCushionGeometry(0.46, 0.068, 0.53, 0.15), chairUpholsteryMat);
  backPad.position.set(0, 0.84, 0.207);
  backPad.rotation.x = Math.PI / 2 + 0.1;
  backPad.castShadow = true;
  backPad.receiveShadow = true;
  backPad.add(createCushionPiping(0.46, 0.53, chairSeamMat));
  chairGroup.add(backPad);

  const backSupport = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.32, 0.045, 2, 0.01), blackMetalMat);
  backSupport.position.set(0, 0.56, 0.255);
  backSupport.rotation.x = -0.18;
  backSupport.castShadow = true;
  chairGroup.add(backSupport);

  const chairPoleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.48, 16);
  const chairPole = new THREE.Mesh(chairPoleGeo, blackMetalMat);
  chairPole.position.y = 0.24;
  chairGroup.add(chairPole);

  const baseLegGeo = new RoundedBoxGeometry(0.046, 0.038, 0.28, 2, 0.009);
  const wheelGeo = new THREE.CylinderGeometry(0.031, 0.031, 0.018, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#25272c', roughness: 0.84 });
  for (let l = 0; l < 5; l++) {
    const angle = (l * Math.PI * 2) / 5;
    const baseLeg = new THREE.Mesh(baseLegGeo, blackMetalMat);
    baseLeg.rotation.y = angle;
    baseLeg.position.set(Math.sin(angle) * 0.14, 0.075, Math.cos(angle) * 0.14);
    baseLeg.castShadow = true;
    chairGroup.add(baseLeg);

    const caster = new THREE.Group();
    caster.position.set(Math.sin(angle) * 0.275, 0.032, Math.cos(angle) * 0.275);
    caster.rotation.y = angle;
    for (const offset of [-0.014, 0.014]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.x = offset;
      wheel.castShadow = true;
      caster.add(wheel);
    }
    chairGroup.add(caster);
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
