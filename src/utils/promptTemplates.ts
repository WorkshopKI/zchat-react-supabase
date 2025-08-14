/**
 * Predefined prompt templates for different tasks
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: string[]; // Variables that can be customized
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Code & Development
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review code for best practices, bugs, and improvements',
    category: 'Development',
    template: 'Please review the following {language} code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance improvements\n4. Readability and maintainability\n\nCode:\n{code}',
    variables: ['language', 'code']
  },
  {
    id: 'debug-help',
    name: 'Debug Assistance',
    description: 'Get help debugging code issues',
    category: 'Development',
    template: 'I\'m having trouble with this {language} code. The issue is: {problem}\n\nExpected behavior: {expected}\nActual behavior: {actual}\n\nCode:\n{code}\n\nPlease help me identify and fix the issue.',
    variables: ['language', 'problem', 'expected', 'actual', 'code']
  },
  {
    id: 'explain-code',
    name: 'Code Explanation',
    description: 'Explain how code works step by step',
    category: 'Development',
    template: 'Please explain this {language} code step by step. Break down what each part does and how it works together:\n\n{code}\n\nMake the explanation suitable for a {skill_level} programmer.',
    variables: ['language', 'code', 'skill_level']
  },

  // Writing & Content
  {
    id: 'blog-post',
    name: 'Blog Post Creation',
    description: 'Create engaging blog posts on any topic',
    category: 'Writing',
    template: 'Write a {tone} blog post about {topic}. The target audience is {audience}.\n\nKey points to cover:\n- {point1}\n- {point2}\n- {point3}\n\nLength: approximately {word_count} words\nStyle: {style}',
    variables: ['tone', 'topic', 'audience', 'point1', 'point2', 'point3', 'word_count', 'style']
  },
  {
    id: 'email-template',
    name: 'Professional Email',
    description: 'Draft professional emails for various purposes',
    category: 'Writing',
    template: 'Write a professional email for the following situation:\n\nTo: {recipient}\nPurpose: {purpose}\nTone: {tone}\nKey message: {message}\n\nContext: {context}',
    variables: ['recipient', 'purpose', 'tone', 'message', 'context']
  },
  {
    id: 'content-outline',
    name: 'Content Outline',
    description: 'Create structured outlines for content',
    category: 'Writing',
    template: 'Create a detailed outline for {content_type} about "{topic}". \n\nTarget audience: {audience}\nGoal: {goal}\nLength: {length}\n\nPlease include:\n- Main sections and subsections\n- Key points for each section\n- Suggested resources or examples',
    variables: ['content_type', 'topic', 'audience', 'goal', 'length']
  },

  // Business & Analysis
  {
    id: 'business-analysis',
    name: 'Business Analysis',
    description: 'Analyze business scenarios and provide insights',
    category: 'Business',
    template: 'Please analyze the following business scenario:\n\nCompany: {company}\nIndustry: {industry}\nSituation: {situation}\n\nProvide analysis on:\n1. Current challenges\n2. Opportunities\n3. Recommended actions\n4. Potential risks\n5. Success metrics',
    variables: ['company', 'industry', 'situation']
  },
  {
    id: 'market-research',
    name: 'Market Research',
    description: 'Research market trends and opportunities',
    category: 'Business',
    template: 'Conduct market research for {product_service} in the {industry} industry.\n\nTarget market: {target_market}\nGeographic focus: {geography}\n\nPlease provide:\n1. Market size and growth trends\n2. Key competitors\n3. Customer needs and pain points\n4. Market opportunities\n5. Potential challenges',
    variables: ['product_service', 'industry', 'target_market', 'geography']
  },

  // Learning & Education
  {
    id: 'concept-explanation',
    name: 'Concept Explanation',
    description: 'Explain complex concepts in simple terms',
    category: 'Education',
    template: 'Explain the concept of "{concept}" in {subject}.\n\nAudience level: {level}\nLearning style preference: {style}\n\nPlease include:\n- Simple definition\n- Real-world examples\n- Key components or principles\n- Common misconceptions\n- Practice suggestions',
    variables: ['concept', 'subject', 'level', 'style']
  },
  {
    id: 'study-plan',
    name: 'Study Plan Creation',
    description: 'Create structured study plans for learning goals',
    category: 'Education',
    template: 'Create a study plan for learning {subject}.\n\nGoal: {goal}\nCurrent level: {current_level}\nTarget level: {target_level}\nTime available: {time_per_week} hours per week\nDuration: {duration}\n\nPreferred learning methods: {learning_methods}',
    variables: ['subject', 'goal', 'current_level', 'target_level', 'time_per_week', 'duration', 'learning_methods']
  },

  // Creative & Design
  {
    id: 'creative-brief',
    name: 'Creative Brief',
    description: 'Generate ideas for creative projects',
    category: 'Creative',
    template: 'Generate creative ideas for a {project_type} project.\n\nTheme: {theme}\nTarget audience: {audience}\nStyle preferences: {style}\nConstraints: {constraints}\n\nPlease provide:\n1. 5 unique concept ideas\n2. Visual style suggestions\n3. Key messaging\n4. Implementation considerations',
    variables: ['project_type', 'theme', 'audience', 'style', 'constraints']
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    description: 'Generate creative solutions and ideas',
    category: 'Creative',
    template: 'Let\'s brainstorm solutions for: {challenge}\n\nContext: {context}\nConstraints: {constraints}\nSuccess criteria: {success_criteria}\n\nPlease generate 10 diverse ideas, ranging from practical to innovative. For each idea, briefly explain the concept and potential impact.',
    variables: ['challenge', 'context', 'constraints', 'success_criteria']
  }
];

export const TEMPLATE_CATEGORIES = Array.from(
  new Set(PROMPT_TEMPLATES.map(template => template.category))
).sort();

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): PromptTemplate[] => {
  return PROMPT_TEMPLATES.filter(template => template.category === category);
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): PromptTemplate | undefined => {
  return PROMPT_TEMPLATES.find(template => template.id === id);
};

/**
 * Replace variables in template with values
 */
export const fillTemplate = (template: string, variables: Record<string, string>): string => {
  let filledTemplate = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    filledTemplate = filledTemplate.replace(regex, value || `{${key}}`);
  });
  
  return filledTemplate;
};