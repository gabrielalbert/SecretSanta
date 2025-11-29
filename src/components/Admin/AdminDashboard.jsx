import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAllEvents } from '../../services/adminService';
import './AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'users') {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } else {
        const eventsData = await getAllEvents();
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        err.response?.data?.message ||
          'Failed to fetch data. You may not have admin privileges.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users Management
        </button>
        <button
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events Management
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {activeTab === 'users' && (
            <div className="users-section">
              <div className="section-header">
                <h2>All Users</h2>
                <div className="stats">
                  <span>Total: {users.length}</span>
                  <span>Active: {users.filter((u) => u.isActive).length}</span>
                  <span>Admins: {users.filter((u) => u.isAdmin).length}</span>
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Status</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="btn-action"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="events-section">
              <div className="section-header">
                <h2>All Events</h2>
                <button
                  onClick={() => navigate('/admin/events/create')}
                  className="btn-primary"
                >
                  Create New Event
                </button>
              </div>

              <div className="events-grid">
                {events.length === 0 ? (
                  <div className="empty-state">
                    <p>No events created yet</p>
                    <button
                      onClick={() => navigate('/admin/events/create')}
                      className="btn-primary"
                    >
                      Create Your First Event
                    </button>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="event-card">
                      <div className="event-header">
                        <h3>{event.name}</h3>
                        <span className={`status-badge ${event.isActive ? 'active' : 'inactive'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="event-description">{event.description}</p>
                      <div className="event-dates">
                        <div>
                          <strong>Start:</strong> {formatDate(event.startDate)}
                        </div>
                        <div>
                          <strong>End:</strong> {formatDate(event.endDate)}
                        </div>
                      </div>
                      <div className="event-stats">
                        <div className="stat">
                          <span className="stat-value">{event.invitedCount}</span>
                          <span className="stat-label">Invited</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{event.acceptedCount}</span>
                          <span className="stat-label">Accepted</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{event.maxTasksPerUser}</span>
                          <span className="stat-label">Max Tasks</span>
                        </div>
                      </div>
                      <div className="event-actions">
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="btn-action"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
