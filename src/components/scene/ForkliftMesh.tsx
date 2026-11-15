import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ForkliftEntity, WarehouseSite } from '../../types/logistics';
import { computeForkliftPose } from '../../utils/kinematics';
import { PalletUnit } from './PalletCluster';
import { SelectionBrackets } from './SelectionBrackets';

interface ForkliftMeshProps {
  forklift: ForkliftEntity;
  site: WarehouseSite;
  simTimeRef: React.MutableRefObject<number>;
  isSelected: boolean;
  isDark: boolean;
  onSelect: () => void;
}

export const ForkliftMesh: React.FC<ForkliftMeshProps> = ({
  forklift,
  site,
  simTimeRef,
  isSelected,
  isDark,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const forksRef = useRef<THREE.Group>(null);
  const loadRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const pose = computeForkliftPose(forklift, site, simTimeRef.current);
    if (groupRef.current) {
      groupRef.current.position.set(pose.position[0], pose.position[1], pose.position[2]);
      groupRef.current.rotation.y = pose.rotationY;
    }
    if (forksRef.current) {
      forksRef.current.position.y = pose.forkHeight;
    }
    if (loadRef.current) {
      loadRef.current.visible = pose.hasLoad;
    }
  });

  const initial = computeForkliftPose(forklift, site, simTimeRef.current);

  return (
    <group
      ref={groupRef}
      position={initial.position}
      rotation={[0, initial.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Counterweight Yellow Rear & Azul Ejecutivo Front Fender (exact match to video!) */}
      <mesh position={[0, 0.56, -0.35]} castShadow>
        <boxGeometry args={[1.28, 0.78, 1.35]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.45, 0.42]} castShadow>
        <boxGeometry args={[1.24, 0.56, 0.65]} />
        <meshStandardMaterial color="#0866FF" roughness={0.4} />
      </mesh>

      {/* Operator Seat */}
      <mesh position={[0, 1.05, -0.15]}>
        <boxGeometry args={[0.56, 0.42, 0.52]} />
        <meshStandardMaterial color="#0B1220" />
      </mesh>

      {/* Overhead Safety Roll Cage */}
      {[
        [-0.54, -0.78],
        [0.54, -0.78],
        [-0.54, 0.45],
        [0.54, 0.45],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, 1.38, pz]}>
          <boxGeometry args={[0.08, 1.25, 0.08]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
      ))}
      <mesh position={[0, 2.02, -0.16]}>
        <boxGeometry args={[1.18, 0.08, 1.35]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>

      {/* Front Vertical Mast Rails */}
      <mesh position={[-0.42, 1.28, 0.78]} castShadow>
        <boxGeometry args={[0.1, 2.35, 0.12]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.42, 1.28, 0.78]} castShadow>
        <boxGeometry args={[0.1, 2.35, 0.12]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

      {/* Animated Fork Carriage + Carried Pallet */}
      <group ref={forksRef} position={[0, initial.forkHeight, 0.85]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.98, 0.55, 0.08]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        <mesh position={[-0.32, 0.05, 0.58]}>
          <boxGeometry args={[0.12, 0.06, 1.15]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>
        <mesh position={[0.32, 0.05, 0.58]}>
          <boxGeometry args={[0.12, 0.06, 1.15]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>

        <group ref={loadRef} position={[0, 0.08, 0.65]} visible={initial.hasLoad}>
          <PalletUnit
            variant={forklift.carryingBluePallet ? 'blue' : 'kraft'}
            heightScale={0.88}
          />
        </group>
      </group>

      {/* 4 Forklift Wheels */}
      {[
        [-0.58, 0.28, 0.45],
        [0.58, 0.28, 0.45],
        [-0.54, 0.24, -0.68],
        [0.54, 0.24, -0.68],
      ].map(([wx, wy, wz], idx) => (
        <mesh key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[wy, wy, 0.22, 14]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
      ))}

      {isSelected && (
        <>
          <SelectionBrackets
            width={1.9}
            height={2.5}
            depth={2.9}
            centerY={1.25}
            color={isDark ? '#63EDFF' : '#0866FF'}
          />
          <Html position={[0, 2.95, 0]} center distanceFactor={55} zIndexRange={[25, 0]}>
            <div className="ce-3d-tag ce-3d-tag--active">
              <span className="ce-3d-tag__id">{forklift.id}</span>
              <span className="ce-3d-tag__status">{forklift.status}</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

