
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { SettingsProvider } from './store/SettingsContext';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardFeature } from './features/Dashboard/DashboardFeature';
import { DeviceListFeature } from './features/DeviceList/DeviceListFeature';
import { CashRegister } from './pages/CashRegister';
import { Reports } from './pages/Reports';
import { ClientStatus } from './pages/ClientStatus';
import { Login } from './pages/Login';
import { RegistrationFeature } from './features/Registration/RegistrationFeature';
import { SalesNotesFeature } from './features/Sales/SalesNotesFeature';
import { ClientManagement } from './pages/Clients';
import { Settings } from './pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppContext();
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
            <Route path="/status/:id" element={<ClientStatus />} />

            {/* Admin routes with sidebar */}
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardFeature />} />
              <Route path="check-in" element={<RegistrationFeature />} />
              <Route path="devices" element={<DeviceListFeature />} />
              <Route path="sales" element={<SalesNotesFeature />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="cash" element={<CashRegister />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AppProvider>
  );
}

export default App;
