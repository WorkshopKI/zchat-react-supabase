import React from 'react';
import { useResizableSidebar } from '../hooks/useResizableSidebar';
import SidebarHeader from './SidebarHeader';
import ResizeHandle from './ResizeHandle';
import ProjectTreeView from './ProjectTreeView';

interface ResizableSidebarProps {
  onCreateProject: () => void;
  onCreateChat: (projectId: string) => void;
}

/**
 * Resizable sidebar component that contains the main navigation
 * Manages its own width state and provides resize functionality
 */
const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  onCreateProject,
  onCreateChat
}) => {
  const {
    sidebarWidth,
    isResizing,
    sidebarRef,
    handleMouseDown
  } = useResizableSidebar();

  return (
    <div 
      ref={sidebarRef}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col relative"
      style={{ width: sidebarWidth }}
    >
      <SidebarHeader />
      
      <ProjectTreeView
        onCreateProject={onCreateProject}
        onCreateChat={onCreateChat}
      />
      
      <ResizeHandle 
        onMouseDown={handleMouseDown}
        isResizing={isResizing}
      />
    </div>
  );
};

export default ResizableSidebar;