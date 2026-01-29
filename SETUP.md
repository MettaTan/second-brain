# 🚀 Quick Setup Guide

Follow these steps to get your AI Content Coach running in minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create OpenAI Assistant

1. Go to https://platform.openai.com/assistants
2. Click "Create Assistant"
3. Set up your assistant:

**Name**: Content Coach

**Instructions**:
```
You are an expert content creation advisor and coach. Your role is to help content creators:

- Brainstorm creative content ideas
- Develop content strategies
- Overcome creative blocks
- Refine their messaging and positioning
- Grow their audience
- Improve their content quality

Be friendly, encouraging, and practical. Provide actionable advice with specific examples. Keep responses concise but thorough. Ask clarifying questions when needed to give better advice.
```

**Model**: gpt-4-turbo-preview (or gpt-4)

4. Save and copy your Assistant ID (starts with `asst_`)

## Step 3: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Wait for the project to finish setting up
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of `supabase/migrations/001_create_tables.sql`
6. Run the query (it will create the tables and indexes)

## Step 4: Configure Environment Variables

Create a file named `.env.local` in the root directory:

```env
# Get this from https://platform.openai.com/api-keys
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Get this from your OpenAI Assistant page
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx

# Get these from Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE
```

**Important**: Use the `service_role` key, NOT the `anon` key!

## Step 5: Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## ✅ Verification Checklist

- [ ] All dependencies installed (`node_modules` folder exists)
- [ ] `.env.local` file created with all 4 variables
- [ ] Supabase tables created (check in Table Editor)
- [ ] OpenAI Assistant created and ID copied
- [ ] Dev server running without errors
- [ ] Can see the chat interface in browser

## 🐛 Common Issues

### "Missing Supabase environment variables"
- Make sure your `.env.local` file exists in the project root
- Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)
- Restart the dev server after creating `.env.local`

### "Invalid or missing session ID"
- Clear your browser's localStorage
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+F5)

### "Assistant not found"
- Verify your `OPENAI_ASSISTANT_ID` is correct
- Make sure the Assistant exists in your OpenAI account
- Check that your API key has access to the Assistants API

### Blank screen or errors
- Open browser console (F12) to see error messages
- Check the terminal for server-side errors
- Verify all environment variables are set correctly

## 🎨 Customization Tips

### Change the branding
Edit `components/Sidebar.tsx` and `app/layout.tsx` to update the app name and icon.

### Modify colors
Edit `app/globals.css` to customize the theme colors.

### Update Assistant personality
Go to OpenAI Platform and edit your Assistant's instructions anytime!

---

Need help? Check the main README.md for more detailed documentation.




