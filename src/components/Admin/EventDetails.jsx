import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEvent, updateEvent, deleteEvent } from '../../services/adminService';
import './EventDetails.css';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxTasksPerUser: 5,
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getEvent(eventId);
      setEventData(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        startDate: toInputDateValue(data.startDate),
        endDate: toInputDateValue(data.endDate),
        maxTasksPerUser: data.maxTasksPerUser,
        isActive: data.isActive
      });
    } catch (err) {
      console.error('Failed to load event details:', err);
      setError(err.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const toInputDateValue = (isoValue) => {
    if (!isoValue) return '';
    const date = new Date(isoValue);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString();
    return localISOTime.slice(0, 16);
  };

  const formatDateTime = useMemo(
    () => (value) => {
      if (!value) return '—';
      return new Date(value).toLocaleString();
    },
    []
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Event name is required.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start and end date/time are required.');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end <= start) {
      setError('End date must be after the start date.');
      return;
    }

    if (Number(formData.maxTasksPerUser) < 1) {
      setError('Max tasks per user must be at least 1.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        maxTasksPerUser: Number(formData.maxTasksPerUser),
        isActive: formData.isActive
      };

      await updateEvent(eventId, payload);
      setSuccess('Event updated successfully.');
      await loadEvent();
    } catch (err) {
      console.error('Failed to update event:', err);
      setError(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this event? All associated tasks and submissions will be removed.'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      await deleteEvent(eventId);
      alert('Event deleted successfully.');
      navigate('/admin');
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="event-details">
        <div className="error-message">Unable to find the requested event.</div>
        <button className="btn-back" onClick={() => navigate('/admin')}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="event-details">
      <div className="details-header">
        <div>
          <h1>Manage Event</h1>
          <p className="details-subtitle">
            Update event information, review invitations, or remove the event entirely.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/admin')}>
            ← Back to Events
          </button>
          <button className="btn-danger" onClick={handleDelete} disabled={saving}>
            Delete Event
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="details-content">
        <section className="edit-card">
          <h2>Edit Event</h2>
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label htmlFor="name">Event Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                disabled={saving}
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
                disabled={saving}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start *</label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  disabled={saving}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End *</label>
                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxTasksPerUser">Max Tasks Per User *</label>
                <input
                  id="maxTasksPerUser"
                  name="maxTasksPerUser"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxTasksPerUser}
                  onChange={handleInputChange}
                  disabled={saving}
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                  Active Event
                </label>
                <small>Inactive events remain in history but are hidden from participants.</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        <section className="summary-card">
          <h2>Event Summary</h2>
          <div className="summary-grid">
            <div>
              <span className="summary-label">Created</span>
              <span className="summary-value">{formatDateTime(eventData.createdAt)}</span>
            </div>
            <div>
              <span className="summary-label">Status</span>
              <span className={`status-pill ${eventData.isActive ? 'active' : 'inactive'}`}>
                {eventData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="summary-label">Invitations Sent</span>
              <span className="summary-value">{eventData.invitations?.length || 0}</span>
            </div>
            <div>
              <span className="summary-label">Accepted</span>
              <span className="summary-value">
                {eventData.invitations?.filter((inv) => inv.status === 'Accepted').length || 0}
              </span>
            </div>
            <div>
              <span className="summary-label">Task Count</span>
              <span className="summary-value">{eventData.taskCount}</span>
            </div>
            <div>
              <span className="summary-label">Max Tasks / User</span>
              <span className="summary-value">{eventData.maxTasksPerUser}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="invitations-card">
        <h2>Invitations</h2>
        {eventData.invitations?.length ? (
          <div className="table-container">
            <table className="invitations-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Chris Ma</th>
                  <th>Chris Child</th>
                  <th>Invited</th>
                  <th>Status</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {eventData.invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.username}</td>
                    <td>{inv.chrisMaUsername || '—'}</td>
                    <td>{inv.chrisChildUsername || '—'}</td>
                    <td>{formatDateTime(inv.invitedAt)}</td>
                    <td>
                      <span className={`status-pill ${inv.status?.toLowerCase() || 'pending'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>{inv.responseAt ? formatDateTime(inv.responseAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No invitations have been sent for this event.</p>
        )}
      </section>
    </div>
  );
};

export default EventDetails;
