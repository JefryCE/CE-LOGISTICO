import React from 'react';
import {
  BatteryCharging,
  Box,
  Building2,
  Crosshair,
  Home,
  Minus,
  Navigation,
  PackageCheck,
  Plus,
  RotateCcw,
  RotateCw,
  Snowflake,
  Truck,
  X,
} from 'lucide-react';
import {
  ForkliftEntity,
  SelectedObject,
  TruckEntity,
  WarehouseSite,
} from '../../types/logistics';
import { CameraCommand } from '../scene/LogisticsScene';

interface RightInspectorPanelProps {
  activeSite: WarehouseSite;
  trucks: TruckEntity[];
  forklifts: ForkliftEntity[];
  selectedObject: SelectedObject;
  followTarget: boolean;
  embedded?: boolean;
  onToggleFollow: () => void;
  onClearSelection: () => void;
  onCameraAction: (type: CameraCommand['type']) => void;
  onAdvanceTruckStep: (truckId: string) => void;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Cargando':
    case 'Descargando':
    case 'Operativo':
    case 'En stock':
    case 'Disponible':
      return 'ce-status-pill--success';
    case 'En ruta':
    case 'Aculando':
    case 'Reservado':
      return 'ce-status-pill--info';
    case 'Stock bajo':
    case 'Recargando':
      return 'ce-status-pill--warning';
    default:
      return 'ce-status-pill--info';
  }
}

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  activeSite,
  trucks,
  forklifts,
  selectedObject,
  followTarget,
  embedded = false,
  onToggleFollow,
  onClearSelection,
  onCameraAction,
  onAdvanceTruckStep,
}) => {
  const selectedTruck =
    selectedObject?.type === 'truck'
      ? trucks.find((t) => t.id === selectedObject.id)
      : undefined;

  const selectedForklift =
    selectedObject?.type === 'forklift'
      ? forklifts.find((f) => f.id === selectedObject.id)
      : undefined;

  const selectedDock =
    selectedObject?.type === 'dock'
      ? activeSite.docks.find((d) => d.id === selectedObject.id)
      : undefined;

  const selectedStaging =
    selectedObject?.type === 'staging'
      ? activeSite.stagingZones.find((z) => z.id === selectedObject.id)
      : undefined;

  const siteTrucks = trucks.filter((t) => t.siteId === activeSite.id);
  const siteForklifts = forklifts.filter((f) => f.siteId === activeSite.id);
  const dockedBays = activeSite.docks.filter((d) => d.status === 'Ocupado').length;
  const arrivingCount = siteTrucks.filter(
    (t) => t.status === 'En ruta' || t.status === 'Aculando'
  ).length;
  const workingForklifts = siteForklifts.filter(
    (f) => f.status === 'Cargando' || f.status === 'Descargando'
  );
  const featuredForklift = workingForklifts[0] || siteForklifts[0];

  const stockPct = Math.min(
    100,
    Math.round((activeSite.stockCurrent / activeSite.stockCapacity) * 100)
  );
  const bayPct = Math.min(
    100,
    Math.round((dockedBays / activeSite.docks.length) * 100)
  );

  return (
    <aside
      className={embedded ? 'ce-right-hud ce-right-hud--embedded' : 'ce-right-hud'}
      aria-label="Controles de cámara e inspector"
    >
      {/* Vertical Camera Controls Toolbar (exact match to video!) */}
      {!embedded && (
        <div className="ce-cam-toolbar">
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('zoomIn')}
            title="Acercar cámara"
            aria-label="Acercar cámara"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('zoomOut')}
            title="Alejar cámara"
            aria-label="Alejar cámara"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('rotateLeft')}
            title="Rotar 45° a la izquierda"
            aria-label="Rotar 45 grados a la izquierda"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('rotateRight')}
            title="Rotar 45° a la derecha"
            aria-label="Rotar 45 grados a la derecha"
          >
            <RotateCw size={15} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('reset')}
            title="Restablecer vista de sede"
            aria-label="Restablecer vista de sede"
          >
            <Home size={15} />
          </button>
        </div>
      )}

      {/* Context Inspector Card */}
      <div
        className={
          embedded ? 'ce-inspector-card ce-inspector-card--embedded' : 'ce-inspector-card'
        }
      >
        {selectedTruck ? (
          /* === MODE B: SELECTED TRUCK INSPECTOR === */
          <>
            <div className="ce-inspector__head">
              <div className="ce-inspector__thumb ce-inspector__thumb--truck">
                <Truck size={20} />
              </div>
              <div className="ce-inspector__titles">
                <span className="ce-overline">{selectedTruck.carrier}</span>
                <h2 className="ce-inspector__title">{selectedTruck.id}</h2>
                <span className="ce-inspector__subtitle">
                  {selectedTruck.driver} · <span className="ce-mono">{selectedTruck.plate}</span>
                </span>
              </div>
              <div className="ce-inspector__head-actions">
                <button
                  type="button"
                  className="ce-mini-action"
                  onClick={() => onCameraAction('focusObject')}
                  title="Centrar cámara en vehículo"
                  aria-label="Centrar cámara en vehículo"
                >
                  <Crosshair size={14} />
                </button>
                <button
                  type="button"
                  className={`ce-mini-action ${followTarget ? 'is-active' : ''}`}
                  onClick={onToggleFollow}
                  title={
                    followTarget
                      ? 'Desactivar seguimiento automático'
                      : 'Seguir camión con la cámara'
                  }
                  aria-label="Seguir camión con la cámara"
                >
                  <Navigation size={14} />
                </button>
                <button
                  type="button"
                  className="ce-mini-action"
                  onClick={onClearSelection}
                  title="Volver al resumen de sede"
                  aria-label="Cerrar inspector de vehículo"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="ce-inspector__status-block">
              <div className="ce-inspector__status-line">
                <span
                  className={`ce-status-pill ${getStatusBadgeClass(
                    selectedTruck.status
                  )}`}
                >
                  ● {selectedTruck.status}
                </span>
                <span className="ce-inspector__status-note">
                  {selectedTruck.status === 'En ruta' ||
                  selectedTruck.status === 'Aculando'
                    ? `Hacia ${selectedTruck.siteId} · ${selectedTruck.etaText}`
                    : `${selectedTruck.siteId} · ${selectedTruck.bayCode} · ${selectedTruck.palletsDone}/${selectedTruck.palletsTotal} pallets`}
                </span>
              </div>
              <div className="ce-inspector__progress-row">
                <div className="ce-progress-track">
                  <div
                    className={`ce-progress-fill ${
                      selectedTruck.status === 'Cargando' ||
                      selectedTruck.status === 'Descargando'
                        ? 'ce-progress-fill--green'
                        : ''
                    }`}
                    style={{
                      width: `${Math.round(
                        (selectedTruck.status === 'Cargando' ||
                        selectedTruck.status === 'Descargando'
                          ? selectedTruck.palletsDone / selectedTruck.palletsTotal
                          : selectedTruck.progress) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="ce-mono ce-inspector__progress-meta">
                  {selectedTruck.status === 'Cargando' ||
                  selectedTruck.status === 'Descargando'
                    ? `${selectedTruck.palletsDone}/${selectedTruck.palletsTotal}`
                    : selectedTruck.remainingText}
                </span>
              </div>
            </div>

            <dl className="ce-kv-list">
              <div className="ce-kv-row">
                <dt>Envío</dt>
                <dd className="ce-mono">{selectedTruck.shipmentId}</dd>
              </div>
              <div className="ce-kv-row">
                <dt>Cliente</dt>
                <dd>{selectedTruck.customer}</dd>
              </div>
              <div className="ce-kv-row">
                <dt>Destino</dt>
                <dd>{selectedTruck.destination}</dd>
              </div>
              <div className="ce-kv-row">
                <dt>ETA</dt>
                <dd className="ce-mono">{selectedTruck.etaText}</dd>
              </div>
              <div className="ce-kv-row">
                <dt>Velocidad</dt>
                <dd className="ce-mono">{selectedTruck.speedKmh} km/h</dd>
              </div>
              <div className="ce-kv-row">
                <dt>Bahía asignada</dt>
                <dd>
                  {selectedTruck.bayCode} · {selectedTruck.siteId}
                </dd>
              </div>
              <div className="ce-kv-row">
                <dt>Carga</dt>
                <dd className="ce-mono">
                  {selectedTruck.palletsDone}/{selectedTruck.palletsTotal} pallets ·{' '}
                  {selectedTruck.weightTons.toFixed(1)} t
                </dd>
              </div>
            </dl>

            <div className="ce-inspector__footer">
              <button
                type="button"
                className="ce-btn-primary ce-btn-primary--full"
                onClick={() => onAdvanceTruckStep(selectedTruck.id)}
              >
                {selectedTruck.status === 'En ruta'
                  ? 'Adelantar arribo a muelle'
                  : selectedTruck.status === 'Aculando'
                  ? 'Completar aculamiento en bahía'
                  : 'Registrar +1 pallet procesado'}
              </button>
            </div>
          </>
        ) : selectedForklift ? (
          /* === SELECTED FORKLIFT INSPECTOR === */
          <>
            <div className="ce-inspector__head">
              <div className="ce-inspector__thumb">
                <BatteryCharging size={20} />
              </div>
              <div className="ce-inspector__titles">
                <span className="ce-overline">FLOTA INTERNA · {selectedForklift.siteId}</span>
                <h2 className="ce-inspector__title">{selectedForklift.id}</h2>
                <span className="ce-inspector__subtitle">Montacargas eléctrico contrapesado</span>
              </div>
              <div className="ce-inspector__head-actions">
                <button
                  type="button"
                  className="ce-mini-action"
                  onClick={onClearSelection}
                  title="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="ce-inspector__status-block">
              <div className="ce-inspector__status-line">
                <span
                  className={`ce-status-pill ${getStatusBadgeClass(
                    selectedForklift.status
                  )}`}
                >
                  ● {selectedForklift.status}
                </span>
                <span className="ce-inspector__status-note">
                  Batería LFP: <strong className="ce-mono">{selectedForklift.batteryPct}%</strong>
                </span>
              </div>
              <div className="ce-inspector__progress-row">
                <div className="ce-progress-track">
                  <div
                    className="ce-progress-fill ce-progress-fill--green"
                    style={{ width: `${selectedForklift.batteryPct}%` }}
                  />
                </div>
                <span className="ce-mono ce-inspector__progress-meta">
                  {selectedForklift.batteryPct}%
                </span>
              </div>
            </div>

            <dl className="ce-kv-list">
              <div className="ce-kv-row">
                <dt>Tarea actual</dt>
                <dd>{selectedForklift.taskLabel}</dd>
              </div>
              <div className="ce-kv-row">
                <dt>Sede operativa</dt>
                <dd>{activeSite.name}</dd>
              </div>
              <div className="ce-kv-row">
                <dt>Tipo de carga</dt>
                <dd>
                  {selectedForklift.carryingBluePallet
                    ? 'Pallet Corporativo C|E'
                    : 'Estándar Corrugado'}
                </dd>
              </div>
            </dl>
          </>
        ) : selectedDock || selectedStaging ? (
          /* === SELECTED DOCK OR STAGING ZONE === */
          <>
            <div className="ce-inspector__head">
              <div className="ce-inspector__thumb">
                <PackageCheck size={20} />
              </div>
              <div className="ce-inspector__titles">
                <span className="ce-overline">{activeSite.id} · ZONA OPERATIVA</span>
                <h2 className="ce-inspector__title">
                  {selectedDock ? selectedDock.code : selectedStaging?.label}
                </h2>
                <span className="ce-inspector__subtitle">{activeSite.name}</span>
              </div>
              <button
                type="button"
                className="ce-mini-action"
                onClick={onClearSelection}
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
            <dl className="ce-kv-list">
              {selectedDock ? (
                <>
                  <div className="ce-kv-row">
                    <dt>Estado de muelle</dt>
                    <dd>{selectedDock.status}</dd>
                  </div>
                  <div className="ce-kv-row">
                    <dt>Camión asignado</dt>
                    <dd className="ce-mono">{selectedDock.truckId || 'Sin asignar'}</dd>
                  </div>
                  <div className="ce-kv-row">
                    <dt>Apertura de puerta</dt>
                    <dd className="ce-mono">{Math.round(selectedDock.doorOpen * 100)}%</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="ce-kv-row">
                    <dt>Pallets en acopio</dt>
                    <dd className="ce-mono">{selectedStaging?.pallets} pallets</dd>
                  </div>
                  <div className="ce-kv-row">
                    <dt>Contenido principal</dt>
                    <dd>{selectedStaging?.skuSummary}</dd>
                  </div>
                </>
              )}
            </dl>
          </>
        ) : (
          /* === MODE A: SITE OVERVIEW + INVENTORY + FORKLIFT FLEET (matches frame_009 & frame_017!) === */
          <>
            <div className="ce-inspector__head">
              <div className="ce-inspector__thumb">
                <Building2 size={20} />
              </div>
              <div className="ce-inspector__titles">
                <span className="ce-overline">{activeSite.typeLabel}</span>
                <h2 className="ce-inspector__title">{activeSite.name}</h2>
                <span className="ce-inspector__subtitle">{activeSite.address}</span>
              </div>
              <button
                type="button"
                className="ce-mini-action"
                onClick={() => onCameraAction('reset')}
                title="Enfocar sede"
                aria-label="Enfocar sede"
              >
                <Crosshair size={14} />
              </button>
            </div>

            <div className="ce-site-op-row">
              <span className="ce-status-pill ce-status-pill--success">● Operativo</span>
              <span className="ce-site-op-summary">
                {dockedBays} en muelle · {arrivingCount} llegando · {activeSite.stagedCount}{' '}
                en acopio
              </span>
            </div>

            {/* 2x2 Metrics Grid */}
            <div className="ce-metrics-grid">
              <div className="ce-metric-box">
                <span className="ce-metric-box__label">Stock en sede</span>
                <div className="ce-metric-box__val ce-mono">
                  <strong>{activeSite.stockCurrent.toLocaleString('es-PE')}</strong>
                  <span> / {activeSite.stockCapacity.toLocaleString('es-PE')}</span>
                </div>
                <div className="ce-progress-track ce-progress-track--thin">
                  <div className="ce-progress-fill" style={{ width: `${stockPct}%` }} />
                </div>
              </div>

              <div className="ce-metric-box">
                <span className="ce-metric-box__label">Bahías de camiones</span>
                <div className="ce-metric-box__val ce-mono">
                  <strong>{dockedBays}</strong>
                  <span> / {activeSite.docks.length} bahías</span>
                </div>
                <div className="ce-progress-track ce-progress-track--thin">
                  <div
                    className="ce-progress-fill ce-progress-fill--green"
                    style={{ width: `${bayPct}%` }}
                  />
                </div>
              </div>

              <div className="ce-metric-box">
                <span className="ce-metric-box__label">Despachos hoy</span>
                <div className="ce-metric-box__val ce-mono">
                  <strong>{activeSite.outboundToday}</strong>
                  <span> camiones</span>
                </div>
              </div>

              <div className="ce-metric-box">
                <span className="ce-metric-box__label">Ubicados hoy</span>
                <div className="ce-metric-box__val ce-mono">
                  <strong>{activeSite.putAwaysToday}</strong>
                  <span> pallets</span>
                </div>
              </div>
            </div>

            {/* Inventory SKU Section */}
            <div className="ce-inventory-block">
              <div className="ce-section-head">
                <span>Inventario</span>
                <span>unidades</span>
              </div>
              <div className="ce-inventory-list">
                {activeSite.inventory.map((item) => (
                  <div key={item.id} className="ce-inventory-row">
                    <span
                      className={`ce-sku-icon ce-sku-icon--${item.iconType}`}
                      aria-hidden="true"
                    >
                      {item.iconType === 'cold' ? (
                        <Snowflake size={13} />
                      ) : (
                        <Box size={13} />
                      )}
                    </span>
                    <span className="ce-inventory-name">{item.name}</span>
                    <span className="ce-inventory-qty ce-mono">
                      {item.units.toLocaleString('es-PE')}
                    </span>
                    <span
                      className={`ce-status-pill ce-status-pill--xs ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status === 'Stock bajo' ? '! Stock bajo' : '✓ En stock'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forklift Fleet Footer Summary */}
            {featuredForklift && (
              <div className="ce-forklift-summary">
                <div className="ce-section-head">
                  <span>Flota de montacargas</span>
                  <span className="ce-mono">
                    {workingForklifts.length}/{siteForklifts.length} activos
                  </span>
                </div>
                <div className="ce-forklift-summary__row">
                  <strong className="ce-mono">{featuredForklift.id}</strong>
                  <span className="ce-forklift-summary__task">
                    {featuredForklift.taskLabel}
                  </span>
                  <div className="ce-progress-track ce-progress-track--mini">
                    <div
                      className="ce-progress-fill ce-progress-fill--green"
                      style={{ width: `${featuredForklift.progressPct}%` }}
                    />
                  </div>
                  <span className="ce-mono">{featuredForklift.progressPct}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

