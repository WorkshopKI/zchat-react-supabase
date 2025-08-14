import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, provider: 'lmstudio' | 'openrouter', model: string) => Promise<void>;
}

/**
 * Modal for creating a new chat
 */
const CreateChatModal: React.FC<CreateChatModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { settings } = useSettings();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !settings.defaultModel || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim(), settings.defaultProvider, settings.defaultModel);
      // Reset form
      setTitle('');
      onClose();
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New Chat
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chat Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter chat title"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Using default settings:
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  Provider: <span className="font-medium">{settings.defaultProvider}</span>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Model: <span className="font-medium">{settings.defaultModel || 'Not set'}</span>
                </span>
              </div>
              {!settings.defaultModel && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  ⚠️ No default model set. Please configure in Settings.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!title.trim() || !settings.defaultModel || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChatModal;