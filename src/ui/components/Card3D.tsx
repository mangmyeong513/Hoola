import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Shape, ShapeGeometry } from 'three';

const CARD_MODEL_PATH = '/models/card.glb';

export type Card3DProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
};

function createFallbackGeometry() {
  const width = 1.6;
  const height = 2.3;
  const radius = 0.18;
  const shape = new Shape();
  shape.moveTo(-width / 2 + radius, -height / 2);
  shape.lineTo(width / 2 - radius, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
  shape.lineTo(width / 2, height / 2 - radius);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
  shape.lineTo(-width / 2 + radius, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
  shape.lineTo(-width / 2, -height / 2 + radius);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);
  return new ShapeGeometry(shape, 8);
}

const Card3D: React.FC<Card3DProps> = ({ position, rotation = [0, 0, 0] }) => {
  let gltf: Awaited<ReturnType<typeof useLoader<typeof GLTFLoader>>> | undefined;
  try {
    gltf = useLoader(GLTFLoader, CARD_MODEL_PATH);
  } catch (error) {
    gltf = undefined;
  }

  const fallback = useMemo(() => createFallbackGeometry(), []);

  return (
    <group position={position} rotation={rotation}>
      {gltf ? (
        <primitive object={gltf.scene.clone()} />
      ) : (
        <mesh geometry={fallback} castShadow receiveShadow>
          <meshStandardMaterial attach="material" color="#ffffff" />
        </mesh>
      )}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.4, 2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 2]} />
        <meshStandardMaterial color="#14532d" />
      </mesh>
    </group>
  );
};

export default Card3D;
