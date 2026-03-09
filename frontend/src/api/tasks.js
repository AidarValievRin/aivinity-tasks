import api from './axios';

export const tasksApi = {
  // My tasks
  getMyTasks: (params) => api.get('/tasks/my', { params }),
  createMyTask: (data) => api.post('/tasks/my', data),
  getMyTask: (id) => api.get(`/tasks/my/${id}`),
  updateMyTask: (id, data) => api.put(`/tasks/my/${id}`, data),
  deleteMyTask: (id) => api.delete(`/tasks/my/${id}`),
  updateMyTaskStatus: (id, status) => api.put(`/tasks/my/${id}/status`, { status }),
  addMyTaskComment: (id, content) => api.post(`/tasks/my/${id}/comments`, { content }),

  // Team tasks
  getTeamTasks: (params) => api.get('/tasks/team', { params }),
  createTeamTask: (data) => api.post('/tasks/team', data),
  getTeamTask: (id) => api.get(`/tasks/team/${id}`),
  updateTeamTask: (id, data) => api.put(`/tasks/team/${id}`, data),
  deleteTeamTask: (id) => api.delete(`/tasks/team/${id}`),
  updateTeamTaskStatus: (id, status) => api.put(`/tasks/team/${id}/status`, { status }),
  addTeamTaskComment: (id, content) => api.post(`/tasks/team/${id}/comments`, { content }),
};
