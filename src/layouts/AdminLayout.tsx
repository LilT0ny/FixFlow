import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogOut, Settings, Users, ChartNoAxesCombined, SquarePlus, MonitorSmartphone, CircleDollarSign, FileText, Wrench } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { useSettings } from '../hooks/useSettings';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAppContext();
  const { settings } = useSettings();
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Inicio", end: true },
    { to: "/check-in", icon: SquarePlus, label: "Nuevo ingreso" },
    { to: "/devices", icon: MonitorSmartphone, label: "Dispositivos" },
    { to: "/sales", icon: FileText, label: "Notas de venta" },
    { to: "/clients", icon: Users, label: "Clientes" },
    { to: "/cash", icon: CircleDollarSign, label: "Transacciones" },
    { to: "/reports", icon: ChartNoAxesCombined, label: "Reportes" },
    { to: "/settings", icon: Settings, label: "Configuración" },
  ];

  const brandLogo = (
    <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-surface-900 shrink-0">
      {settings.logo ? (
        <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
      ) : (
        <Wrench className="w-5 h-5 text-white" />
      )}
    </div>
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive
      ? 'bg-surface-100 text-surface-900'
      : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50'}`;

  const navigation = (
    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setSidebarOpen(false)}
          className={navLinkClass}
        >
          <item.icon className="w-[18px] h-[18px] shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const logoutButton = (
    <div className="p-3 mt-auto border-t border-surface-200">
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors duration-150"
      >
        <LogOut className="w-[18px] h-[18px]" />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-surface-200 fixed h-full z-10">
        <div className="p-4 pb-6 flex items-center gap-3">
          {brandLogo}
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-surface-900 leading-tight truncate">
              {settings?.companyName || 'Cargando...'}
            </h1>
            <p className="text-xs text-surface-500 truncate">Panel administrativo</p>
          </div>
        </div>

        {navigation}
        {logoutButton}
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative p-4 md:p-8 lg:p-10 pt-20 md:pt-8">
        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 w-full h-14 bg-white/90 backdrop-blur-md border-b border-surface-200 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            {brandLogo}
            <span className="text-sm font-semibold tracking-tight text-surface-900 truncate">
              {settings?.companyName || 'Cargando...'}
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors duration-150"
            title="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile menu backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-surface-900/40 z-30 md:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Mobile */}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-surface-200 z-40 flex flex-col transform transition-transform duration-300 ease-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 pb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {brandLogo}
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold tracking-tight text-surface-900 leading-tight truncate">
                  {settings?.companyName || 'Cargando...'}
                </h1>
                <p className="text-xs text-surface-500 truncate">Panel administrativo</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors duration-150 shrink-0"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {navigation}
          {logoutButton}
        </aside>

        <main key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
