import api from './axios';

export const teamsApi = {
  getTeams: () => api.get('/teams'),
  createTeam: (data) => api.post('/teams', data),
  getTeam: (id) => api.get(`/teams/${id}`),
  invite: (id, uniqueCode) => api.post(`/teams/${id}/invite`, { uniqueCode }),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};
