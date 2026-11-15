import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Home,
  Info,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Truck,
} from 'lucide-react';
import {
  ForkliftEntity,
  SelectedObject,
  SiteId,
  TruckEntity,
  WarehouseSite,
} from '../../types/logistics';
import { DeviceType } from '../../hooks/useViewport';
import { CameraCommand } from '../scene/LogisticsScene';
import { RightInspectorPanel } from './RightInspectorPanel';
import { ShipmentTimelineCard } from './ShipmentTimelineCard';
import { FleetSwitcherCard } from './FleetSwitcherCard';

interface MobileBottomDockProps {
  deviceType: DeviceType;
  activeSite: WarehouseSite;
  trucks: TruckEntity[];
  forklifts: ForkliftEntity[];
  selectedObject: SelectedObject;
  trackedTruck: TruckEntity;
  followTarget: boolean;
  onToggleFollow: () => void;
  onClearSelection: () => void;
  onCameraAction: (type: CameraCommand['type']) => void;
  onAdvanceTruckStep: (truckId: string) => void;
  onCycleShipmentTruck: () => void;
  onSelectObject: (obj: SelectedObject, siteId?: SiteId) => void;
}

type MobileTab = 'inspector' | 'tracking' | 'fleet';

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  deviceType,
  activeSite,
  trucks,
  forklifts,
  selectedObject,
  trackedTruck,
  followTarget,
  onToggleFollow,
  onClearSelection,
  onCameraAction,
  onAdvanceTruckStep,
  onCycleShipmentTruck,
  onSelectObject,
}) => {
  const isMobile = deviceType === 'mobile';
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>(
    isMobile ? 'inspector' : 'tracking'
  );

  // When switching between mobile & tablet, ensure valid default tab
  useEffect(() => {
    if (!isMobile && activeTab === 'inspector') {
      setActiveTab('tracking');
    }
  }, [isMobile, activeTab]);

  // If user taps an object in 3D on mobile, switch to inspector tab
  useEffect(() => {
    if (isMobile && selectedObject) {
      setActiveTab('inspector');
    }
  }, [isMobile, selectedObject]);

  const activeLabel =
    selectedObject?.type === 'truck'
      ? `${selectedObject.id} · ${trackedTruck.status}`
      : selectedObject?.type === 'forklift'
      ? `${selectedObject.id} · Montacargas`
      : `${activeSite.id} · ${activeSite.name}`;

  return (
    <>
      {/* Touch-friendly Floating Camera Controls on Mobile */}
      {isMobile && (
        <div
          className={`ce-mobile-cam-bar ${expanded ? 'is-raised' : ''}`}
          aria-label="Controles de cámara"
        >
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('zoomIn')}
            aria-label="Acercar cámara"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('zoomOut')}
            aria-label="Alejar cámara"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('rotateLeft')}
            aria-label="Rotar izquierda"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('rotateRight')}
            aria-label="Rotar derecha"
          >
            <RotateCw size={15} />
          </button>
          <button
            type="button"
            className="ce-cam-btn"
            onClick={() => onCameraAction('reset')}
            aria-label="Restablecer vista"
          >
            <Home size={15} />
          </button>
        </div>
      )}

      {/* Responsive Bottom Sheet (Mobile: 3 tabs | Tablet: Tracking & Fleet tabs) */}
      <section
        className={`ce-bottom-dock ${
          isMobile ? 'ce-bottom-dock--mobile' : 'ce-bottom-dock--tablet'
        } ${expanded || !isMobile ? 'is-expanded' : ''}`}
        aria-label="Paneles operativos adaptativos"
      >
        <div className="ce-bottom-dock__bar">
          <div className="ce-bottom-dock__tabs">
            {isMobile && (
              <button
                type="button"
                className={`ce-dock-tab ${
                  activeTab === 'inspector' ? 'is-active' : ''
                }`}
                onClick={() => {
                  setActiveTab('inspector');
                  setExpanded(true);
                }}
              >
                <Info size={14} />
                <span>Inspector</span>
              </button>
            )}
            <button
              type="button"
              className={`ce-dock-tab ${
                activeTab === 'tracking' ? 'is-active' : ''
              }`}
              onClick={() => {
                setActiveTab('tracking');
                if (isMobile) setExpanded(true);
              }}
            >
              <Truck size={14} />
              <span>Envío</span>
            </button>
            <button
              type="button"
              className={`ce-dock-tab ${
                activeTab === 'fleet' ? 'is-active' : ''
              }`}
              onClick={() => {
                setActiveTab('fleet');
                if (isMobile) setExpanded(true);
              }}
            >
              <ClipboardList size={14} />
              <span>Flota</span>
            </button>
          </div>

          {isMobile && (
            <button
              type="button"
              className="ce-dock-toggle"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Minimizar panel' : 'Expandir panel'}
            >
              <span className="ce-dock-toggle__label">{activeLabel}</span>
              {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
        </div>

        {(expanded || !isMobile) && (
          <div className="ce-bottom-dock__content">
            {isMobile && activeTab === 'inspector' && (
              <RightInspectorPanel
                embedded
                activeSite={activeSite}
                trucks={trucks}
                forklifts={forklifts}
                selectedObject={selectedObject}
                followTarget={followTarget}
                onToggleFollow={onToggleFollow}
                onClearSelection={onClearSelection}
                onCameraAction={onCameraAction}
                onAdvanceTruckStep={onAdvanceTruckStep}
              />
            )}

            {activeTab === 'tracking' && (
              <ShipmentTimelineCard
                embedded
                trackedTruck={trackedTruck}
                onCycleTruck={onCycleShipmentTruck}
                onFocusTruck={(id, siteId) =>
                  onSelectObject({ type: 'truck', id }, siteId)
                }
              />
            )}

            {activeTab === 'fleet' && (
              <FleetSwitcherCard
                embedded
                activeSite={activeSite}
                trucks={trucks}
                forklifts={forklifts}
                selectedObject={selectedObject}
                onSelectObject={onSelectObject}
              />
            )}
          </div>
        )}
      </section>
    </>
  );
};
