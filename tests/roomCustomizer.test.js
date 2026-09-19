import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { RoomCustomizer, FLOOR_STYLES, WALL_COLORS, NEON_COLORS } from '../src/components/RoomCustomizer.js';

describe('RoomCustomizer Component & Material Sandbox', () => {
  it('should define available presets for floors, walls, and neon colors', () => {
    expect(Object.keys(FLOOR_STYLES).length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(WALL_COLORS).length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(NEON_COLORS).length).toBeGreaterThanOrEqual(5);
  });

  it('should apply floor material changes to room', () => {
    const mockRoom = {
      group: new THREE.Group(),
      floorMaterial: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
      wallMaterial: new THREE.MeshStandardMaterial({ color: '#ffffff' })
    };

    const customizer = new RoomCustomizer(mockRoom, null);
    customizer.setFloor('marble');

    expect(customizer.settings.floor).toBe('marble');
    expect(mockRoom.floorMaterial.color.getHexString()).toBe(
      new THREE.Color(FLOOR_STYLES.marble.color).getHexString()
    );
  });

  it('should apply wall finish changes to room', () => {
    const mockRoom = {
      group: new THREE.Group(),
      floorMaterial: new THREE.MeshStandardMaterial(),
      wallMaterial: new THREE.MeshStandardMaterial()
    };

    const customizer = new RoomCustomizer(mockRoom, null);
    customizer.setWall('tokyo');

    expect(customizer.settings.wall).toBe('tokyo');
    expect(mockRoom.wallMaterial.color.getHexString()).toBe(
      new THREE.Color(WALL_COLORS.tokyo.color).getHexString()
    );
  });

  it('should sanitize and cap custom neon sign text', () => {
    const mockRoom = { group: new THREE.Group() };
    const customizer = new RoomCustomizer(mockRoom, null);

    customizer.setNeonText('ThisIsAVeryLongSloganThatShouldBeCapped');
    expect(customizer.settings.neonText.length).toBeLessThanOrEqual(20);
  });
});
