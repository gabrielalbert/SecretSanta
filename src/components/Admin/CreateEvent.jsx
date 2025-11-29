import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, createEvent } from '../../services/adminService';
import './CreateEvent.css';

function CreateEvent() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxTasksPerUser: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData.filter((u) => u.isActive));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Event name is required');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Please select at least 2 users for the event');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);

      const eventData = {
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        maxTasksPerUser: parseInt(formData.maxTasksPerUser, 10),
        userIds: selectedUsers
      };

      await createEvent(eventData);
      setSuccess('Event created successfully! Invitations sent to selected users.');

      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event">
      <div className="create-event-header">
        <h1>Create New Event</h1>
        <button onClick={() => navigate('/admin')} className="btn-back">
          Back to Admin
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-section">
          <h2>Event Details</h2>

          <div className="form-group">
            <label htmlFor="name">Event Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., March Task Game 2025"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the event..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="maxTasksPerUser">Max Tasks Per User</label>
            <input
              type="number"
              id="maxTasksPerUser"
              name="maxTasksPerUser"
              value={formData.maxTasksPerUser}
              onChange={handleInputChange}
              min="1"
              max="20"
            />
            <small>Maximum number of tasks each user can create in this event</small>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header-with-action">
            <h2>Select Participants (Minimum 2) *</h2>
            <button type="button" onClick={handleSelectAll} className="btn-select-all">
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="info-box">
            <p>
              <strong>How it works:</strong>
            </p>
            <ul>
              <li>Select users who will participate in this event</li>
              <li>Each user will be randomly assigned a "Chris Ma" (who they create tasks for)</li>
              <li>Each user will be randomly assigned a "Chris Child" (who they receive tasks from)</li>
              <li>This ensures anonymity and cross-user task flow</li>
              <li>Users must accept the invitation to participate</li>
            </ul>
          </div>

          <div className="selected-count">
            Selected: <strong>{selectedUsers.length}</strong> / {users.length} users
          </div>

          <div className="users-grid">
            {users.map((user) => (
              <div
                key={user.id}
                className={`user-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                onClick={() => handleUserToggle(user.id)}
              >
                <div className="user-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleUserToggle(user.id);
                    }}
                  />
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                {user.isAdmin && <span className="admin-badge">Admin</span>}
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="empty-state">
              <p>No active users found</p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || selectedUsers.length < 2}
          >
            {loading ? 'Creating Event...' : 'Create Event & Send Invitations'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateEvent;
