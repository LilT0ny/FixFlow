import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, Home, LogOut, Settings, Users, ChartNoAxesCombined, SquarePlus, MonitorSmartphone, CircleDollarSign, FileText, Wrench } from 'lucide-react';
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
    <div className="min-h-screen bg-[#fafafa] font-sans text-surface-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-surface-200/50 fixed h-full z-10 transition-all duration-300">
        <div className="p-8 pb-10 flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-2xl bg-primary-600 shadow-xl shadow-primary-500/30 transform rotate-[-6deg]">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white font-black text-xl">
                {settings?.companyName?.charAt(0) || 'S'}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-surface-900 leading-none truncate max-w-[140px]">
              {settings?.companyName || 'Cargando...'}
            </h1>
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-1.5 opacity-60">Sello de Calidad</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-2">
          {navItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              end={item.end}
              className={({ isActive }) => `group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${isActive 
                ? 'bg-surface-900 text-white shadow-xl shadow-surface-200 scale-105 ml-1' 
                : 'text-surface-400 hover:text-surface-900 hover:bg-surface-50'}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-surface-50">
          <button 
            onClick={logout} 
            className="flex items-center gap-3.5 px-4 py-4 w-full rounded-2xl font-black text-[11px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all active:scale-95 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center transition-colors group-hover:bg-red-100">
              <LogOut className="w-4 h-4" />
            </div>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen relative p-4 md:p-10 pt-20 md:pt-10">
        {/* Mobile header / active indicator */}
        <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200/50 z-20 flex items-center justify-between px-6">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
               <Wrench className="w-4 h-4 text-white" />
             </div>
             <span className="font-black text-sm tracking-tight text-surface-900 truncate max-w-[150px]">
               {settings?.companyName || 'S'}
             </span>
           </div>
           
           <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2.5 bg-surface-900 text-white shadow-lg rounded-xl transition-all active:scale-90"
            title="Abrir Menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile menu backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-md z-30 md:hidden animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Sidebar - Mobile */}
        <aside className={`fixed inset-y-0 left-0 w-[300px] bg-white shadow-[32px_0_64px_-16px_rgba(0,0,0,0.1)] z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} rounded-r-[40px] border-r border-white`}>
           <div className="p-8 pb-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-[20px] bg-primary-600 shadow-2xl shadow-primary-500/30">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white font-black text-2xl">
                    {settings?.companyName?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-3 rounded-full bg-surface-50 text-surface-400 active:scale-95">
                <Menu className="w-6 h-6 rotate-90" />
              </button>
            </div>
            
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-surface-900 leading-tight">
                {settings?.companyName || 'Cargando...'}
              </h1>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-1 opacity-60">Panel Administrativo</p>
            </div>
          </div>

          <nav className="px-6 space-y-2 mt-4">
            {navItems.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to} 
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${isActive ? 'bg-surface-900 text-white shadow-xl shadow-surface-300 translate-x-1' : 'text-surface-400 hover:bg-surface-50'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="absolute bottom-10 left-0 w-full px-6">
            <button 
              onClick={logout} 
              className="flex items-center gap-4 px-5 py-5 w-full rounded-2xl font-black text-[11px] uppercase tracking-widest text-red-500 bg-red-50 active:bg-red-100 transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </main>
      </div>
    </div>
  );
};