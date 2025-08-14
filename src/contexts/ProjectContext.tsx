import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, Chat, Message } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createChat: (projectId: string, title: string, modelProvider: 'lmstudio' | 'openrouter', modelName: string) => Promise<Chat | null>;
  deleteChat: (chatId: string) => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (content: string, role: 'user' | 'assistant' | 'system', chatId?: string) => Promise<Message | null>;
  loadMessages: (chatId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true }); // Default to alphabetical ordering

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    console.log(`[ProjectContext] createProject called - user: ${user ? 'authenticated' : 'null'}`);
    if (!user) {
      console.warn('[ProjectContext] createProject failed - no authenticated user');
      return null;
    }

    console.log(`[ProjectContext] Attempting to create project "${name}" for user ${user.id}`);
    try {
      const insertStart = Date.now();
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name,
            description,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      console.log(`[ProjectContext] Database insert completed in ${Date.now() - insertStart}ms`);

      if (error) {
        console.error('[ProjectContext] Database error:', error);
        throw error;
      }

      console.log(`[ProjectContext] Project created successfully: ${data.id}`);
      const refreshStart = Date.now();
      await refreshProjects();
      console.log(`[ProjectContext] Projects refreshed in ${Date.now() - refreshStart}ms`);
      return data;
    } catch (error) {
      console.error('[ProjectContext] Error creating project:', error);
      return null;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await refreshProjects();
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const createChat = async (
    projectId: string,
    title: string,
    modelProvider: 'lmstudio' | 'openrouter',
    modelName: string
  ): Promise<Chat | null> => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([
          {
            title,
            project_id: projectId,
            model_provider: modelProvider,
            model_name: modelName,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const sendMessage = async (content: string, role: 'user' | 'assistant' | 'system' = 'user', chatId?: string): Promise<Message | null> => {
    // Use provided chatId or fall back to currentChat
    const targetChatId = chatId || currentChat?.id;
    
    if (!targetChatId) {
      console.error('No chat ID provided and no current chat set');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: targetChatId,
            role,
            content,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Message saved successfully:', data);
      
      // Only update local messages if this is for the current chat
      if (targetChatId === currentChat?.id) {
        setMessages(prev => [...prev, data]);
        console.log('Local messages updated, total count:', messages.length + 1);
      }
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      console.log('Loading messages for chat:', chatId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    console.log(`[ProjectContext] User state changed: ${user ? `authenticated (${user.email})` : 'null'}`);
    if (user) {
      refreshProjects();
    } else {
      console.log('[ProjectContext] Clearing project state due to no user');
      setProjects([]);
      setCurrentProject(null);
      setCurrentChat(null);
      setMessages([]);
    }
  }, [user]);

  const value = {
    projects,
    currentProject,
    currentChat,
    messages,
    loading,
    createProject,
    deleteProject,
    setCurrentProject,
    createChat,
    deleteChat,
    setCurrentChat,
    sendMessage,
    loadMessages,
    refreshProjects,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};