
export enum GameState {
  MENU = 'MENU',
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export type PowerUpType = 'magnet' | 'shield' | 'speed';

export interface ObstacleData {
  id: string;
  z: number;
  lane: number;
  type: 'pillar' | 'wall' | 'low-bar' | 'hound';
}

export interface CoinData {
  id: string;
  z: number;
  lane: number;
}

export interface PowerUpData {
  id: string;
  z: number;
  lane: number;
  type: PowerUpType;
}
