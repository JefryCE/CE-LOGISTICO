import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isTouch: boolean;
}

function getViewportInfo(): ViewportInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const height = typeof window !== 'undefined' ? window.innerHeight : 900;

  // Puntos de corte oficiales del Manual Canal Ejecutivo §7.5:
  // Móvil < 768 px · Tablet 768–1023 px · Escritorio >= 1024 px
  let deviceType: DeviceType = 'desktop';
  if (width < 768) {
    deviceType = 'mobile';
  } else if (width < 1024) {
    deviceType = 'tablet';
  }

  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    width,
    height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isLandscape: width > height,
    isTouch,
  };
}

export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(getViewportInfo);

  useEffect(() => {
    const update = () => setViewport(getViewportInfo());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return viewport;
}
