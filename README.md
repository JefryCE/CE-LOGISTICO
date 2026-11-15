# Canal Ejecutivo · Gemelo Digital Logístico 3D

Simulación web 3D interactiva en tiempo real construida en español para **Canal Ejecutivo**, inspirada en la arquitectura operativa del gemelo logístico de referencia y diseñada siguiendo estrictamente el **Manual de Identidad Visual Corporativa v1.0** (`CE_Manual_Identidad_Visual_v1.0.pdf`).

## Ejecución Rápida

```bash
npm install
npm run dev
```

Abre en el navegador: `http://localhost:5173`

## Características Principales

- **Campus Industrial 3D Conectado (WebGL / Three.js):** 5 centros logísticos operativos (`CD-01` a `CD-05`) conectados por red vial asfaltada, bahías numeradas, anexos de oficinas acristaladas, silos frigoríficos, estaciones de carga eléctrica y zonas de acopio con pines 3D interactivos.
- **Flota Animada en Tiempo Real:** 14 camiones articulados (`En ruta`, `Aculando`, `Cargando`, `Descargando`) con línea de trayectoria dinámica y cajas delimitadoras 3D al seleccionarse, más 16 montacargas eléctricos trasladando pallets.
- **HUD Operativo Completo en Español:**
  - Encabezado corporativo `72 px` con logotipo maestro oficial, buscador global (`/`), selector desplegable de sedes + vista de red completa, control `En vivo` (`1× / 2× / Pausa`), alertas y modo claro/oscuro (`[data-theme="dark"]`).
  - Franja de KPIs en `JetBrains Mono` (`tabular-nums`).
  - Barra vertical de cámara (`+`, `−`, rotar `45°`, restablecer y seguimiento automático de vehículo) + Inspector contextual dual (Resumen de Sede con Inventario por SKU o Detalle de Vehículo/Muelle).
  - Línea de tiempo horizontal de 5 etapas (*Seguimiento de Envío*) y conmutador inferior de *Muelles*, *Montacargas* y *Camiones*.
  - **Copiloto IA y Guía Zyro:** Onboarding interactivo y diagnósticos con IA responsable (*«Generado con IA · revisado por un experto»*).

