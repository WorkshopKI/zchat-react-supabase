import React, { useState } from 'react';
import { Eye, Edit3, Save, X } from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  title: string;
  readonly?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  content, 
  onSave, 
  onCancel, 
  title,
  readonly = false 
}) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isPreview, setIsPreview] = useState(true);

  const handleSave = () => {
    onSave(editedContent);
  };

  // Simple markdown to HTML converter for preview
  const markdownToHtml = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```([\\s\\S]*?)```/gim, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\\n/gim, '<br>');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {!readonly && (
              <>
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className={`p-2 rounded-lg flex items-center space-x-1 ${
                    isPreview 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  }`}
                  title={isPreview ? 'Edit' : 'Preview'}
                >
                  {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="text-sm">{isPreview ? 'Edit' : 'Preview'}</span>
                </button>
                
                {!isPreview && (
                  <button
                    onClick={handleSave}
                    className="p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg flex items-center space-x-1"
                    title="Save Changes"
                  >
                    <Save className="h-4 w-4" />
                    <span className="text-sm">Save</span>
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isPreview ? (
            // Preview mode
            <div className="h-full overflow-y-auto p-6">
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(editedContent) }}
              />
            </div>
          ) : (
            // Edit mode
            <div className="h-full p-4">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                placeholder="Enter markdown content..."
              />
            </div>
          )}
        </div>

        {/* Footer with help text */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isPreview ? (
                readonly ? 'Viewing converted file content' : 'Click Edit to modify the markdown content'
              ) : (
                'Editing markdown content - use Preview to see formatted output'
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {editedContent.length.toLocaleString()} characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;