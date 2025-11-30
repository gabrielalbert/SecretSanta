import api from './api';

const TOKEN_CANDIDATE_KEYS = [
  'token',
  'Token',
  'accessToken',
  'AccessToken',
  'access_token',
  'jwt',
  'Jwt',
  'jwtToken',
  'JwtToken',
  'jwt_token',
  'idToken',
  'IdToken'
];

const USER_CANDIDATE_KEYS = ['user', 'User', 'profile', 'Profile'];

const extractToken = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidates = [data, data.data, data.user, data.User, data.profile, data.Profile];

  for (const source of candidates) {
    if (!source || typeof source !== 'object') {
      continue;
    }
    for (const key of TOKEN_CANDIDATE_KEYS) {
      const value = source[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
  }

  return null;
};

const extractUserPayload = (data) => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  for (const key of USER_CANDIDATE_KEYS) {
    if (data[key] && typeof data[key] === 'object') {
      return data[key];
    }
  }

  if (data.data && typeof data.data === 'object') {
    return data.data;
  }

  return data;
};

const deriveAdminFlag = (payload = {}) => {
  const directFlag = payload.isAdmin ?? payload.IsAdmin;
  if (typeof directFlag !== 'undefined') {
    if (typeof directFlag === 'string') {
      const normalized = directFlag.trim().toLowerCase();
      return normalized === 'true' || normalized === '1';
    }
    return !!directFlag;
  }

  const roleValue = payload.roles ?? payload.Roles ?? payload.role ?? payload.Role;
  if (Array.isArray(roleValue)) {
    return roleValue.some((role) => String(role).toLowerCase() === 'admin');
  }
  if (typeof roleValue === 'string') {
    return roleValue
      .split(/[\s,]+/)
      .filter(Boolean)
      .some((role) => role.toLowerCase() === 'admin');
  }

  return false;
};

const serializeUserForStorage = (userPayload, token) => {
  const normalizedUser = {
    ...userPayload,
    isAdmin: deriveAdminFlag(userPayload)
  };

  if (token) {
    normalizedUser.token = token;
  }

  return normalizedUser;
};

const persistAuthSession = (data, { requireToken = true } = {}) => {
  const token = extractToken(data);
  const userPayload = extractUserPayload(data);

  if (requireToken && !token) {
    throw new Error('Authentication token is missing from the response');
  }

  const normalizedUser = serializeUserForStorage(userPayload, token);

  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }

  localStorage.setItem('user', JSON.stringify(normalizedUser));

  return normalizedUser;
};

export const authService = {
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    const token = extractToken(response.data);

    if (token) {
      return persistAuthSession(response.data);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return serializeUserForStorage(extractUserPayload(response.data));
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return persistAuthSession(response.data);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return null;
    }

    try {
      const parsed = JSON.parse(userStr);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      const normalizedUser = {
        ...parsed,
        isAdmin: deriveAdminFlag(parsed)
      };

      if (normalizedUser.token && !localStorage.getItem('token')) {
        localStorage.setItem('token', normalizedUser.token);
      }

      return normalizedUser;
    } catch (error) {
      console.error('Failed to parse stored user', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const taskService = {
  // Chris Ma functions
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  getMyCreatedTasks: async () => {
    const response = await api.get('/tasks/my-created-tasks');
    return response.data;
  },

  assignTask: async (taskId, assignmentData) => {
    const hasPayload =
      assignmentData &&
      typeof assignmentData === 'object' &&
      Object.keys(assignmentData).length > 0;

    const response = hasPayload
      ? await api.post(`/tasks/${taskId}/assign`, assignmentData)
      : await api.post(`/tasks/${taskId}/assign`);

    return response.data;
  },

  // Chris Child functions
  getMyAssignments: async () => {
    const response = await api.get('/tasks/my-assignments');
    return response.data;
  },

  updateAssignmentStatus: async (assignmentId, status) => {
    const response = await api.patch(`/tasks/assignments/${assignmentId}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  // All users
  getCompletedTasks: async () => {
    const response = await api.get('/tasks/completed');
    return response.data;
  },
};

export const submissionService = {
  submitTask: async (taskAssignmentId, notes, files) => {
    const formData = new FormData();
    formData.append('taskAssignmentId', taskAssignmentId);
    if (notes) formData.append('notes', notes);
    
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await api.post('/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadFile: async (fileId) => {
    const response = await api.get(`/submissions/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getSubmission: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}`);
    return response.data;
  },
};
