-- ==============================================
-- ZChat Database Schema - Consolidated Migration
-- ==============================================
-- This migration consolidates all previous migrations into a clean, optimized schema

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS knowledge_base CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;

-- ==============================================
-- TYPES
-- ==============================================

CREATE TYPE user_role AS ENUM ('user', 'admin');

-- ==============================================
-- CORE TABLES
-- ==============================================

-- User Profiles Table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role DEFAULT 'user' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- User Settings Table
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_provider text DEFAULT 'lmstudio' NOT NULL CHECK (default_provider IN ('lmstudio', 'openrouter')),
  default_model text DEFAULT '' NOT NULL,
  lmstudio_url text DEFAULT 'http://localhost:1234' NOT NULL,
  openrouter_api_key text DEFAULT '' NOT NULL,
  openrouter_url text DEFAULT 'https://openrouter.ai/api/v1' NOT NULL,
  max_context_length integer DEFAULT 30000 NOT NULL CHECK (max_context_length >= 1000 AND max_context_length <= 500000),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Projects Table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '' NOT NULL,
  system_prompt text DEFAULT '' NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Chats Table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  model_provider text NOT NULL CHECK (model_provider IN ('lmstudio', 'openrouter')),
  model_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Messages Table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Knowledge Base Table
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

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- User tables
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Core app tables
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_knowledge_base_project_id ON knowledge_base(project_id);

-- ==============================================
-- ROW LEVEL SECURITY SETUP
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- SIMPLE, SECURE RLS POLICIES
-- ==============================================

-- User Profiles: Users can only access their own profile
CREATE POLICY "user_profiles_own_data" ON user_profiles FOR ALL USING (auth.uid() = user_id);

-- User Settings: Users can only access their own settings
CREATE POLICY "user_settings_own_data" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Projects: Users can only access their own projects
CREATE POLICY "projects_own_data" ON projects FOR ALL USING (auth.uid() = user_id);

-- Chats: Users can only access chats in their own projects
CREATE POLICY "chats_own_data" ON chats FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = chats.project_id AND projects.user_id = auth.uid())
);

-- Messages: Users can only access messages in their own chats
CREATE POLICY "messages_own_data" ON messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chats 
    JOIN projects ON projects.id = chats.project_id
    WHERE chats.id = messages.chat_id AND projects.user_id = auth.uid()
  )
);

-- Knowledge Base: Users can only access knowledge base in their own projects
CREATE POLICY "knowledge_base_own_data" ON knowledge_base FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = knowledge_base.project_id AND projects.user_id = auth.uid())
);

-- ==============================================
-- UTILITY FUNCTIONS
-- ==============================================

-- Function to get user settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
  default_provider text,
  default_model text,
  lmstudio_url text,
  openrouter_api_key text,
  openrouter_url text,
  max_context_length integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.default_provider, 'lmstudio'::text),
    COALESCE(us.default_model, ''::text),
    COALESCE(us.lmstudio_url, 'http://localhost:1234'::text),
    COALESCE(us.openrouter_api_key, ''::text),
    COALESCE(us.openrouter_url, 'https://openrouter.ai/api/v1'::text),
    COALESCE(us.max_context_length, 30000)
  FROM user_settings us
  WHERE us.user_id = user_uuid;
  
  -- If no settings exist, return defaults
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'lmstudio'::text,
      ''::text,
      'http://localhost:1234'::text,
      ''::text,
      'https://openrouter.ai/api/v1'::text,
      30000;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to upsert user settings
CREATE OR REPLACE FUNCTION upsert_user_settings(
  user_uuid uuid,
  p_default_provider text DEFAULT NULL,
  p_default_model text DEFAULT NULL,
  p_lmstudio_url text DEFAULT NULL,
  p_openrouter_api_key text DEFAULT NULL,
  p_openrouter_url text DEFAULT NULL,
  p_max_context_length integer DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_settings (
    user_id,
    default_provider,
    default_model,
    lmstudio_url,
    openrouter_api_key,
    openrouter_url,
    max_context_length
  ) VALUES (
    user_uuid,
    COALESCE(p_default_provider, 'lmstudio'),
    COALESCE(p_default_model, ''),
    COALESCE(p_lmstudio_url, 'http://localhost:1234'),
    COALESCE(p_openrouter_api_key, ''),
    COALESCE(p_openrouter_url, 'https://openrouter.ai/api/v1'),
    COALESCE(p_max_context_length, 30000)
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    default_provider = COALESCE(p_default_provider, user_settings.default_provider),
    default_model = COALESCE(p_default_model, user_settings.default_model),
    lmstudio_url = COALESCE(p_lmstudio_url, user_settings.lmstudio_url),
    openrouter_api_key = COALESCE(p_openrouter_api_key, user_settings.openrouter_api_key),
    openrouter_url = COALESCE(p_openrouter_url, user_settings.openrouter_url),
    max_context_length = COALESCE(p_max_context_length, user_settings.max_context_length),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM user_profiles
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(user_role_result = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================
-- USER CREATION TRIGGER
-- ==============================================

-- Function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
BEGIN
  -- Get current user count
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- Create user profile (first user is admin, rest are users)
  INSERT INTO user_profiles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN user_count = 0 THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );

  -- Create default user settings
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile/settings: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user setup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- UPDATED_AT TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that need them
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();