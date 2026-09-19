import { describe, it, expect } from 'vitest';
import { ArcadeMiniGame } from '../src/utils/arcadeMiniGame.js';

describe('ArcadeMiniGame Engine Logic', () => {
  it('should initialize with correct default state and snake body', () => {
    const game = new ArcadeMiniGame();
    expect(game.state).toBe('READY');
    expect(game.score).toBe(0);
    expect(game.snake.length).toBe(3);
    expect(game.cols).toBe(36);
    expect(game.rows).toBe(20);
  });

  it('should start game and transition to PLAYING', () => {
    let playedSound = false;
    const mockSound = {
      playArcadeBeep: () => { playedSound = true; }
    };
    const game = new ArcadeMiniGame(mockSound);
    game.start();

    expect(game.state).toBe('PLAYING');
    expect(playedSound).toBe(true);
  });

  it('should advance snake head forward on tick', () => {
    const game = new ArcadeMiniGame();
    game.start();
    const initialHead = { ...game.snake[0] };

    game.tick();
    const newHead = game.snake[0];

    // Default direction is { x: 1, y: 0 }
    expect(newHead.x).toBe(initialHead.x + 1);
    expect(newHead.y).toBe(initialHead.y);
  });

  it('should trigger game over on outer wall collision', () => {
    const game = new ArcadeMiniGame();
    game.start();
    // Place snake right next to right wall
    game.snake = [{ x: game.cols - 1, y: 5 }, { x: game.cols - 2, y: 5 }];
    game.dir = { x: 1, y: 0 };
    game.nextDir = { x: 1, y: 0 };

    game.tick();
    expect(game.state).toBe('GAMEOVER');
  });

  it('should trigger game over on self collision', () => {
    const game = new ArcadeMiniGame();
    game.start();
    // Loop snake into itself
    game.snake = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 5 }
    ];
    game.dir = { x: 0, y: 1 };
    game.nextDir = { x: 0, y: 1 };

    game.tick();
    expect(game.state).toBe('GAMEOVER');
  });

  it('should increase score and grow snake when eating food', () => {
    const game = new ArcadeMiniGame();
    game.start();
    const currentLen = game.snake.length;

    // Place food directly in front of snake
    game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
    game.dir = { x: 1, y: 0 };
    game.nextDir = { x: 1, y: 0 };

    game.tick();
    expect(game.score).toBe(100);
    expect(game.snake.length).toBe(currentLen + 1);
  });
});
