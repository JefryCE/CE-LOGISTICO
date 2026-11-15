import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SelectionBracketsProps {
  width: number;
  height: number;
  depth: number;
  centerY?: number;
  color?: string;
}

/**
 * Renders 8 crisp 3D corner L-brackets around a selected vehicle (exact match to WareTrack video!).
 */
export const SelectionBrackets: React.FC<SelectionBracketsProps> = ({
  width,
  height,
  depth,
  centerY = height / 2,
  color = '#0B1220',
}) => {
  const geometry = useMemo(() => {
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;
    const arm = Math.min(width, height, depth) * 0.24;
    const pts: number[] = [];

    const corners: [number, number, number][] = [
      [-hw, -hh, -hd],
      [hw, -hh, -hd],
      [-hw, hh, -hd],
      [hw, hh, -hd],
      [-hw, -hh, hd],
      [hw, -hh, hd],
      [-hw, hh, hd],
      [hw, hh, hd],
    ];

    for (const [cx, cy, cz] of corners) {
      const sx = cx < 0 ? 1 : -1;
      const sy = cy < 0 ? 1 : -1;
      const sz = cz < 0 ? 1 : -1;

      pts.push(cx, cy, cz, cx + sx * arm, cy, cz);
      pts.push(cx, cy, cz, cx, cy + sy * arm, cz);
      pts.push(cx, cy, cz, cx, cy, cz + sz * arm);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [width, height, depth]);

  return (
    <group position={[0, centerY, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
};

