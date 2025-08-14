import React from 'react';
import { useResizableSidebar } from '../hooks/useResizableSidebar';
import { useDashboard } from '../hooks/useDashboard';
import ResizableSidebar from '../components/ResizableSidebar';
import MainContent from '../components/MainContent';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import CreateChatModal from '../components/modals/CreateChatModal';

/**
 * Main Dashboard component
 * 
 * Features:
 * - Resizable sidebar with project navigation
 * - Main content area showing welcome or project-specific content
 * - Modals for creating projects and chats
 * - Persistent sidebar width across sessions
 */
const Dashboard: React.FC = () => {
  const { isResizing } = useResizableSidebar();
  const {
    currentProject,
    showCreateProject,
    showCreateChat,
    handleCreateProject,
    handleCreateChat,
    openCreateProject,
    closeCreateProject,
    openCreateChat,
    closeCreateChat,
    handleCreateChatFromTree,
  } = useDashboard();

  return (
    <div 
      className="flex h-screen bg-gray-100 dark:bg-gray-900"
      style={{ 
        cursor: isResizing ? 'col-resize' : 'default',
        userSelect: isResizing ? 'none' : 'auto'
      }}
    >
      <ResizableSidebar
        onCreateProject={openCreateProject}
        onCreateChat={handleCreateChatFromTree}
      />
      
      <MainContent
        currentProject={currentProject}
        onCreateProject={openCreateProject}
        onCreateChat={openCreateChat}
      />

      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={closeCreateProject}
        onSubmit={handleCreateProject}
      />

      <CreateChatModal
        isOpen={showCreateChat}
        onClose={closeCreateChat}
        onSubmit={handleCreateChat}
      />
    </div>
  );
};

export default Dashboard;