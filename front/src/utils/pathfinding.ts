import * as THREE from 'three';
import { DESK_CONFIGS } from './deskConfigs';

// Discretized grid parameters for the 14.8 x 10.4 floor
const gridSpacing = 0.25;
const colCount = Math.floor(14.8 / gridSpacing); // ~59 cols
const rowCount = Math.floor(10.4 / gridSpacing);  // ~41 rows

const xMin = -7.4;
const zMin = -5.2;

// Convert world position to grid index
export const worldToGrid = (x: number, z: number): [number, number] => {
  const col = Math.floor((x - xMin) / gridSpacing);
  const row = Math.floor((z - zMin) / gridSpacing);
  return [
    Math.max(0, Math.min(colCount - 1, col)),
    Math.max(0, Math.min(rowCount - 1, row))
  ];
};

// Convert grid index back to world position
export const gridToWorld = (col: number, row: number): THREE.Vector3 => {
  const x = xMin + col * gridSpacing + gridSpacing / 2;
  const z = zMin + row * gridSpacing + gridSpacing / 2;
  return new THREE.Vector3(x, 0, z);
};

// Check if a grid cell is walkable
const isWalkable = (
  col: number,
  row: number,
  startCol: number,
  startRow: number,
  targetCol: number,
  targetRow: number,
  target: THREE.Vector3,
  activeDesk: number | null
): boolean => {
  if (col < 0 || col >= colCount || row < 0 || row >= rowCount) return false;

  // Start cell is always walkable so pathfinding can begin from the avatar's current spot
  if (col === startCol && row === startRow) return true;

  const cellPos = gridToWorld(col, row);

  // Target must respect collision at the exact clicked/seat point, not the grid center.
  // Seat targets can sit right outside a desk while the coarse grid center is still padded.
  if (col === targetCol && row === targetRow) {
    return !checkCollision(target.x, target.z, activeDesk);
  }

  // Padding limits from walls
  if (Math.abs(cellPos.x) > 7.1 || Math.abs(cellPos.z) > 4.9) return false;

  return !checkCollision(cellPos.x, cellPos.z, activeDesk);
};

const canStepTo = (
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
  startCol: number,
  startRow: number,
  targetCol: number,
  targetRow: number,
  target: THREE.Vector3,
  activeDesk: number | null
): boolean => {
  if (!isWalkable(toCol, toRow, startCol, startRow, targetCol, targetRow, target, activeDesk)) {
    return false;
  }

  // Prevent cutting through desk corners on diagonal moves
  const dCol = toCol - fromCol;
  const dRow = toRow - fromRow;
  if (dCol !== 0 && dRow !== 0) {
    if (
      !isWalkable(fromCol + dCol, fromRow, startCol, startRow, targetCol, targetRow, target, activeDesk) ||
      !isWalkable(fromCol, fromRow + dRow, startCol, startRow, targetCol, targetRow, target, activeDesk)
    ) {
      return false;
    }
  }

  return true;
};

// Check if a world position is in collision with desks or walls (for WASD)
export const checkCollision = (
  x: number,
  z: number,
  activeDesk: number | null
): boolean => {
  // Padding limits from walls
  if (Math.abs(x) > 7.1 || Math.abs(z) > 4.9) return true; // Collides with wall

  // Bounding box collision check for each desk
  for (const desk of DESK_CONFIGS) {
    const dx = desk.position[0];
    const dz = desk.position[2];

    // Desk size is [1.8, 0.06, 1.0]. Adding safety padding (0.12 units) for avatar width.
    const padX = 0.9 + 0.12;
    const padZ = 0.5 + 0.12;

    if (
      x >= dx - padX && 
      x <= dx + padX && 
      z >= dz - padZ && 
      z <= dz + padZ
    ) {
      return true; // Collides with desk
    }

    // Chair collision check (only block if it contains a colleague)
    if (desk.id !== activeDesk && desk.hasColleague !== false) {
      const rotY = desk.rotationY || 0;
      const offsetZ = -0.65 * Math.cos(rotY);
      const offsetX = -0.65 * Math.sin(rotY);
      const cx = dx + offsetX;
      const cz = dz + offsetZ;

      const distSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (distSq < 0.45 * 0.45) {
        return true; // Collides with sitting colleague
      }
    }
  }

  return false; // No collision
};

// Slide along walls/desks when a desired move is blocked (shared by WASD and click-to-move)
export const resolveMovement = (
  current: THREE.Vector3,
  desired: THREE.Vector3,
  activeDesk: number | null
): THREE.Vector3 => {
  if (!checkCollision(desired.x, desired.z, activeDesk)) {
    return desired;
  }

  const slideX = current.clone();
  slideX.x = desired.x;
  if (!checkCollision(slideX.x, slideX.z, activeDesk)) {
    return slideX;
  }

  const slideZ = current.clone();
  slideZ.z = desired.z;
  if (!checkCollision(slideZ.x, slideZ.z, activeDesk)) {
    return slideZ;
  }

  return current.clone();
};

// BFS Shortest Path Finder
export const findPath = (
  start: THREE.Vector3,
  target: THREE.Vector3,
  activeDesk: number | null
): THREE.Vector3[] => {
  const [startCol, startRow] = worldToGrid(start.x, start.z);
  const [targetCol, targetRow] = worldToGrid(target.x, target.z);

  // Fast path: if start and target are in the same cell
  if (startCol === targetCol && startRow === targetRow) {
    if (checkCollision(target.x, target.z, activeDesk)) {
      return [];
    }
    return [target.clone()];
  }

  // BFS Setup
  const queue: [number, number][] = [[startCol, startRow]];
  const visited = new Set<string>();
  visited.add(`${startCol},${startRow}`);

  // Maps coordinates to parent coord key to reconstruct path
  const parentMap = new Map<string, string>();

  let found = false;

  // Directions (8-direction movement: orthagonal + diagonal)
  const dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const [currCol, currRow] = current;

    if (currCol === targetCol && currRow === targetRow) {
      found = true;
      break;
    }

    for (const [dCol, dRow] of dirs) {
      const nextCol = currCol + dCol;
      const nextRow = currRow + dRow;
      const nextKey = `${nextCol},${nextRow}`;

      if (!visited.has(nextKey)) {
        if (canStepTo(currCol, currRow, nextCol, nextRow, startCol, startRow, targetCol, targetRow, target, activeDesk)) {
          visited.add(nextKey);
          parentMap.set(nextKey, `${currCol},${currRow}`);
          queue.push([nextCol, nextRow]);
        }
      }
    }
  }

  // Reconstruct path if found
  if (found) {
    const path: THREE.Vector3[] = [];
    let currKey = `${targetCol},${targetRow}`;
    const startKey = `${startCol},${startRow}`;

    while (currKey !== startKey) {
      const [c, r] = currKey.split(',').map(Number);
      path.unshift(gridToWorld(c, r));
      
      const parent = parentMap.get(currKey);
      if (!parent) break;
      currKey = parent;
    }

    // Only snap to the exact click point when it is actually walkable
    if (path.length > 0) {
      if (!checkCollision(target.x, target.z, activeDesk)) {
        path[path.length - 1].copy(target);
      }
    } else {
      path.push(gridToWorld(targetCol, targetRow));
    }

    return path;
  }

  // No valid path — do not fall back to a straight line through desks
  return [];
};
