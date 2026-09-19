import { describe, it, expect } from 'vitest';
import { MAIN_MODES, VERT_MODES } from '../src/utils/animatedScreens.js';

describe('AnimatedScreen Constants & Mode Architecture', () => {
  it('should define correct available main monitor screen modes', () => {
    expect(MAIN_MODES).toContain('vscode');
    expect(MAIN_MODES).toContain('terminal');
    expect(MAIN_MODES).toContain('fivem');
    expect(MAIN_MODES).toContain('portfolio');
    expect(MAIN_MODES.length).toBe(4);
  });

  it('should define correct available vertical monitor screen modes', () => {
    expect(VERT_MODES).toContain('discord');
    expect(VERT_MODES).toContain('spotify');
    expect(VERT_MODES).toContain('chat-log');
    expect(VERT_MODES.length).toBe(3);
  });

  it('should verify screen mode cycling calculation wraps around', () => {
    let modeIndex = 0;
    const cycledModes = [];

    for (let i = 0; i < MAIN_MODES.length * 2; i++) {
      cycledModes.push(MAIN_MODES[modeIndex]);
      modeIndex = (modeIndex + 1) % MAIN_MODES.length;
    }

    expect(cycledModes[0]).toBe('vscode');
    expect(cycledModes[4]).toBe('vscode'); // Wrapped around
    expect(cycledModes[1]).toBe('terminal');
    expect(cycledModes[5]).toBe('terminal');
  });
});
