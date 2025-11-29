import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, updateUser } from '../../services/adminService';
import './UserDetails.css';

const fallbackUserState = {
  username: '',
  email: '',
  isAdmin: false,
  isActive: true,
};

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(fallbackUserState);
  const [userSnapshot, setUserSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hydrateForm = useCallback((user) => {
    if (!user) {
      setFormData(fallbackUserState);
      return;
    }

    setFormData({
      username: user.username ?? '',
      email: user.email ?? '',
      isAdmin: !!(user.isAdmin ?? user.IsAdmin),
      isActive: !!(user.isActive ?? user.IsActive ?? true),
    });
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await getUser(userId);
      setUserSnapshot(data);
      hydrateForm(data);
    } catch (err) {
      console.error('Failed to load user', err);
      setError(err?.response?.data?.message || 'Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [hydrateForm, userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const formatDate = useMemo(
    () => (value) => {
      if (!value) return '—';
      try {
        return new Date(value).toLocaleString();
      } catch (err) {
        return String(value);
      }
    },
    []
  );

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        isAdmin: !!formData.isAdmin,
        isActive: !!formData.isActive,
      };

      const updatedUser = await updateUser(userId, payload);
      setUserSnapshot(updatedUser);
      hydrateForm(updatedUser);
      setSuccess('User updated successfully.');
    } catch (err) {
      console.error('Failed to update user', err);
      setError(err?.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-user-page">
        <div className="loading">Loading user details...</div>
      </div>
    );
  }

  if (!userSnapshot) {
    return (
      <div className="admin-user-page">
        <div className="error-message">Unable to locate the requested user.</div>
        <div className="admin-user-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate('/admin')}>
            Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-page">
      <div className="admin-user-header">
        <div>
          <h1>Manage User</h1>
          <p className="header-subtitle">Update account access and review recent activity.</p>
        </div>
        <div className="admin-user-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            ← Back to Admin
          </button>
          <button type="button" className="btn-ghost" onClick={loadUser} disabled={loading || saving}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="admin-user-grid">
        <section className="admin-user-card">
          <h2>Account Details</h2>
          <form onSubmit={handleSubmit} className="admin-user-form">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-switches">
              <label className="switch-input">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  disabled={saving}
                />
                <span>Active Account</span>
              </label>
              <label className="switch-input">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                  disabled={saving}
                />
                <span>Administrator</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-user-card">
          <h2>Profile Overview</h2>
          <dl className="profile-summary">
            <div>
              <dt>User ID</dt>
              <dd>{userSnapshot.id ?? userSnapshot.Id ?? '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`status-pill ${formData.isActive ? 'active' : 'inactive'}`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <span className={`status-pill ${formData.isAdmin ? 'admin' : 'user'}`}>
                  {formData.isAdmin ? 'Admin' : 'User'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(userSnapshot.createdAt ?? userSnapshot.CreatedAt)}</dd>
            </div>
            <div>
              <dt>Last Login</dt>
              <dd>{formatDate(userSnapshot.lastLoginAt ?? userSnapshot.LastLoginAt)}</dd>
            </div>
            <div>
              <dt>Events Joined</dt>
              <dd>{userSnapshot.eventParticipationCount ?? userSnapshot.EventsJoined ?? '—'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
};

export default UserDetails;
