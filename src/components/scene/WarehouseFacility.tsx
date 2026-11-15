import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DockBay, SelectedObject, WarehouseSite } from '../../types/logistics';
import { PalletUnit, StagingCluster } from './PalletCluster';

interface WarehouseFacilityProps {
  site: WarehouseSite;
  isActiveSite: boolean;
  isDark: boolean;
  selectedObject: SelectedObject;
  onSelectSite: () => void;
  onSelectDock: (dock: DockBay) => void;
  onSelectStaging: (stagingId: string) => void;
}

const StylizedTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.65, 0]} castShadow>
      <cylinderGeometry args={[0.14, 0.2, 1.3, 8]} />
      <meshStandardMaterial color="#7C5836" roughness={0.9} />
    </mesh>
    <mesh position={[0, 1.9, 0]} castShadow>
      <sphereGeometry args={[0.98, 16, 16]} />
      <meshStandardMaterial color="#58B368" roughness={0.75} />
    </mesh>
    <mesh position={[0.25, 2.35, 0.15]} castShadow>
      <sphereGeometry args={[0.65, 14, 14]} />
      <meshStandardMaterial color="#6FD07C" roughness={0.72} />
    </mesh>
  </group>
);

const FenceSegment: React.FC<{
  start: [number, number];
  end: [number, number];
  isDark: boolean;
}> = ({ start, end, isDark }) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const len = Math.hypot(dx, dz);
  const cx = (start[0] + end[0]) / 2;
  const cz = (start[1] + end[1]) / 2;
  const angle = Math.atan2(dx, dz);
  const postCount = Math.max(2, Math.floor(len / 5.5));
  const metalColor = isDark ? '#475569' : '#64748B';

  return (
    <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
      {/* Top & bottom horizontal rails */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.06, 0.06, len]} />
        <meshStandardMaterial color={metalColor} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.05, 0.05, len]} />
        <meshStandardMaterial color={metalColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Semi-transparent wire mesh panel */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.02, 1.3, len]} />
        <meshStandardMaterial
          color={metalColor}
          transparent
          opacity={0.16}
          roughness={0.5}
        />
      </mesh>
      {/* Fence posts */}
      {Array.from({ length: postCount + 1 }).map((_, idx) => {
        const zPos = -len / 2 + (idx / postCount) * len;
        return (
          <mesh key={idx} position={[0, 0.85, zPos]} castShadow>
            <boxGeometry args={[0.1, 1.7, 0.1]} />
            <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

export const WarehouseFacility: React.FC<WarehouseFacilityProps> = ({
  site,
  isActiveSite,
  isDark,
  selectedObject,
  onSelectSite,
  onSelectDock,
  onSelectStaging,
}) => {
  const [sx, , sz] = site.position;
  const bw = site.buildingWidth;
  const bd = site.buildingDepth;
  const bh = site.buildingHeight;
  const buildingLocalZ = -11;
  const dockFaceLocalZ = buildingLocalZ + bd / 2;

  const wallColor = isDark ? '#1E293B' : '#F8FAFC';
  const roofColor = isDark ? '#0F172A' : '#E2E8F0';
  const padColor = isDark ? '#0F1B33' : '#F4F7FB';
  const apronColor = isDark ? '#13223E' : '#FFFFFF';

  return (
    <group position={[sx, 0, sz]}>
      {/* Concrete Parcel Base */}
      <mesh position={[0, 0.06, 2]} receiveShadow onClick={onSelectSite}>
        <boxGeometry args={[76, 0.12, 56]} />
        <meshStandardMaterial color={padColor} roughness={0.92} />
      </mesh>

      {/* Reinforced Concrete Truck Apron in front of docks */}
      <mesh position={[0, 0.13, dockFaceLocalZ + 12.5]} receiveShadow onClick={onSelectSite}>
        <boxGeometry args={[bw + 16, 0.04, 25]} />
        <meshStandardMaterial color={apronColor} roughness={0.86} />
      </mesh>

      {/* Active Site Subtle Ground Highlight Border */}
      {isActiveSite && (
        <lineSegments position={[0, 0.15, 2]}>
          <edgesGeometry args={[new THREE.BoxGeometry(76.2, 0.04, 56.2)]} />
          <lineBasicMaterial color="#0866FF" />
        </lineSegments>
      )}

      {/* Main Warehouse Volume */}
      <group position={[0, 0, buildingLocalZ]}>
        {/* Main structural walls */}
        <mesh position={[0, bh / 2 + 0.12, 0]} castShadow receiveShadow onClick={onSelectSite}>
          <boxGeometry args={[bw, bh, bd]} />
          <meshStandardMaterial color={wallColor} roughness={0.65} />
        </mesh>

        {/* Flat Industrial Roof with recessed membrane */}
        <mesh position={[0, bh + 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[bw + 0.5, 0.28, bd + 0.5]} />
          <meshStandardMaterial color={roofColor} roughness={0.75} />
        </mesh>

        {/* Signature Canal Ejecutivo Azul Ejecutivo (#0866FF) Roof Fascia Band */}
        <mesh position={[0, bh - 0.15, 0]}>
          <boxGeometry args={[bw + 0.65, 0.55, bd + 0.65]} />
          <meshStandardMaterial color="#0866FF" roughness={0.35} />
        </mesh>

        {/* Corner Vertical Brand Pilasters (#0866FF) */}
        {[
          [-bw / 2, -bd / 2],
          [bw / 2, -bd / 2],
          [-bw / 2, bd / 2],
          [bw / 2, bd / 2],
        ].map(([cx, cz], i) => (
          <mesh key={i} position={[cx, bh / 2 + 0.12, cz]}>
            <boxGeometry args={[0.45, bh, 0.45]} />
            <meshStandardMaterial color="#0866FF" roughness={0.4} />
          </mesh>
        ))}

        {/* Rooftop HVAC Units & Skylights */}
        {[-bw * 0.28, 0, bw * 0.28].map((rx, idx) => (
          <group key={idx} position={[rx, bh + 0.65, -bd * 0.18]}>
            <mesh castShadow>
              <boxGeometry args={[3.4, 0.75, 2.4]} />
              <meshStandardMaterial color={isDark ? '#334155' : '#CBD5E1'} roughness={0.6} />
            </mesh>
            <mesh position={[-0.8, 0.42, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.12, 16]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.8, 0.42, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.12, 16]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
          </group>
        ))}

        {site.hasSkylights &&
          [-14, -5, 5, 14].map((kx, idx) => (
            <mesh key={idx} position={[kx, bh + 0.38, 3]}>
              <boxGeometry args={[5.5, 0.12, 4.2]} />
              <meshStandardMaterial
                color="#63EDFF"
                emissive="#0866FF"
                emissiveIntensity={isDark ? 0.65 : 0.2}
                roughness={0.2}
              />
            </mesh>
          ))}

        {/* Optional Glass Curtain-Wall Office Annex (matches Northgate DC in video!) */}
        {site.hasGlassOffice && (
          <group position={[-bw / 2 - 4.2, 0, bd * 0.14]}>
            <mesh position={[0, 2.9, 0]} castShadow receiveShadow>
              <boxGeometry args={[8.4, 5.6, bd * 0.68]} />
              <meshStandardMaterial
                color="#0866FF"
                metalness={0.55}
                roughness={0.18}
              />
            </mesh>
            {/* White Architectural Mullion Grid */}
            {[-2.5, 0, 2.5].map((mx, i) => (
              <mesh key={i} position={[mx, 2.9, bd * 0.34 + 0.04]}>
                <boxGeometry args={[0.12, 5.5, 0.08]} />
                <meshStandardMaterial color="#F8FAFC" />
              </mesh>
            ))}
            {[1.6, 3.2, 4.6].map((my, i) => (
              <mesh key={i} position={[0, my, bd * 0.34 + 0.04]}>
                <boxGeometry args={[8.45, 0.1, 0.08]} />
                <meshStandardMaterial color="#F8FAFC" />
              </mesh>
            ))}
            <mesh position={[0, 5.75, 0]}>
              <boxGeometry args={[8.7, 0.3, bd * 0.72]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>
          </group>
        )}

        {/* Optional Cold-Chain Cryo Silos & Side Chiller Annex (matches Eastport Cold Chain in video!) */}
        {site.hasColdSilos && (
          <group position={[-bw / 2 - 3.8, 0, -2]}>
            {[-4.2, -1.4, 1.4].map((szPos, idx) => (
              <group key={idx} position={[0, 0, szPos]}>
                <mesh position={[0, 3.4, 0]} castShadow>
                  <cylinderGeometry args={[1.15, 1.15, 6.6, 20]} />
                  <meshStandardMaterial color="#E2E8F0" metalness={0.35} roughness={0.4} />
                </mesh>
                <mesh position={[0, 5.2, 0]}>
                  <cylinderGeometry args={[1.18, 1.18, 0.45, 20]} />
                  <meshStandardMaterial color="#0866FF" />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* Building Facade Brand Badge (Official Canal Ejecutivo Identity) */}
        <Html
          position={[0, bh + 1.5, bd / 2]}
          center
          distanceFactor={68}
          zIndexRange={[10, 0]}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSite();
            }}
            className={`ce-site-pill ${isActiveSite ? 'ce-site-pill--active' : ''}`}
          >
            <span className="ce-site-pill__code">{site.id}</span>
            <span className="ce-site-pill__name">{site.name}</span>
          </button>
        </Html>

        {/* Numbered Dock Bays along +Z Front Wall */}
        {site.docks.map((dock) => {
          const isDockSelected =
            selectedObject?.type === 'dock' && selectedObject.id === dock.id;
          const portalColor = isDockSelected
            ? '#63EDFF'
            : dock.status === 'Ocupado'
            ? '#0866FF'
            : dock.status === 'Reservado'
            ? '#4D8EFF'
            : '#94A3B8';

          return (
            <group
              key={dock.id}
              position={[dock.localX, 0, bd / 2]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDock(dock);
              }}
            >
              {/* Blue Dock Portal Frame (left, right, top lintel) */}
              <mesh position={[-1.95, 2.25, 0.14]} castShadow>
                <boxGeometry args={[0.32, 4.3, 0.34]} />
                <meshStandardMaterial color={portalColor} roughness={0.35} />
              </mesh>
              <mesh position={[1.95, 2.25, 0.14]} castShadow>
                <boxGeometry args={[0.32, 4.3, 0.34]} />
                <meshStandardMaterial color={portalColor} roughness={0.35} />
              </mesh>
              <mesh position={[0, 4.35, 0.14]} castShadow>
                <boxGeometry args={[4.22, 0.36, 0.36]} />
                <meshStandardMaterial color={portalColor} roughness={0.35} />
              </mesh>

              {/* Safety Yellow/Black Dock Bumpers */}
              <mesh position={[-1.75, 0.65, 0.32]}>
                <boxGeometry args={[0.22, 0.9, 0.25]} />
                <meshStandardMaterial color="#0B1220" />
              </mesh>
              <mesh position={[1.75, 0.65, 0.32]}>
                <boxGeometry args={[0.22, 0.9, 0.25]} />
                <meshStandardMaterial color="#0B1220" />
              </mesh>

              {/* Interior Recess Cavity + Staged Pallet Inside Open Bay (exact match to video!) */}
              <mesh position={[0, 2.15, -0.02]}>
                <planeGeometry args={[3.58, 4.05]} />
                <meshStandardMaterial color={isDark ? '#091326' : '#CBD5E1'} />
              </mesh>

              {/* Roll-up sectional door (partially or fully raised) */}
              {dock.doorOpen < 0.95 && (
                <mesh
                  position={[
                    0,
                    4.15 - ((1 - dock.doorOpen) * 3.9) / 2,
                    0.08,
                  ]}
                >
                  <boxGeometry args={[3.55, (1 - dock.doorOpen) * 3.9, 0.08]} />
                  <meshStandardMaterial color="#E2E8F0" roughness={0.6} />
                </mesh>
              )}

              {/* Visible Pallet Inside Open Bay */}
              {dock.doorOpen >= 0.6 && (
                <PalletUnit
                  position={[0, 0.12, -1.1]}
                  variant={dock.status === 'Ocupado' ? 'kraft' : 'blue'}
                  heightScale={1.05}
                />
              )}

              {/* Dock Number Sign Badge above portal (E1, B1, F1...) */}
              <mesh position={[0, 5.05, 0.16]}>
                <boxGeometry args={[1.15, 0.62, 0.1]} />
                <meshStandardMaterial color="#0866FF" />
              </mesh>

              {/* Painted Yellow Apron Parking Lane Lines */}
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[-1.95, 0.16, 6.2]}
              >
                <planeGeometry args={[0.14, 11.2]} />
                <meshBasicMaterial
                  color={isDockSelected ? '#0866FF' : '#F59E0B'}
                  transparent
                  opacity={0.65}
                />
              </mesh>
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[1.95, 0.16, 6.2]}
              >
                <planeGeometry args={[0.14, 11.2]} />
                <meshBasicMaterial
                  color={isDockSelected ? '#0866FF' : '#F59E0B'}
                  transparent
                  opacity={0.65}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Forklift EV Charging Pedestals on Left Apron (exact match to frame_007!) */}
      <group position={[-28.5, 0.14, dockFaceLocalZ + 5.5]}>
        {[-2.2, 0, 2.2].map((zOff, idx) => (
          <group key={idx} position={[0, 0, zOff]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <boxGeometry args={[0.75, 1.7, 0.95]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
            </mesh>
            <mesh position={[0.39, 1.15, 0]}>
              <boxGeometry args={[0.05, 0.35, 0.55]} />
              <meshBasicMaterial color="#12B76A" />
            </mesh>
          </group>
        ))}
        {/* Subtle green EV charging pad glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.1, 0.02, 0]}>
          <planeGeometry args={[4.2, 6.8]} />
          <meshBasicMaterial color="#12B76A" transparent opacity={0.14} />
        </mesh>
      </group>

      {/* Staging Pallet Clusters + Floating Blue 3D Pins */}
      {site.stagingZones.map((zone) => (
        <StagingCluster
          key={zone.id}
          id={zone.id}
          label={zone.label}
          palletsCount={zone.pallets}
          position={[zone.localPos[0], 0.14, zone.localPos[2]]}
          variant={zone.variant}
          isSelected={
            selectedObject?.type === 'staging' && selectedObject.id === zone.id
          }
          onSelect={() => onSelectStaging(zone.id)}
        />
      ))}

      {/* Perimeter Fence along Front Road (with open Vehicle Gate on the right!) */}
      <FenceSegment start={[-37.5, 29.5]} end={[16, 29.5]} isDark={isDark} />
      <FenceSegment start={[31.5, 29.5]} end={[37.5, 29.5]} isDark={isDark} />
      <FenceSegment start={[-37.5, -25.5]} end={[-37.5, 29.5]} isDark={isDark} />

      {/* Stylized Sidewalk Trees along the Avenue */}
      {[-33, -20, -7, 6, 35].map((tx, idx) => (
        <StylizedTree
          key={idx}
          position={[tx, 0, 31.2]}
          scale={0.85 + (idx % 2) * 0.14}
        />
      ))}
    </group>
  );
};

