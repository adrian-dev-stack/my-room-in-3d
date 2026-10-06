export function getRoomOverview(aspect) {
  const scale = Math.max(1, 1.1 / aspect);
  return {
    position: { x: -11.5 * scale, y: 1.25 + 8 * scale, z: 11.5 * scale },
    target: { x: 0, y: 1.25, z: 0 }
  };
}

export function getRoomDetailView(viewName, aspect) {
  const views = {
    'Desk Setup': {
      position: { x: -1.8, y: 3.4, z: 1.7 },
      target: { x: 0, y: 1.65, z: -2.6 }
    },
    'Bed Corner': {
      position: { x: 2.1, y: 3.8, z: -0.2 },
      target: { x: -1.6, y: 0.55, z: 2.3 }
    }
  };
  const view = views[viewName];
  const scale = Math.max(1, 1.2 / aspect);
  return {
    position: Object.fromEntries(['x', 'y', 'z'].map((axis) =>
      [axis, view.target[axis] + (view.position[axis] - view.target[axis]) * scale])),
    target: view.target
  };
}
