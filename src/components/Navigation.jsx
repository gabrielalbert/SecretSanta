import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      <header className="nav-header">
        <div className="nav-content">
          <Link to="/dashboard" className="nav-logo">
            <h1>🎅🏻 Secret Santa</h1>
          </Link>
          <div className="nav-user-info">
            <span className="nav-username">👤 {user?.username}</span>
            <button onClick={handleLogout} className="nav-logout">Logout</button>
          </div>
        </div>
      </header>

      <nav className="nav-menu">
        <Link to="/dashboard" className={`nav-menu-link ${isActive('/dashboard')}`}>
          🏠 Home
        </Link>
        <Link to="/dashboard/chris-ma" className={`nav-menu-link ${isActive('/dashboard/chris-ma')}`}>
          🧑‍🎄 Chris Mom
        </Link>
        <Link to="/dashboard/chris-child" className={`nav-menu-link ${isActive('/dashboard/chris-child')}`}>
          👼🏻 Chris Child
        </Link>
        <Link to="/dashboard/results" className={`nav-menu-link ${isActive('/dashboard/results')}`}>
          📊 Results
        </Link>
      </nav>
    </>
  );
};

export default Navigation;
