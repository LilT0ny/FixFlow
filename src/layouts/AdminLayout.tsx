import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, LogOut, Settings, Users, ChartNoAxesCombined,
  CircleDollarSign, Wrench, PanelLeftClose, PanelLeftOpen, Sun, Moon
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../store/ThemeContext';
import type { ModuleKey } from '../constants/modules';

/** Navegación agrupada por tipo de tarea */
const NAV_SECTIONS: { title: string; items: { to: string; icon: typeof Home; label: string; end?: boolean; module: ModuleKey }[] }[] = [
  {
    title: 'Taller',
    items: [
      { to: '/', icon: Home, label: 'Inicio', end: true, module: 'dashboard' },
      { to: '/clients', icon: Users, label: 'Clientes', module: 'clientes' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/cash', icon: CircleDollarSign, label: 'Transacciones', module: 'caja' },
      { to: '/reports', icon: ChartNoAxesCombined, label: 'Reportes', module: 'reportes' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/settings', icon: Settings, label: 'Configuración', module: 'configuracion' },
    ],
  },
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('sidebar_collapsed') === '1');
  const { logout, canAccessModule } = useAppContext();
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const visibleSections = NAV_SECTIONS
    .map(section => ({ ...section, items: section.items.filter(item => canAccessModule(item.module)) }))
    .filter(section => section.items.length > 0);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar_collapsed', prev ? '0' : '1');
      return !prev;
    });
  };

  const brandLogo = (
    <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-surface-900 shrink-0">
      {settings.logo ? (
        <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
      ) : (
        <Wrench className="w-5 h-5 text-white" />
      )}
    </div>
  );

  const navLinkClass = (isActive: boolean, isCollapsed: boolean) =>
    `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
    } ${isActive
      ? 'bg-surface-100 text-surface-900 dark:bg-gray-800 dark:text-gray-100'
      : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/60'}`;

  const navigation = (isCollapsed: boolean) => (
    <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
      {visibleSections.map((section, i) => (
        <div key={section.title}>
          {isCollapsed ? (
            i > 0 && <div className="border-t border-surface-100 dark:border-gray-800 mx-2 mb-3" />
          ) : (
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-gray-500 select-none">
              {section.title}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) => navLinkClass(isActive, isCollapsed)}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!isCollapsed && item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const logoutButton = (isCollapsed: boolean) => (
    <div className="p-3 mt-auto border-t border-surface-200 dark:border-gray-800 space-y-0.5">
      <button
        onClick={toggleTheme}
        title={isCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
        className={`flex items-center gap-3 py-2.5 w-full rounded-lg text-sm font-medium text-surface-500 hover:text-surface-900 hover:bg-surface-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/60 transition-colors duration-150 ${
          isCollapsed ? 'justify-center px-0' : 'px-3'
        }`}
      >
        {theme === 'dark' ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
        {!isCollapsed && (theme === 'dark' ? 'Modo claro' : 'Modo oscuro')}
      </button>
      <button
        onClick={logout}
        title={isCollapsed ? 'Cerrar sesión' : undefined}
        className={`flex items-center gap-3 py-2.5 w-full rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-red-950/30 transition-colors duration-150 ${
          isCollapsed ? 'justify-center px-0' : 'px-3'
        }`}
      >
        <LogOut className="w-[18px] h-[18px] shrink-0" />
        {!isCollapsed && 'Cerrar sesión'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 dark:bg-gray-950 dark:text-gray-100 flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-surface-200 dark:bg-gray-900 dark:border-gray-800 fixed h-full z-10 transition-[width] duration-300 ease-out ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className={`p-4 pb-5 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          {brandLogo}
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold tracking-tight text-surface-900 dark:text-gray-100 leading-tight truncate">
                {settings?.companyName || 'Cargando...'}
              </h1>
              <p className="text-xs text-surface-500 dark:text-gray-400 truncate">Panel administrativo</p>
            </div>
          )}
        </div>

        {navigation(collapsed)}

        {/* Toggle contraer/expandir */}
        <div className="px-3 pb-1">
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className={`flex items-center gap-3 py-2.5 w-full rounded-lg text-sm font-medium text-surface-500 hover:text-surface-900 hover:bg-surface-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/60 transition-colors duration-150 ${
              collapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-[18px] h-[18px] shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-[18px] h-[18px] shrink-0" />
                Contraer menú
              </>
            )}
          </button>
        </div>

        {logoutButton(collapsed)}
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen relative p-4 md:p-8 lg:p-10 pt-20 md:pt-8 transition-[margin] duration-300 ease-out ${
          collapsed ? 'md:ml-[76px]' : 'md:ml-64'
        }`}
      >
        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 w-full h-14 bg-white/90 backdrop-blur-md border-b border-surface-200 dark:bg-gray-900/90 dark:border-gray-800 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            {brandLogo}
            <span className="text-sm font-semibold tracking-tight text-surface-900 dark:text-gray-100 truncate">
              {settings?.companyName || 'Cargando...'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors duration-150"
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors duration-150"
              title="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-surface-900/40 z-30 md:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Mobile */}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-surface-200 dark:bg-gray-900 dark:border-gray-800 z-40 flex flex-col transform transition-transform duration-300 ease-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 pb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {brandLogo}
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold tracking-tight text-surface-900 dark:text-gray-100 leading-tight truncate">
                  {settings?.companyName || 'Cargando...'}
                </h1>
                <p className="text-xs text-surface-500 dark:text-gray-400 truncate">Panel administrativo</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors duration-150 shrink-0"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {navigation(false)}
          {logoutButton(false)}
        </aside>

        <main key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
