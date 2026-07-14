
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { SettingsProvider } from './store/SettingsContext';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './store/ToastContext';
import { AdminLayout } from './layouts/AdminLayout';
import { MasterAdminLayout } from './layouts/MasterAdminLayout';
import { DashboardFeature } from './features/Dashboard/DashboardFeature';
import { CashRegisterFeature } from './features/CashRegister/CashRegisterFeature';
import { ReportsFeature } from './features/Reports/ReportsFeature';
import { ClientStatus } from './pages/ClientStatus';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { ClientsFeature } from './features/Clients/ClientsFeature';
import { InventoryFeature } from './features/Inventory/InventoryFeature';
import { SettingsFeature } from './features/Settings/SettingsFeature';
import { MasterAdminDashboard } from './features/MasterAdmin/MasterAdminDashboard';
import { SessionsPage } from './features/MasterAdmin/SessionsPage';
import { useAuth } from './hooks/useAuthSaaS';
import { ALL_MODULES, MODULE_ROUTES, type ModuleKey } from './constants/modules';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, authUser, authLoading } = useAppContext();
  if (authLoading) return null; // esperar restauración de sesión antes de decidir
  if (authUser?.debe_cambiar_password) return <Navigate to="/change-password" replace />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/** Master no pasa por AppContext (isAuthenticated ahí excluye is_master a
 *  propósito), así que tiene su propio guard sobre useAuthSaaS. */
const RequireMaster = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_master) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** Gatea una vista según los módulos habilitados del member (owner/master nunca se restringen).
 *  Si no tiene acceso, redirige al primer módulo permitido; si no tiene ninguno, avisa en vez
 *  de generar un loop de redirecciones. */
const RequireModule = ({ module, children }: { module: ModuleKey; children: React.ReactNode }) => {
  const { canAccessModule, logout } = useAppContext();
  if (canAccessModule(module)) return <>{children}</>;

  const fallback = ALL_MODULES.find(m => m !== module && canAccessModule(m));
  if (fallback) return <Navigate to={MODULE_ROUTES[fallback]} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-surface-900 font-semibold mb-1">Sin acceso a ningún módulo</p>
        <p className="text-sm text-surface-500 mb-4">Pedile al dueño del taller que te habilite alguna vista.</p>
        <button onClick={logout} className="text-sm text-primary-600 font-medium hover:underline">Cerrar sesión</button>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
    <AppProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            {/* Redirigir /saas-login al login unificado */}
            <Route path="/saas-login" element={<Navigate to="/login" replace />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/status/:id" element={<ClientStatus />} />

            {/* Master Admin routes */}
            <Route path="/master" element={<RequireMaster><MasterAdminLayout /></RequireMaster>}>
              <Route path="dashboard" element={<MasterAdminDashboard />} />
              <Route path="sessions" element={<SessionsPage />} />
            </Route>

            {/* Admin routes with sidebar */}
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<RequireModule module="dashboard"><DashboardFeature /></RequireModule>} />
              {/* Dispositivos vive ahora en el Dashboard (ruta índice) */}
              <Route path="devices" element={<Navigate to="/" replace />} />
              {/* Nuevo ingreso vive ahora como modal en el Dashboard */}
              <Route path="check-in" element={<Navigate to="/" replace />} />
              <Route path="clients" element={<RequireModule module="clientes"><ClientsFeature /></RequireModule>} />
              <Route path="inventory" element={<RequireModule module="inventario"><InventoryFeature /></RequireModule>} />
              <Route path="cash" element={<RequireModule module="caja"><CashRegisterFeature /></RequireModule>} />
              <Route path="reports" element={<RequireModule module="reportes"><ReportsFeature /></RequireModule>} />
              <Route path="settings" element={<RequireModule module="configuracion"><SettingsFeature /></RequireModule>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AppProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
