import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  FolderPlus, 
  MessageCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Brain,
  Book,
  Settings2,
  Calendar,
  SortAsc
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useSettings } from '../contexts/SettingsContext';
import { Project, ChatWithContext, Message } from '../types';
import { supabase } from '../lib/supabase';
import { calculateChatContextUsage, getContextUsagePercentage, getContextUsageColor, formatContextUsage } from '../utils/contextCalculator';

interface ProjectTreeViewProps {
  onCreateProject: () => void;
  onCreateChat: (projectId: string) => void;
}

type ProjectSortType = 'alphabetical' | 'created';

const ProjectTreeView: React.FC<ProjectTreeViewProps> = ({ onCreateProject, onCreateChat }) => {
  const navigate = useNavigate();
  const { projectId, chatId } = useParams();
  const { projects, deleteProject } = useProject();
  const { settings } = useSettings();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectChats, setProjectChats] = useState<Record<string, ChatWithContext[]>>({});
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ProjectSortType>(() => {
    const saved = localStorage.getItem('project-sort-preference');
    return (saved as ProjectSortType) || 'alphabetical';
  });

  useEffect(() => {
    // Auto-expand current project
    if (projectId) {
      setExpandedProjects(prev => new Set([...prev, projectId]));
    }
  }, [projectId]);

  useEffect(() => {
    // Load chats for all projects
    loadAllChats();
  }, [projects, settings.maxContextLength]);

  const loadAllChats = async () => {
    try {
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Get message counts for all chats
      const chatIds = chatsData?.map(chat => chat.id) || [];
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('chat_id, content')
        .in('chat_id', chatIds);

      if (messagesError) throw messagesError;

      // Group messages by chat_id and calculate context usage
      const messagesByChat: Record<string, Message[]> = {};
      messagesData?.forEach(message => {
        if (!messagesByChat[message.chat_id]) {
          messagesByChat[message.chat_id] = [];
        }
        messagesByChat[message.chat_id].push(message as Message);
      });

      // Group chats by project with context information
      const chatsByProject: Record<string, ChatWithContext[]> = {};
      chatsData?.forEach(chat => {
        const chatMessages = messagesByChat[chat.id] || [];
        const contextUsage = calculateChatContextUsage(chatMessages);
        const contextPercentage = getContextUsagePercentage(contextUsage, settings.maxContextLength);
        
        const chatWithContext: ChatWithContext = {
          ...chat,
          contextUsage,
          contextPercentage,
        };
        
        if (!chatsByProject[chat.project_id]) {
          chatsByProject[chat.project_id] = [];
        }
        chatsByProject[chat.project_id].push(chatWithContext);
      });

      setProjectChats(chatsByProject);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}" and all its chats?`)) {
      await deleteProject(project.id);
      setShowProjectMenu(null);
    }
  };

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/${project.id}/edit`);
    setShowProjectMenu(null);
  };

  const handleManageKnowledge = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/${project.id}/knowledge`);
    setShowProjectMenu(null);
  };

  const handleSystemPrompt = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/${project.id}/system-prompt`);
    setShowProjectMenu(null);
  };

  const toggleSort = () => {
    const newSortBy = sortBy === 'alphabetical' ? 'created' : 'alphabetical';
    setSortBy(newSortBy);
    localStorage.setItem('project-sort-preference', newSortBy);
  };

  const sortedProjects = React.useMemo(() => {
    const projectsCopy = [...projects];
    if (sortBy === 'alphabetical') {
      return projectsCopy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return projectsCopy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [projects, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Projekte</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleSort}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title={`Sortiert nach ${sortBy === 'alphabetical' ? 'Name' : 'Erstellungsdatum'}. Klicken zum Sortieren nach ${sortBy === 'alphabetical' ? 'Erstellungsdatum' : 'Name'}.`}
            >
              {sortBy === 'alphabetical' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onCreateProject}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Projekt erstellen"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Tree */}
      <div className="p-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FolderPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Projekte</p>
            <button
              onClick={onCreateProject}
              className="text-blue-500 hover:text-blue-600 text-sm mt-1"
            >
              Erstes Projekt erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedProjects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const chats = projectChats[project.id] || [];
              const isCurrentProject = projectId === project.id;

              return (
                <div key={project.id} className="select-none">
                  {/* Project Row */}
                  <div
                    className={`group flex items-center px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isCurrentProject ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
                    }`}
                    onClick={() => {
                      toggleProject(project.id);
                      navigate(`/project/${project.id}`);
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProject(project.id);
                      }}
                      className="p-0.5 mr-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0 flex items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateChat(project.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Neuer Chat"
                        >
                          <Plus className="h-3 w-3 text-gray-500" />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowProjectMenu(showProjectMenu === project.id ? null : project.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title="Projektmenü"
                          >
                            <Settings2 className="h-3 w-3 text-gray-500" />
                          </button>
                          
                          {showProjectMenu === project.id && (
                            <div className="absolute right-0 top-6 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                              <div className="py-1">
                                <button
                                  onClick={(e) => handleEditProject(project, e)}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  <span>Projekt bearbeiten</span>
                                </button>
                                
                                <button
                                  onClick={(e) => handleSystemPrompt(project, e)}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Brain className="h-4 w-4" />
                                  <span>System Prompt</span>
                                </button>
                                
                                <button
                                  onClick={(e) => handleManageKnowledge(project, e)}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Book className="h-4 w-4" />
                                  <span>Wissensbasis</span>
                                </button>
                                
                                <hr className="my-1 border-gray-200 dark:border-gray-600" />
                                
                                <button
                                  onClick={(e) => handleDeleteProject(project, e)}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Projekt löschen</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chats */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {chats.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                          Noch keine Chats
                        </div>
                      ) : (
                        chats.map((chat) => {
                          const isCurrentChat = chatId === chat.id;
                          const usageColor = getContextUsageColor(chat.contextPercentage);
                          return (
                            <div
                              key={chat.id}
                              className={`group flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                isCurrentChat ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
                              }`}
                              onClick={() => navigate(`/project/${project.id}/chat/${chat.id}`)}
                            >
                              <MessageCircle className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                  {chat.title}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span>{chat.model_provider} • {chat.model_name}</span>
                                  <span className={`${usageColor} font-mono`} title={`Context Usage: ${formatContextUsage(chat.contextUsage, settings.maxContextLength)}`}>
                                    {chat.contextPercentage}%
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement delete chat
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded ml-1"
                                title="Delete Chat"
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showProjectMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProjectMenu(null)}
        />
      )}
    </div>
  );
};

export default ProjectTreeView;