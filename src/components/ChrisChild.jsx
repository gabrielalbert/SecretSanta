import React, { useState, useEffect } from 'react';
import { taskService, submissionService } from '../services/taskService';
import './ChrisChild.css';

const ChrisChild = () => {
  const [activeTab, setActiveTab] = useState('assigned');
  const [assignments, setAssignments] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'assigned') {
      loadAssignments();
    } else if (activeTab === 'completed') {
      loadCompletedTasks();
    }
  }, [activeTab]);

  const loadAssignments = async () => {
    try {
      const data = await taskService.getMyAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);
      const allCompleted = await taskService.getCompletedTasks();
      const myCompletedTasks = allCompleted.filter((task) => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const submittedBy = task.submittedByUsername || task.SubmittedByUsername;
        return submittedBy === currentUser?.username;
      });
      setCompletedTasks(myCompletedTasks);
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId, status) => {
    try {
      await taskService.updateAssignmentStatus(assignmentId, status);
      setMessage({ type: 'success', text: 'Status updated!' });
      loadAssignments();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await submissionService.submitTask(selectedTask.id, notes, files);
      setMessage({ type: 'success', text: 'Task submitted successfully!' });
      setSelectedTask(null);
      setNotes('');
      setFiles([]);
      loadAssignments();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit task' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return labels[priority] || 'Medium';
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#ffc107',
      InProgress: '#17a2b8',
      Completed: '#28a745',
      Reviewed: '#6f42c1'
    };
    return colors[status] || '#6c757d';
  };

  const getFileId = (file) => file?.id || file?.Id;
  const getFileName = (file) => file?.fileName || file?.FileName || '';
  const getFileSizeValue = (file) => file?.fileSize ?? file?.FileSize ?? 0;
  const getFileContentType = (file) => (file?.contentType || file?.ContentType || '').trim();

  const handlePreviewFile = async (file) => {
    const contentType = normalizeContentType(file);
    const fileName = getFileName(file);
    const fileId = getFileId(file);

    if (!isPreviewable(contentType, fileName)) {
      alert('This file type cannot be previewed. Please download it instead.');
      return;
    }

    setPreviewLoading(true);
    try {
      const blob = await submissionService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      setPreviewFile({
        ...file,
        id: fileId,
        fileName,
        contentType,
        url,
        isImage: contentType.startsWith('image/'),
        isVideo: contentType.startsWith('video/'),
        isAudio: contentType.startsWith('audio/'),
        isPdf: contentType === 'application/pdf'
      });
    } catch (error) {
      console.error('Failed to preview file:', error);
      alert('Failed to preview file');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    if (!fileId) {
      alert('File is missing an identifier. Please refresh and try again.');
      return;
    }
    try {
      const blob = await submissionService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
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

  const normalizeContentType = (file) => {
    const rawType = getFileContentType(file);
    if (rawType) return rawType;

    const extension = getFileName(file).split('.').pop()?.toLowerCase();
    if (!extension) return '';

    const map = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogv: 'video/ogg',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      opus: 'audio/ogg'
    };

    return map[extension] || '';
  };

  const isPreviewable = (contentType, fileName) => {
    if (
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/') ||
      contentType === 'application/pdf'
    ) {
      return true;
    }

    if (!contentType && fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      return [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'bmp',
        'svg',
        'mp4',
        'webm',
        'ogv',
        'ogg',
        'avi',
        'mov',
        'mkv',
        'mp3',
        'wav',
        'm4a',
        'aac',
        'flac',
        'opus',
        'pdf'
      ].includes(extension);
    }

    return false;
  };

  const getFileIcon = (file) => {
    const contentType = normalizeContentType(file);
    const fileName = getFileName(file).toLowerCase();

    if (contentType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return '🖼️';
    if (contentType.startsWith('video/') || fileName.match(/\.(mp4|webm|ogg|avi|mov|mkv)$/)) return '🎥';
    if (contentType.startsWith('audio/') || fileName.match(/\.(mp3|wav|m4a|aac|flac|ogg|opus)$/)) return '🎵';
    if (contentType === 'application/pdf' || fileName.endsWith('.pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document') || fileName.match(/\.(doc|docx)$/)) return '📝';
    if (contentType.includes('spreadsheet') || contentType.includes('excel') || fileName.match(/\.(xls|xlsx)$/)) return '📊';
    if (contentType.includes('presentation') || contentType.includes('powerpoint') || fileName.match(/\.(ppt|pptx)$/)) return '📽️';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="chris-child-container">
      <div className="header">
        <h2>Chris Child - My Tasks</h2>
        <p className="subtitle">Complete your assigned secret tasks</p>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          📋 Assigned Tasks
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ My Completed Tasks
        </button>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {activeTab === 'assigned' && (
        <>
          {selectedTask ? (
            <div className="submit-task-form">
              <button className="btn-back" onClick={() => setSelectedTask(null)}>
                ← Back to Tasks
              </button>

              <h3>Submit Task: {selectedTask.taskTitle}</h3>
              <p className="task-desc">{selectedTask.taskDescription}</p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="4"
                    placeholder="Add any notes about your submission..."
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Upload Files</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={loading}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.mp4,.webm,.ogv,.avi,.mov,.mkv,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  {files.length > 0 && (
                    <div className="file-list">
                      <p>Selected files:</p>
                      <ul>
                        {files.map((file, index) => (
                          <li key={index}>
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Task'}
                </button>
              </form>
            </div>
          ) : (
            <div className="tasks-section">
              {assignments.length === 0 ? (
                <p className="empty-state">No tasks assigned yet. Check back later!</p>
              ) : (
                <div className="tasks-grid">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="task-card">
                      <div className="task-header">
                        <h4>{assignment.taskTitle}</h4>
                        <span className={`priority-badge priority-${assignment.priority}`}>
                          {getPriorityLabel(assignment.priority)}
                        </span>
                      </div>

                      <div className="task-status" style={{ color: getStatusColor(assignment.status) }}>
                        Status: {assignment.status}
                      </div>

                      <p className="task-description">{assignment.taskDescription}</p>

                      {assignment.dueDate && (
                        <p className="task-due-date">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      )}

                      <p className="task-assigned">
                        Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                      <div className="role-mappings">
                        <h4>{assignment.eventName}</h4>                          
                      </div>
                      <div className="task-actions">
                        {assignment.status === 'Pending' && (
                          <button
                            className="btn-action btn-start"
                            onClick={() => handleStatusChange(assignment.id, 'InProgress')}
                          >
                            Start Task
                          </button>
                        )}

                        {assignment.status === 'InProgress' && (
                          <button
                            className="btn-action btn-submit-task"
                            onClick={() => setSelectedTask(assignment)}
                          >
                            Submit Task
                          </button>
                        )}

                        {assignment.status === 'Completed' && (
                          <span className="completed-badge">✓ Completed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'completed' && (
        <>
          {loading ? (
            <div className="loading">Loading completed tasks...</div>
          ) : completedTasks.length === 0 ? (
            <p className="empty-state">You haven't completed any tasks yet.</p>
          ) : (
            <div className="completed-tasks-grid">
              {completedTasks.map((task) => {
                const taskId = task.id || task.Id;
                const eventName = task.eventName || task.EventName || '';
                const taskTitle = task.taskTitle || task.TaskTitle || '';
                const taskDescription = task.taskDescription || task.TaskDescription || '';
                const submittedAt = task.submittedAt || task.SubmittedAt;
                const submissionNotes = task.notes || task.Notes;
                const taskFiles = task.files || task.Files || [];
                return (
                  <div key={taskId || taskTitle} className="completed-task-card">
                    <div className="task-card-header">
                      <div className="header-content">
                        <h3>{taskTitle}</h3>
                        {eventName && <span className="event-badge">📅 {eventName}</span>}
                      </div>
                      <span className="submitted-date">
                        {submittedAt ? new Date(submittedAt).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <p className="task-description">{taskDescription}</p>

                    {submissionNotes && (
                      <div className="task-notes">
                        <strong>Your Submission Notes:</strong>
                        <p>{submissionNotes}</p>
                      </div>
                    )}

                    {taskFiles.length > 0 && (
                      <div className="files-section">
                        <strong>Your Uploaded Files ({taskFiles.length}):</strong>
                        <div className="files-list">
                          {taskFiles.map((file) => {
                            const fileId = getFileId(file);
                            const fileName = getFileName(file);
                            const fileSize = getFileSizeValue(file);
                            const contentType = normalizeContentType(file);
                            return (
                              <div key={fileId || fileName} className="file-item">
                                <div className="file-info">
                                  <span className="file-name">
                                    {getFileIcon(file)} {fileName}
                                  </span>
                                  <span className="file-size">{formatFileSize(fileSize)}</span>
                                </div>
                                <div className="file-actions">
                                  {isPreviewable(contentType, fileName) && (
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
                                    onClick={() => handleDownloadFile(fileId, fileName)}
                                  >
                                    📥 Download
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="task-footer">
                      <span className="completion-badge">
                        ✓ Completed on {submittedAt ? new Date(submittedAt).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {previewFile && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewFile.fileName || previewFile.FileName}</h3>
              <button className="btn-close" onClick={closePreview}>
                ✕
              </button>
            </div>
            <div className="preview-body">
              {previewFile.isImage && (
                <img src={previewFile.url} alt={previewFile.fileName || previewFile.FileName} />
              )}
              {previewFile.isVideo && (
                <video controls src={previewFile.url}>
                  Your browser does not support the video tag.
                </video>
              )}
              {previewFile.isAudio && (
                <audio controls src={previewFile.url}>
                  Your browser does not support the audio element.
                </audio>
              )}
              {previewFile.isPdf && (
                <iframe
                  src={previewFile.url}
                  title={previewFile.fileName || previewFile.FileName}
                  width="100%"
                  height="100%"
                />
              )}
            </div>
            <div className="preview-footer">
              <button
                className="btn-download-modal"
                onClick={() =>
                  handleDownloadFile(
                    previewFile.id || previewFile.Id,
                    previewFile.fileName || previewFile.FileName
                  )
                }
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChrisChild;
