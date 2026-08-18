import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import EmployeeMaster from './pages/EmployeeMaster';
import Establishment from './pages/Establishment';
import JanShakti from './pages/JanShakti';
import Reports from './pages/Reports';
import VacancyDetails from './pages/VacancyDetails';
import EEVacancyDetails from './pages/EEVacancyDetails';
import Retirements from './pages/Retirements';

import { EmployeeProvider } from './contexts/EmployeeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HierarchyProvider } from './contexts/HierarchyContext';
import AdminPanel from './pages/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';

// Dummy pages for other routes
const Placeholder = ({ title }) => (
  <div className="card p-4 text-center border-0 shadow-sm rounded-4">
    <h3 className="text-primary">{title} Module</h3>
    <p className="text-muted">This module is scheduled for development in the next phase.</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <HierarchyProvider>
        <EmployeeProvider>
          <ErrorBoundary>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<EmployeeMaster />} />
              <Route path="establishments" element={<Establishment />} />
              <Route path="janshakti" element={<JanShakti />} />
              <Route path="reports" element={<Reports />} />
              <Route path="vacancy-details" element={<VacancyDetails />} />
              <Route path="ee-vacancy-details" element={<EEVacancyDetails />} />
              <Route path="retirements" element={<Retirements />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="settings" element={<Placeholder title="Settings" />} />
            </Route>
          </Routes>
          </BrowserRouter>
          </ErrorBoundary>
        </EmployeeProvider>
      </HierarchyProvider>
    </AuthProvider>
  );
}

export default App;
