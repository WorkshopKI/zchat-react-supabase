# ZChat Database Schema

## Overview

The ZChat application uses a PostgreSQL database with Supabase for authentication and real-time features. The database is designed with security, simplicity, and performance in mind.

## Core Tables

### `user_profiles`
Stores user profile information and roles.

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role DEFAULT 'user' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Key Features:**
- First user automatically becomes admin
- Automatic creation via trigger on user signup
- Role-based access control

### `user_settings`
Stores user-specific application settings including encrypted API keys.

```sql
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_provider text DEFAULT 'lmstudio' NOT NULL,
  default_model text DEFAULT '' NOT NULL,
  lmstudio_url text DEFAULT 'http://localhost:1234' NOT NULL,
  openrouter_api_key text DEFAULT '' NOT NULL, -- Base64 encoded
  openrouter_url text DEFAULT 'https://openrouter.ai/api/v1' NOT NULL,
  max_context_length integer DEFAULT 30000 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Key Features:**
- API keys are base64 encoded for obfuscation
- Automatic creation with defaults via trigger
- Managed via RPC functions for security

### `projects`
Stores user projects with system prompts and descriptions.

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '' NOT NULL,
  system_prompt text DEFAULT '' NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### `chats`
Stores chat conversations within projects.

```sql
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  model_provider text NOT NULL CHECK (model_provider IN ('lmstudio', 'openrouter')),
  model_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### `messages`
Stores individual messages within chats.

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

### `knowledge_base`
Stores project-specific knowledge base documents.

```sql
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  file_type text DEFAULT 'text' NOT NULL,
  file_size integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

## Security

### Row Level Security (RLS)
All tables have RLS enabled with simple, secure policies:

```sql
-- Users can only access their own data
CREATE POLICY "user_profiles_own_data" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_settings_own_data" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "projects_own_data" ON projects FOR ALL USING (auth.uid() = user_id);

-- Hierarchical access through project ownership
CREATE POLICY "chats_own_data" ON chats FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = chats.project_id AND projects.user_id = auth.uid())
);
```

### API Key Security
- API keys are base64 encoded before storage
- Managed through secure RPC functions
- Never exposed in client-side code

## Database Functions

### `get_user_settings(user_uuid)`
Retrieves user settings with fallback to defaults.

### `upsert_user_settings(...)`
Safely updates user settings with null-aware updates.

### `is_user_admin(user_uuid)`
Checks if a user has admin role.

## Triggers

### User Creation Trigger
Automatically creates user profile and settings when a new user signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Updated At Triggers
Automatically update `updated_at` timestamps on record changes.

## Performance

### Indexes
Strategic indexes on foreign keys and frequently queried columns:

- `idx_user_profiles_user_id`
- `idx_user_settings_user_id`
- `idx_projects_user_id`
- `idx_chats_project_id`
- `idx_messages_chat_id`
- `idx_messages_created_at`
- `idx_knowledge_base_project_id`

## Data Hierarchy

```
User (auth.users)
├── UserProfile (role, preferences)
├── UserSettings (API keys, defaults)
└── Projects
    ├── Chats
    │   └── Messages
    └── KnowledgeBase
```

## Migration Strategy

The database uses a single consolidated migration file (`20250803100000_consolidated_schema.sql`) that:
- Creates all tables with proper constraints
- Sets up all RLS policies
- Creates utility functions
- Establishes triggers for automation

This approach ensures consistency and eliminates migration conflicts.