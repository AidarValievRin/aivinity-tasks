import { create } from 'zustand';
import { tasksApi } from '../api/tasks';
import { teamsApi } from '../api/teams';
import { categoriesApi } from '../api/categories';

export const useTaskStore = create((set, get) => ({
  myTasks: [],
  teamTasks: [],
  teams: [],
  categories: [],
  loading: false,
  error: null,

  // Fetch my tasks
  fetchMyTasks: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await tasksApi.getMyTasks(params);
      set({ myTasks: res.data.tasks, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Error', loading: false });
    }
  },

  // Create personal task
  createMyTask: async (data) => {
    const res = await tasksApi.createMyTask(data);
    set((state) => ({ myTasks: [res.data.task, ...state.myTasks] }));
    return res.data.task;
  },

  // Update personal task
  updateMyTask: async (id, data) => {
    const res = await tasksApi.updateMyTask(id, data);
    set((state) => ({
      myTasks: state.myTasks.map((t) => (t.id === id ? res.data.task : t)),
    }));
    return res.data.task;
  },

  // Delete personal task
  deleteMyTask: async (id) => {
    await tasksApi.deleteMyTask(id);
    set((state) => ({ myTasks: state.myTasks.filter((t) => t.id !== id) }));
  },

  // Update status
  updateMyTaskStatus: async (id, status) => {
    const res = await tasksApi.updateMyTaskStatus(id, status);
    set((state) => ({
      myTasks: state.myTasks.map((t) => (t.id === id ? res.data.task : t)),
    }));
    return res.data.task;
  },

  // Add comment to personal task
  addMyTaskComment: async (id, content) => {
    const res = await tasksApi.addMyTaskComment(id, content);
    set((state) => ({
      myTasks: state.myTasks.map((t) =>
        t.id === id ? { ...t, comments: [...t.comments, res.data.comment] } : t
      ),
    }));
    return res.data.comment;
  },

  // Fetch team tasks
  fetchTeamTasks: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await tasksApi.getTeamTasks(params);
      set({ teamTasks: res.data.tasks, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Error', loading: false });
    }
  },

  // Create team task
  createTeamTask: async (data) => {
    const res = await tasksApi.createTeamTask(data);
    set((state) => ({ teamTasks: [res.data.task, ...state.teamTasks] }));
    return res.data.task;
  },

  // Update team task
  updateTeamTask: async (id, data) => {
    const res = await tasksApi.updateTeamTask(id, data);
    set((state) => ({
      teamTasks: state.teamTasks.map((t) => (t.id === id ? res.data.task : t)),
    }));
    return res.data.task;
  },

  // Delete team task
  deleteTeamTask: async (id) => {
    await tasksApi.deleteTeamTask(id);
    set((state) => ({ teamTasks: state.teamTasks.filter((t) => t.id !== id) }));
  },

  // Update team task status
  updateTeamTaskStatus: async (id, status) => {
    const res = await tasksApi.updateTeamTaskStatus(id, status);
    set((state) => ({
      teamTasks: state.teamTasks.map((t) => (t.id === id ? res.data.task : t)),
    }));
    return res.data.task;
  },

  // Add comment to team task
  addTeamTaskComment: async (id, content) => {
    const res = await tasksApi.addTeamTaskComment(id, content);
    set((state) => ({
      teamTasks: state.teamTasks.map((t) =>
        t.id === id ? { ...t, comments: [...t.comments, res.data.comment] } : t
      ),
    }));
    return res.data.comment;
  },

  // Socket updates
  handleSocketTaskCreated: (task) => {
    if (task.isTeamTask) {
      set((state) => ({
        teamTasks: state.teamTasks.some((t) => t.id === task.id)
          ? state.teamTasks
          : [task, ...state.teamTasks],
      }));
    } else {
      set((state) => ({
        myTasks: state.myTasks.some((t) => t.id === task.id)
          ? state.myTasks
          : [task, ...state.myTasks],
      }));
    }
  },

  handleSocketTaskUpdated: (task) => {
    if (task.isTeamTask) {
      set((state) => ({
        teamTasks: state.teamTasks.map((t) => (t.id === task.id ? task : t)),
      }));
    } else {
      set((state) => ({
        myTasks: state.myTasks.map((t) => (t.id === task.id ? task : t)),
      }));
    }
  },

  handleSocketTaskDeleted: ({ id }) => {
    set((state) => ({
      myTasks: state.myTasks.filter((t) => t.id !== id),
      teamTasks: state.teamTasks.filter((t) => t.id !== id),
    }));
  },

  handleSocketCommentAdded: ({ taskId, comment }) => {
    set((state) => ({
      myTasks: state.myTasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
      ),
      teamTasks: state.teamTasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
      ),
    }));
  },

  // Teams
  fetchTeams: async () => {
    try {
      const res = await teamsApi.getTeams();
      set({ teams: res.data.teams });
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  },

  createTeam: async (name) => {
    const res = await teamsApi.createTeam({ name });
    set((state) => ({ teams: [...state.teams, res.data.team] }));
    return res.data.team;
  },

  inviteToTeam: async (teamId, uniqueCode) => {
    const res = await teamsApi.invite(teamId, uniqueCode);
    return res.data;
  },

  removeMember: async (teamId, userId) => {
    await teamsApi.removeMember(teamId, userId);
    set((state) => ({
      teams: state.teams.map((team) =>
        team.id === teamId
          ? { ...team, members: team.members.filter((m) => m.user?.id !== userId) }
          : team
      ),
    }));
  },

  // Categories
  fetchCategories: async () => {
    try {
      const res = await categoriesApi.getCategories();
      set({ categories: res.data.categories });
    } catch {}
  },

  createCategory: async (data) => {
    const res = await categoriesApi.createCategory(data);
    set((state) => ({ categories: [...state.categories, res.data.category] }));
    return res.data.category;
  },

  deleteCategory: async (id) => {
    await categoriesApi.deleteCategory(id);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
  },
}));
