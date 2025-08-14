# ZChat

A modern AI chat interface with project-based organization, built with React, Vite, and local Supabase. Supports both local LMStudio models and cloud-based OpenRouter providers.

## Features

### Core Features
- 🔐 **Authentication** - Secure email/password authentication with Supabase Auth
- 📁 **Project Organization** - Organize conversations into projects
- 💬 **Chat Interface** - Clean, responsive ChatGPT-like interface
- 🤖 **Multiple AI Providers** - Support for both LMStudio (local) and OpenRouter (cloud)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🌙 **Dark/Light Theme** - Toggle between themes with persistent settings

### Advanced Features
- 🎨 **Syntax Highlighting** - Code blocks with proper syntax highlighting
- 📝 **Markdown Support** - Rich text rendering for AI responses
- 📄 **Chat Export** - Export conversations in JSON, Markdown, or Text formats
- ⚡ **Real-time Updates** - Live synchronization using Supabase subscriptions
- 🔍 **Model Selection** - Dynamic model detection and selection interface
- 🎯 **Local-First** - Complete local development environment

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Database**: Supabase (local development)
- **Routing**: React Router v6
- **AI Providers**: LMStudio (local), OpenRouter (cloud)
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for local Supabase)
- LMStudio (optional, for local AI models)
- OpenRouter API key (optional, for cloud AI models)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/WorkshopKI/zchat-react-supabase.git
cd zchat-react-supabase
npm install
```

### 2. Set up Local Supabase

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Start local Supabase (requires Docker)
supabase start
```

This will start local services:
- Supabase Studio: http://localhost:54323
- PostgreSQL: localhost:54322
- Auth: localhost:54321/auth/v1

### 3. Configure Environment

Create a `.env.local` file:

```env
# Supabase (local development)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key

# LMStudio (optional)
VITE_LMSTUDIO_URL=http://localhost:1234

# OpenRouter (optional)
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_OPENROUTER_URL=https://openrouter.ai/api/v1
```

### 4. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 to start using the application.

## AI Provider Setup

### LMStudio (Local)

1. Download and install [LMStudio](https://lmstudio.ai/)
2. Load a model in LMStudio
3. Start the local server (usually runs on http://localhost:1234)
4. The application will automatically detect available models

### OpenRouter (Cloud)

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add the API key to your `.env.local` file
4. The application will fetch available models automatically

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatExport.tsx  # Chat export functionality
│   ├── ModelSelector.tsx # AI model selection interface
│   ├── ProtectedRoute.tsx # Route protection
│   └── ThemeToggle.tsx # Dark/light theme switcher
├── contexts/            # React contexts
│   ├── AuthContext.tsx # Authentication state management
│   └── ProjectContext.tsx # Project and chat state management
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.ts # Local storage hook
│   ├── useRealtime.ts   # Real-time subscriptions
│   └── useTheme.ts      # Theme management
├── lib/                 # Utilities and configurations
│   ├── lmstudio.ts     # LMStudio API client
│   ├── openrouter.ts   # OpenRouter API client
│   └── supabase.ts     # Supabase client configuration
├── pages/               # Main page components
│   ├── AuthPage.tsx    # Login/register page
│   ├── ChatPage.tsx    # Chat interface
│   └── Dashboard.tsx   # Project management dashboard
├── types/               # TypeScript type definitions
└── styles/              # Global styles and Tailwind config
```

## Database Schema

The application uses three main tables:

- **projects** - User projects for organizing chats
- **chats** - Individual chat conversations
- **messages** - Chat messages with role-based content

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Database Migrations

Supabase migrations are located in `supabase/migrations/`. To apply migrations:

```bash
supabase db reset  # Reset and apply all migrations
```

## Deployment

### Frontend Deployment

Build the application:

```bash
npm run build
```

Deploy the `dist` folder to your preferred hosting service (Vercel, Netlify, etc.).

### Supabase Deployment

For production, you can:

1. Use Supabase Cloud (recommended)
2. Self-host Supabase using Docker

Update your environment variables to point to your production Supabase instance.

## Features Roadmap

- [ ] File upload support
- [ ] Voice messages
- [ ] Chat search and filtering
- [ ] Conversation templates
- [ ] API usage tracking
- [ ] Multi-user collaboration
- [ ] Plugin system
- [ ] Custom model fine-tuning interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include environment details and error messages

## Acknowledgments

- OpenAI for the ChatGPT interface inspiration
- Supabase team for the excellent backend-as-a-service platform
- LMStudio for making local AI models accessible
- OpenRouter for providing access to multiple AI providers
