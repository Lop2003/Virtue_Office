import React from 'react';

interface OfficeLightsProps {
  theme: 'day' | 'sunset' | 'night';
}

export const OfficeLights: React.FC<OfficeLightsProps> = ({ theme }) => {
  // Theme-dependent light configurations
  const getThemeLights = () => {
    switch (theme) {
      case 'sunset':
        return {
          ambientIntensity: 0.55,
          ambientColor: '#fdba74', // warm peach
          hemiSkyColor: '#ffedd5',
          hemiGroundColor: '#7c2d12',
          hemiIntensity: 0.5,
          dirPosition: [8, 12, 8] as [number, number, number],
          dirIntensity: 1.6,
          dirColor: '#fb923c', // orange sunset glow
          fillIntensity: 0.65,
          fillColor: '#f43f5e' // rose fill
        };
      case 'night':
        return {
          ambientIntensity: 0.6,
          ambientColor: '#1e1b4b', // deep indigo
          hemiSkyColor: '#020617',
          hemiGroundColor: '#0f172a',
          hemiIntensity: 0.65,
          dirPosition: [10, 15, 10] as [number, number, number],
          dirIntensity: 1.1,
          dirColor: '#3b82f6', // cyan moon glow
          fillIntensity: 0.7,
          fillColor: '#6366f1' // purple fill
        };
      default: // day
        return {
          ambientIntensity: 0.9,
          ambientColor: '#ffffff', // bright day
          hemiSkyColor: '#ffffff',
          hemiGroundColor: '#444444',
          hemiIntensity: 0.7,
          dirPosition: [10, 15, 10] as [number, number, number],
          dirIntensity: 2.1,
          dirColor: '#fffbeb', // soft yellow sunlight
          fillIntensity: 0.8,
          fillColor: '#ffffff'
        };
    }
  };

  const lights = getThemeLights();

  return (
    <>
      <ambientLight intensity={lights.ambientIntensity} color={lights.ambientColor} />
      <hemisphereLight 
        color={lights.hemiSkyColor} 
        groundColor={lights.hemiGroundColor} 
        intensity={lights.hemiIntensity} 
      />
      <directionalLight
        castShadow
        position={lights.dirPosition}
        intensity={lights.dirIntensity}
        color={lights.dirColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={lights.fillIntensity}
        color={lights.fillColor}
      />
      {theme === 'night' && (
        <>
          {/* Cozy warm interior ceiling lights to contrast with the dark cyber cityscape */}
          <pointLight 
            position={[-3.5, 1.84, -0.5]} 
            intensity={3.6} 
            distance={10} 
            decay={1.2} 
            color="#ffecd9" 
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />
          <pointLight 
            position={[3.5, 1.84, 0.5]} 
            intensity={3.6} 
            distance={10} 
            decay={1.2} 
            color="#ffecd9" 
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />
          {/* Wall Lamp 1 (Left Wall) */}
          <pointLight 
            position={[-7.3, 1.6, -1.5]} 
            intensity={1.4} 
            distance={6} 
            decay={1.5} 
            color="#fef08a" 
          />
          {/* Wall Lamp 2 (Back Wall Left) */}
          <pointLight 
            position={[-3.5, 1.6, -4.1]} 
            intensity={1.4} 
            distance={6} 
            decay={1.5} 
            color="#fef08a" 
          />
          {/* Wall Lamp 3 (Back Wall Right) */}
          <pointLight 
            position={[0.5, 1.6, -4.1]} 
            intensity={1.4} 
            distance={6} 
            decay={1.5} 
            color="#fef08a" 
          />
        </>
      )}
    </>
  );
};
