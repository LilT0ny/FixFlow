
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { DeviceList } from './pages/DeviceList';
import { CashRegister } from './pages/CashRegister';
import { Reports } from './pages/Reports';
import { ClientStatus } from './pages/ClientStatus';
import { Login } from './pages/Login';
import { CheckInForm } from './components/DeviceCheckIn/CheckInForm';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/status/:id" element={<ClientStatus />} />

          {/* Admin routes with sidebar */}
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="check-in" element={<CheckInForm />} />
            <Route path="devices" element={<DeviceList />} />
            <Route path="cash" element={<CashRegister />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
