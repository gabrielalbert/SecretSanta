import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyInvitations, respondToInvitation } from '../../services/adminService';
import { taskService, submissionService } from '../../services/taskService';
import './Invitations.css';

function Invitations() {
  const [activeTab, setActiveTab] = useState('invitations');
  const [invitations, setInvitations] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchInvitations();
    } else if (activeTab === 'completed') {
      fetchCompletedTasks();
    }
  }, [activeTab]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await taskService.getCompletedTasks();
      setCompletedTasks(data);
    } catch (err) {
      console.error('Error fetching completed tasks:', err);
      setError('Failed to fetch completed tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId, accept) => {
    try {
      setRespondingTo(invitationId);
      await respondToInvitation(invitationId, accept);
      await fetchInvitations();
      alert(`Invitation ${accept ? 'accepted' : 'declined'} successfully!`);
    } catch (err) {
      console.error('Error responding to invitation:', err);
      alert(err.response?.data?.message || 'Failed to respond to invitation');
    } finally {
      setRespondingTo(null);
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-accepted';
      case 'declined':
        return 'status-declined';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const handlePreviewFile = async (file) => {
    if (!isPreviewable(file.contentType)) {
      alert('This file type cannot be previewed. Please download it instead.');
      return;
    }

    setPreviewLoading(true);
    try {
      const blob = await submissionService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewFile({
        ...file,
        url,
        isImage: file.contentType.startsWith('image/'),
        isVideo: file.contentType.startsWith('video/'),
        isPdf: file.contentType === 'application/pdf'
      });
    } catch (error) {
      console.error('Failed to preview file:', error);
      alert('Failed to preview file');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const blob = await submissionService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const isPreviewable = (contentType) =>
    contentType.startsWith('image/') ||
    contentType.startsWith('video/') ||
    contentType === 'application/pdf';

  const getFileIcon = (contentType) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType === 'application/pdf') return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊';
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📽️';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'Pending');
  const respondedInvitations = invitations.filter((inv) => inv.status !== 'Pending');

  return (
    <div className="invitations-page">
      <div className="invitations-header">
        <h1>My Tasks & Invitations</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          Back to Dashboard
        </button>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          📬 Event Invitations
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completed Tasks
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {activeTab === 'invitations' && (
            <>
              {pendingInvitations.length > 0 && (
                <div className="invitations-section">
                  <h2>Pending Invitations ({pendingInvitations.length})</h2>
                  <div className="invitations-grid">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="invitation-card pending">
                        <div className="invitation-header">
                          <h3>{invitation.eventName}</h3>
                          <span className={`status-badge ${getStatusColor(invitation.status)}`}>
                            {invitation.status}
                          </span>
                        </div>

                        <div className="invitation-body">
                          <div className="invitation-info">
                            <p>
                              <strong>Invited:</strong> {formatDate(invitation.invitedAt)}
                            </p>
                          </div>

                          <div className="role-mappings">
                            <h4>Your Role Assignments:</h4>
                            <div className="role-mapping">
                              <div className="role-label">Chris Ma (You create tasks for):</div>
                              <div className="role-value">{invitation.chrisMaUsername}</div>
                            </div>
                          </div>

                          <div className="info-note">
                            <p>
                              <strong>Note:</strong> Task creation remains anonymous. The person won't know you're creating tasks for them!
                            </p>
                          </div>
                        </div>

                        <div className="invitation-actions">
                          <button
                            onClick={() => handleRespond(invitation.id, false)}
                            className="btn-decline"
                            disabled={respondingTo === invitation.id}
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespond(invitation.id, true)}
                            className="btn-accept"
                            disabled={respondingTo === invitation.id}
                          >
                            {respondingTo === invitation.id ? 'Processing...' : 'Accept'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {respondedInvitations.length > 0 && (
                <div className="invitations-section">
                  <h2>Past Invitations ({respondedInvitations.length})</h2>
                  <div className="invitations-grid">
                    {respondedInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className={`invitation-card ${invitation.status.toLowerCase()}`}
                      >
                        <div className="invitation-header">
                          <h3>{invitation.eventName}</h3>
                          <span className={`status-badge ${getStatusColor(invitation.status)}`}>
                            {invitation.status}
                          </span>
                        </div>

                        <div className="invitation-body">
                          <div className="invitation-info">
                            <p>
                              <strong>Invited:</strong> {formatDate(invitation.invitedAt)}
                            </p>
                            <p>
                              <strong>Responded:</strong> {formatDate(invitation.responseAt)}
                            </p>
                          </div>

                          {invitation.status === 'Accepted' && (
                            <div className="role-mappings">
                              <h4>Your Role Assignments:</h4>
                              <div className="role-mapping">
                                <div className="role-label">Chris Ma:</div>
                                <div className="role-value">{invitation.chrisMaUsername}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invitations.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📬</div>
                  <h3>No Invitations Yet</h3>
                  <p>You haven't received any event invitations. Check back later!</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {completedTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h3>No Completed Tasks</h3>
                  <p>No tasks have been completed yet.</p>
                </div>
              ) : (
                <div className="completed-tasks-grid">
                  {completedTasks.map((task) => {
                    const createdByName =
                      task.createdByUsername || task.CreatedByUsername || 'Unknown';
                    return (
                      <div key={task.id} className="task-card">
                        <div className="task-card-header">
                          <div className="header-content">
                            <h3>{task.taskTitle}</h3>
                            {task.eventName && <span className="event-badge">📅 {task.eventName}</span>}
                          </div>
                          <span className="submitted-date">
                            {new Date(task.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="task-description">{task.taskDescription}</p>

                        {task.notes && (
                          <div className="task-notes">
                            <strong>Notes:</strong>
                            <p>{task.notes}</p>
                          </div>
                        )}

                        {task.files && task.files.length > 0 && (
                          <div className="files-section">
                            <strong>Attached Files ({task.files.length}):</strong>
                            <div className="files-list">
                              {task.files.map((file) => (
                                <div key={file.id} className="file-item">
                                  <div className="file-info">
                                    <span className="file-name">
                                      {getFileIcon(file.contentType)} {file.fileName}
                                    </span>
                                    <span className="file-size">{formatFileSize(file.fileSize)}</span>
                                  </div>
                                  <div className="file-actions">
                                    {isPreviewable(file.contentType) && (
                                      <button
                                        className="btn-preview"
                                        onClick={() => handlePreviewFile(file)}
                                        disabled={previewLoading}
                                      >
                                        👁️ Preview
                                      </button>
                                    )}
                                    <button
                                      className="btn-download"
                                      onClick={() => handleDownloadFile(file.id, file.fileName)}
                                    >
                                      📥 Download
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="task-footer">
                          <span className="created-by">
                            🛠️ Created by: <strong>{createdByName}</strong>
                          </span>
                          <span className="submitted-by">
                            👤 Submitted by: <strong>{task.submittedByUsername}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {previewFile && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewFile.fileName}</h3>
              <button className="btn-close" onClick={closePreview}>
                ✕
              </button>
            </div>
            <div className="preview-body">
              {previewFile.isImage && <img src={previewFile.url} alt={previewFile.fileName} />}
              {previewFile.isVideo && (
                <video controls src={previewFile.url}>
                  Your browser does not support the video tag.
                </video>
              )}
              {previewFile.isPdf && (
                <iframe
                  src={previewFile.url}
                  title={previewFile.fileName}
                  width="100%"
                  height="100%"
                />
              )}
            </div>
            <div className="preview-footer">
              <button
                className="btn-download-modal"
                onClick={() => handleDownloadFile(previewFile.id, previewFile.fileName)}
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invitations;
