export type SiteId = 'CD-01' | 'CD-02' | 'CD-03' | 'CD-04' | 'CD-05';
export type ViewScope = SiteId | 'ALL';

export type TruckStatus = 'En ruta' | 'Aculando' | 'Cargando' | 'Descargando';
export type ForkliftStatus = 'Cargando' | 'Descargando' | 'Recargando' | 'Disponible';
export type DockStatus = 'Ocupado' | 'Reservado' | 'Disponible';
export type StockLevelStatus = 'En stock' | 'Stock bajo';

export type CarrierBrand = 'Canal Ejecutivo' | 'Nordline' | 'Cargoviva' | 'Bluepeak';

export interface InventoryItem {
  id: string;
  name: string;
  units: number;
  status: StockLevelStatus;
  iconType: 'box' | 'cold' | 'blueCube';
}

export interface DockBay {
  id: string;
  code: string; // e.g., "Ent. 1", "Sal. 2", "Bahía 1"
  shortLabel: string; // e.g., "E1", "S2", "B1"
  siteId: SiteId;
  status: DockStatus;
  truckId?: string;
  doorOpen: number; // 0..1
  localX: number; // X offset relative to warehouse center
}

export interface ShipmentStep {
  label: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export interface TruckEntity {
  id: string;
  carrier: CarrierBrand;
  driver: string;
  plate: string;
  siteId: SiteId;
  bayCode: string;
  bayLocalX: number;
  status: TruckStatus;
  palletsDone: number;
  palletsTotal: number;
  weightTons: number;
  shipmentId: string;
  customer: string;
  destination: string;
  etaText: string;
  remainingText: string;
  speedKmh: number;
  progress: number; // 0..1
  routePhase: number; // 0..1 for moving trucks
  steps: ShipmentStep[];
}

export interface ForkliftEntity {
  id: string;
  siteId: SiteId;
  taskLabel: string;
  status: ForkliftStatus;
  batteryPct: number;
  progressPct: number;
  bayLocalX: number;
  laneIndex: number;
  carryingBluePallet?: boolean;
}

export interface StagingZone {
  id: string;
  siteId: SiteId;
  label: string;
  pallets: number;
  skuSummary: string;
  localPos: [number, number, number];
  variant: 'mixed' | 'blue' | 'cold';
}

export interface WarehouseSite {
  id: SiteId;
  name: string;
  typeLabel: string;
  address: string;
  position: [number, number, number]; // World [x, y, z]
  buildingWidth: number;
  buildingDepth: number;
  buildingHeight: number;
  hasGlassOffice?: boolean;
  hasColdSilos?: boolean;
  hasSkylights?: boolean;
  stockCurrent: number;
  stockCapacity: number;
  stockDelta: number;
  trucksDelta: number;
  onTimePct: number;
  onTimeDelta: number;
  outboundToday: number;
  putAwaysToday: number;
  stagedCount: number;
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
  docks: DockBay[];
  inventory: InventoryItem[];
  stagingZones: StagingZone[];
}

export type SelectedObject =
  | { type: 'truck'; id: string }
  | { type: 'forklift'; id: string }
  | { type: 'dock'; id: string }
  | { type: 'staging'; id: string }
  | null;

