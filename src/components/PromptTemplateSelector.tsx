import React, { useState } from 'react';
import { 
  FileText as Template, 
  X, 
  Search, 
  Edit3, 
  Copy,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  TEMPLATE_CATEGORIES, 
  getTemplatesByCategory, 
  fillTemplate,
  PromptTemplate 
} from '../utils/promptTemplates';

interface PromptTemplateSelectorProps {
  onTemplateSelect: (prompt: string) => void;
  onClose: () => void;
}

const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({ 
  onTemplateSelect, 
  onClose 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter templates based on search and category
  const filterTemplate = (template: PromptTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize variables with empty values
    const initialVariables: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialVariables[variable] = '';
    });
    setTemplateVariables(initialVariables);
    
    if (template.variables.length > 0) {
      setShowCustomizer(true);
    } else {
      // No variables to customize, use template directly
      onTemplateSelect(template.template);
    }
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    const filledTemplate = fillTemplate(selectedTemplate.template, templateVariables);
    onTemplateSelect(filledTemplate);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getPreviewText = () => {
    if (!selectedTemplate) return '';
    return fillTemplate(selectedTemplate.template, templateVariables);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Template className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Prompt Templates
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Categories</option>
              {TEMPLATE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto">
            {selectedCategory ? (
              // Show templates for selected category
              <div className="p-2">
                {getTemplatesByCategory(selectedCategory).filter(filterTemplate).map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left p-3 rounded-lg mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedTemplate?.id === template.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Show grouped by category
              <div className="p-2">
                {TEMPLATE_CATEGORIES.map(category => {
                  const categoryTemplates = getTemplatesByCategory(category).filter(filterTemplate);
                  
                  if (categoryTemplates.length === 0) return null;
                  
                  const isExpanded = expandedCategories.has(category);
                  
                  return (
                    <div key={category} className="mb-2">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {category} ({categoryTemplates.length})
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="ml-4 space-y-1">
                          {categoryTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template)}
                              className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                selectedTemplate?.id === template.id 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                                  : 'border border-transparent'
                              }`}
                            >
                              <div className="font-medium text-gray-900 dark:text-white mb-1">
                                {template.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {template.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedTemplate ? (
            <>
              {/* Template Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {selectedTemplate.variables.length > 0 && (
                      <button
                        onClick={() => setShowCustomizer(!showCustomizer)}
                        className={`p-2 rounded-lg flex items-center space-x-1 ${
                          showCustomizer 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="text-sm">Customize</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(getPreviewText())}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center space-x-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                    {selectedTemplate.category}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex">
                {/* Variables Panel */}
                {showCustomizer && selectedTemplate.variables.length > 0 && (
                  <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Customize Variables
                    </h5>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <textarea
                            value={templateVariables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            placeholder={`Enter ${variable}...`}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                            rows={variable.includes('code') || variable.includes('content') ? 4 : 2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Panel */}
                <div className={`${showCustomizer && selectedTemplate.variables.length > 0 ? 'w-1/2' : 'w-full'} p-4 flex flex-col`}>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Preview
                  </h5>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto">
                    <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                      {getPreviewText()}
                    </pre>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUseTemplate}
                      className="btn-primary"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Template className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Template
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a prompt template from the sidebar to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptTemplateSelector;