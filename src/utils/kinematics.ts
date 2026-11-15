import { ForkliftEntity, TruckEntity, WarehouseSite } from '../types/logistics';

export interface Pose3D {
  position: [number, number, number];
  rotationY: number;
  routePoints?: [number, number, number][];
}

export function getDockFaceZ(site: WarehouseSite): number {
  const buildingZ = site.position[2] - 11;
  return buildingZ + site.buildingDepth / 2;
}

/**
 * Computes exact live 3D pose and remaining trajectory polyline for any truck.
 * Truck model faces +Z when rotationY = 0 (cab at +Z, cargo rear at -Z).
 */
export function computeTruckPose(
  truck: TruckEntity,
  site: WarehouseSite,
  simTime: number
): Pose3D {
  const [sx, , sz] = site.position;
  const dockFaceZ = getDockFaceZ(site);
  const dockedZ = dockFaceZ + 5.1;
  const bayX = sx + truck.bayLocalX;
  const roadZ = sz + 35.5;
  const gateX = sx + 25;

  if (truck.status === 'Cargando' || truck.status === 'Descargando') {
    return {
      position: [bayX, 0, dockedZ],
      rotationY: 0,
    };
  }

  if (truck.status === 'Aculando') {
    // Smooth back-and-hold maneuver into the assigned dock bay
    const cycle = (simTime * 0.085 + truck.routePhase) % 1;
    // Ease in-out maneuver from apron lane (z = dockFaceZ + 17) to dockedZ + 1.2
    const t = cycle < 0.75 ? cycle / 0.75 : 1 - (cycle - 0.75) / 0.25 * 0.15;
    const smooth = t * t * (3 - 2 * t);
    const startX = bayX + 4.2;
    const startZ = dockFaceZ + 16.5;
    const endX = bayX;
    const endZ = dockedZ + 0.9;

    const curX = startX + (endX - startX) * smooth;
    const curZ = startZ + (endZ - startZ) * smooth;
    const yaw = Math.sin((1 - smooth) * Math.PI) * 0.32;

    return {
      position: [curX, 0, curZ],
      rotationY: yaw,
      routePoints: [
        [curX, 0.12, curZ - 3.5],
        [bayX, 0.12, dockedZ],
      ],
    };
  }

  // En ruta: drives along the front avenue (+X direction) -> turns into gate -> approaches apron
  const waypoints: [number, number][] = [
    [sx - 44, roadZ],
    [sx - 12, roadZ],
    [gateX, roadZ],
    [gateX, sz + 20],
    [bayX, sz + 18],
  ];

  // Compute cumulative lengths
  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1][0] - waypoints[i][0];
    const dz = waypoints[i + 1][1] - waypoints[i][1];
    const len = Math.hypot(dx, dz);
    segLengths.push(len);
    totalLen += len;
  }

  const u = (simTime * 0.038 + truck.routePhase) % 1;
  const targetDist = u * totalLen;

  let acc = 0;
  let segIdx = 0;
  let localT = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (targetDist <= acc + segLengths[i] || i === segLengths.length - 1) {
      segIdx = i;
      localT = segLengths[i] > 0 ? (targetDist - acc) / segLengths[i] : 0;
      break;
    }
    acc += segLengths[i];
  }

  const p0 = waypoints[segIdx];
  const p1 = waypoints[segIdx + 1];
  const x = p0[0] + (p1[0] - p0[0]) * localT;
  const z = p0[1] + (p1[1] - p0[1]) * localT;
  const rotationY = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);

  // Build remaining trajectory polyline to the dock bay
  const routePoints: [number, number, number][] = [[x, 0.12, z]];
  for (let j = segIdx + 1; j < waypoints.length; j++) {
    routePoints.push([waypoints[j][0], 0.12, waypoints[j][1]]);
  }
  routePoints.push([bayX, 0.12, dockedZ]);

  return {
    position: [x, 0, z],
    rotationY,
    routePoints,
  };
}

/**
 * Computes live 3D pose + fork height for any forklift.
 */
export function computeForkliftPose(
  forklift: ForkliftEntity,
  site: WarehouseSite,
  simTime: number
): { position: [number, number, number]; rotationY: number; forkHeight: number; hasLoad: boolean } {
  const [sx, , sz] = site.position;
  const dockFaceZ = getDockFaceZ(site);

  if (forklift.status === 'Recargando' || forklift.status === 'Disponible') {
    const slotOffset = forklift.status === 'Recargando' ? 0 : 3.2;
    return {
      position: [sx - 27 + slotOffset, 0, dockFaceZ + 5.5],
      rotationY: Math.PI / 2,
      forkHeight: 0.18,
      hasLoad: false,
    };
  }

  // Active loading/unloading shuttle between inside warehouse rack zone and yard/bay staging
  const speed = 0.22;
  const raw = (simTime * speed + forklift.laneIndex * 0.37) % 2;
  const goingOut = raw < 1;
  const t = goingOut ? raw : 2 - raw;
  const smooth = t * t * (3 - 2 * t);

  const zInside = dockFaceZ - 4.2;
  const zApron = dockFaceZ + 11.8;
  const curZ = zInside + (zApron - zInside) * smooth;
  // Offset slightly beside the docked truck so forklifts shuttle visibly along the apron & into open bays!
  const curX = sx + forklift.bayLocalX + 3.1;
  const rotationY = goingOut ? 0 : Math.PI;
  const forkHeight = 0.22 + Math.sin(smooth * Math.PI) * 0.35;
  const hasLoad = forklift.status === 'Cargando' ? goingOut : !goingOut;

  return {
    position: [curX, 0, curZ],
    rotationY,
    forkHeight,
    hasLoad,
  };
}

