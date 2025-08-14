# ZChat - AI Assistant Development Guide

## Project Overview

**ZChat** is a modern chat application that allows users to interact with various AI models (local LMStudio and cloud OpenRouter) through an organized project-based structure. The application is built with React, TypeScript, Vite, and Supabase, featuring a clean German user interface.

## Core Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Authentication + Real-time)
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Lucide React
- **AI Providers**: LMStudio (local) + OpenRouter (cloud)

### Key Design Principles
- **Project-First Workflow**: Users must create/select projects before creating chats
- **German UI**: All user-facing text is in German for better UX
- **Modal-Based Settings**: Settings accessed via modal instead of separate page
- **Resizable Sidebar**: Persistent width with drag-to-resize functionality
- **Real-time Updates**: Supabase subscriptions for live data

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── modals/         # Modal dialogs (Settings, CreateProject, CreateChat)
│   ├── ResizableSidebar.tsx
│   ├── ProjectTreeView.tsx
│   ├── MainContent.tsx
│   └── ...
├── contexts/           # React contexts for state management
│   ├── AuthContext.tsx     # Authentication & user profiles
│   ├── ProjectContext.tsx  # Projects, chats, messages
│   └── SettingsContext.tsx # User settings & preferences
├── hooks/              # Custom React hooks
├── lib/                # External API integrations
│   ├── supabase.ts     # Supabase client
│   ├── lmstudio.ts     # LMStudio API
│   ├── openrouter.ts   # OpenRouter API
│   └── settings.ts     # Settings management
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Database Schema

### Core Tables
- **user_profiles**: User information and roles (admin/user)
- **user_settings**: Encrypted API keys and preferences
- **projects**: User projects with system prompts
- **chats**: Conversations within projects
- **messages**: Individual chat messages
- **knowledge_base**: Project-specific knowledge documents

### Key Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic user setup**: Triggers create profiles and settings on signup
- **Encrypted API keys**: Base64 encoded storage with server-side functions
- **First user = admin**: Automatic admin role assignment

## User Flow & UX

### Authentication Flow
1. User signs up/in via Supabase Auth
2. Automatic user profile and settings creation
3. First user gets admin role, subsequent users get user role

### Project-First Workflow (German UI)
1. **No Projects**: "Willkommen bei ZChat" - Must create first project
2. **Projects Exist, None Selected**: "Projekt auswählen" - Must select project from sidebar
3. **Project Selected**: "Neuen Chat erstellen" - Can now create chats

### Sidebar Organization
- **Projekte**: Alphabetical sorting by default (toggleable to creation date)
- **Project Expansion**: Shows chats with context usage indicators
- **Action Buttons**: Create project, sort toggle, settings modal

## AI Integration

### Supported Providers
- **LMStudio**: Local AI server (http://localhost:1234)
- **OpenRouter**: Cloud AI service with 300+ models

### Settings Management
- **Modal Interface**: Organized tabs (General, AI Providers, Admin, Advanced)
- **Server-side Storage**: API keys stored encrypted in database
- **Model Selection**: Auto-switching providers when selecting models
- **Connection Testing**: Real-time provider connectivity checks

## Development Guidelines

### Component Patterns
- **Separation of Concerns**: Logic in custom hooks, UI in components
- **TypeScript First**: Strict typing for all props and state
- **Modal Dialogs**: Use existing modal patterns for new features
- **German Text**: All user-facing strings must be in German

### State Management
- **Context + Hooks**: React Context for global state, custom hooks for logic
- **Real-time Sync**: Supabase subscriptions for live updates
- **Optimistic Updates**: UI updates immediately, sync with backend

### Database Operations
- **RPC Functions**: Use Supabase functions for complex operations
- **Security First**: All operations through RLS policies
- **Migration Strategy**: Single consolidated migration approach

## Key Features Implemented

### ✅ Recently Completed
- **Settings Modal**: Replaced page with organized modal dialog
- **Project Sorting**: Alphabetical (default) + creation date sorting
- **German UI**: Complete translation of user-facing text
- **Project-First Flow**: Guided onboarding requiring project creation
- **Consolidated Database**: Clean, optimized schema with simplified policies
- **Compact Connection Tests**: Streamlined provider testing feedback

### 🔧 Current Architecture Strengths
- **Modular Design**: Easy to extend with new features
- **Type Safety**: Comprehensive TypeScript coverage
- **Performance**: Optimized queries and efficient re-rendering
- **Security**: Encrypted storage and proper access controls
- **UX**: Intuitive German interface with clear user guidance

## Development Commands

```bash
# Development
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npx supabase start   # Start local Supabase
npx supabase db reset # Reset database with migrations
npx supabase stop    # Stop local services
```

## Environment Setup

### Required Files
- `.env.local`: Local Supabase configuration
- `supabase/config.toml`: Supabase project configuration

### Database Migration
- Single consolidated migration: `20250803100000_consolidated_schema.sql`
- Includes all tables, policies, functions, and triggers
- Clean slate approach for production deployment

## Future Development Areas

### Potential Enhancements
- **User Management**: Admin panel for user role management
- **Prompt Templates**: Global template system for common prompts
- **Analytics**: Usage tracking and performance metrics
- **Collaboration**: Shared projects and team features
- **Mobile App**: React Native version using same backend

### Technical Debt
- **Bundle Size**: Consider code splitting for better loading
- **Error Handling**: More comprehensive error boundary implementation
- **Testing**: Add unit and integration tests
- **Internationalization**: Proper i18n framework for multi-language support

## Debugging & Troubleshooting

### Common Issues
- **Authentication Loops**: Check RLS policies and user profile creation
- **API Key Issues**: Verify encryption/decryption in settings functions
- **Modal State**: Ensure proper cleanup on modal close
- **Database Errors**: Check migration status and policy conflicts

### Development Tips
- **Use browser DevTools**: React DevTools for component debugging
- **Supabase Dashboard**: Monitor real-time database operations
- **Network Tab**: Debug API calls and response times
- **Console Logs**: Strategic logging for state changes

## Security Considerations

### Data Protection
- **API Keys**: Never store plain-text, always encrypt before database storage
- **User Data**: Strict RLS policies prevent cross-user data access
- **Authentication**: Supabase handles secure token management
- **HTTPS**: Ensure all production traffic uses HTTPS

### Best Practices
- **Input Validation**: Client and server-side validation
- **Error Messages**: Avoid exposing sensitive system information
- **Access Controls**: Regular review of user permissions and roles
- **Audit Logging**: Track important user actions and system changes

This documentation provides a comprehensive foundation for future AI-assisted development of the ZChat project, covering architecture, patterns, and implementation details essential for maintaining and extending the application.