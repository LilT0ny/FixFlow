
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardFeature } from './features/Dashboard/DashboardFeature';
import { DeviceListFeature } from './features/DeviceList/DeviceListFeature';
import { CashRegister } from './pages/CashRegister';
import { Reports } from './pages/Reports';
import { ClientStatus } from './pages/ClientStatus';
import { Login } from './pages/Login';
import { RegistroReparacionFeature } from './features/RegistroReparacion/RegistroReparacionFeature';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/sistema-reparacion">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/status/:id" element={<ClientStatus />} />

          {/* Admin routes with sidebar */}
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardFeature />} />
            <Route path="check-in" element={<RegistroReparacionFeature />} />
            <Route path="devices" element={<DeviceListFeature />} />
            <Route path="cash" element={<CashRegister />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
