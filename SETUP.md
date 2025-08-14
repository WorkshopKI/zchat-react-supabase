# Quick Setup Guide

Since Docker setup can be complex, here are two options to get ZChat running:

## Option 1: Cloud Supabase (Recommended - Easiest)

1. **Create a Supabase account** at https://supabase.com
2. **Create a new project**
3. **Get your project credentials** from Settings > API
4. **Update your `.env.local` file:**

```env
# Supabase (cloud)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# LMStudio (optional)
VITE_LMSTUDIO_URL=http://localhost:1234

# OpenRouter (optional)
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_OPENROUTER_URL=https://openrouter.ai/api/v1
```

5. **Run the database migration:**
```bash
# Copy the migration content from supabase/migrations/20250802183758_create_tables.sql
# and run it in your Supabase SQL editor
```

6. **Start the app:**
```bash
npm run dev
```

## Option 2: Local Docker Setup

If you want to use local Supabase:

1. **Install Docker Desktop** from https://docker.com/products/docker-desktop
2. **Start Docker Desktop** and wait for it to be ready
3. **Start Supabase:**
```bash
supabase start
```
4. **The app will automatically connect** to local Supabase

## Current Status

The app is running at http://localhost:3000 but needs database connection.

Choose Option 1 (Cloud Supabase) for the quickest setup!