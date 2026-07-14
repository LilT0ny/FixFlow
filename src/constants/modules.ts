/** Módulos de la app que un member puede tener habilitados/deshabilitados.
 *  Dashboard/dispositivos/ventas se unificaron en una sola vista ('/') en el
 *  rediseño, y "usuarios" vive dentro de la pestaña Configuración. "registro"
 *  ya no tiene vista propia (es el modal "Nuevo ingreso" disparado desde
 *  Inicio) — sigue siendo un módulo con permiso propio, solo que ahora gatea
 *  un botón en vez de una ruta; por eso su entrada en MODULE_ROUTES apunta a
 *  Inicio en vez de a una página dedicada. */
export type ModuleKey = 'dashboard' | 'registro' | 'clientes' | 'caja' | 'reportes' | 'configuracion';

export const ALL_MODULES: ModuleKey[] = ['dashboard', 'registro', 'clientes', 'caja', 'reportes', 'configuracion'];

export const MODULE_ROUTES: Record<ModuleKey, string> = {
  dashboard: '/',
  registro: '/',
  clientes: '/clients',
  caja: '/cash',
  reportes: '/reports',
  configuracion: '/settings',
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Inicio',
  registro: 'Nuevo ingreso',
  clientes: 'Clientes',
  caja: 'Transacciones',
  reportes: 'Reportes',
  configuracion: 'Configuración',
};
