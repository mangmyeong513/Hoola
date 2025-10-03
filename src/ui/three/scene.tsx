import React from 'react';
import { Canvas, CanvasProps } from '@react-three/fiber';

const Scene: React.FC<CanvasProps> = ({ children, ...props }) => (
  <Canvas shadows camera={{ position: [0, 8, 8], fov: 50 }} {...props}>
    <color attach="background" args={[0.07, 0.12, 0.08]} />
    <hemisphereLight args={[0xffffff, 0x222222, 0.6]} />
    <spotLight
      position={[5, 12, 5]}
      angle={0.45}
      penumbra={0.3}
      intensity={1.2}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
    />
    {children}
  </Canvas>
);

export default Scene;
