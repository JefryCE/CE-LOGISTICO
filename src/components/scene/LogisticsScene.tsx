import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  DockBay,
  ForkliftEntity,
  SelectedObject,
  SiteId,
  TruckEntity,
  ViewScope,
  WarehouseSite,
} from '../../types/logistics';
import { DeviceType } from '../../hooks/useViewport';
import { NETWORK_CAMERA_PRESET } from '../../data/logisticsData';
import { computeForkliftPose, computeTruckPose, getDockFaceZ } from '../../utils/kinematics';
import { WarehouseFacility } from './WarehouseFacility';
import { TruckMesh } from './TruckMesh';
import { ForkliftMesh } from './ForkliftMesh';

export interface CameraCommand {
  seq: number;
  type: 'zoomIn' | 'zoomOut' | 'rotateLeft' | 'rotateRight' | 'reset' | 'focusObject';
}

interface LogisticsSceneProps {
  sites: WarehouseSite[];
  trucks: TruckEntity[];
  forklifts: ForkliftEntity[];
  viewScope: ViewScope;
  selectedObject: SelectedObject;
  followTarget: boolean;
  isPaused: boolean;
  simSpeed: number;
  isDark: boolean;
  deviceType: DeviceType;
  viewportAspect: number;
  cameraCommand: CameraCommand | null;
  onSelectSite: (siteId: SiteId) => void;
  onSelectObject: (obj: SelectedObject, siteId?: SiteId) => void;
}

