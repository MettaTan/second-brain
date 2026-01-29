# ⚡ Quick Start Guide

Get your AI Content Coach running in 5 minutes!

## 🚀 Super Fast Setup

### 1️⃣ Install (30 seconds)

```bash
npm install
```

### 2️⃣ Configure (2 minutes)

Create `.env.local`:

```bash
# Copy the example file
cp .env.example .env.local

# Then edit .env.local with your actual keys
```

You need:
- **OpenAI API Key**: https://platform.openai.com/api-keys
- **OpenAI Assistant ID**: https://platform.openai.com/assistants (create one)
- **Supabase URL**: Your Supabase project URL
- **Supabase Service Key**: From Supabase Dashboard > Settings > API

### 3️⃣ Setup Database (1 minute)

1. Go to Supabase SQL Editor
2. Copy/paste contents of `supabase/migrations/001_create_tables.sql`
3. Run it

### 4️⃣ Run (10 seconds)

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 📝 Detailed Steps

### Create OpenAI Assistant

1. Go to https://platform.openai.com/assistants
2. Click "Create"
3. Add these instructions:

```
You are an expert content creation advisor. Help users with:
- Content ideas and brainstorming
- Content strategy
- Overcoming creative blocks
- Growing their audience

Be friendly, practical, and provide actionable advice.
```

4. Choose model: `gpt-4-turbo-preview`
5. Copy the Assistant ID (starts with `asst_`)

### Get Supabase Credentials

1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Go to Settings > API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Use the `service_role` key, NOT the `anon` key!

---

## 🧪 Test It

### Send Your First Message

1. Open http://localhost:3000
2. Type: "Give me 5 content ideas for a tech blog"
3. Press Enter
4. Watch the AI respond in real-time! ✨

### Verify Database

1. Go to Supabase > Table Editor
2. Check `threads` table → Should have 1 row
3. Check `messages` table → Should have 2 rows (your question + AI answer)

---

## 🚀 Deploy to Production

### Option 1: Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables when prompted
# Then deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your repo
5. Add environment variables
6. Click "Deploy"

Done in 3 minutes! 🎉

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
→ Check that `.env.local` exists and has all 4 variables

### "Assistant not found"
→ Verify your `OPENAI_ASSISTANT_ID` is correct

### "Failed to send message"
→ Check your OpenAI API key is valid and has credits

### Build fails
→ Make sure all dependencies are installed: `npm install`

### Nothing happens when I send a message
→ Open browser console (F12) to see error messages

---

## 📚 Next Steps

Once it's working:

1. ✅ Read `README.md` for full documentation
2. ✅ Check `DEPLOYMENT.md` for production deployment
3. ✅ Review `ARCHITECTURE.md` to understand the system
4. ✅ Use `CHECKLIST.md` before launching

---

## 🆘 Need Help?

1. Check the error message in:
   - Browser console (F12)
   - Terminal where `npm run dev` is running
   
2. Verify environment variables:
   ```bash
   cat .env.local
   ```

3. Check Vercel logs (if deployed):
   - Dashboard > Your Project > Logs

4. Common issues are documented in `DEPLOYMENT.md`

---

## 💡 Pro Tips

### Faster Development
```bash
# Auto-restart on changes (already enabled)
npm run dev
```

### Check for Errors
```bash
# TypeScript check
npm run build

# Linting
npm run lint
```

### View Database
- Supabase Dashboard > Table Editor
- See all threads and messages

### Monitor Costs
- OpenAI: https://platform.openai.com/usage
- Supabase: Dashboard > Database
- Vercel: Dashboard > Usage

---

## ⚡ Command Reference

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter

# Deployment
vercel               # Deploy to preview
vercel --prod        # Deploy to production
```

---

## 🎯 Success Checklist

- [ ] `npm install` completed
- [ ] `.env.local` created with all 4 variables
- [ ] OpenAI Assistant created
- [ ] Supabase tables created
- [ ] `npm run dev` running
- [ ] Can send messages and get responses
- [ ] Messages saved to Supabase

**All checked?** You're ready to go! 🚀

---

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Prerequisites**: Node.js 18+, OpenAI account, Supabase account

**Let's build something amazing!** 💪




