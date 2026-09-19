import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createRCCar } from '../src/components/RCCar.js';

describe('RCCar Component & Physics Engine', () => {
  it('should initialize RC Car with correct defaults and components', () => {
    const scene = new THREE.Scene();
    const mockSound = {
      setEngineSound: () => {},
      playTireSkid: () => {},
      playCarHorn: () => {}
    };

    const rcCar = createRCCar(scene, mockSound);

    expect(rcCar.group).toBeDefined();
    expect(rcCar.group.name).toBe('RCCar');
    expect(rcCar.rampGroup).toBeDefined();
    expect(rcCar.state.active).toBe(false);
    expect(rcCar.state.velocity).toBe(0);
    expect(rcCar.state.maxSpeed).toBeGreaterThan(3.0);
  });

  it('should detect collisions against room outer boundary limits', () => {
    const scene = new THREE.Scene();
    const rcCar = createRCCar(scene, {});

    // Inside valid room area
    expect(rcCar.checkCollisions(0, 0).hit).toBe(false);

    // Outside room boundaries (limits are ~3.65)
    expect(rcCar.checkCollisions(-4.0, 0).hit).toBe(true);
    expect(rcCar.checkCollisions(4.0, 0).hit).toBe(true);
    expect(rcCar.checkCollisions(0, -4.0).hit).toBe(true);
    expect(rcCar.checkCollisions(0, 4.0).hit).toBe(true);
  });

  it('should detect collisions against furniture objects', () => {
    const scene = new THREE.Scene();
    const rcCar = createRCCar(scene, {});

    // Inside bed area (approx x: -2.0, z: 2.0)
    const bedHit = rcCar.checkCollisions(-2.0, 2.0);
    expect(bedHit.hit).toBe(true);
    expect(bedHit.name).toBe('Bed');

    // Inside desk area (approx x: 0, z: -2.5)
    const deskHit = rcCar.checkCollisions(0, -2.5);
    expect(deskHit.hit).toBe(true);
    expect(deskHit.name).toBe('Desk');
  });

  it('should toggle active state cleanly', () => {
    const scene = new THREE.Scene();
    let engineActive = false;
    const mockSound = {
      setEngineSound: (active) => { engineActive = active; }
    };

    const rcCar = createRCCar(scene, mockSound);
    rcCar.setActive(true);
    expect(rcCar.state.active).toBe(true);
    expect(engineActive).toBe(true);

    rcCar.setActive(false);
    expect(rcCar.state.active).toBe(false);
    expect(engineActive).toBe(false);
  });
});
