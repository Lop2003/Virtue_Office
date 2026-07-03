export type AvatarType = 'human' | 'robot' | 'model';

export interface CharacterOption {
  id: string;
  name: string;
  subtitle: string;
  type: AvatarType;
  accent: string;
  modelUrl?: string;
  modelScale?: number;
  modelYOffset?: number;
  modelRotationY?: number;
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: 'human',
    name: 'Human',
    subtitle: 'Customizable teammate',
    type: 'human',
    accent: '#2563eb',
  },
  {
    id: 'robot',
    name: 'Robot',
    subtitle: 'Animated expressive bot',
    type: 'robot',
    accent: '#f97316',
  },
  {
    id: 'soldier',
    name: 'Soldier',
    subtitle: 'Three.js animated sample',
    type: 'model',
    accent: '#16a34a',
    modelUrl: '/characters/Soldier.glb',
    modelScale: 0.93,
    modelYOffset: 0,
    modelRotationY: 0,
  },
  {
    id: 'xbot',
    name: 'Xbot',
    subtitle: 'Three.js animated sample',
    type: 'model',
    accent: '#7c3aed',
    modelUrl: '/characters/Xbot.glb',
    modelScale: 0.94,
    modelYOffset: 0,
    modelRotationY: 0,
  },
  {
    id: 'cesium-man',
    name: 'Cesium Man',
    subtitle: 'Khronos glTF sample',
    type: 'model',
    accent: '#0ea5e9',
    modelUrl: '/characters/CesiumMan.glb',
    modelScale: 1.13,
    modelYOffset: 0,
    modelRotationY: 0,
  },
];
