import React, { useEffect, useMemo, useState } from 'react';
import {
  INITIAL_FORKLIFTS,
  INITIAL_SITES,
  INITIAL_TRUCKS,
} from './data/logisticsData';
import {
  SelectedObject,
  SiteId,
  TruckEntity,
  ViewScope,
} from './types/logistics';
import { CameraCommand, LogisticsScene } from './components/scene/LogisticsScene';
import { TopNavBar } from './components/ui/TopNavBar';
import { KpiStrip } from './components/ui/KpiStrip';
import { RightInspectorPanel } from './components/ui/RightInspectorPanel';
import { ShipmentTimelineCard } from './components/ui/ShipmentTimelineCard';
import { FleetSwitcherCard } from './components/ui/FleetSwitcherCard';
import { ZyroAiAssistantModal } from './components/ui/ZyroAiAssistantModal';
import { MobileBottomDock } from './components/ui/MobileBottomDock';
import { useViewport } from './hooks/useViewport';

export const App: React.FC = () => {
  const viewport = useViewport();
  const { deviceType, width, height, isDesktop, isMobile } = viewport;
  const viewportAspect = height > 0 ? width / height : 1.6;

  const [sites, setSites] = useState(INITIAL_SITES);
  const [trucks, setTrucks] = useState(INITIAL_TRUCKS);
  const [forklifts, setForklifts] = useState(INITIAL_FORKLIFTS);

  // Start on CD-04 with CAM-2481 selected (exact opening shot of the reference video!)
  const [viewScope, setViewScope] = useState<ViewScope>('CD-04');
  const [lastSiteId, setLastSiteId] = useState<SiteId>('CD-04');
  const [selectedObject, setSelectedObject] = useState<SelectedObject>({
    type: 'truck',
    id: 'CAM-2481',
  });
  const [followTarget, setFollowTarget] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const [simSeconds, setSimSeconds] = useState(9 * 3600 + 44 * 60); // 09:44

  // Sync [data-theme="dark"] per Canal Ejecutivo Manual §7.5
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Live operational clock + periodic pallet/telemetry micro-updates
  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => {
      setSimSeconds((prev) => prev + Math.round(5 * simSpeed));

      // Gently fluctuate speed of En ruta trucks for realism
      setTrucks((prev) =>
        prev.map((t) => {
          if (t.status === 'En ruta') {
            const delta = Math.floor(Math.random() * 5) - 2;
            const nextSpeed = Math.max(26, Math.min(46, t.speedKmh + delta));
            return { ...t, speedKmh: nextSpeed };
          }
          return t;
        })
      );
    }, 2500);
    return () => window.clearInterval(interval);
  }, [isPaused, simSpeed]);

  const clockText = useMemo(() => {
    const totalMinutes = Math.floor(simSeconds / 60) % (24 * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [simSeconds]);

  const activeSite = useMemo(() => {
    const targetId = viewScope === 'ALL' ? lastSiteId : viewScope;
    return sites.find((s) => s.id === targetId) || sites[0];
  }, [sites, viewScope, lastSiteId]);

  const siteTrucks = useMemo(
    () => trucks.filter((t) => t.siteId === activeSite.id),
    [trucks, activeSite.id]
  );

  // Tracked truck for the bottom-left Shipment Tracking Timeline
  const trackedTruck: TruckEntity = useMemo(() => {
    if (selectedObject?.type === 'truck') {
      const found = trucks.find((t) => t.id === selectedObject.id);
      if (found) return found;
    }
    return siteTrucks[0] || trucks[0];
  }, [selectedObject, trucks, siteTrucks]);

  const handleChangeScope = (scope: ViewScope) => {
    setViewScope(scope);
    setFollowTarget(false);
    if (scope !== 'ALL') {
      setLastSiteId(scope);
      // Clear vehicle selection when switching warehouse so the Site Overview Inspector shines!
      setSelectedObject(null);
    }
  };

  const handleSelectObject = (obj: SelectedObject, siteId?: SiteId) => {
    setSelectedObject(obj);
    if (!obj) {
      setFollowTarget(false);
    }
    if (siteId && siteId !== lastSiteId) {
      setLastSiteId(siteId);
      setViewScope(siteId);
    } else if (siteId && viewScope === 'ALL') {
      setLastSiteId(siteId);
    }
  };

  const handleCameraAction = (type: CameraCommand['type']) => {
    setFollowTarget(false);
    setCameraCommand((prev) => ({ seq: (prev?.seq || 0) + 1, type }));
  };

  const handleCycleShipmentTruck = () => {
    if (siteTrucks.length === 0) return;
    const idx = siteTrucks.findIndex((t) => t.id === trackedTruck.id);
    const next = siteTrucks[(idx + 1) % siteTrucks.length];
    handleSelectObject({ type: 'truck', id: next.id }, next.siteId);
  };

  const handleAdvanceTruckStep = (truckId: string) => {
    setTrucks((prev) =>
      prev.map((t) => {
        if (t.id !== truckId) return t;
        if (t.status === 'En ruta') {
          return {
            ...t,
            status: 'Aculando',
            speedKmh: 6,
            etaText: 'En maniobra (1 min)',
            remainingText: 'aculando',
            progress: 0.9,
          };
        }
        if (t.status === 'Aculando') {
          return {
            ...t,
            status: 'Descargando',
            speedKmh: 0,
            palletsDone: 1,
            etaText: 'Listo en 12 min',
            remainingText: '12 min rest.',
            steps: t.steps.map((s, idx) => ({
              ...s,
              completed: idx < 4,
              active: idx === 4,
              label: idx === 4 ? `Descargando 1/${t.palletsTotal}` : s.label,
            })),
          };
        }
        const nextDone = Math.min(t.palletsTotal, t.palletsDone + 1);
        return {
          ...t,
          palletsDone: nextDone,
          progress: nextDone / t.palletsTotal,
          steps: t.steps.map((s) =>
            s.active
              ? {
                  ...s,
                  label: `${t.status} ${nextDone}/${t.palletsTotal}`,
                }
              : s
          ),
        };
      })
    );

    setSites((prev) =>
      prev.map((s) =>
        s.id === activeSite.id
          ? { ...s, stockCurrent: s.stockCurrent + 1, putAwaysToday: s.putAwaysToday + 1 }
          : s
      )
    );
  };

  const handleApplyAiOptimization = () => {
    setForklifts((prev) =>
      prev.map((fl) => {
        if (fl.siteId === activeSite.id && fl.status === 'Disponible') {
          return {
            ...fl,
            status: 'Descargando',
            taskLabel: `Asignado por IA · Apoyo rápido ${activeSite.id}`,
            progressPct: 95,
            carryingBluePallet: true,
          };
        }
        return fl;
      })
    );
    setSites((prev) =>
      prev.map((s) =>
        s.id === activeSite.id
          ? { ...s, onTimePct: Math.min(99.9, +(s.onTimePct + 0.3).toFixed(1)) }
          : s
      )
    );
  };

  return (
    <div className="ce-app-shell" data-device={deviceType}>
      {/* 1. Barra Superior Corporativa Canal Ejecutivo */}
      <TopNavBar
        sites={sites}
        trucks={trucks}
        forklifts={forklifts}
        viewScope={viewScope}
        activeSite={activeSite}
        clockText={clockText}
        isPaused={isPaused}
        simSpeed={simSpeed}
        isDark={isDark}
        isAiOpen={isAiOpen}
        deviceType={deviceType}
        onChangeScope={handleChangeScope}
        onSelectObject={handleSelectObject}
        onTogglePause={() => setIsPaused((p) => !p)}
        onCycleSpeed={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
        onToggleTheme={() => setIsDark((d) => !d)}
        onToggleAi={() => setIsAiOpen((o) => !o)}
      />

      {/* 2. Franja de 3 KPIs (Carrusel horizontal en móvil, fila en tablet/PC) */}
      <KpiStrip
        sites={sites}
        trucks={trucks}
        viewScope={viewScope}
        activeSite={activeSite}
      />

      {/* 3. Copiloto IA + Guía Zyro (Desplegable bajo demanda) */}
      <ZyroAiAssistantModal
        isOpen={isAiOpen}
        viewScope={viewScope}
        onClose={() => setIsAiOpen(false)}
        onApplyOptimization={handleApplyAiOptimization}
      />

      {/* 4. Controles de Cámara + Inspector Contextual Derecho (Desktop y Tablet) */}
      {!isMobile && (
        <RightInspectorPanel
          activeSite={activeSite}
          trucks={trucks}
          forklifts={forklifts}
          selectedObject={selectedObject}
          followTarget={followTarget}
          onToggleFollow={() => setFollowTarget((f) => !f)}
          onClearSelection={() => {
            setSelectedObject(null);
            setFollowTarget(false);
          }}
          onCameraAction={handleCameraAction}
          onAdvanceTruckStep={handleAdvanceTruckStep}
        />
      )}

      {/* 5 & 6. En Desktop: tarjetas inferiores separadas; en Tablet/Móvil: Dock Adaptativo */}
      {isDesktop ? (
        <>
          <ShipmentTimelineCard
            trackedTruck={trackedTruck}
            onCycleTruck={handleCycleShipmentTruck}
            onFocusTruck={(id, siteId) =>
              handleSelectObject({ type: 'truck', id }, siteId)
            }
          />
          <FleetSwitcherCard
            activeSite={activeSite}
            trucks={trucks}
            forklifts={forklifts}
            selectedObject={selectedObject}
            onSelectObject={handleSelectObject}
          />
        </>
      ) : (
        <MobileBottomDock
          deviceType={deviceType}
          activeSite={activeSite}
          trucks={trucks}
          forklifts={forklifts}
          selectedObject={selectedObject}
          trackedTruck={trackedTruck}
          followTarget={followTarget}
          onToggleFollow={() => setFollowTarget((f) => !f)}
          onClearSelection={() => {
            setSelectedObject(null);
            setFollowTarget(false);
          }}
          onCameraAction={handleCameraAction}
          onAdvanceTruckStep={handleAdvanceTruckStep}
          onCycleShipmentTruck={handleCycleShipmentTruck}
          onSelectObject={handleSelectObject}
        />
      )}

      {/* 7. Escena WebGL / Three.js en Tiempo Real */}
      <LogisticsScene
        sites={sites}
        trucks={trucks}
        forklifts={forklifts}
        viewScope={viewScope}
        selectedObject={selectedObject}
        followTarget={followTarget}
        isPaused={isPaused}
        simSpeed={simSpeed}
        isDark={isDark}
        deviceType={deviceType}
        viewportAspect={viewportAspect}
        cameraCommand={cameraCommand}
        onSelectSite={(siteId) => handleChangeScope(siteId)}
        onSelectObject={handleSelectObject}
      />
    </div>
  );
};

