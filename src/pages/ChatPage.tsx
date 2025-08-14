import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Send, ArrowLeft, Settings, Trash2, Copy, Bot, User, FileText as Template } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Chat } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ChatExport from '../components/ChatExport';
import PromptTemplateSelector from '../components/PromptTemplateSelector';
import { lmstudioAPI } from '../lib/lmstudio';
import { openRouterAPI } from '../lib/openrouter';
import { useRealtime } from '../hooks/useRealtime';

const ChatPage: React.FC = () => {
  const { projectId, chatId } = useParams();
  const navigate = useNavigate();
  const { } = useAuth();
  const { currentProject, messages, loadMessages, sendMessage, setCurrentChat } = useProject();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Enable real-time updates for this chat
  useRealtime(chatId);

  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
      loadChatDetails();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatDetails = async () => {
    if (!chatId) return;
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) throw error;
      setChat(data);
      
      // Set the current chat in the project context
      setCurrentChat(data);
    } catch (error) {
      console.error('Error loading chat details:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !chat) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      console.log('Sending user message:', userMessage);
      // Send user message
      const userMsg = await sendMessage(userMessage, 'user', chat.id);
      console.log('User message sent:', userMsg);

      // Get AI response
      console.log('Getting AI response...');
      const response = await getAIResponse(userMessage, chat);
      console.log('AI response received:', response);
      
      if (response) {
        const assistantMsg = await sendMessage(response, 'assistant', chat.id);
        console.log('Assistant message sent:', assistantMsg);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAIResponse = async (message: string, chat: Chat): Promise<string | null> => {
    try {
      if (chat.model_provider === 'lmstudio') {
        return await lmstudioAPI.getSimpleResponse(messages.concat([{
          id: '',
          chat_id: chat.id,
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        }]), chat.model_name);
      } else if (chat.model_provider === 'openrouter') {
        return await openRouterAPI.getSimpleResponse(messages.concat([{
          id: '',
          chat_id: chat.id,
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        }]), chat.model_name);
      }
      return null;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'Sorry, I encountered an error while processing your request.';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chat.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chat.model_provider} • {chat.model_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentProject && (
            <ChatExport chat={chat} project={currentProject} messages={messages} />
          )}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-red-500">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with your AI assistant!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="h-5 w-5 mt-0.5 opacity-70" />
                  )}
                  {message.role === 'user' && (
                    <User className="h-5 w-5 mt-0.5 opacity-70" />
                  )}
                  <div className="flex-1 min-w-0">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                        className="prose dark:prose-invert max-w-none"
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 opacity-70" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message or choose a template..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowTemplateSelector(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Choose Template"
            >
              <Template className="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
      
      {/* Prompt Template Selector */}
      {showTemplateSelector && (
        <PromptTemplateSelector
          onTemplateSelect={(prompt) => {
            setInput(prompt);
            setShowTemplateSelector(false);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;