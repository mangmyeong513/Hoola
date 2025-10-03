import React, { useEffect, useMemo, useState } from 'react';
import { DoubleSide, MeshStandardMaterial, Shape, ShapeGeometry, Texture } from 'three';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';

const TABLE_TEXTURE = '/textures/felt.jpg';

const TableMesh: React.FC = () => {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      TABLE_TEXTURE,
      (tex) => {
        tex.wrapS = tex.wrapT = 1000;
        setTexture(tex);
      },
      undefined,
      () => setTexture(null)
    );
  }, []);

  const geometry = useMemo(() => {
    const shape = new Shape();
    const radius = 2.2;
    const width = 10;
    const height = 6;
    shape.absarc(-width / 2 + radius, -height / 2 + radius, radius, Math.PI, Math.PI / 2, true);
    shape.lineTo(width / 2 - radius, -height / 2);
    shape.absarc(width / 2 - radius, -height / 2 + radius, radius, Math.PI * 1.5, 0, true);
    shape.lineTo(width / 2, height / 2 - radius);
    shape.absarc(width / 2 - radius, height / 2 - radius, radius, 0, Math.PI / 2, true);
    shape.lineTo(-width / 2 + radius, height / 2);
    shape.absarc(-width / 2 + radius, height / 2 - radius, radius, Math.PI / 2, Math.PI, true);
    shape.lineTo(-width / 2, -height / 2 + radius);
    shape.absarc(-width / 2 + radius, -height / 2 + radius, radius, Math.PI, Math.PI * 1.5, true);
    return new ShapeGeometry(shape, 64);
  }, []);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture ?? undefined,
        color: texture ? 0xffffff : 0x0f5132,
        roughness: 0.9,
        metalness: 0.1,
        side: DoubleSide
      }),
    [texture]
  );

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={material} />
  );
};

export default TableMesh;
