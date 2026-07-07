
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { SettingsProvider } from './store/SettingsContext';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardFeature } from './features/Dashboard/DashboardFeature';
import { DeviceListFeature } from './features/DeviceList/DeviceListFeature';
import { CashRegisterFeature } from './features/CashRegister/CashRegisterFeature';
import { ReportsFeature } from './features/Reports/ReportsFeature';
import { ClientStatus } from './pages/ClientStatus';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { RegistrationFeature } from './features/Registration/RegistrationFeature';
import { SalesNotesFeature } from './features/Sales/SalesNotesFeature';
import { ClientsFeature } from './features/Clients/ClientsFeature';
import { SettingsFeature } from './features/Settings/SettingsFeature';
import { MasterAdminDashboard } from './features/MasterAdmin/MasterAdminDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, authUser, authLoading } = useAppContext();
  if (authLoading) return null; // esperar restauración de sesión antes de decidir
  if (authUser?.debe_cambiar_password) return <Navigate to="/change-password" replace />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
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
            <Route path="/master/dashboard" element={<MasterAdminDashboard />} />

            {/* Admin routes with sidebar */}
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardFeature />} />
              <Route path="check-in" element={<RegistrationFeature />} />
              <Route path="devices" element={<DeviceListFeature />} />
              <Route path="sales" element={<SalesNotesFeature />} />
              <Route path="clients" element={<ClientsFeature />} />
              <Route path="cash" element={<CashRegisterFeature />} />
              <Route path="reports" element={<ReportsFeature />} />
              <Route path="settings" element={<SettingsFeature />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AppProvider>
  );
}

export default App;
