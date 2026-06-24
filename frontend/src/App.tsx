import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Login } from '@/pages/Login/Login';
import { Register } from '@/pages/Register/Register';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import '@/styles/global.css';
import '@/styles/typography.css';

// Guard para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--on-surface-variant)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>
          progress_activity
        </span>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
	const { isAuthenticated } = useAuth();

	return (
		<Routes>
			<Route
				path="/login"
				element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
			/>
			<Route
				path="/register"
				element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
			/>
			<Route
				path="/"
				element={
				<ProtectedRoute>
					<Dashboard />
				</ProtectedRoute>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

const App = () => {
    return (
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<AppRoutes />
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
    );
};

export default App;