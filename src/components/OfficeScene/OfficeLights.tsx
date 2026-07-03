import React from 'react';

interface OfficeLightsProps {
  theme: 'day' | 'sunset' | 'night';
  sunIntensityMulti?: number;
  ambientIntensityMulti?: number;
}

export const OfficeLights: React.FC<OfficeLightsProps> = ({ 
  theme,
  sunIntensityMulti = 1,
  ambientIntensityMulti = 1
}) => {
  // Theme-dependent light configurations
  const getThemeLights = () => {
    switch (theme) {
      case 'sunset':
        return {
          ambientIntensity: 0.35,
          ambientColor: '#f6ad55', // amber-orange
          hemiSkyColor: '#ffe0b2',
          hemiGroundColor: '#5a3414',
          hemiIntensity: 0.45,
          dirPosition: [12, 4.2, 7] as [number, number, number],
          dirIntensity: 2.8,
          dirColor: '#ffb347', // golden sunset glow
          fillIntensity: 0.82,
          fillColor: '#ffd166' // warm gold fill
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
          ambientIntensity: 0.45,
          ambientColor: '#f8fafc', // clean daylight
          hemiSkyColor: '#fff6c9',
          hemiGroundColor: '#cbd5e1',
          hemiIntensity: 0.45,
          dirPosition: [8, 12, 6] as [number, number, number],
          dirIntensity: 3.5,
          dirColor: '#ffe6a0', // warm bright sun
          fillIntensity: 0.6,
          fillColor: '#dbeafe'
        };
    }
  };

  const lights = getThemeLights();

  return (
    <>
      <ambientLight 
        intensity={lights.ambientIntensity * ambientIntensityMulti} 
        color={lights.ambientColor} 
      />
      <hemisphereLight 
        color={lights.hemiSkyColor} 
        groundColor={lights.hemiGroundColor} 
        intensity={lights.hemiIntensity * ambientIntensityMulti} 
      />
      <directionalLight
        castShadow={theme !== 'night'}
        position={lights.dirPosition}
        intensity={lights.dirIntensity * sunIntensityMulti}
        color={lights.dirColor}
        shadow-mapSize-width={theme === 'day' ? 2048 : theme === 'sunset' ? 1536 : 0}
        shadow-mapSize-height={theme === 'day' ? 2048 : theme === 'sunset' ? 1536 : 0}
        shadow-camera-far={theme === 'night' ? 0 : 24}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.00008}
        shadow-normalBias={0.008}
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={lights.fillIntensity}
        color={lights.fillColor}
      />
      {(theme === 'day' || theme === 'sunset') && (
        <>
          <pointLight
            position={[-3.8, 2.2, -0.8]}
            intensity={theme === 'day' ? 1.15 : 0.95}
            distance={12}
            decay={1.4}
            color={theme === 'day' ? '#fff7cc' : '#ffd7a3'}
          />
          <pointLight
            position={[3.8, 2.2, 0.8]}
            intensity={theme === 'day' ? 1.0 : 0.85}
            distance={12}
            decay={1.4}
            color={theme === 'day' ? '#e0f2fe' : '#ffb86b'}
          />
          <pointLight
            position={[0, 2.6, -2.4]}
            intensity={theme === 'day' ? 0.8 : 0.9}
            distance={14}
            decay={1.6}
            color={theme === 'day' ? '#ffffff' : '#fef3c7'}
          />
          {theme === 'day' && (
            <directionalLight
              position={[-6, 7, -2]}
              intensity={0.55}
              color="#ffffff"
            />
          )}
        </>
      )}
      {theme === 'night' && (
        <>
          {/* Cozy warm interior ceiling lights to contrast with the dark cyber cityscape */}
          <pointLight 
            position={[-3.5, 1.84, -0.5]} 
            intensity={2.4} 
            distance={10} 
            decay={1.2} 
            color="#ffecd9" 
          />
          <pointLight 
            position={[3.5, 1.84, 0.5]} 
            intensity={2.4} 
            distance={10} 
            decay={1.2} 
            color="#ffecd9" 
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
