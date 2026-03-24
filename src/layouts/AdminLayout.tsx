import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, ClipboardList, Wallet, Smartphone, Home, BarChart3, LogOut } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10 transition-transform">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="./Logo.svg" alt="Logo Mecánica Celular" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Mecánica Celular</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Home className="w-5 h-5" />
            Dashboard
          </NavLink>
          <NavLink to="/check-in" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ClipboardList className="w-5 h-5" />
            Nuevo Ingreso
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Smartphone className="w-5 h-5" />
            Equipos Registrados
          </NavLink>
          <NavLink to="/cash" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Wallet className="w-5 h-5" />
            Cuadre de Caja
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BarChart3 className="w-5 h-5" />
            Reportes
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        {/* Small floating button for mobile menu if header is removed */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="md:hidden fixed top-4 right-4 z-20 p-3 bg-white text-gray-700 shadow-md rounded-full hover:bg-gray-50 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile menu backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Sidebar - Mobile */}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           <div className="p-6 flex items-center gap-3 border-b">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="./Logo.svg" alt="Logo Mecánica Celular" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Mecánica Celular</h1>
          </div>
          <nav className="p-4 space-y-2">
            <NavLink to="/" end onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Home className="w-5 h-5" /> Dashboard
            </NavLink>
            <NavLink to="/check-in" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <ClipboardList className="w-5 h-5" /> Nuevo Ingreso
            </NavLink>
            <NavLink to="/devices" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Smartphone className="w-5 h-5" /> Equipos Registrados
            </NavLink>
            <NavLink to="/cash" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Wallet className="w-5 h-5" /> Cuadre de Caja
            </NavLink>
            <NavLink to="/reports" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <BarChart3 className="w-5 h-5" /> Reportes
            </NavLink>
          </nav>
          
          <div className="p-4 border-t border-gray-100 mt-auto">
            <button onClick={() => { setSidebarOpen(false); logout(); }} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
