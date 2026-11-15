import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  Pause,
  Play,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import {
  ForkliftEntity,
  SelectedObject,
  SiteId,
  TruckEntity,
  ViewScope,
  WarehouseSite,
} from '../../types/logistics';

interface TopNavBarProps {
  sites: WarehouseSite[];
  trucks: TruckEntity[];
  forklifts: ForkliftEntity[];
  viewScope: ViewScope;
  activeSite: WarehouseSite;
  clockText: string;
  isPaused: boolean;
  simSpeed: number;
  isDark: boolean;
  isAiOpen: boolean;
  onChangeScope: (scope: ViewScope) => void;
  onSelectObject: (obj: SelectedObject, siteId?: SiteId) => void;
  onTogglePause: () => void;
  onCycleSpeed: () => void;
  onToggleTheme: () => void;
  onToggleAi: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  sites,
  trucks,
  forklifts,
  viewScope,
  activeSite,
  clockText,
  isPaused,
  simSpeed,
  isDark,
  isAiOpen,
  onChangeScope,
  onSelectObject,
  onTogglePause,
  onCycleSpeed,
  onToggleTheme,
  onToggleAi,
}) => {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSiteMenuOpen(false);
        setAlertsOpen(false);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSiteMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQ = query.trim().toLowerCase();
  const searchResults = normalizedQ
    ? [
        ...sites
          .filter(
            (s) =>
              s.id.toLowerCase().includes(normalizedQ) ||
              s.name.toLowerCase().includes(normalizedQ)
          )
          .map((s) => ({
            key: s.id,
            badge: s.id,
            title: s.name,
            sub: s.address,
            onPick: () => {
              onChangeScope(s.id);
              onSelectObject(null, s.id);
            },
          })),
        ...trucks
          .filter(
            (t) =>
              t.id.toLowerCase().includes(normalizedQ) ||
              t.carrier.toLowerCase().includes(normalizedQ) ||
              t.shipmentId.toLowerCase().includes(normalizedQ) ||
              t.customer.toLowerCase().includes(normalizedQ)
          )
          .map((t) => ({
            key: t.id,
            badge: t.siteId,
            title: `${t.id} · ${t.carrier}`,
            sub: `${t.status} · ${t.shipmentId} · ${t.customer}`,
            onPick: () => onSelectObject({ type: 'truck', id: t.id }, t.siteId),
          })),
        ...forklifts
          .filter(
            (f) =>
              f.id.toLowerCase().includes(normalizedQ) ||
              f.taskLabel.toLowerCase().includes(normalizedQ)
          )
          .map((f) => ({
            key: f.id,
            badge: f.siteId,
            title: `${f.id} · Montacargas`,
            sub: f.taskLabel,
            onPick: () => onSelectObject({ type: 'forklift', id: f.id }, f.siteId),
          })),
      ].slice(0, 7)
    : [];

  const handleStepSite = (dir: -1 | 1) => {
    const idx = sites.findIndex((s) => s.id === activeSite.id);
    const nextIdx = (idx + dir + sites.length) % sites.length;
    onChangeScope(sites[nextIdx].id);
  };

  const fillPct = Math.round((activeSite.stockCurrent / activeSite.stockCapacity) * 100);
  const dockedCount = activeSite.docks.filter((d) => d.status === 'Ocupado').length;

  return (
    <header className="ce-topbar">
      {/* Left: Untouched Master Logo of Canal Ejecutivo (§2.1 & §7.1) */}
      <div className="ce-topbar__brand">
        <a
          href="#inicio"
          className="ce-brand-link"
          onClick={(e) => {
            e.preventDefault();
            onChangeScope('CD-04');
          }}
          title="Canal Ejecutivo · Inicio"
        >
          <img
            src={
              isDark
                ? '/brand/ce-logo-horizontal-blanco.png'
                : '/brand/ce-logo-horizontal-azul.png'
            }
            alt="Canal Ejecutivo"
            className="ce-brand-logo"
          />
        </a>
        <span className="ce-brand-bar" aria-hidden="true" />
        <div className="ce-brand-product">
          <span className="ce-brand-product__overline">GEMELO DIGITAL 3D</span>
          <span className="ce-brand-product__title">Operaciones Logísticas</span>
        </div>
      </div>

      {/* Center-Left: Global Search Input */}
      <div className="ce-search">
        <Search size={16} className="ce-search__icon" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Buscar sedes, camiones, montacargas, pallets, envíos..."
          aria-label="Buscar en la red logística"
          className="ce-search__input"
        />
        {query ? (
          <button
            type="button"
            className="ce-search__clear"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="ce-search__kbd">/</kbd>
        )}

        {searchFocused && normalizedQ && (
          <div className="ce-search__dropdown">
            {searchResults.length === 0 ? (
              <div className="ce-search__empty">
                Sin coincidencias para «{query}»
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="ce-search__item"
                  onClick={() => {
                    item.onPick();
                    setQuery('');
                    setSearchFocused(false);
                  }}
                >
                  <span className="ce-badge-code">{item.badge}</span>
                  <div className="ce-search__item-body">
                    <span className="ce-search__item-title">{item.title}</span>
                    <span className="ce-search__item-sub">{item.sub}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Center-Right: Multi-Site Network Selector Dropdown (exact clone of frame_007!) */}
      <div className="ce-site-selector" ref={dropdownRef}>
        <button
          type="button"
          className="ce-site-selector__trigger"
          onClick={() => setSiteMenuOpen((o) => !o)}
          aria-expanded={siteMenuOpen}
        >
          <span className="ce-badge-code">
            {viewScope === 'ALL' ? 'RED' : activeSite.id}
          </span>
          <div className="ce-site-selector__meta">
            <span className="ce-site-selector__name">
              {viewScope === 'ALL' ? 'Vista General (5 Sedes)' : activeSite.name}
            </span>
            <span className="ce-site-selector__sub">
              {viewScope === 'ALL'
                ? '14 camiones · 97,6% a tiempo'
                : `${fillPct}% lleno · ${dockedCount}/${activeSite.docks.length} en muelle`}
            </span>
          </div>
        </button>

        <div className="ce-site-selector__nav">
          <button
            type="button"
            className="ce-icon-mini"
            onClick={() => handleStepSite(-1)}
            title="Sede anterior"
            aria-label="Sede anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="ce-icon-mini"
            onClick={() => handleStepSite(1)}
            title="Siguiente sede"
            aria-label="Siguiente sede"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            className="ce-icon-mini"
            onClick={() => setSiteMenuOpen((o) => !o)}
            title="Abrir lista de sedes"
            aria-label="Abrir lista de sedes"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {siteMenuOpen && (
          <div className="ce-site-dropdown">
            <button
              type="button"
              className={`ce-site-dropdown__row ${
                viewScope === 'ALL' ? 'is-active' : ''
              }`}
              onClick={() => {
                onChangeScope('ALL');
                setSiteMenuOpen(false);
              }}
            >
              <span className="ce-badge-code ce-badge-code--dark">TODOS</span>
              <div className="ce-site-dropdown__info">
                <div className="ce-site-dropdown__top">
                  <strong>Vista general de la red</strong>
                  <span className="ce-mono">5 sedes</span>
                </div>
                <span className="ce-site-dropdown__caption">
                  Alejar cámara a todo el campus industrial
                </span>
              </div>
            </button>

            <div className="ce-site-dropdown__divider" />

            {sites.map((site) => {
              const pct = Math.round((site.stockCurrent / site.stockCapacity) * 100);
              const occ = site.docks.filter((d) => d.status === 'Ocupado').length;
              const inbound = trucks.filter(
                (t) =>
                  t.siteId === site.id &&
                  (t.status === 'En ruta' || t.status === 'Aculando')
              ).length;

              return (
                <button
                  key={site.id}
                  type="button"
                  className={`ce-site-dropdown__row ${
                    viewScope === site.id ? 'is-active' : ''
                  }`}
                  onClick={() => {
                    onChangeScope(site.id);
                    setSiteMenuOpen(false);
                  }}
                >
                  <span className="ce-badge-code">{site.id}</span>
                  <div className="ce-site-dropdown__info">
                    <div className="ce-site-dropdown__top">
                      <strong>{site.name}</strong>
                      <span className="ce-mono">{pct}%</span>
                    </div>
                    <div className="ce-progress-track ce-progress-track--thin">
                      <div
                        className="ce-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="ce-site-dropdown__caption">
                      {occ}/{site.docks.length} en muelle · {inbound} entrantes
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls: Live Status, AI Copilot (Zyro), Theme, Notifications & User */}
      <div className="ce-topbar__actions">
        <div className="ce-live-pill">
          <span
            className={`ce-live-dot ${isPaused ? 'is-paused' : ''}`}
            aria-hidden="true"
          />
          <span className="ce-live-label">{isPaused ? 'Pausado' : 'En vivo'}</span>
          <span className="ce-live-clock ce-mono">{clockText}</span>
          <button
            type="button"
            className="ce-live-btn"
            onClick={onTogglePause}
            title={isPaused ? 'Reanudar simulación' : 'Pausar simulación'}
            aria-label={isPaused ? 'Reanudar simulación' : 'Pausar simulación'}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            type="button"
            className="ce-live-speed ce-mono"
            onClick={onCycleSpeed}
            title="Cambiar velocidad de simulación"
          >
            {simSpeed}×
          </button>
        </div>

        {/* IA Activa / Guía Zyro Button (§6.4 & §8.1) */}
        <button
          type="button"
          className={`ce-ai-chip ${isAiOpen ? 'is-active' : ''}`}
          onClick={onToggleAi}
          title="Abrir Copiloto IA y Guía Zyro"
        >
          <span className="ce-ai-chip__pulse" aria-hidden="true" />
          <Sparkles size={14} />
          <span>IA activa</span>
        </button>

        {/* Theme Switcher (§7.5 Light / Dark Mode) */}
        <button
          type="button"
          className="ce-icon-btn"
          onClick={onToggleTheme}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Alerts Bell */}
        <div className="ce-alerts-wrap">
          <button
            type="button"
            className="ce-icon-btn"
            onClick={() => setAlertsOpen((o) => !o)}
            aria-label="Notificaciones operativas"
            title="Alertas operativas"
          >
            <Bell size={17} />
            <span className="ce-notif-dot" />
          </button>

          {alertsOpen && (
            <div className="ce-alerts-popover">
              <div className="ce-alerts-popover__head">
                <span> Eventos Operativos</span>
                <span className="ce-mono">3 activos</span>
              </div>
              <div className="ce-alert-item ce-alert-item--info">
                <strong>ⓘ Arribo en 1 min · CAM-2481</strong>
                <span>Bahía Ent. 2 asignada automáticamente en CD-04.</span>
              </div>
              <div className="ce-alert-item ce-alert-item--warn">
                <strong>! Stock bajo · Caja Corrugada (M)</strong>
                <span>893 unidades restantes en CD-02 Norte Principal.</span>
              </div>
              <div className="ce-alert-item ce-alert-item--ok">
                <strong>✓ Puntualidad sobre meta (98,2 %)</strong>
                <span>Despachos consolidados sin demoras en turno mañana.</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="ce-user-chip">
          <div className="ce-user-chip__avatar" aria-hidden="true">
            CM
          </div>
          <div className="ce-user-chip__text">
            <span className="ce-user-chip__name">Carlos Mendoza</span>
            <span className="ce-user-chip__role">Gerente de Operaciones</span>
          </div>
        </div>
      </div>
    </header>
  );
};

