import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import MyTasks from '../components/tasks/MyTasks';
import TeamTasks from '../components/tasks/TeamTasks';

let socket;

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('my');
  const { user } = useAuthStore();
  const {
    fetchMyTasks,
    fetchTeamTasks,
    fetchTeams,
    fetchCategories,
    handleSocketTaskCreated,
    handleSocketTaskUpdated,
    handleSocketTaskDeleted,
    handleSocketCommentAdded,
    teams,
  } = useTaskStore();

  useEffect(() => {
    fetchMyTasks();
    fetchTeamTasks();
    fetchTeams();
    fetchCategories();
  }, []);

  useEffect(() => {
    socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (user) {
        socket.emit('join:user', user.id);
      }
    });

    socket.on('task:created', handleSocketTaskCreated);
    socket.on('task:updated', handleSocketTaskUpdated);
    socket.on('task:deleted', handleSocketTaskDeleted);
    socket.on('comment:added', handleSocketCommentAdded);

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (socket && teams.length > 0) {
      teams.forEach((team) => {
        socket.emit('join:team', team.id);
      });
    }
  }, [teams]);

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'my' ? <MyTasks /> : <TeamTasks />}
        </main>
      </div>
    </div>
  );
}
