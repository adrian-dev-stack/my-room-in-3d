import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  createWoodFloorTexture,
  createWoodFloorBumpMap,
  createZebraBlindsTexture
} from '../utils/textures.js';

export function createRoom() {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'RoomStructure';

  const ROOM_SIZE = 7.2;
  const WALL_HEIGHT = 4.2;
  const WALL_THICKNESS = 0.2;

  // Authentic Materials from your photos
  const woodFloorTexture = createWoodFloorTexture();
  const woodFloorBump = createWoodFloorBumpMap();
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: woodFloorTexture,
    bumpMap: woodFloorBump,
    bumpScale: 0.015,
    roughness: 0.4,
    metalness: 0.05
  });

  // Authentic Light Concrete / Matte Wall Paint (Clean, continuous wall - Photo 3 & 4)
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#e4e7eb',
    roughness: 0.85,
    metalness: 0.02
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: '#2b1a0e',
    roughness: 0.5,
    metalness: 0.08
  });

  const darkBaseMaterial = new THREE.MeshStandardMaterial({
    color: '#08090d',
    roughness: 0.9
  });

  // 1. Floor & Isometric Base Pedestal
  const floorGeo = new RoundedBoxGeometry(ROOM_SIZE, 0.2, ROOM_SIZE, 4, 0.04);
  const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
  floorMesh.position.y = -0.1;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Extruded dark diorama base pedestal
  const pedestalGeo = new RoundedBoxGeometry(ROOM_SIZE + 0.14, 1.3, ROOM_SIZE + 0.14, 4, 0.06);
  const pedestalMesh = new THREE.Mesh(pedestalGeo, darkBaseMaterial);
  pedestalMesh.position.y = -0.75;
  pedestalMesh.receiveShadow = false;
  roomGroup.add(pedestalMesh);

  // 2. Clean Back Wall (Z = -ROOM_SIZE/2 - Door Removed!)
  const mainBackWallGeo = new THREE.BoxGeometry(ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS);
  const mainBackWall = new THREE.Mesh(mainBackWallGeo, wallMaterial);
  mainBackWall.position.set(0, WALL_HEIGHT / 2, -ROOM_SIZE / 2 + WALL_THICKNESS / 2);
  mainBackWall.receiveShadow = true;
  mainBackWall.castShadow = true;
  roomGroup.add(mainBackWall);

  // 3. Side Wall on Right (X = ROOM_SIZE/2)
  const sideRightWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE);
  const sideRightWall = new THREE.Mesh(sideRightWallGeo, wallMaterial);
  sideRightWall.position.set(ROOM_SIZE / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0);
  sideRightWall.receiveShadow = true;
  sideRightWall.castShadow = true;
  roomGroup.add(sideRightWall);

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
  const frameOuterGeo = new RoundedBoxGeometry(1.65, 2.1, 0.1, 4, 0.02);
  const frameOuter = new THREE.Mesh(frameOuterGeo, frameMaterial);
  frameOuter.castShadow = true;
  windowGroup.add(frameOuter);

  const zebraTexture = createZebraBlindsTexture();
  const blindsMaterial = new THREE.MeshStandardMaterial({
    map: zebraTexture,
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

  windowGroup.position.set(-2.0, 2.3, 3.5);
  windowGroup.rotation.y = Math.PI;
  roomGroup.add(windowGroup);

  return roomGroup;
}
