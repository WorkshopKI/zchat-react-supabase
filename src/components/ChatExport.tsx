import React from 'react';
import { Download, FileText, Code } from 'lucide-react';
import { Message, Chat, Project } from '../types';

interface ChatExportProps {
  chat: Chat;
  project: Project;
  messages: Message[];
}

const ChatExport: React.FC<ChatExportProps> = ({ chat, project, messages }) => {
  const exportAsJson = () => {
    const exportData = {
      project: {
        name: project.name,
        description: project.description,
      },
      chat: {
        title: chat.title,
        model_provider: chat.model_provider,
        model_name: chat.model_name,
        created_at: chat.created_at,
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
      })),
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = () => {
    let markdown = `# ${chat.title}\n\n`;
    markdown += `**Project:** ${project.name}\n`;
    if (project.description) {
      markdown += `**Description:** ${project.description}\n`;
    }
    markdown += `**Model:** ${chat.model_provider} - ${chat.model_name}\n`;
    markdown += `**Created:** ${new Date(chat.created_at).toLocaleString()}\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((message, index) => {
      const timestamp = new Date(message.created_at).toLocaleString();
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      
      markdown += `## ${role} - ${timestamp}\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (index < messages.length - 1) {
        markdown += `---\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    let text = `${chat.title}\n`;
    text += `${'='.repeat(chat.title.length)}\n\n`;
    text += `Project: ${project.name}\n`;
    if (project.description) {
      text += `Description: ${project.description}\n`;
    }
    text += `Model: ${chat.model_provider} - ${chat.model_name}\n`;
    text += `Created: ${new Date(chat.created_at).toLocaleString()}\n`;
    text += `Exported: ${new Date().toLocaleString()}\n\n`;
    text += `${'-'.repeat(50)}\n\n`;

    messages.forEach((message, index) => {
      const timestamp = new Date(message.created_at).toLocaleString();
      const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
      
      text += `[${timestamp}] ${role}:\n`;
      text += `${message.content}\n\n`;
      
      if (index < messages.length - 1) {
        text += `${'-'.repeat(30)}\n\n`;
      }
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={exportAsMarkdown}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        title="Export as Markdown"
      >
        <FileText className="h-4 w-4" />
      </button>
      <button
        onClick={exportAsJson}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        title="Export as JSON"
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        onClick={exportAsText}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        title="Export as Text"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatExport;