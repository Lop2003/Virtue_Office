export interface DeskConfig {
  id: number;
  position: [number, number, number];
  rotationY?: number;
  hasLaptop?: boolean;
  hasLamp?: boolean;
  hasPlant?: boolean;
  hasMug?: boolean;
  chairColor?: string;
  lampColor?: string;
  mugColor?: string;
  deskColor?: string;
  laptopColor?: string;
  glowColor?: string;
  lightIntensity?: number;
  hasColleague?: boolean;
}

// Programmatically generate 20 desks (4 rows of 5 desks facing each other)
const generateDesks = (): DeskConfig[] => {
  const desks: DeskConfig[] = [];
  let id = 0;
  const xCoords = [-5.2, -2.6, 0.0, 2.6, 5.2];
  const chairColors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  // Double-row 1 (Back Row Block)
  // Line 1: Facing Z-positive (rotY = 0)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, -2.6],
      rotationY: 0,
      hasLaptop: true,
      hasLamp: col % 3 === 0,
      hasPlant: col % 2 === 0,
      hasMug: col % 2 === 1,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#f43f5e',
      lightIntensity: 1.5,
      hasColleague: id % 3 !== 0 // Remove some colleagues
    });
    id++;
  });
  
  // Line 2: Facing Z-negative (rotY = PI)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, -1.6],
      rotationY: Math.PI,
      hasLaptop: true,
      hasLamp: col % 3 === 1,
      hasPlant: col % 2 === 1,
      hasMug: col % 2 === 0,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#06b6d4',
      lightIntensity: 1.5,
      hasColleague: id % 2 !== 0 // Remove some colleagues
    });
    id++;
  });

  // Double-row 2 (Front Row Block)
  // Line 1: Facing Z-positive (rotY = 0)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, 1.6],
      rotationY: 0,
      hasLaptop: true,
      hasLamp: col % 3 === 2,
      hasPlant: col % 2 === 0,
      hasMug: col % 2 === 1,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#f43f5e',
      lightIntensity: 1.5,
      hasColleague: id % 4 !== 0 // Remove some colleagues
    });
    id++;
  });

  // Line 2: Facing Z-negative (rotY = PI)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, 2.6],
      rotationY: Math.PI,
      hasLaptop: true,
      hasLamp: col % 3 === 0,
      hasPlant: col % 2 === 1,
      hasMug: col % 2 === 0,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#06b6d4',
      lightIntensity: 1.5,
      hasColleague: id % 3 !== 1 // Remove some colleagues
    });
    id++;
  });

  return desks;
};

export const DESK_CONFIGS = generateDesks();
