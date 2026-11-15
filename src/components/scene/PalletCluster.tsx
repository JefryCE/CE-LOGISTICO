import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface PalletUnitProps {
  position?: [number, number, number];
  variant?: 'kraft' | 'blue' | 'cold';
  heightScale?: number;
}

export const PalletUnit: React.FC<PalletUnitProps> = ({
  position = [0, 0, 0],
  variant = 'kraft',
  heightScale = 1,
}) => {
  const boxColor =
    variant === 'blue' ? '#0866FF' : variant === 'cold' ? '#F1F5F9' : '#DFB484';
  const accentColor =
    variant === 'blue' ? '#0041AD' : variant === 'cold' ? '#CBD5E1' : '#C69764';

  const h = 1.05 * heightScale;

  return (
    <group position={position}>
      {/* Wooden pallet base */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.16, 1.35]} />
        <meshStandardMaterial color="#B98552" roughness={0.85} />
      </mesh>
      {/* Main cargo stack */}
      <mesh position={[0, 0.16 + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.24, h, 1.24]} />
        <meshStandardMaterial color={boxColor} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Strapping / carton seam bands */}
      <mesh position={[0, 0.16 + h / 2, 0]}>
        <boxGeometry args={[1.27, h * 0.12, 1.27]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.16 + h / 2, 0]}>
        <boxGeometry args={[0.14, h + 0.02, 1.27]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
    </group>
  );
};

interface StagingClusterProps {
  id: string;
  label: string;
  palletsCount: number;
  position: [number, number, number];
  variant: 'mixed' | 'blue' | 'cold';
  isSelected: boolean;
  onSelect: () => void;
}

export const StagingCluster: React.FC<StagingClusterProps> = ({
  label,
  palletsCount,
  position,
  variant,
  isSelected,
  onSelect,
}) => {
  const pinRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (pinRef.current) {
      pinRef.current.position.y = 2.6 + Math.sin(clock.getElapsedTime() * 2.4 + position[0]) * 0.16;
    }
  });

  const v1 = variant === 'blue' ? 'blue' : variant === 'cold' ? 'cold' : 'kraft';
  const v2 = variant === 'mixed' ? 'blue' : v1;
  const v3 = variant === 'mixed' ? 'cold' : v1;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Painted yellow staging floor border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5.4, 3.8]} />
        <meshStandardMaterial color={isSelected ? '#DCE8FF' : '#F5F7FA'} roughness={0.9} />
      </mesh>
      <lineSegments position={[0, 0.03, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(5.4, 0.02, 3.8)]} />
        <lineBasicMaterial color={isSelected ? '#0866FF' : '#EAB308'} />
      </lineSegments>

      {/* Pallets arrangement */}
      <PalletUnit position={[-1.5, 0, -0.8]} variant={v1} heightScale={1.1} />
      <PalletUnit position={[0, 0, -0.8]} variant={v2} heightScale={0.95} />
      <PalletUnit position={[1.5, 0, -0.8]} variant={v1} heightScale={1.15} />
      <PalletUnit position={[-0.9, 0, 0.85]} variant={v3} heightScale={0.85} />
      <PalletUnit position={[0.8, 0, 0.85]} variant={v2} heightScale={1.05} />

      {/* Floating 3D Blue Location Pin (exact match to reference video!) */}
      <group ref={pinRef} position={[0, 2.6, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.48, 20, 20]} />
          <meshStandardMaterial
            color="#0866FF"
            emissive="#0866FF"
            emissiveIntensity={isSelected ? 0.45 : 0.15}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.36, 0.7, 20]} />
          <meshStandardMaterial color="#0866FF" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.45, 0.36]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0.45, -0.36]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {isSelected && (
          <Html position={[0, 1.25, 0]} center distanceFactor={55} zIndexRange={[20, 0]}>
            <div className="ce-3d-tag ce-3d-tag--active">
              <span className="ce-3d-tag__id">{label}</span>
              <span className="ce-3d-tag__status">{palletsCount} pallets</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

