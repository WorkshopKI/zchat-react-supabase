import React from 'react';
import { FolderPlus, MessageCircle, MousePointer } from 'lucide-react';
import { Project } from '../types';
import { useProject } from '../contexts/ProjectContext';

interface MainContentProps {
  currentProject: Project | null;
  onCreateProject: () => void;
  onCreateChat: () => void;
}

/**
 * Main content area of the dashboard
 * Shows welcome message or project-specific content
 */
const MainContent: React.FC<MainContentProps> = ({
  currentProject,
  onCreateProject,
  onCreateChat
}) => {
  const { projects } = useProject();
  
  return (
    <div className="flex-1 flex items-center justify-center">
      {currentProject ? (
        <ProjectContent 
          project={currentProject}
          onCreateChat={onCreateChat}
        />
      ) : projects.length === 0 ? (
        <NoProjectsContent onCreateProject={onCreateProject} />
      ) : (
        <SelectProjectContent />
      )}
    </div>
  );
};

/**
 * Content shown when a project is selected
 */
const ProjectContent: React.FC<{
  project: Project;
  onCreateChat: () => void;
}> = ({ project, onCreateChat }) => (
  <div className="text-center">
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
      {project.name}
    </h2>
    <p className="text-gray-500 dark:text-gray-400 mb-8">
      {project.description || 'Wählen Sie einen Chat aus oder erstellen Sie einen neuen Chat'}
    </p>
    <button
      onClick={onCreateChat}
      className="btn-primary flex items-center gap-2"
    >
      <MessageCircle className="h-5 w-5" />
      Neuen Chat erstellen
    </button>
  </div>
);

/**
 * Content shown when no projects exist at all
 */
const NoProjectsContent: React.FC<{
  onCreateProject: () => void;
}> = ({ onCreateProject }) => (
  <div className="text-center max-w-md">
    <div className="mb-6">
      <FolderPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    </div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
      Willkommen bei ZChat
    </h2>
    <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
      Um mit ZChat zu beginnen, müssen Sie zuerst ein Projekt erstellen. 
      Projekte helfen Ihnen dabei, Ihre Unterhaltungen zu organisieren.
    </p>
    <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
      Nach der Projekterstellung können Sie Chats innerhalb des Projekts erstellen.
    </p>
    <button
      onClick={onCreateProject}
      className="btn-primary flex items-center gap-2 mx-auto"
    >
      <FolderPlus className="h-5 w-5" />
      Erstes Projekt erstellen
    </button>
  </div>
);

/**
 * Content shown when projects exist but none is selected
 */
const SelectProjectContent: React.FC = () => (
  <div className="text-center max-w-md">
    <div className="mb-6">
      <MousePointer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    </div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
      Projekt auswählen
    </h2>
    <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
      Wählen Sie ein Projekt aus der Seitenleiste aus, um Chats zu erstellen und zu verwalten.
    </p>
    <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
      Klicken Sie auf ein Projekt in der linken Seitenleiste, um zu beginnen.
    </p>
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <p className="text-sm text-blue-700 dark:text-blue-300">
        💡 Tipp: Sie können auch ein neues Projekt über das "+" Symbol neben "Projekte" erstellen.
      </p>
    </div>
  </div>
);

export default MainContent;