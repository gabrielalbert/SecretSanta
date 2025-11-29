import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ChrisMa from './components/ChrisMa';
import ChrisChild from './components/ChrisChild';
import TaskResults from './components/TaskResults';
import AdminDashboard from './components/Admin/AdminDashboard';
import CreateEvent from './components/Admin/CreateEvent';
import EventDetails from './components/Admin/EventDetails';
import UserDetails from './components/Admin/UserDetails';
import Invitations from './components/Invitations/Invitations';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/chris-ma"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <ChrisMa />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/chris-child"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <ChrisChild />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/results"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <TaskResults />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <PrivateRoute requireAdmin>
                <DashboardLayout>
                  <CreateEvent />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/events/:eventId"
            element={
              <PrivateRoute requireAdmin>
                <DashboardLayout>
                  <EventDetails />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <PrivateRoute requireAdmin>
                <DashboardLayout>
                  <UserDetails />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Invitations />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function DashboardLayout({ children }) {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <div className="dashboard-layout">
        <Navigation />
        {children}
      </div>

      <footer className="nav-footer">
        <div className="nav-footer-content">
          <span>© {currentYear} Secret Santa Task Game</span>
          <span className="nav-footer-divider">•</span>
          <span className="nav-footer-dev">Crafted by Gabriel</span>
          <span className="nav-footer-divider">•</span>
          <span className="nav-footer-note">Delivering festive fun for every event.</span>
        </div>
      </footer>
    </>
  );
}

export default App;
