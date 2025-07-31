import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Processes from './components/Processes';
import Hearings from './components/Hearings';
import Galeria from './components/Galeria';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Componente para rotas públicas
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/clients" 
        element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/processes" 
        element={
          <ProtectedRoute>
            <Processes />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/hearings" 
        element={
          <ProtectedRoute>
            <Hearings />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/galeria" 
        element={
          <ProtectedRoute>
            <Galeria />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />
      
      <Route 
        path="*" 
        element={<Navigate to="/dashboard" replace />} 
      />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App; 