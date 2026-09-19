import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createRoomPet } from '../src/components/RoomPet.js';

describe('RoomPet Component & State Machine', () => {
  it('should initialize pet with 3D group and valid initial state', () => {
    const scene = new THREE.Scene();
    const pet = createRoomPet(scene, null);

    expect(pet.group).toBeDefined();
    expect(pet.group.name).toBe('CyberCat');
    expect(['ROAM', 'REST_RUG', 'NAP_BED']).toContain(pet.state.mode);
    expect(typeof pet.state.x).toBe('number');
    expect(typeof pet.state.z).toBe('number');
  });

  it('should trigger purr sound and happiness state on pet()', () => {
    const scene = new THREE.Scene();
    let playedPurr = false;
    const mockSound = {
      playPurr: () => { playedPurr = true; }
    };

    const pet = createRoomPet(scene, mockSound);
    expect(pet.state.isHappy).toBe(false);

    pet.pet();
    expect(pet.state.isHappy).toBe(true);
    expect(playedPurr).toBe(true);
  });

  it('should update position toward target when in ROAM mode', () => {
    const scene = new THREE.Scene();
    const pet = createRoomPet(scene, null);

    pet.state.mode = 'ROAM';
    pet.state.x = 0;
    pet.state.z = 0;
    pet.state.targetX = 2.0;
    pet.state.targetZ = 2.0;

    const initialDist = Math.hypot(pet.state.targetX - pet.state.x, pet.state.targetZ - pet.state.z);
    pet.update(0.1);
    const newDist = Math.hypot(pet.state.targetX - pet.state.x, pet.state.targetZ - pet.state.z);

    expect(newDist).toBeLessThan(initialDist);
  });
});
