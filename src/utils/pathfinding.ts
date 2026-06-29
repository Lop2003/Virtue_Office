import * as THREE from 'three';
import { DESK_CONFIGS } from '../components/OfficeScene';

// Discretized grid parameters for the 14.8 x 8.4 floor
const gridSpacing = 0.25;
const colCount = Math.floor(14.8 / gridSpacing); // ~59 cols
const rowCount = Math.floor(8.4 / gridSpacing);   // ~33 rows

const xMin = -7.4;
const zMin = -4.2;

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
  activeDesk: number | null
): boolean => {
  if (col < 0 || col >= colCount || row < 0 || row >= rowCount) return false;

  // Start and target cells are always walkable
  if ((col === startCol && row === startRow) || (col === targetCol && row === targetRow)) return true;

  const cellPos = gridToWorld(col, row);

  // Padding limits from walls
  if (Math.abs(cellPos.x) > 7.1 || Math.abs(cellPos.z) > 3.9) return false;

  // Bounding box collision check for each desk
  for (const desk of DESK_CONFIGS) {
    const dx = desk.position[0];
    const dz = desk.position[2];

    // Desk size is [1.8, 0.06, 1.0]. Adding safety padding (0.12 units) for avatar width.
    const padX = 0.9 + 0.12;
    const padZ = 0.5 + 0.12;

    if (
      cellPos.x >= dx - padX && 
      cellPos.x <= dx + padX && 
      cellPos.z >= dz - padZ && 
      cellPos.z <= dz + padZ
    ) {
      return false; // Collides with desk
    }

    // Chair collision check (only block if it contains a colleague)
    if (desk.id !== activeDesk) {
      const rotY = desk.rotationY || 0;
      const offsetZ = -0.4 * Math.cos(rotY);
      const offsetX = -0.4 * Math.sin(rotY);
      const cx = dx + offsetX;
      const cz = dz + offsetZ;

      // Chair diameter ~0.6 units. Adding padding ~0.15. Total radius ~0.45.
      const distSq = (cellPos.x - cx) * (cellPos.x - cx) + (cellPos.z - cz) * (cellPos.z - cz);
      if (distSq < 0.42 * 0.42) {
        return false; // Collides with sitting colleague
      }
    }
  }

  return true;
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
        if (isWalkable(nextCol, nextRow, startCol, startRow, targetCol, targetRow, activeDesk)) {
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

    // Replace the final grid node with the exact click coordinate for precision snapping
    if (path.length > 0) {
      path[path.length - 1].copy(target);
    } else {
      path.push(target.clone());
    }

    return path;
  }

  // Fallback to direct path if BFS is blocked (avoids freezing)
  return [target.clone()];
};
