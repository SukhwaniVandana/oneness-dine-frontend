import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider }         from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider }         from './components/common/Toast';
import { ErrorBoundary }         from './components/common/ErrorHandler';
import AppLayout                 from './components/layout/AppLayout';
import Login           from './pages/Login';
import TablesDashboard from './pages/TablesDashboard';
import OrderTaking     from './pages/OrderTaking';
import KotScreen   from './pages/KotScreen';

const Placeholder = ({ name }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'12px' }}>
    <div style={{ fontSize:'32px', opacity:0.3 }}>🚧</div>
    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:'18px', fontWeight:600, color:'var(--text2)' }}>{name} — Coming Soon</div>
    <div style={{ fontSize:'12px', color:'var(--text3)' }}>This screen is being built next.</div>
  </div>
);

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout><Outlet /></AppLayout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/tables" replace /> : children;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry:2, retryDelay: a => Math.min(1000*2**a, 10000), staleTime:20_000 } },
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
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/tables"  element={<TablesDashboard />} />
                    <Route path="/order"   element={<OrderTaking />} />
                    <Route path="/kot"     element={<KotScreen />} />
                    <Route path="/billing" element={<Placeholder name="Billing" />} />
                    <Route path="/reports" element={<Placeholder name="Reports Dashboard" />} />
                    <Route path="/admin"   element={<Placeholder name="Admin Panel" />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
