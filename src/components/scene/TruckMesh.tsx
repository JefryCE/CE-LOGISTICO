import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { CarrierBrand, TruckEntity, WarehouseSite } from '../../types/logistics';
import { computeTruckPose } from '../../utils/kinematics';
import { SelectionBrackets } from './SelectionBrackets';

interface TruckMeshProps {
  truck: TruckEntity;
  site: WarehouseSite;
  simTimeRef: React.MutableRefObject<number>;
  isSelected: boolean;
  isDark: boolean;
  onSelect: () => void;
}

function getCarrierColors(carrier: CarrierBrand): {
  cabColor: string;
  stripeColor: string;
  badgeText: string;
} {
  switch (carrier) {
    case 'Canal Ejecutivo':
      return {
        cabColor: '#0866FF', // Flagship Azul Ejecutivo!
        stripeColor: '#0866FF',
        badgeText: 'C|E CANAL EJECUTIVO',
      };
    case 'Nordline':
      return {
        cabColor: '#F8FAFC',
        stripeColor: '#0D9488',
        badgeText: 'NORDLINE',
      };
    case 'Cargoviva':
      return {
        cabColor: '#F8FAFC',
        stripeColor: '#EA580C',
        badgeText: 'CARGOVIVA',
      };
    case 'Bluepeak':
      return {
        cabColor: '#F8FAFC',
        stripeColor: '#0041AD',
        badgeText: 'BLUEPEAK',
      };
  }
}

export const TruckMesh: React.FC<TruckMeshProps> = ({
  truck,
  site,
  simTimeRef,
  isSelected,
  isDark,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [routePts, setRoutePts] = React.useState<[number, number, number][] | undefined>(
    undefined
  );
  const frameCounterRef = useRef(0);

  const { cabColor, stripeColor } = getCarrierColors(truck.carrier);

  useFrame(() => {
    const pose = computeTruckPose(truck, site, simTimeRef.current);
    if (groupRef.current) {
      groupRef.current.position.set(pose.position[0], pose.position[1], pose.position[2]);
      groupRef.current.rotation.y = pose.rotationY;
    }

    frameCounterRef.current += 1;
    if (frameCounterRef.current % 4 === 0) {
      if ((isSelected || truck.status === 'En ruta') && pose.routePoints) {
        setRoutePts(pose.routePoints);
      } else if (routePts !== undefined) {
        setRoutePts(undefined);
      }
    }
  });

  const initialPose = computeTruckPose(truck, site, simTimeRef.current);

  return (
    <>
      {/* Trajectory Route Line on Asphalt (shown prominently for selected or en-route trucks!) */}
      {routePts && routePts.length >= 2 && (
        <Line
          points={routePts}
          color={isSelected ? '#0866FF' : '#4D8EFF'}
          lineWidth={isSelected ? 4.5 : 2.2}
          dashed={!isSelected}
          dashScale={2}
          dashSize={1.2}
          gapSize={0.7}
        />
      )}

      <group
        ref={groupRef}
        position={initialPose.position}
        rotation={[0, initialPose.rotationY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {/* Chassis Frame */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[2.2, 0.28, 8.8]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>

        {/* Rear Cargo Trailer Box (-Z rear to +1.8) */}
        <group position={[0, 2.28, -1.15]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.56, 3.15, 6.5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.42} />
          </mesh>
          {/* Lower Brand Livery Skirt Stripe */}
          <mesh position={[0, -1.18, 0]}>
            <boxGeometry args={[2.6, 0.68, 6.52]} />
            <meshStandardMaterial color={stripeColor} roughness={0.35} />
          </mesh>
          {/* Side Accent Bar */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[2.59, 0.22, 4.2]} />
            <meshStandardMaterial color={stripeColor} roughness={0.35} />
          </mesh>
          {/* Rear Roll-Up Door Detail */}
          <mesh position={[0, 0, -3.26]}>
            <planeGeometry args={[2.25, 2.75]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.6} />
          </mesh>
        </group>

        {/* Aerodynamic Cab (+Z front) */}
        <group position={[0, 1.68, 3.35]}>
          {/* Cab Main Body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.44, 2.25, 2.15]} />
            <meshStandardMaterial color={cabColor} roughness={0.35} />
          </mesh>
          {/* Roof Wind Deflector Fairing */}
          <mesh position={[0, 1.38, -0.35]} castShadow>
            <boxGeometry args={[2.36, 0.55, 1.35]} />
            <meshStandardMaterial color={cabColor} roughness={0.35} />
          </mesh>
          {/* Dark Windshield + Side Windows */}
          <mesh position={[0, 0.38, 1.09]}>
            <planeGeometry args={[2.16, 0.88]} />
            <meshStandardMaterial color="#0B1630" metalness={0.6} roughness={0.15} />
          </mesh>
          <mesh position={[1.23, 0.38, 0.25]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.25, 0.82]} />
            <meshStandardMaterial color="#0B1630" metalness={0.6} roughness={0.15} />
          </mesh>
          <mesh position={[-1.23, 0.38, 0.25]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.25, 0.82]} />
            <meshStandardMaterial color="#0B1630" metalness={0.6} roughness={0.15} />
          </mesh>
          {/* Front Grille */}
          <mesh position={[0, -0.52, 1.09]}>
            <planeGeometry args={[1.7, 0.62]} />
            <meshStandardMaterial color="#0F172A" />
          </mesh>
          {/* Headlights */}
          <mesh position={[-0.88, -0.68, 1.09]}>
            <boxGeometry args={[0.36, 0.2, 0.06]} />
            <meshBasicMaterial color={isDark ? '#63EDFF' : '#FEF08A'} />
          </mesh>
          <mesh position={[0.88, -0.68, 1.09]}>
            <boxGeometry args={[0.36, 0.2, 0.06]} />
            <meshBasicMaterial color={isDark ? '#63EDFF' : '#FEF08A'} />
          </mesh>
          {/* Side Mirrors */}
          <mesh position={[-1.34, 0.35, 0.85]}>
            <boxGeometry args={[0.12, 0.46, 0.18]} />
            <meshStandardMaterial color="#0B1220" />
          </mesh>
          <mesh position={[1.34, 0.35, 0.85]}>
            <boxGeometry args={[0.12, 0.46, 0.18]} />
            <meshStandardMaterial color="#0B1220" />
          </mesh>
        </group>

        {/* 6 Wheels (Front Steer Axle + Dual Rear Tandem Axles) */}
        {[
          [-1.12, 0.52, 3.35],
          [1.12, 0.52, 3.35],
          [-1.12, 0.52, -1.65],
          [1.12, 0.52, -1.65],
          [-1.12, 0.52, -3.05],
          [1.12, 0.52, -3.05],
        ].map(([wx, wy, wz], idx) => (
          <group key={idx} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.52, 0.52, 0.34, 18]} />
              <meshStandardMaterial color="#0F172A" roughness={0.85} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.26, 0.26, 0.36, 14]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Selection 3D Corner Wireframe Brackets + Floating Blue Label Pill */}
        {isSelected && (
          <>
            <SelectionBrackets
              width={3.15}
              height={4.15}
              depth={9.8}
              centerY={2.1}
              color={isDark ? '#63EDFF' : '#1E293B'}
            />
            <Html position={[0, 4.65, 0]} center distanceFactor={58} zIndexRange={[25, 0]}>
              <div className="ce-3d-tag ce-3d-tag--active">
                <span className="ce-3d-tag__id">{truck.id}</span>
                <span className="ce-3d-tag__status">{truck.status}</span>
              </div>
            </Html>
          </>
        )}
      </group>
    </>
  );
};

