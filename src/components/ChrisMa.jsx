import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../services/taskService';
import { getMyInvitations } from '../services/adminService';
import './ChrisMa.css';

const ChrisMa = () => {
  const [tasks, setTasks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 2,
    eventId: '',
    invitationId: '',
    assigneeUserId: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [invitations, setInvitations] = useState([]);
  const [selectedInvitationId, setSelectedInvitationId] = useState('');
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    loadAcceptedInvitations();
  }, []);

  const getNormalizedEventId = (entity) => {
    if (!entity || typeof entity !== 'object') {
      return '';
    }
    return (
      entity.eventId ??
      entity.EventId ??
      entity.eventID ??
      entity.EventID ??
      entity.event?.id ??
      ''
    );
  };

  const getAssigneeUserId = (invitation) => {
    if (!invitation || typeof invitation !== 'object') {
      return '';
    }
    return (
      invitation.chrisChildUserId ??
      invitation.ChrisChildUserId ??
      invitation.assigneeUserId ??
      invitation.AssigneeUserId ??
      invitation.chrisMaUserId ??
      invitation.ChrisMaUserId ??
      invitation.targetUserId ??
      invitation.TargetUserId ??
      ''
    );
  };

  const getAssigneeDisplayName = (invitation) => {
    if (!invitation || typeof invitation !== 'object') {
      return '';
    }
    return (
      invitation.chrisMaUsername ??
      invitation.ChrisMaUsername ??
      invitation.chrisChildUsername ??
      invitation.ChrisChildUsername ??
      invitation.assigneeUsername ??
      invitation.AssigneeUsername ??
      invitation.targetUsername ??
      invitation.TargetUsername ??
      ''
    );
  };

  const formatInvitationOption = (invitation) => {
    if (!invitation) {
      return '';
    }
    const eventName =
      invitation.eventName ??
      invitation.EventName ??
      `Event #${getNormalizedEventId(invitation) || '-'}`;
    const assigneeName = getAssigneeDisplayName(invitation) || 'Unknown recipient';
    return `${eventName} -> ${assigneeName}`;
  };

  const extractTaskId = (taskResponse) => {
    if (!taskResponse || typeof taskResponse !== 'object') {
      return null;
    }

    if (typeof taskResponse.id !== 'undefined') {
      return taskResponse.id;
    }
    if (typeof taskResponse.taskId !== 'undefined') {
      return taskResponse.taskId;
    }
    if (taskResponse.task && typeof taskResponse.task.id !== 'undefined') {
      return taskResponse.task.id;
    }
    if (taskResponse.data && typeof taskResponse.data.id !== 'undefined') {
      return taskResponse.data.id;
    }
    if (Array.isArray(taskResponse) && taskResponse.length > 0) {
      return extractTaskId(taskResponse[0]);
    }
    return null;
  };

  const getTaskId = (task) =>
    task?.id ?? task?.Id ?? task?.taskId ?? task?.TaskId ?? task?.task?.id ?? null;

  const getTaskInvitationId = (task) =>
    task?.invitationId ?? task?.InvitationId ?? task?.invitation?.id ?? null;

  const getTaskEventId = (task) =>
    task?.eventId ?? task?.EventId ?? null;

  const getTaskEventName = (task) =>
    task?.eventName ??
    task?.EventName ??
    task?.event?.name ??
    task?.event?.Name ??
    task?.event?.displayName ??
    task?.event?.DisplayName ??
    task?.event?.title ??
    task?.event?.Title ??
    null;

  const getTaskAssigneeName = (task) =>
    task?.assignedToUsername ??
    task?.AssignedToUsername ??
    task?.assignedTo?.username ??
    task?.assignedTo?.Username ??
    task?.chrisChildUsername ??
    task?.ChrisChildUsername ??
    task?.assigneeUsername ??
    task?.AssigneeUsername ??
    task?.assignee?.username ??
    task?.assignee?.Username ??
    task?.chrisChild?.username ??
    task?.chrisChild?.Username ??
    task?.targetUser?.username ??
    task?.targetUser?.Username ??
    null;

  const loadTasks = async () => {
    try {
      const data = await taskService.getMyCreatedTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadAcceptedInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const data = await getMyInvitations();
      const accepted = Array.isArray(data)
        ? data.filter((inv) => (inv.status ?? inv.Status ?? '').toLowerCase() === 'accepted')
        : [];
      setInvitations(accepted);

      if (accepted.length > 0) {
        const initialInvitation = accepted[0];
        const initialId = String(initialInvitation.id ?? initialInvitation.Id);
        setSelectedInvitationId(initialId);
        setNewTask((prev) => ({
          ...prev,
          eventId: getNormalizedEventId(initialInvitation),
          invitationId: initialInvitation.id ?? initialInvitation.Id ?? '',
          assigneeUserId: getAssigneeUserId(initialInvitation)
        }));
      } else {
        setSelectedInvitationId('');
        setNewTask((prev) => ({
          ...prev,
          eventId: '',
          invitationId: '',
          assigneeUserId: ''
        }));
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
      setMessage({ type: 'error', text: 'Failed to load invitations. Please refresh.' });
    } finally {
      setLoadingInvitations(false);
    }
  };

  const selectedInvitation = useMemo(() => {
    if (!selectedInvitationId) {
      return null;
    }
    return (
      invitations.find(
        (inv) => String(inv.id ?? inv.Id) === String(selectedInvitationId)
      ) || null
    );
  }, [invitations, selectedInvitationId]);

  const handleInvitationChange = (event) => {
    const nextId = event.target.value;
    setSelectedInvitationId(nextId);

    const invitation =
      invitations.find((inv) => String(inv.id ?? inv.Id) === String(nextId)) || null;

    setNewTask((prev) => ({
      ...prev,
      eventId: getNormalizedEventId(invitation),
      invitationId: invitation?.id ?? invitation?.Id ?? '',
      assigneeUserId: getAssigneeUserId(invitation)
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedInvitation) {
      setMessage({
        type: 'error',
        text: 'Select an event invitation before creating a task.'
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const assigneeUserId = getAssigneeUserId(selectedInvitation);
      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        dueDate: newTask.dueDate || undefined,
        priority: Number(newTask.priority) || 2,
        eventId: getNormalizedEventId(selectedInvitation) || undefined,
        invitationId: selectedInvitation.id ?? selectedInvitation.Id ?? undefined,
        assigneeUserId: assigneeUserId || undefined,
        chrisChildUserId:
          selectedInvitation.chrisChildUserId ??
          selectedInvitation.ChrisChildUserId ??
          undefined
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      const createdTask = await taskService.createTask(payload);
      const createdTaskId = extractTaskId(createdTask);

      if (createdTaskId && assigneeUserId) {
        await taskService.assignTask(createdTaskId, {
          invitationId: selectedInvitation.id ?? selectedInvitation.Id,
          eventId: payload.eventId || undefined,
          assigneeUserId,
          chrisChildUserId:
            selectedInvitation.chrisChildUserId ??
            selectedInvitation.ChrisChildUserId ??
            undefined
        });
      }

      setMessage({ type: 'success', text: 'Task created and assigned successfully!' });
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        priority: 2,
        eventId: getNormalizedEventId(selectedInvitation),
        invitationId: selectedInvitation.id ?? selectedInvitation.Id ?? '',
        assigneeUserId: assigneeUserId || ''
      });
      setShowCreateForm(false);
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          error.response?.data ||
          'Failed to create task'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (task) => {
    const taskId = getTaskId(task);
    if (!taskId) {
      setMessage({ type: 'error', text: 'Task identifier missing. Please refresh.' });
      return;
    }

    const taskInvitationId = getTaskInvitationId(task);
    let matchingInvitation = null;

    if (taskInvitationId) {
      matchingInvitation =
        invitations.find(
          (inv) => String(inv.id ?? inv.Id) === String(taskInvitationId)
        ) || null;
    }

    if (!matchingInvitation) {
      const taskEventId = getNormalizedEventId(task);
      if (taskEventId) {
        matchingInvitation =
          invitations.find(
            (inv) =>
              getNormalizedEventId(inv) &&
              String(getNormalizedEventId(inv)) === String(taskEventId)
          ) || null;
      }
    }

    if (!matchingInvitation && invitations.length === 1) {
      matchingInvitation = invitations[0];
    }

    if (!matchingInvitation) {
      setMessage({
        type: 'error',
        text: 'No matching event invitation found for this task.'
      });
      return;
    }

    try {
      await taskService.assignTask(taskId, {
        invitationId:
          matchingInvitation.id ??
          matchingInvitation.Id ??
          taskInvitationId ??
          undefined,
        eventId: getNormalizedEventId(matchingInvitation) || undefined,
        assigneeUserId: getAssigneeUserId(matchingInvitation) || undefined,
        chrisChildUserId:
          matchingInvitation.chrisChildUserId ??
          matchingInvitation.ChrisChildUserId ??
          undefined
      });
      setMessage({ type: 'success', text: 'Task assigned successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      await loadTasks();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign task' });
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return labels[priority] || 'Medium';
  };

  const canCreateTask = invitations.length > 0;
  const assigneeDisplayName = getAssigneeDisplayName(selectedInvitation);
  const selectedEventName =
    selectedInvitation?.eventName ??
    selectedInvitation?.EventName ??
    `Event #${getNormalizedEventId(selectedInvitation) || '-'}`;

  return (
    <div className="chris-ma-container">
      <div className="header">
        <h2>Chris Ma - Task Creator</h2>
        <p className="subtitle">Create and assign secret tasks to team members</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {!loadingInvitations && !canCreateTask && (
        <div className="info-banner">
          Accept an event invitation to start creating tasks.
        </div>
      )}

      <button
        className="btn-create"
        onClick={() => setShowCreateForm(!showCreateForm)}
        disabled={!canCreateTask || loadingInvitations}
        title={!canCreateTask ? 'Accept an invitation to enable task creation.' : undefined}
      >
        {showCreateForm ? 'Cancel' : '+ Create New Task'}
      </button>

      {showCreateForm && (
        <div className="create-task-form">
          <h3>Create New Task</h3>
          {!canCreateTask ? (
            <p className="form-note">You need an accepted invitation before you can create tasks.</p>
          ) : (
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Event Invitation</label>
                <select
                  value={selectedInvitationId}
                  onChange={handleInvitationChange}
                  disabled={loading || loadingInvitations}
                  required
                >
                  <option value="" disabled>
                    {loadingInvitations ? 'Loading invitations...' : 'Select an event'}
                  </option>
                  {invitations.map((invitation) => {
                    const optionId = String(invitation.id ?? invitation.Id);
                    return (
                      <option key={optionId} value={optionId}>
                        {formatInvitationOption(invitation)}
                      </option>
                    );
                  })}
                </select>
                <p className="form-note">
                  Choose the event this task belongs to. The recipient comes from your invitation.
                </p>
              </div>

              {selectedInvitation && (
                <div className="form-assignee">
                  <div>
                    <span className="assignee-label">Assigning to</span>
                    <span className="assignee-value">{assigneeDisplayName || 'Unknown recipient'}</span>
                  </div>
                  {selectedEventName && (
                    <div>
                      <span className="assignee-label">Event</span>
                      <span className="assignee-value">{selectedEventName}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows="4"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: parseInt(e.target.value, 10) })
                    }
                    disabled={loading}
                  >
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Critical</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="tasks-section">
        <h3>My Created Tasks</h3>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks created yet. Create your first task!</p>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task, index) => {
              const cardTaskId = getTaskId(task) ?? `task-${index}`;
              const taskEventId = getNormalizedEventId(task);
              const matchingInvitation =
                  invitations.find(
                  (inv) =>
                  getNormalizedEventId(inv) &&
                  String(getNormalizedEventId(inv)) === String(taskEventId)
                ) || null;
              
              const eventName = matchingInvitation.eventName ?? matchingInvitation.EventName;
              const assigneeName = getAssigneeDisplayName(matchingInvitation);

              return (
                <div key={cardTaskId} className="task-card">
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <span className={`priority-badge priority-${task.priority}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                  <p className="task-description">{task.description}</p>                  
                  {task.dueDate && (
                    <p className="task-due-date">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="task-created">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                  <div className="role-mappings">
                              <h4>{eventName}</h4>
                              <div className="role-mapping">
                                <div className="role-label">Chris Child:</div>
                                <div className="role-value">{assigneeName}</div>
                              </div>
                            </div>
                  {/* <button
                    className="btn-assign"
                    onClick={() => handleAssignTask(task)}
                    disabled={loadingInvitations}
                  >
                    Assign to Chris Child
                  </button> */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChrisMa;
