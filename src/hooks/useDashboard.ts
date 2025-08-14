import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';

/**
 * Custom hook for dashboard state and logic
 * Handles project selection, modal states, and navigation
 */
export const useDashboard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, currentProject, setCurrentProject, createProject, createChat } = useProject();

  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateChat, setShowCreateChat] = useState(false);

  // Update current project when projectId changes
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, projects, setCurrentProject]);

  // Project creation handler
  const handleCreateProject = async (name: string, description: string) => {
    const project = await createProject(name, description);
    if (project) {
      navigate(`/project/${project.id}`);
    }
  };

  // Chat creation handler
  const handleCreateChat = async (title: string, provider: 'lmstudio' | 'openrouter', model: string) => {
    if (!currentProject) return;
    
    const chat = await createChat(currentProject.id, title, provider, model);
    if (chat) {
      navigate(`/project/${currentProject.id}/chat/${chat.id}`);
    }
  };

  // Modal control functions
  const openCreateProject = () => setShowCreateProject(true);
  const closeCreateProject = () => setShowCreateProject(false);
  
  const openCreateChat = () => {
    if (currentProject) {
      setShowCreateChat(true);
    }
  };
  const closeCreateChat = () => setShowCreateChat(false);

  // Handle create chat from tree view (sets current project and opens modal)
  const handleCreateChatFromTree = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      setShowCreateChat(true);
    }
  };

  return {
    // State
    currentProject,
    showCreateProject,
    showCreateChat,
    
    // Handlers
    handleCreateProject,
    handleCreateChat,
    openCreateProject,
    closeCreateProject,
    openCreateChat,
    closeCreateChat,
    handleCreateChatFromTree,
  };
};