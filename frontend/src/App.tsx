import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { Sidebar } from './components/Navigation/Sidebar';
import { Header } from './components/Navigation/Header';
import { PageTransition } from './components/Navigation/PageTransition';
import { ProtectedRoute } from './components/Navigation/ProtectedRoute';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { InfrastructurePage } from './pages/Infrastructure/InfrastructurePage';
import { DeploymentsPage } from './pages/Deployments/DeploymentsPage';
import { MonitoringPage } from './pages/Monitoring/MonitoringPage';
import { SecurityPage } from './pages/Security/SecurityPage';
import { CostManagementPage } from './pages/CostManagement/CostManagementPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { useAppInitialization } from './hooks/useAppInitialization';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  const { theme } = useSelector((state: any) => state.ui);
  const { onboardingCompleted } = useSelector((state: any) => state.user);
  
  // Initialize app data
  useAppInitialization();
  
  const isDark = theme === 'dark';
  const sidebarWidth = 280;
  const collapsedSidebarWidth = 64;

  // Set body theme attribute for CSS styling
  React.useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!onboardingCompleted) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)'
        : 'linear-gradient(135deg, #9eb5e7 0%, #afbfea 8%, #bfc9ec 17%, #cdd3ee 25%, #dbdef1 33%, #dce3f6 42%, #dde8fb 50%, #deedff 58%, #cdefff 67%, #b9f1ff 75%, #a7f4fa 83%, #9df5eb 100%)',
    }}>
      <Sidebar width={sidebarWidth} collapsedWidth={collapsedSidebarWidth} />
      <Header sidebarWidth={sidebarWidth} collapsedSidebarWidth={collapsedSidebarWidth} />
      
      <main style={{
        marginLeft: collapsedSidebarWidth, // Always use collapsed width
        marginTop: '0px', // Remove margin so background extends behind header
        paddingTop: '64px', // Add padding instead to push content below header
        minHeight: '100vh', // Full height
        background: isDark
          ? 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)'
          : 'linear-gradient(135deg, #9eb5e7 0%, #afbfea 8%, #bfc9ec 17%, #cdd3ee 25%, #dbdef1 33%, #dce3f6 42%, #dde8fb 50%, #deedff 58%, #cdefff 67%, #b9f1ff 75%, #a7f4fa 83%, #9df5eb 100%)',
      }}>
        <PageTransition>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Main application routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/infrastructure/*" 
              element={
                <ProtectedRoute>
                  <InfrastructurePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/deployments/*" 
              element={
                <ProtectedRoute>
                  <DeploymentsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/monitoring/*" 
              element={
                <ProtectedRoute>
                  <MonitoringPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/security/*" 
              element={
                <ProtectedRoute>
                  <SecurityPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cost-management/*" 
              element={
                <ProtectedRoute>
                  <CostManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Onboarding route */}
            <Route path="/onboarding" element={<OnboardingWizard />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <AppContent />
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;