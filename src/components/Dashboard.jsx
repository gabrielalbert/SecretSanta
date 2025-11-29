import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome to Secret Santa!</h2>
          <p className="intro-text">
            This is a secret task assignment game where you play dual roles:
          </p>

          <div className="roles-grid">
            <div className="role-card">
              <div className="role-icon">🧑‍🎄</div>
              <h3>Chris Mom</h3>
              <p>Create and assign tasks to random team members. Your identity as the task creator remains anonymous.</p>
              <Link to="/dashboard/chris-ma" className="btn-role">Go to Chris Ma</Link>
            </div>

            <div className="role-card">
              <div className="role-icon">👼🏻</div>
              <h3>Chris Child</h3>
              <p>Complete tasks assigned to you. You won't know who created the task, maintaining complete anonymity.</p>
              <Link to="/dashboard/chris-child" className="btn-role">Go to Chris Child</Link>
            </div>

            <div className="role-card">
              <div className="role-icon">📊</div>
              <h3>Task Results</h3>
              <p>View all completed tasks from the team. All submissions are anonymous - you can't see who created or completed them.</p>
              <Link to="/dashboard/results" className="btn-role">View Results</Link>
            </div>

            <div className="role-card">
              <div className="role-icon">📬</div>
              <h3>My Invitations</h3>
              <p>View and respond to event invitations. See your role assignments and accept to participate.</p>
              <Link to="/invitations" className="btn-role">View Invitations</Link>
            </div>

            {isAdmin && (
              <div className="role-card admin-card">
                <div className="role-icon">⚙️</div>
                <h3>Admin Panel</h3>
                <p>Manage users and create events. Send invitations with random role mappings.</p>
                <Link to="/admin" className="btn-role btn-admin">Admin Dashboard</Link>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>How It Works</h3>
            <ul>
              <li>✨ Create tasks as "Chris Mom" and assign them randomly to team members</li>
              <li>🎯 The system ensures the same person doesn't get consecutive assignments</li>
              <li>📝 Complete assigned tasks as "Chris Child" with file uploads</li>
              <li>🔒 All task creators remain anonymous - even after completion</li>
              <li>👥 Everyone can view completed tasks, but identities stay hidden</li>
              <li>📅 Daily task assignment limits prevent overload</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
