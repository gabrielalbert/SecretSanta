import React, { useState, useEffect } from 'react';
import { taskService, submissionService } from '../services/taskService';
import './TaskResults.css';

const TaskResults = () => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    try {
      const data = await taskService.getCompletedTasks();
      setCompletedTasks(data);
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileId = (file) => file?.id || file?.Id;
  const getFileName = (file) => file?.fileName || file?.FileName || '';
  const getFileSizeValue = (file) => file?.fileSize ?? file?.FileSize ?? 0;
  const getFileContentType = (file) => (file?.contentType || file?.ContentType || '').trim();

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

  const closePreview = () => {
    if (previewFile?.url) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
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
    if (contentType.startsWith('video/') || fileName.match(/\.(mp4|webm|ogv|ogg|avi|mov|mkv)$/)) return '🎥';
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

  if (loading) {
    return <div className="loading">Loading completed tasks...</div>;
  }

  return (
    <div className="task-results-container">
      <div className="header">
        <h2>Completed Tasks</h2>
        <p className="subtitle">View all completed tasks from the team</p>
      </div>

      {completedTasks.length === 0 ? (
        <p className="empty-state">No completed tasks yet.</p>
      ) : (
        <div className="results-grid">
          {completedTasks.map((task) => {
            const taskId = task.id || task.Id;
            const taskTitle = task.taskTitle || task.TaskTitle || '';
            const taskDescription = task.taskDescription || task.TaskDescription || '';
            const submittedAt = task.submittedAt || task.SubmittedAt;
            const eventEndDate = task.eventEndDate || task.EventEndDate;
            const notes = task.notes || task.Notes;
            const eventName = task.eventName || task.EventName || '';
            const submittedBy = task.submittedByUsername || task.SubmittedByUsername || '';
            const createdBy = task.createdByUsername || task.CreatedByUsername || '';
            const submittedByDisplay = submittedBy || 'Unknown';
            const createdByDisplay = createdBy || 'Unknown';
            const files = task.files || task.Files || [];
            
            const isEndDateValid = () => {
              const today = new Date();
              const end = new Date(eventEndDate);
              return end > today;
          };

            return (
              <div key={taskId || taskTitle} className="result-card">
                <div className="result-header">
                  <div className="header-content">
                    <h3>{taskTitle}</h3>
                    {eventName && <span className="event-badge">📅 {eventName}</span>}
                  </div>
                  <span className="submitted-date">
                    {submittedAt ? new Date(submittedAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <p className="task-description">{taskDescription}</p>

                {notes && (
                  <div className="submission-notes">
                    <strong>Submission Notes:</strong>
                    <p>{notes}</p>
                  </div>
                )}

                {files.length > 0 ? (
                  <div className="files-section">
                    <strong>Attached Files ({files.length}):</strong>
                    <div className="files-list">
                      {files.map((file) => {
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
                                  title="Preview this file"
                                >
                                  👁️ Preview
                                </button>
                              )}
                              <button
                                className="btn-download"
                                onClick={() => handleDownloadFile(fileId, fileName)}
                                title="Download this file"
                              >
                                📥 Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="no-files-message">
                    <p>📎 No files attached to this submission</p>
                  </div>
                )}

                <div className="result-footer">
                  {!isEndDateValid() && (
                    <span className="created-by">
                    🧑‍🎄 Chris Mom: <strong>{createdByDisplay}</strong>
                    </span>
                  )}
                  
                  <span className="submitted-by">
                    👼🏻 Chris Child: <strong>{submittedByDisplay}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
                onClick={() => handleDownloadFile(
                  previewFile.id || previewFile.Id,
                  previewFile.fileName || previewFile.FileName
                )}
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

export default TaskResults;
