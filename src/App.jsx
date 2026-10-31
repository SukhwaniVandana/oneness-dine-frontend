import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { ROLE_HOME } from './config/roles';

import AppLayout     from './components/layout/AppLayout';
import CaptainLayout from './components/layout/CaptainLayout';
import KitchenLayout from './components/layout/KitchenLayout';

import LoginPage       from './pages/Login';
import TablesDashboard from './pages/TablesDashboard';
import OrderTaking     from './pages/OrderTaking';
import KotScreen       from './pages/KotScreen';
import BillingScreen   from './pages/BillingScreen';
import BillsScreen     from './pages/BillsScreen';
import ReportsPage     from './pages/ReportsScreen';
import AdminPage       from './pages/AdminScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

/* ── Route guard: redirect to login if not authenticated ── */
function PublicRoute({ children }) {
  const { session } = useAuth();
  if (session) {
    const home = ROLE_HOME[session.roleName] || '/tables';
    return <Navigate to={home} replace />;
  }
  return children;
}

/* ── Route guard: pick layout by role ── */
function ProtectedRoute() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;

  const role = session.roleName;

  /* Captain — mobile order-taking app (Tables + Order only) */
  if (role === 'CAPTAIN') {
    return (
      <CaptainLayout>
        <Routes>
          <Route path="tables" element={<TablesDashboard />} />
          <Route path="order"  element={<OrderTaking />} />
          <Route path="*"      element={<Navigate to="/tables" replace />} />
        </Routes>
      </CaptainLayout>
    );
  }

  /* Kitchen staff — fullscreen KOT display only */
  if (role === 'KITCHEN_STAFF') {
    return (
      <KitchenLayout>
        <Routes>
          <Route path="kot" element={<KotScreen />} />
          <Route path="*"   element={<Navigate to="/kot" replace />} />
        </Routes>
      </KitchenLayout>
    );
  }

  /* All other roles (ADMIN, MANAGER, CASHIER, WAITER) → full desktop app */
  return (
    <AppLayout>
      <Routes>
        <Route path="tables"  element={<TablesDashboard />} />
        <Route path="order"   element={<OrderTaking />} />
        <Route path="kot"     element={<KotScreen />} />
        <Route path="billing" element={<BillingScreen />} />
        <Route path="bill"    element={<BillsScreen />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="admin"   element={<AdminPage />} />
        <Route path="*"       element={<Navigate to={ROLE_HOME[role] || '/tables'} replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={
                  <PublicRoute><LoginPage /></PublicRoute>
                } />
                <Route path="/*" element={<ProtectedRoute />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
