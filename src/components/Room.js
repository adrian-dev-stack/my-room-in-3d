import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createWoodMaterialTextures, createPaintMaterialTextures } from '../utils/materialTextures.js';
import { AnimatedWindow } from '../utils/animatedWindow.js';

export function createRoom() {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'RoomStructure';

  const ROOM_SIZE = 7.2;
  const WALL_HEIGHT = 4.2;
  const WALL_THICKNESS = 0.2;

  // Animated Window for weather sync
  const animatedWindow = new AnimatedWindow();

  // Authentic Materials from your photos
  const floorTextures = createWoodMaterialTextures({ planks: true, color: '#956540' });
  const tiledFloor = Object.fromEntries(Object.entries(floorTextures).map(([key, texture]) => {
    const tile = texture.clone();
    tile.repeat.set(4, 4);
    return [key, tile];
  }));
  const floorMaterial = new THREE.MeshStandardMaterial({
    ...tiledFloor,
    color: '#ffffff',
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.8,
    metalness: 0
  });
  floorMaterial.userData.pbrWood = true;

  // Authentic Light Concrete / Matte Wall Paint (Clean, continuous wall - Photo 3 & 4)
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#e4e7eb',
    ...createPaintMaterialTextures(),
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughness: 0.85,
    metalness: 0
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    ...createWoodMaterialTextures({ size: 512, color: '#503423' }),
    color: '#ffffff',
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.85,
    metalness: 0
  });

  const darkBaseMaterial = new THREE.MeshStandardMaterial({
    color: '#08090d',
    roughness: 0.9
  });

  // 1. Floor & Isometric Base Pedestal
  const floorGeo = new RoundedBoxGeometry(ROOM_SIZE, 0.2, ROOM_SIZE, 4, 0.04);
  const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
  floorMesh.name = 'WoodPlankFloor';
  floorMesh.position.y = -0.1;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Extruded dark diorama base pedestal
  const pedestalGeo = new RoundedBoxGeometry(ROOM_SIZE + 0.14, 0.38, ROOM_SIZE + 0.14, 4, 0.04);
  const pedestalMesh = new THREE.Mesh(pedestalGeo, darkBaseMaterial);
  pedestalMesh.position.y = -0.39;
  pedestalMesh.receiveShadow = false;
  roomGroup.add(pedestalMesh);

  // 2. Clean Back Wall (Z = -ROOM_SIZE/2 - Door Removed!)
  const mainBackWallGeo = new RoundedBoxGeometry(ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS, 2, 0.014);
  const mainBackWall = new THREE.Mesh(mainBackWallGeo, wallMaterial);
  mainBackWall.position.set(0, WALL_HEIGHT / 2, -ROOM_SIZE / 2 + WALL_THICKNESS / 2);
  mainBackWall.receiveShadow = true;
  mainBackWall.castShadow = true;
  roomGroup.add(mainBackWall);

  // 3. Side Wall on Right (X = ROOM_SIZE/2)
  const sideRightWallGeo = new RoundedBoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE, 2, 0.014);
  const sideRightWall = new THREE.Mesh(sideRightWallGeo, wallMaterial);
  sideRightWall.position.set(ROOM_SIZE / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0);
  sideRightWall.receiveShadow = true;
  sideRightWall.castShadow = true;
  roomGroup.add(sideRightWall);

  const skirtingBack = new THREE.Mesh(new RoundedBoxGeometry(ROOM_SIZE - 0.2, 0.14, 0.055, 2, 0.01), darkTrimMaterial);
  skirtingBack.position.set(0, 0.07, -3.36);
  skirtingBack.receiveShadow = true;
  roomGroup.add(skirtingBack);
  const skirtingRight = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.14, ROOM_SIZE - 0.2, 2, 0.01), darkTrimMaterial);
  skirtingRight.position.set(3.36, 0.07, 0);
  skirtingRight.receiveShadow = true;
  roomGroup.add(skirtingRight);

  // 4. Dark Wood Ceiling Crown Trims (Along entire top edge)
  const trimBackGeo = new RoundedBoxGeometry(ROOM_SIZE, 0.12, WALL_THICKNESS + 0.06, 2, 0.015);
  const trimBack = new THREE.Mesh(trimBackGeo, darkTrimMaterial);
  trimBack.position.set(0, WALL_HEIGHT - 0.06, -ROOM_SIZE / 2 + WALL_THICKNESS / 2);
  trimBack.castShadow = true;
  roomGroup.add(trimBack);

  const trimRightGeo = new RoundedBoxGeometry(WALL_THICKNESS + 0.06, 0.12, ROOM_SIZE, 2, 0.015);
  const trimRight = new THREE.Mesh(trimRightGeo, darkTrimMaterial);
  trimRight.position.set(ROOM_SIZE / 2 - WALL_THICKNESS / 2, WALL_HEIGHT - 0.06, 0);
  trimRight.castShadow = true;
  roomGroup.add(trimRight);

  // 5. Surface-Mounted Blue Ethernet / Power Cables & Dual Outlets (Photo 3)
  const cableGroup = new THREE.Group();
  const cableMaterial = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.35 });
  const socketMaterial = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 });

  // Switch box on left
  const socketGeo = new RoundedBoxGeometry(0.16, 0.2, 0.04, 4, 0.01);
  const socket1 = new THREE.Mesh(socketGeo, socketMaterial);
  socket1.position.set(-0.8, 1.85, -ROOM_SIZE / 2 + 0.12);
  socket1.castShadow = true;
  cableGroup.add(socket1);

  // Double outlet box in center
  const socket2Geo = new RoundedBoxGeometry(0.24, 0.18, 0.04, 4, 0.01);
  const socket2 = new THREE.Mesh(socket2Geo, socketMaterial);
  socket2.position.set(0.4, 1.85, -ROOM_SIZE / 2 + 0.12);
  socket2.castShadow = true;
  cableGroup.add(socket2);

  // Vertical blue cable from ceiling down to switch
  const cableCurve1 = new THREE.LineCurve3(
    new THREE.Vector3(-0.8, WALL_HEIGHT - 0.2, -ROOM_SIZE / 2 + 0.12),
    new THREE.Vector3(-0.8, 1.85, -ROOM_SIZE / 2 + 0.12)
  );
  const cableTube1 = new THREE.TubeGeometry(cableCurve1, 10, 0.008, 8, false);
  const cableMesh1 = new THREE.Mesh(cableTube1, cableMaterial);
  cableGroup.add(cableMesh1);

  // Horizontal blue cable between boxes and toward PC
  const cableCurve2 = new THREE.LineCurve3(
    new THREE.Vector3(-0.8, 1.85, -ROOM_SIZE / 2 + 0.12),
    new THREE.Vector3(1.15, 1.85, -ROOM_SIZE / 2 + 0.12)
  );
  const cableTube2 = new THREE.TubeGeometry(cableCurve2, 20, 0.008, 8, false);
  const cableMesh2 = new THREE.Mesh(cableTube2, cableMaterial);
  cableGroup.add(cableMesh2);

  roomGroup.add(cableGroup);

  // 6. Authentic Zebra Blinds Window (In Corner Above Bed - Photo 1)
  const windowGroup = new THREE.Group();
  windowGroup.name = 'ZebraBlindsWindow';

  const frameMaterial = new THREE.MeshStandardMaterial({ color: '#161920', roughness: 0.3, metalness: 0.7 });
  for (const x of [-0.78, 0.78]) {
    const frameSide = new THREE.Mesh(new RoundedBoxGeometry(0.09, 2.1, 0.1, 2, 0.015), frameMaterial);
    frameSide.position.x = x;
    frameSide.castShadow = true;
    windowGroup.add(frameSide);
  }
  for (const y of [-1, 1]) {
    const frameEdge = new THREE.Mesh(new RoundedBoxGeometry(1.65, 0.09, 0.1, 2, 0.015), frameMaterial);
    frameEdge.position.y = y;
    frameEdge.castShadow = true;
    windowGroup.add(frameEdge);
  }

  const blindsMaterial = new THREE.MeshStandardMaterial({
    map: animatedWindow.texture,
    roughness: 0.7,
    metalness: 0.05
  });
  const blindsGeo = new RoundedBoxGeometry(1.42, 1.85, 0.04, 2, 0.01);
  const blindsMesh = new THREE.Mesh(blindsGeo, blindsMaterial);
  blindsMesh.position.set(0, -0.04, 0.04);
  windowGroup.add(blindsMesh);

  const valanceGeo = new RoundedBoxGeometry(1.52, 0.18, 0.14, 4, 0.015);
  const valance = new THREE.Mesh(valanceGeo, frameMaterial);
  valance.position.set(0, 0.95, 0.06);
  valance.castShadow = true;
  windowGroup.add(valance);

  const blindRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.4, 16), frameMaterial);
  blindRoller.rotation.z = Math.PI / 2;
  blindRoller.position.set(0, 0.87, 0.07);
  windowGroup.add(blindRoller);

  windowGroup.position.set(-2.0, 2.3, 3.5);
  windowGroup.rotation.y = Math.PI;
  roomGroup.add(windowGroup);

  return {
    group: roomGroup,
    animatedWindow,
    floorMaterial,
    wallMaterial,
    floorMesh
  };
}
