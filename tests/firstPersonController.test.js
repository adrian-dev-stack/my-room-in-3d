import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FirstPersonController } from '../src/components/FirstPersonController.js';

describe('FirstPersonController Logic & Collision Checks', () => {
  it('should initialize with correct default height, radius, and speed', () => {
    const camera = new THREE.PerspectiveCamera();
    const fps = new FirstPersonController(camera, null, null);

    expect(fps.height).toBeCloseTo(1.65);
    expect(fps.radius).toBeCloseTo(0.32);
    expect(fps.active).toBe(false);
    expect(fps.moveSpeed).toBeGreaterThan(1.5);
    expect(fps.sprintSpeed).toBeGreaterThan(fps.moveSpeed);
  });

  it('should detect wall collisions when walking out of bounds', () => {
    const camera = new THREE.PerspectiveCamera();
    const fps = new FirstPersonController(camera, null, null);

    // Inside open floor
    expect(fps.checkCollisions(0, 0).hit).toBe(false);

    // Outside outer room walls (limit ~3.65)
    expect(fps.checkCollisions(-3.7, 0).hit).toBe(true);
    expect(fps.checkCollisions(3.7, 0).hit).toBe(true);
    expect(fps.checkCollisions(0, -3.7).hit).toBe(true);
    expect(fps.checkCollisions(0, 3.7).hit).toBe(true);
  });

  it('should detect collisions against room furniture', () => {
    const camera = new THREE.PerspectiveCamera();
    const fps = new FirstPersonController(camera, null, null);

    // Bed corner
    expect(fps.checkCollisions(-2.0, 2.0).hit).toBe(true);

    // Desk center
    expect(fps.checkCollisions(0, -2.5).hit).toBe(true);
  });

  it('should enable and disable cleanly', () => {
    const camera = new THREE.PerspectiveCamera();
    const fps = new FirstPersonController(camera, null, null);

    fps.enable();
    expect(fps.active).toBe(true);
    expect(fps.position.y).toBe(fps.height);

    fps.disable();
    expect(fps.active).toBe(false);
  });
});
