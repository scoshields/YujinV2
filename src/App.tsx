import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Dashboard } from './pages/Dashboard';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { useAuthStore } from './store/authStore';
import { Profile } from './pages/Profile';
import { Workouts } from './pages/Workouts';
import { FitFamComparison } from './pages/PartnerComparison';
import { WorkoutDetails } from './pages/WorkoutDetails';
import { FitFam } from './pages/Partners';

function App() {
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Hero />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/workouts" element={
          <ProtectedRoute>
            <Workouts />
          </ProtectedRoute>
        } />
        <Route path="/partners" element={
          <ProtectedRoute>
            <FitFam />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/workouts/:workoutId" element={
          <ProtectedRoute>
            <WorkoutDetails />
          </ProtectedRoute>
        } />
        <Route path="/partners/:partnerId" element={
          <ProtectedRoute>
            <FitFamComparison />
          </ProtectedRoute>
        } />
        <Route path="/login" element={
          <div className="min-h-screen pt-16 flex items-center">
            <LoginForm />
          </div>
        } />
        <Route path="/signup" element={
          <div className="min-h-screen pt-16 flex items-center">
            <SignupForm />
          </div>
        } />
      </Routes>
    </div>
    </Router>
  );
}

export default App;
