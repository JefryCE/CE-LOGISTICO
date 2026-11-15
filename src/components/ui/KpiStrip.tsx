import React from 'react';
import { ArrowUpRight, Box, Clock, Truck } from 'lucide-react';
import { TruckEntity, ViewScope, WarehouseSite } from '../../types/logistics';

interface KpiStripProps {
  sites: WarehouseSite[];
  trucks: TruckEntity[];
  viewScope: ViewScope;
  activeSite: WarehouseSite;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  sites,
  trucks,
  viewScope,
  activeSite,
}) => {
  const isAll = viewScope === 'ALL';

  const stockTotal = isAll
    ? sites.reduce((sum, s) => sum + s.stockCurrent, 0)
    : activeSite.stockCurrent;
  const stockDelta = isAll
    ? sites.reduce((sum, s) => sum + s.stockDelta, 0)
    : activeSite.stockDelta;

  const siteTrucks = isAll
    ? trucks
    : trucks.filter((t) => t.siteId === activeSite.id);
  const inboundCount = siteTrucks.filter(
    (t) => t.status === 'En ruta' || t.status === 'Aculando'
  ).length;
  const trucksDelta = isAll ? 6 : activeSite.trucksDelta;

  const onTime = isAll
    ? (sites.reduce((sum, s) => sum + s.onTimePct, 0) / sites.length).toFixed(1)
    : activeSite.onTimePct.toFixed(1);
  const onTimeDelta = isAll ? '0.5' : activeSite.onTimeDelta.toFixed(1);

  const scopeTag = isAll ? '5 sedes' : activeSite.id;

  return (
    <section className="ce-kpi-strip" aria-label="Indicadores clave de operación">
      {/* KPI 1: Stock disponible */}
      <article className="ce-kpi-card">
        <div className="ce-kpi-card__icon">
          <Box size={20} />
        </div>
        <div className="ce-kpi-card__body">
          <span className="ce-kpi-card__label">Stock disponible</span>
          <div className="ce-kpi-card__value-row">
            <strong className="ce-kpi-card__value ce-mono">
              {stockTotal.toLocaleString('es-PE')}
            </strong>
            <span className="ce-delta-pill">
              <ArrowUpRight size={12} />+{stockDelta}
            </span>
          </div>
          <span className="ce-kpi-card__sub">pallets · {scopeTag}</span>
        </div>
      </article>

      {/* KPI 2: Camiones en planta */}
      <article className="ce-kpi-card">
        <div className="ce-kpi-card__icon">
          <Truck size={20} />
        </div>
        <div className="ce-kpi-card__body">
          <span className="ce-kpi-card__label">Camiones en planta</span>
          <div className="ce-kpi-card__value-row">
            <strong className="ce-kpi-card__value ce-mono">
              {siteTrucks.length}
            </strong>
            <span className="ce-delta-pill">
              <ArrowUpRight size={12} />+{trucksDelta}
            </span>
          </div>
          <span className="ce-kpi-card__sub">
            {inboundCount} entrantes · {scopeTag}
          </span>
        </div>
      </article>

      {/* KPI 3: Entregas a tiempo */}
      <article className="ce-kpi-card">
        <div className="ce-kpi-card__icon">
          <Clock size={20} />
        </div>
        <div className="ce-kpi-card__body">
          <span className="ce-kpi-card__label">Entregas a tiempo</span>
          <div className="ce-kpi-card__value-row">
            <strong className="ce-kpi-card__value ce-mono">{onTime}%</strong>
            <span className="ce-delta-pill">
              <ArrowUpRight size={12} />+{onTimeDelta}%
            </span>
          </div>
          <span className="ce-kpi-card__sub">últimos 30 días · {scopeTag}</span>
        </div>
      </article>
    </section>
  );
};

