# 🚀 Quick Start - Get ZChat Running in 5 Minutes

Your ZChat application is built and ready! Here's the fastest way to get it running with a database:

## ⚡ Super Quick Setup (Cloud Supabase)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email

### Step 2: Create New Project
1. Click "New Project"
2. Choose a name like "chatgpt-clone"
3. Create a strong password
4. Select a region close to you
5. Click "Create new project" (takes ~2 minutes)

### Step 3: Get Your Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**

### Step 4: Configure Your App
Update your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase

# Optional: Add AI providers
VITE_LMSTUDIO_URL=http://localhost:1234
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_OPENROUTER_URL=https://openrouter.ai/api/v1
```

### Step 5: Set Up Database
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste this SQL code:

```sql
-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create chats table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  model_provider text NOT NULL CHECK (model_provider IN ('lmstudio', 'openrouter')),
  model_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Projects: Users can only see their own projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Chats: Users can only see chats in their projects
CREATE POLICY "Users can view chats in their projects" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chats.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chats in their projects" ON chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chats.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chats in their projects" ON chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chats.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chats in their projects" ON chats
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chats.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Messages: Users can only see messages in chats they own
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats 
      JOIN projects ON projects.id = chats.project_id
      WHERE chats.id = messages.chat_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      JOIN projects ON projects.id = chats.project_id
      WHERE chats.id = messages.chat_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their chats" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chats 
      JOIN projects ON projects.id = chats.project_id
      WHERE chats.id = messages.chat_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their chats" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chats 
      JOIN projects ON projects.id = chats.project_id
      WHERE chats.id = messages.chat_id 
      AND projects.user_id = auth.uid()
    )
  );
```

3. Click **RUN** to execute the SQL

### Step 6: Start Your App
```bash
npm run dev
```

## 🎉 You're Ready!

Visit http://localhost:3000 and:

1. **Sign up** for a new account
2. **Create a project** to organize your chats
3. **Start a new chat** and select a model
4. **Begin chatting** with your AI assistant!

## 🤖 Add AI Providers (Optional)

### For LMStudio (Local AI):
1. Download LMStudio from https://lmstudio.ai/
2. Load a model and start the server
3. The app will automatically detect it

### For OpenRouter (Cloud AI):
1. Sign up at https://openrouter.ai/
2. Get your API key
3. Add it to your `.env.local` file

---

**That's it!** Your ZChat application is now fully functional with cloud database, authentication, and real-time features! 🚀