const RoadStrip: React.FC<{
  center: [number, number];
  length: number;
  width?: number;
  horizontal?: boolean;
  isDark: boolean;
}> = ({ center, length, width = 10.5, horizontal = true, isDark }) => {
  const dashCount = Math.floor(length / 6);
  const asphalt = isDark ? '#16233B' : '#CBD5E1';
  const shoulder = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <group
      position={[center[0], 0.03, center[1]]}
      rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}
    >
      {/* Sidewalk / Curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[length + 2, width + 2.2]} />
        <meshStandardMaterial color={shoulder} roughness={0.9} />
      </mesh>
      {/* Asphalt Roadway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial color={asphalt} roughness={0.85} />
      </mesh>
      {/* Center Dashed White Lane Dividers */}
      {Array.from({ length: dashCount }).map((_, i) => {
        const x = -length / 2 + 3 + i * 6;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, 0]}>
            <planeGeometry args={[2.6, 0.2]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
};

interface SceneUpdaterProps extends LogisticsSceneProps {
  simTimeRef: React.MutableRefObject<number>;
}

const CameraAndClockController: React.FC<SceneUpdaterProps> = ({
  sites,
  trucks,
  forklifts,
  viewScope,
  selectedObject,
  followTarget,
  isPaused,
  simSpeed,
  deviceType,
  viewportAspect,
  cameraCommand,
  simTimeRef,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const desiredPos = useRef(new THREE.Vector3(-92, 27, 94));
  const desiredTarget = useRef(new THREE.Vector3(-54, 2, 54));
  const isTweening = useRef(true);
  const lastCmdSeq = useRef(0);

  // Pull camera slightly back on portrait / narrow viewports so full facilities stay framed
  const distScale =
    viewportAspect < 0.75 ? 1.42 : viewportAspect < 1.15 ? 1.2 : 1;

  // Dynamically adapt FOV by device type
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov =
        deviceType === 'mobile' && viewportAspect < 1
          ? 48
          : deviceType === 'tablet'
          ? 42
          : 36;
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }
  }, [camera, deviceType, viewportAspect]);

  const applyScaledPreset = (
    pos: [number, number, number],
    target: [number, number, number]
  ) => {
    const tVec = new THREE.Vector3(...target);
    const pVec = new THREE.Vector3(...pos);
    const offset = pVec.sub(tVec).multiplyScalar(distScale);
    desiredTarget.current.copy(tVec);
    desiredPos.current.copy(tVec).add(offset);
  };

  // Trigger camera glide when switching site / network scope
  useEffect(() => {
    if (viewScope === 'ALL') {
      applyScaledPreset(
        NETWORK_CAMERA_PRESET.position,
        NETWORK_CAMERA_PRESET.target
      );
      isTweening.current = true;
      return;
    }
    const site = sites.find((s) => s.id === viewScope);
    if (site) {
      applyScaledPreset(site.cameraPreset.position, site.cameraPreset.target);
      isTweening.current = true;
    }
  }, [viewScope, sites, distScale]);

  // Trigger subtle focus glide when selecting a specific entity
  useEffect(() => {
    if (!selectedObject) return;

    if (selectedObject.type === 'truck') {
      const t = trucks.find((item) => item.id === selectedObject.id);
      const site = sites.find((s) => s.id === t?.siteId);
      if (t && site) {
        const pose = computeTruckPose(t, site, simTimeRef.current);
        desiredTarget.current.set(pose.position[0], 1.8, pose.position[2]);
        desiredPos.current.set(
          pose.position[0] - 24,
          19,
          pose.position[2] + 28
        );
        isTweening.current = true;
      }
    } else if (selectedObject.type === 'forklift') {
      const f = forklifts.find((item) => item.id === selectedObject.id);
      const site = sites.find((s) => s.id === f?.siteId);
      if (f && site) {
        const pose = computeForkliftPose(f, site, simTimeRef.current);
        desiredTarget.current.set(pose.position[0], 1.4, pose.position[2]);
        desiredPos.current.set(
          pose.position[0] - 18,
          15,
          pose.position[2] + 22
        );
        isTweening.current = true;
      }
    } else if (selectedObject.type === 'dock') {
      const site = sites.find((s) => s.docks.some((d) => d.id === selectedObject.id));
      const dock = site?.docks.find((d) => d.id === selectedObject.id);
      if (site && dock) {
        const dz = getDockFaceZ(site);
        const wx = site.position[0] + dock.localX;
        desiredTarget.current.set(wx, 2.2, dz + 2);
        desiredPos.current.set(wx - 20, 17, dz + 25);
        isTweening.current = true;
      }
    } else if (selectedObject.type === 'staging') {
      const site = sites.find((s) =>
        s.stagingZones.some((z) => z.id === selectedObject.id)
      );
      const zone = site?.stagingZones.find((z) => z.id === selectedObject.id);
      if (site && zone) {
        const wx = site.position[0] + zone.localPos[0];
        const wz = site.position[2] + zone.localPos[2];
        desiredTarget.current.set(wx, 1.5, wz);
        desiredPos.current.set(wx - 18, 15, wz + 20);
        isTweening.current = true;
      }
    }
  }, [selectedObject]);

  // Handle toolbar button commands (+, -, rotateLeft, rotateRight, reset, focusObject)
  useEffect(() => {
    if (!cameraCommand || cameraCommand.seq === lastCmdSeq.current) return;
    lastCmdSeq.current = cameraCommand.seq;
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const offset = camera.position.clone().sub(ctrl.target);

    if (cameraCommand.type === 'zoomIn') {
      offset.multiplyScalar(0.76);
      if (offset.length() < 12) offset.setLength(12);
      desiredTarget.current.copy(ctrl.target);
      desiredPos.current.copy(ctrl.target).add(offset);
      isTweening.current = true;
    } else if (cameraCommand.type === 'zoomOut') {
      offset.multiplyScalar(1.3);
      if (offset.length() > 230) offset.setLength(230);
      desiredTarget.current.copy(ctrl.target);
      desiredPos.current.copy(ctrl.target).add(offset);
      isTweening.current = true;
    } else if (cameraCommand.type === 'rotateLeft' || cameraCommand.type === 'rotateRight') {
      const angle = cameraCommand.type === 'rotateLeft' ? Math.PI / 4 : -Math.PI / 4;
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      desiredTarget.current.copy(ctrl.target);
      desiredPos.current.copy(ctrl.target).add(offset);
      isTweening.current = true;
    } else if (cameraCommand.type === 'reset') {
      if (viewScope === 'ALL') {
        applyScaledPreset(
          NETWORK_CAMERA_PRESET.position,
          NETWORK_CAMERA_PRESET.target
        );
      } else {
        const site = sites.find((s) => s.id === viewScope) || sites[0];
        applyScaledPreset(site.cameraPreset.position, site.cameraPreset.target);
      }
      isTweening.current = true;
    } else if (cameraCommand.type === 'focusObject' && selectedObject) {
      if (selectedObject.type === 'truck') {
        const t = trucks.find((item) => item.id === selectedObject.id);
        const site = sites.find((s) => s.id === t?.siteId);
        if (t && site) {
          const pose = computeTruckPose(t, site, simTimeRef.current);
          desiredTarget.current.set(pose.position[0], 1.8, pose.position[2]);
          desiredPos.current.set(pose.position[0] - 20, 16, pose.position[2] + 24);
          isTweening.current = true;
        }
      }
    }
  }, [cameraCommand, camera, viewScope, sites, selectedObject, trucks]);

  useFrame((_, delta) => {
    if (!isPaused) {
      simTimeRef.current += delta * simSpeed;
    }

    const ctrl = controlsRef.current;
    if (!ctrl) return;

    // Continuous Follow-Camera mode for moving vehicles
    if (followTarget && selectedObject?.type === 'truck') {
      const t = trucks.find((item) => item.id === selectedObject.id);
      const site = sites.find((s) => s.id === t?.siteId);
      if (t && site) {
        const pose = computeTruckPose(t, site, simTimeRef.current);
        const targetVec = new THREE.Vector3(pose.position[0], 1.8, pose.position[2]);
        const deltaMove = targetVec.clone().sub(ctrl.target);
        ctrl.target.lerp(targetVec, 0.12);
        camera.position.addScaledVector(deltaMove, 0.12);
        ctrl.update();
        return;
      }
    }

    if (isTweening.current) {
      const lerpFactor = Math.min(1, delta * 4.5);
      camera.position.lerp(desiredPos.current, lerpFactor);
      ctrl.target.lerp(desiredTarget.current, lerpFactor);
      ctrl.update();

      if (
        camera.position.distanceTo(desiredPos.current) < 0.25 &&
        ctrl.target.distanceTo(desiredTarget.current) < 0.25
      ) {
        isTweening.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.15}
      minPolarAngle={0.25}
      minDistance={12}
      maxDistance={280}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      onStart={() => {
        isTweening.current = false;
      }}
    />
  );
};

export const LogisticsScene: React.FC<LogisticsSceneProps> = (props) => {
  const {
    sites,
    trucks,
    forklifts,
    viewScope,
    selectedObject,
    isDark,
    deviceType,
    onSelectSite,
    onSelectObject,
  } = props;
  const simTimeRef = useRef(0);

  const groundColor = isDark ? '#071124' : '#E6ECF5';
  const fogColor = isDark ? '#050D1F' : '#E9EFF7';

  return (
    <div className="ce-canvas-wrap">
      <Canvas
        shadows
        dpr={deviceType === 'mobile' ? [1, 1.5] : [1, 2]}
        camera={{ position: [-92, 27, 94], fov: 36, near: 0.5, far: 650 }}
        onPointerMissed={() => onSelectObject(null)}
      >
        <color attach="background" args={[fogColor]} />
        <fog attach="fog" args={[fogColor, 175, 420]} />

        {/* Architectural Diorama Lighting */}
        <ambientLight intensity={isDark ? 0.65 : 0.85} color={isDark ? '#B9D1FF' : '#FFFFFF'} />
        <hemisphereLight
          args={[isDark ? '#1E3158' : '#FFFFFF', isDark ? '#050D1F' : '#CBD5E1', isDark ? 0.55 : 0.65]}
        />
        <directionalLight
          position={[-65, 95, 75]}
          intensity={isDark ? 0.95 : 1.35}
          color={isDark ? '#DCE8FF' : '#FFFDF9'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
          shadow-bias={-0.0004}
        />

        {/* Infinite Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[900, 900]} />
          <meshStandardMaterial color={groundColor} roughness={0.96} />
        </mesh>

        {/* Connected Industrial Park Road Network */}
        <RoadStrip center={[0, 79.5]} length={250} horizontal isDark={isDark} />
        <RoadStrip center={[0, -2.5]} length={250} horizontal isDark={isDark} />
        <RoadStrip center={[0, -84.5]} length={250} horizontal isDark={isDark} />
        <RoadStrip center={[0, -2.5]} length={176} horizontal={false} isDark={isDark} />
        <RoadStrip center={[-106, -2.5]} length={176} horizontal={false} isDark={isDark} />
        <RoadStrip center={[106, -2.5]} length={176} horizontal={false} isDark={isDark} />

        {/* 5 Logistics Facilities */}
        {sites.map((site) => (
          <WarehouseFacility
            key={site.id}
            site={site}
            isActiveSite={viewScope === site.id}
            isDark={isDark}
            selectedObject={selectedObject}
            onSelectSite={() => {
              onSelectSite(site.id);
              onSelectObject(null, site.id);
            }}
            onSelectDock={(dock: DockBay) =>
              onSelectObject({ type: 'dock', id: dock.id }, site.id)
            }
            onSelectStaging={(stagingId: string) =>
              onSelectObject({ type: 'staging', id: stagingId }, site.id)
            }
          />
        ))}

        {/* Live Fleet of 14 Trucks */}
        {trucks.map((truck) => {
          const site = sites.find((s) => s.id === truck.siteId);
          if (!site) return null;
          const isSelected =
            selectedObject?.type === 'truck' && selectedObject.id === truck.id;
          return (
            <TruckMesh
              key={truck.id}
              truck={truck}
              site={site}
              simTimeRef={simTimeRef}
              isSelected={isSelected}
              isDark={isDark}
              onSelect={() => onSelectObject({ type: 'truck', id: truck.id }, site.id)}
            />
          );
        })}

        {/* Live Fleet of 16 Forklifts */}
        {forklifts.map((forklift) => {
          const site = sites.find((s) => s.id === forklift.siteId);
          if (!site) return null;
          const isSelected =
            selectedObject?.type === 'forklift' && selectedObject.id === forklift.id;
          return (
            <ForkliftMesh
              key={forklift.id}
              forklift={forklift}
              site={site}
              simTimeRef={simTimeRef}
              isSelected={isSelected}
              isDark={isDark}
              onSelect={() =>
                onSelectObject({ type: 'forklift', id: forklift.id }, site.id)
              }
            />
          );
        })}

        <CameraAndClockController {...props} simTimeRef={simTimeRef} />
      </Canvas>
    </div>
  );
};

