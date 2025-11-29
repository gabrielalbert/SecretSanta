import React, { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import './ChrisMa.css';

const ChrisMa = () => {
  const [tasks, setTasks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 2
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await taskService.getMyCreatedTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await taskService.createTask(newTask);
      setMessage({ type: 'success', text: 'Task created successfully!' });
      setNewTask({ title: '', description: '', dueDate: '', priority: 2 });
      setShowCreateForm(false);
      loadTasks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create task' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (taskId) => {
    try {
      await taskService.assignTask(taskId);
      setMessage({ type: 'success', text: 'Task assigned successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign task' });
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return labels[priority] || 'Medium';
  };

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

      <button
        className="btn-create"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? 'Cancel' : '+ Create New Task'}
      </button>

      {showCreateForm && (
        <div className="create-task-form">
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
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
                  onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
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
        </div>
      )}

      <div className="tasks-section">
        <h3>My Created Tasks</h3>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks created yet. Create your first task!</p>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
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
                <button
                  className="btn-assign"
                  onClick={() => handleAssignTask(task.id)}
                >
                  Assign to Chris Child
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChrisMa;
