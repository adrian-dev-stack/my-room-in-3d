import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import * as THREE from 'three';
import { createRoomModel } from '../src/components/RoomModel.js';
import { getRoomOverview, getRoomDetailView } from '../src/utils/roomCamera.js';

describe('Room camera framing', () => {
  let model;

  beforeAll(() => {
    vi.stubGlobal('document', { createElement: () => createCanvas(1, 1) });
    model = createRoomModel();
    model.group.updateMatrixWorld(true);
  });

  afterAll(() => vi.unstubAllGlobals());

  function expectVisible(object, pose, aspect) {
    const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
    camera.updateMatrixWorld(true);
    let maxX = 0;
    let maxY = 0;
    let minZ = Infinity;
    let maxZ = -Infinity;
    const vertex = new THREE.Vector3();
    object.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const positions = mesh.geometry.attributes.position;
      for (let index = 0; index < positions.count; index++) {
        vertex.fromBufferAttribute(positions, index)
          .applyMatrix4(mesh.matrixWorld).project(camera);
        maxX = Math.max(maxX, Math.abs(vertex.x));
        maxY = Math.max(maxY, Math.abs(vertex.y));
        minZ = Math.min(minZ, vertex.z);
        maxZ = Math.max(maxZ, vertex.z);
      }
    });
    expect(maxX).toBeLessThan(1);
    expect(maxY).toBeLessThan(1);
    expect(minZ).toBeGreaterThan(-1);
    expect(maxZ).toBeLessThan(1);
  }

  it('shows the whole cutaway room from its open side on desktop and portrait phones', () => {
    for (const aspect of [1440 / 1000, 390 / 844, 320 / 932]) {
      const pose = getRoomOverview(aspect);
      expect(pose.position.x).toBeLessThan(-3.6);
      expect(pose.position.z).toBeGreaterThan(3.6);
      expectVisible(model.group, pose, aspect);
    }
  });

  it('keeps both monitors and the bed inside their detail views on portrait phones', () => {
    for (const aspect of [1440 / 1000, 390 / 844, 320 / 932]) {
      const desk = getRoomDetailView('Desk Setup', aspect);
      expectVisible(model.deskSetup.group.getObjectByName('MainMonitor'), desk, aspect);
      expectVisible(model.deskSetup.group.getObjectByName('VerticalMonitor'), desk, aspect);
      expectVisible(model.pcSetup.group, desk, aspect);
      expectVisible(model.furniture.group.getObjectByName('Bed'), getRoomDetailView('Bed Corner', aspect), aspect);
    }
  });
});
