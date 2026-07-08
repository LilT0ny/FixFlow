/** Módulos de la app que un member puede tener habilitados/deshabilitados.
 *  Dashboard/dispositivos/ventas se unificaron en una sola vista ('/') en el
 *  rediseño, y "usuarios" vive dentro de la pestaña Configuración — por eso
 *  acá solo se listan los 6 módulos con vista propia hoy. */
export type ModuleKey = 'dashboard' | 'registro' | 'clientes' | 'caja' | 'reportes' | 'configuracion';

export const ALL_MODULES: ModuleKey[] = ['dashboard', 'registro', 'clientes', 'caja', 'reportes', 'configuracion'];

export const MODULE_ROUTES: Record<ModuleKey, string> = {
  dashboard: '/',
  registro: '/check-in',
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
