import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';

export function useRealtime(chatId?: string) {
  const { loadMessages, refreshProjects } = useProject();

  useEffect(() => {
    if (!chatId) return;

    // Subscribe to new messages in the current chat
    const messagesSubscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          // Reload messages when a new message is inserted
          loadMessages(chatId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [chatId, loadMessages]);

  useEffect(() => {
    // Subscribe to project changes
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload) => {
          console.log('Project change received:', payload);
          refreshProjects();
        }
      )
      .subscribe();

    // Subscribe to chat changes
    const chatsSubscription = supabase
      .channel('chats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        (payload) => {
          console.log('Chat change received:', payload);
          // Could trigger a reload of chats for the current project
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(chatsSubscription);
    };
  }, [refreshProjects]);
}