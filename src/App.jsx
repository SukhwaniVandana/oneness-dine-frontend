import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ThemeProvider }  from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider }  from './components/common/Toast';
import { ErrorBoundary }  from './components/common/ErrorHandler';
import AppLayout          from './components/layout/AppLayout';

import Login             from './pages/Login';
import TablesDashboard   from './pages/TablesDashboard';

/* ── Placeholder for screens not yet built ── */
const Placeholder = ({ name }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', flexDirection: 'column', gap: '12px',
  }}>
    <div style={{ fontSize: '32px', opacity: 0.3 }}>🚧</div>
    <div style={{
      fontFamily: "'Rajdhani',sans-serif", fontSize: '18px',
      fontWeight: 600, color: 'var(--text2)',
    }}>
      {name} — Coming Soon
    </div>
    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
      This screen is being built next.
    </div>
  </div>
);

/* ── Protected Route — redirects to /login if not authenticated ── */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? <AppLayout><Outlet /></AppLayout>
    : <Navigate to="/login" replace />;
}

/* ── Public Route — redirects to /tables if already logged in ── */
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? <Navigate to="/tables" replace />
    : children;
}

/* ── React Query global config ── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 20_000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  {/* Default → Login */}
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  {/* Public — Login */}
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />

                  {/* Protected — all app screens */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/tables"  element={<TablesDashboard />} />
                    <Route path="/order"   element={<Placeholder name="Order Taking" />} />
                    <Route path="/kot"     element={<Placeholder name="Kitchen Display (KOT)" />} />
                    <Route path="/billing" element={<Placeholder name="Billing" />} />
                    <Route path="/reports" element={<Placeholder name="Reports Dashboard" />} />
                    <Route path="/admin"   element={<Placeholder name="Admin Panel" />} />
                  </Route>

                  {/* 404 → Login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>

        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
