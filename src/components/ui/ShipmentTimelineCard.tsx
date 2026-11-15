import React from 'react';
import {
  Check,
  ChevronRight,
  ClipboardCheck,
  Package,
  PackageOpen,
  Truck,
} from 'lucide-react';
import { SiteId, TruckEntity } from '../../types/logistics';

interface ShipmentTimelineCardProps {
  trackedTruck: TruckEntity;
  embedded?: boolean;
  onCycleTruck: () => void;
  onFocusTruck: (truckId: string, siteId: SiteId) => void;
}

const STEP_ICONS = [ClipboardCheck, PackageOpen, Package, Truck, Check];

export const ShipmentTimelineCard: React.FC<ShipmentTimelineCardProps> = ({
  trackedTruck,
  embedded = false,
  onCycleTruck,
  onFocusTruck,
}) => {
  return (
    <section
      className={
        embedded ? 'ce-tracking-card ce-tracking-card--embedded' : 'ce-tracking-card'
      }
      aria-label="Seguimiento de envío en tiempo real"
    >
      <div className="ce-tracking-card__main">
        <div className="ce-tracking-card__head">
          <div className="ce-tracking-card__title-wrap">
            <Truck size={16} className="ce-brand-icon" />
            <h3 className="ce-tracking-card__title">Seguimiento de Envío</h3>
          </div>
          <button
            type="button"
            className="ce-tracking-card__carrier-btn"
            onClick={() => onFocusTruck(trackedTruck.id, trackedTruck.siteId)}
          >
            <span className="ce-mono">{trackedTruck.id}</span> ·{' '}
            {trackedTruck.carrier}
          </button>
        </div>

        {/* 5-Step Horizontal Stepper (exact match to video!) */}
        <ol className="ce-stepper">
          {trackedTruck.steps.map((step, index) => {
            const StepIcon = STEP_ICONS[index] || Check;
            const stateClass = step.active
              ? 'is-active'
              : step.completed
              ? 'is-done'
              : 'is-pending';

            return (
              <li key={index} className={`ce-stepper__item ${stateClass}`}>
                <div className="ce-stepper__node-row">
                  {index > 0 && (
                    <span
                      className={`ce-stepper__line ${
                        step.completed || step.active ? 'is-filled' : ''
                      }`}
                    />
                  )}
                  <span className="ce-stepper__circle">
                    <StepIcon size={step.active ? 15 : 13} />
                  </span>
                </div>
                <span className="ce-stepper__label">{step.label}</span>
                <span className="ce-stepper__time ce-mono">{step.time}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Right Summary Box for Linked Shipment */}
      <button
        type="button"
        className="ce-shipment-mini"
        onClick={onCycleTruck}
        title="Clic para alternar al siguiente envío activo"
      >
        <div className="ce-shipment-mini__icon">
          <Truck size={18} />
        </div>
        <div className="ce-shipment-mini__body">
          <strong className="ce-shipment-mini__id ce-mono">
            {trackedTruck.shipmentId}
          </strong>
          <span className="ce-shipment-mini__dest">
            Hacia: {trackedTruck.destination}
          </span>
          <span
            className={`ce-shipment-mini__status ${
              trackedTruck.status === 'Cargando' ||
              trackedTruck.status === 'Descargando'
                ? 'is-green'
                : 'is-blue'
            }`}
          >
            ● {trackedTruck.status}
          </span>
          <span className="ce-shipment-mini__eta ce-mono">
            {trackedTruck.siteId} · {trackedTruck.bayCode} · {trackedTruck.remainingText}
          </span>
        </div>
        <ChevronRight size={16} className="ce-shipment-mini__arrow" />
      </button>
    </section>
  );
};

