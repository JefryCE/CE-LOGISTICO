import React, { useState } from 'react';
import { ChevronRight, Warehouse } from 'lucide-react';
import {
  ForkliftEntity,
  SelectedObject,
  SiteId,
  TruckEntity,
  WarehouseSite,
} from '../../types/logistics';

interface FleetSwitcherCardProps {
  activeSite: WarehouseSite;
  trucks: TruckEntity[];
  forklifts: ForkliftEntity[];
  selectedObject: SelectedObject;
  embedded?: boolean;
  onSelectObject: (obj: SelectedObject, siteId?: SiteId) => void;
}

type TabKey = 'docks' | 'forklifts' | 'trucks';

function badgeStyleFor(status: string): string {
  switch (status) {
    case 'Cargando':
    case 'Descargando':
    case 'Ocupado':
      return 'ce-status-pill--success';
    case 'Aculando':
    case 'En ruta':
    case 'Reservado':
      return 'ce-status-pill--info';
    case 'Recargando':
      return 'ce-status-pill--warning';
    default:
      return 'ce-status-pill--neutral';
  }
}

export const FleetSwitcherCard: React.FC<FleetSwitcherCardProps> = ({
  activeSite,
  trucks,
  forklifts,
  selectedObject,
  embedded = false,
  onSelectObject,
}) => {
  const [tab, setTab] = useState<TabKey>('trucks');

  const siteTrucks = trucks.filter((t) => t.siteId === activeSite.id);
  const siteForklifts = forklifts.filter((f) => f.siteId === activeSite.id);
  const occupiedDocks = activeSite.docks.filter((d) => d.status === 'Ocupado').length;
  const activeForklifts = siteForklifts.filter(
    (f) => f.status === 'Cargando' || f.status === 'Descargando'
  ).length;

  return (
    <section
      className={
        embedded ? 'ce-switcher-card ce-switcher-card--embedded' : 'ce-switcher-card'
      }
      aria-label="Flota y muelles de la sede activa"
    >
      {/* Tabs Header (Muelles / Montacargas / Camiones + Sede) */}
      <div className="ce-switcher-card__tabs">
        <span className="ce-switcher-card__icon" aria-hidden="true">
          <Warehouse size={14} />
        </span>

        <button
          type="button"
          className={`ce-tab-btn ${tab === 'docks' ? 'is-active' : ''}`}
          onClick={() => setTab('docks')}
        >
          Muelles{' '}
          <span className="ce-mono">
            {occupiedDocks}/{activeSite.docks.length}
          </span>
        </button>

        <button
          type="button"
          className={`ce-tab-btn ${tab === 'forklifts' ? 'is-active' : ''}`}
          onClick={() => setTab('forklifts')}
        >
          Montacargas{' '}
          <span className="ce-mono">
            {activeForklifts}/{siteForklifts.length}
          </span>
        </button>

        <button
          type="button"
          className={`ce-tab-btn ${tab === 'trucks' ? 'is-active' : ''}`}
          onClick={() => setTab('trucks')}
        >
          Camiones <span className="ce-mono">{siteTrucks.length}</span>
        </button>

        <span className="ce-switcher-card__site">{activeSite.name}</span>
      </div>

      {/* Rows Body */}
      <div className="ce-switcher-card__list">
        {tab === 'trucks' &&
          siteTrucks.map((truck) => {
            const isSelected =
              selectedObject?.type === 'truck' && selectedObject.id === truck.id;
            const pct =
              truck.status === 'Cargando' || truck.status === 'Descargando'
                ? Math.round((truck.palletsDone / truck.palletsTotal) * 100)
                : Math.round(truck.progress * 100);

            return (
              <button
                key={truck.id}
                type="button"
                className={`ce-fleet-row ${isSelected ? 'is-selected' : ''}`}
                onClick={() =>
                  onSelectObject({ type: 'truck', id: truck.id }, activeSite.id)
                }
              >
                <div className="ce-fleet-row__col-id">
                  <strong className="ce-mono">{truck.id}</strong>
                  <span>{truck.carrier}</span>
                </div>

                <div className="ce-fleet-row__col-loc">
                  <span
                    className={`ce-dot ${
                      truck.status === 'En ruta' ? 'ce-dot--amber' : 'ce-dot--green'
                    }`}
                  />
                  <span>
                    {truck.status === 'En ruta' || truck.status === 'Aculando'
                      ? `Hacia ${truck.siteId}`
                      : `${truck.siteId} · ${truck.bayCode}`}
                  </span>
                </div>

                <span
                  className={`ce-status-pill ce-status-pill--xs ${badgeStyleFor(
                    truck.status
                  )}`}
                >
                  {truck.status}
                </span>

                <div className="ce-fleet-row__col-prog">
                  {truck.status === 'Cargando' || truck.status === 'Descargando' ? (
                    <>
                      <div className="ce-progress-track ce-progress-track--mini">
                        <div
                          className="ce-progress-fill ce-progress-fill--green"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="ce-mono">
                        {truck.palletsDone}/{truck.palletsTotal}
                      </span>
                    </>
                  ) : (
                    <span className="ce-mono">{truck.remainingText}</span>
                  )}
                </div>

                <ChevronRight size={14} className="ce-fleet-row__arrow" />
              </button>
            );
          })}

        {tab === 'forklifts' &&
          siteForklifts.map((fl) => {
            const isSelected =
              selectedObject?.type === 'forklift' && selectedObject.id === fl.id;
            return (
              <button
                key={fl.id}
                type="button"
                className={`ce-fleet-row ${isSelected ? 'is-selected' : ''}`}
                onClick={() =>
                  onSelectObject({ type: 'forklift', id: fl.id }, activeSite.id)
                }
              >
                <div className="ce-fleet-row__col-id">
                  <strong className="ce-mono">{fl.id}</strong>
                  <span>{fl.siteId}</span>
                </div>

                <div className="ce-fleet-row__col-loc">
                  <span>{fl.taskLabel}</span>
                </div>

                <span
                  className={`ce-status-pill ce-status-pill--xs ${badgeStyleFor(
                    fl.status
                  )}`}
                >
                  {fl.status}
                </span>

                <div className="ce-fleet-row__col-prog">
                  <div className="ce-progress-track ce-progress-track--mini">
                    <div
                      className="ce-progress-fill ce-progress-fill--green"
                      style={{ width: `${fl.batteryPct}%` }}
                    />
                  </div>
                  <span className="ce-mono">{fl.batteryPct}%</span>
                </div>

                <ChevronRight size={14} className="ce-fleet-row__arrow" />
              </button>
            );
          })}

        {tab === 'docks' &&
          activeSite.docks.map((dock) => {
            const isSelected =
              selectedObject?.type === 'dock' && selectedObject.id === dock.id;
            return (
              <button
                key={dock.id}
                type="button"
                className={`ce-fleet-row ${isSelected ? 'is-selected' : ''}`}
                onClick={() =>
                  onSelectObject({ type: 'dock', id: dock.id }, activeSite.id)
                }
              >
                <div className="ce-fleet-row__col-id">
                  <strong className="ce-mono">{dock.code}</strong>
                  <span>Bahía {dock.shortLabel}</span>
                </div>

                <div className="ce-fleet-row__col-loc">
                  <span
                    className={`ce-dot ${
                      dock.status === 'Ocupado'
                        ? 'ce-dot--green'
                        : dock.status === 'Reservado'
                        ? 'ce-dot--amber'
                        : 'ce-dot--gray'
                    }`}
                  />
                  <span>
                    {dock.truckId ? `Camión ${dock.truckId}` : 'Libre para acular'}
                  </span>
                </div>

                <span
                  className={`ce-status-pill ce-status-pill--xs ${badgeStyleFor(
                    dock.status
                  )}`}
                >
                  {dock.status}
                </span>

                <div className="ce-fleet-row__col-prog">
                  <span className="ce-mono">
                    {Math.round(dock.doorOpen * 100)}% puerta
                  </span>
                </div>

                <ChevronRight size={14} className="ce-fleet-row__arrow" />
              </button>
            );
          })}
      </div>
    </section>
  );
};

