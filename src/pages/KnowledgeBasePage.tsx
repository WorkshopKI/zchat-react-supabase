import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Plus,
  File,
  Image,
  Archive,
  Mail,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { supabase } from '../lib/supabase';
import { KnowledgeBaseItem, Project } from '../types';
// import { useSettings } from '../contexts/SettingsContext';

const SUPPORTED_FILE_TYPES = [
  'txt', 'md', 'docx', 'pptx', 'pdf', 'msg', 'zip', 'png', 'webp', 'tiff', 'jpeg', 'jpg'
];

const KnowledgeBasePage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects } = useProject();
  // const { settings } = useSettings();
  const [project, setProject] = useState<Project | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    const currentProject = projects.find(p => p.id === projectId);
    if (currentProject) {
      setProject(currentProject);
      loadKnowledgeBase();
    }
  }, [projectId, projects]);

  const loadKnowledgeBase = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeItems(data || []);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !projectId) return;

    setLoading(true);
    for (const file of Array.from(files)) {
      try {
        // Check file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !SUPPORTED_FILE_TYPES.includes(fileExtension)) {
          alert(`Unsupported file type: ${fileExtension}. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`);
          continue;
        }

        // For text files, read content directly
        let content = '';
        if (['txt', 'md'].includes(fileExtension)) {
          content = await file.text();
        } else {
          // For other files, we'll store metadata and file info
          content = `File: ${file.name}
Type: ${file.type}
Size: ${file.size} bytes
Uploaded: ${new Date().toISOString()}`;
        }

        const { error } = await supabase
          .from('knowledge_base')
          .insert([
            {
              project_id: projectId,
              title: file.name,
              content,
              file_type: fileExtension,
              file_size: file.size,
            },
          ]);

        if (error) throw error;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setLoading(false);
    loadKnowledgeBase();
    event.target.value = ''; // Reset input
  };

  const handleAddTextItem = async () => {
    if (!newItem.title.trim() || !newItem.content.trim() || !projectId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .insert([
          {
            project_id: projectId,
            title: newItem.title,
            content: newItem.content,
            file_type: 'text',
            file_size: new Blob([newItem.content]).size,
          },
        ]);

      if (error) throw error;

      setNewItem({ title: '', content: '' });
      setShowAddModal(false);
      loadKnowledgeBase();
    } catch (error) {
      console.error('Error adding knowledge item:', error);
      alert('Failed to add knowledge item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: KnowledgeBaseItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      loadKnowledgeBase();
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      alert('Failed to delete knowledge item');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (['png', 'jpg', 'jpeg', 'webp', 'tiff'].includes(fileType)) {
      return <Image className="h-5 w-5" />;
    }
    if (['zip'].includes(fileType)) {
      return <Archive className="h-5 w-5" />;
    }
    if (['msg'].includes(fileType)) {
      return <Mail className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredItems = knowledgeItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/project/${project.id}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Knowledge Base
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {project.name} • {knowledgeItems.length} items
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="btn-secondary cursor-pointer flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
              <input
                type="file"
                multiple
                accept={SUPPORTED_FILE_TYPES.map(type => `.${type}`).join(',')}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Text</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Supported File Types Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Supported File Types</h3>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_FILE_TYPES.map(type => (
              <span
                key={type}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded"
              >
                .{type}
              </span>
            ))}
          </div>
        </div>

        {/* Knowledge Items */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No matching items' : 'No knowledge base items yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start building your knowledge base by uploading files or adding text content'
              }
            </p>
            {!searchQuery && (
              <div className="flex justify-center space-x-4">
                <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Files</span>
                  <input
                    type="file"
                    multiple
                    accept={SUPPORTED_FILE_TYPES.map(type => `.${type}`).join(',')}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Text</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-gray-400 mt-0.5">
                      {getFileIcon(item.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span className="uppercase font-mono">{item.file_type}</span>
                        <span>{formatFileSize(item.file_size)}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {item.content.length > 200 ? (
                          <div>
                            <p className="whitespace-pre-wrap">{item.content.substring(0, 200)}...</p>
                            <button className="text-blue-500 hover:text-blue-600 text-sm mt-2">
                              Read more
                            </button>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{item.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        const blob = new Blob([item.content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = item.title;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Add Text Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Text Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newItem.content}
                    onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter content"
                    rows={12}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTextItem}
                  disabled={!newItem.title.trim() || !newItem.content.trim() || loading}
                  className="btn-primary"
                >
                  {loading ? 'Adding...' : 'Add Content'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;