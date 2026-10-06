import * as THREE from 'three';
import { createRoom } from './Room.js';
import { createDeskSetup } from './DeskSetup.js';
import { createPCSetup } from './PCSetup.js';
import { createFurniture } from './Furniture.js';

export function createRoomModel(soundEngine = null) {
  const group = new THREE.Group();
  group.name = 'FiveMPlayerRoom';

  const room = createRoom();
  const deskSetup = createDeskSetup(soundEngine);
  const pcSetup = createPCSetup();
  const furniture = createFurniture();

  pcSetup.group.position.set(1.15, 0.95 + 0.68 / 2, -2.7);
  group.add(room.group, deskSetup.group, pcSetup.group, furniture.group);

  return { group, room, deskSetup, pcSetup, furniture };
}
