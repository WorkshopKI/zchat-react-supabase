import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Brain, FileText } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

const ProjectEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'system-prompt'>('details');

  useEffect(() => {
    const currentProject = projects.find(p => p.id === projectId);
    if (currentProject) {
      setProject(currentProject);
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        system_prompt: currentProject.system_prompt || '',
      });
    }
  }, [projectId, projects]);

  const handleSave = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          system_prompt: formData.system_prompt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      // Refresh projects in context
      window.location.reload(); // Simple refresh for now
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/project/${project.id}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Project: {project.name}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Project Details</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('system-prompt')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system-prompt'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>System Prompt</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'details' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Project Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system-prompt' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">System Prompt</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Define how the AI should behave in all chats within this project. This prompt will be automatically 
                prepended to every conversation in this project.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Instructions
              </label>
              <textarea
                value={formData.system_prompt}
                onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Example: You are a helpful AI assistant specialized in software development. Always provide code examples when relevant and explain complex concepts clearly."
                rows={12}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formData.system_prompt.length} characters
              </p>
            </div>

            {/* System Prompt Templates */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleInputChange('system_prompt', 'You are a helpful AI assistant specialized in software development. Always provide code examples when relevant, explain complex concepts clearly, and follow best practices for clean, maintainable code.')}
                  className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Software Development</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code-focused assistant</p>
                </button>
                
                <button
                  onClick={() => handleInputChange('system_prompt', 'You are a professional business consultant. Provide strategic advice, analyze market trends, and help with business planning. Always consider both short-term and long-term implications of decisions.')}
                  className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Business Consultant</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Strategic business advice</p>
                </button>
                
                <button
                  onClick={() => handleInputChange('system_prompt', 'You are a creative writing assistant. Help with storytelling, character development, plot structure, and writing techniques. Provide constructive feedback and inspire creativity.')}
                  className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Creative Writing</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Story and content creation</p>
                </button>
                
                <button
                  onClick={() => handleInputChange('system_prompt', 'You are an educational tutor. Explain concepts clearly, provide examples, break down complex topics into digestible parts, and encourage learning through questions and practice.')}
                  className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Educational Tutor</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Learning and teaching</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEditPage;