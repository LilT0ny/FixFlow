import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, Home, LogOut, Settings, Users, ChartNoAxesCombined, SquarePlus, MonitorSmartphone, CircleDollarSign, FileText } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { useSettings } from '../hooks/useSettings';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAppContext();
  const { settings } = useSettings();

  const navItems = [
    { to: "/", icon: Home, label: "Inicio", end: true },
    { to: "/check-in", icon: SquarePlus, label: "Nuevo Ingreso" },
    { to: "/devices", icon: MonitorSmartphone, label: "Lista de Dispositivos" },
    { to: "/sales", icon: FileText, label: "Notas de Venta" },
    { to: "/clients", icon: Users, label: "Lista de Clientes" },
    { to: "/cash", icon: CircleDollarSign, label: "Transacciones" },
    { to: "/reports", icon: ChartNoAxesCombined, label: "Reportes" },
    { to: "/settings", icon: Settings, label: "Configuración" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10 transition-transform">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {settings?.companyName?.charAt(0) || 'S'}
              </div>
            )}
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight truncate">
            {settings?.companyName || 'Cargando...'}
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative p-4 md:p-8">
        {/* Mobile menu button */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="md:hidden fixed top-4 right-4 z-20 p-3 bg-white text-gray-700 shadow-lg rounded-full border border-gray-200"
          title="Open Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile menu backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Sidebar - Mobile */}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           <div className="p-6 flex items-center gap-3 border-b">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {settings?.companyName?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
              {settings?.companyName || 'Cargando...'}
            </h1>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to} 
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
          