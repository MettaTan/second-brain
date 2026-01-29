# 🚀 Deployment Guide

This guide will walk you through deploying your AI Content Coach to production using Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works great)
- OpenAI API key with Assistants API access
- Supabase project with tables created

## Step 1: Prepare Your Repository

### Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Content Coach MVP"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/second-brain.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variables (click "Environment Variables"):

```
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE
```

6. Click "Deploy"
7. Wait 2-3 minutes for the build to complete
8. Visit your live site! 🎉

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts, then add environment variables:
vercel env add OPENAI_API_KEY
vercel env add OPENAI_ASSISTANT_ID
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy to production
vercel --prod
```

## Step 3: Post-Deployment Checks

### Verify Your Deployment

1. **Test the chat interface**:
   - Open your deployed URL
   - Send a test message
   - Verify the AI responds correctly

2. **Check the database**:
   - Go to Supabase Dashboard > Table Editor
   - Verify `threads` and `messages` tables are being populated

3. **Test session persistence**:
   - Send a message
   - Refresh the page
   - Verify your conversation history loads

4. **Test on mobile**:
   - Open on your phone
   - Verify sidebar works correctly
   - Test the responsive design

## Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to update your DNS records
5. Wait for DNS propagation (can take up to 48 hours)

## Step 5: Set Up Monitoring

### Vercel Analytics (Built-in)

Vercel automatically tracks:
- Page views
- Performance metrics
- Error rates

View in: Dashboard > Your Project > Analytics

### OpenAI Usage Monitoring

1. Go to [OpenAI Platform](https://platform.openai.com/usage)
2. Monitor your API usage
3. Set up usage alerts if needed

### Supabase Monitoring

1. Go to Supabase Dashboard > Database
2. Monitor:
   - Database size
   - Number of rows
   - Query performance

## Security Best Practices

### 1. Protect Your API Keys

✅ **DO**:
- Store keys in Vercel environment variables
- Use different keys for development and production
- Rotate keys periodically

❌ **DON'T**:
- Commit `.env.local` to git
- Share keys in public channels
- Use the same key across multiple projects

### 2. Rate Limiting (Recommended for Production)

Add rate limiting to prevent abuse:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});
```

Install dependencies:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 3. Content Moderation

Add OpenAI's moderation API to filter inappropriate content:

```typescript
// Before sending to assistant
const moderation = await openai.moderations.create({
  input: message,
});

if (moderation.results[0].flagged) {
  return new Response(
    JSON.stringify({ error: 'Content violates usage policies' }),
    { status: 400 }
  );
}
```

### 4. Database Security

In Supabase:
1. Enable Row Level Security (RLS)
2. Set up backup policies
3. Monitor for unusual activity

## Performance Optimization

### 1. Enable Edge Functions (Optional)

For faster global response times, deploy API routes to Vercel Edge:

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'; // Add this line
```

**Note**: OpenAI SDK works with Edge Runtime!

### 2. Add Caching Headers

For static assets, add caching:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
};
```

### 3. Optimize Images

If you add images later, use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={200}
  priority
/>
```

## Scaling Considerations

### When to Scale

Consider scaling when you have:
- 1,000+ daily active users
- Slow response times
- High OpenAI costs
- Database performance issues

### Scaling Options

1. **Upgrade Supabase Plan**:
   - More database connections
   - Better performance
   - Increased storage

2. **Optimize OpenAI Usage**:
   - Use GPT-3.5-turbo for simple queries
   - Implement caching for common questions
   - Add conversation length limits

3. **Add CDN**:
   - Vercel includes CDN by default
   - Consider Cloudflare for additional protection

4. **Database Optimization**:
   - Add indexes on frequently queried columns
   - Archive old conversations
   - Implement pagination for history

## Troubleshooting Production Issues

### Issue: "Failed to send message"

**Check**:
1. Vercel logs: Dashboard > Your Project > Logs
2. OpenAI API status: status.openai.com
3. Environment variables are set correctly

### Issue: "Database error"

**Check**:
1. Supabase project is not paused
2. Service role key is correct
3. Tables exist and have correct schema
4. Check Supabase logs

### Issue: Slow response times

**Solutions**:
1. Check OpenAI API latency
2. Optimize database queries
3. Consider edge deployment
4. Add caching layer

### Issue: High costs

**Solutions**:
1. Monitor OpenAI usage dashboard
2. Set spending limits
3. Implement rate limiting
4. Use GPT-3.5-turbo instead of GPT-4

## Maintenance

### Weekly Tasks

- [ ] Check error logs in Vercel
- [ ] Monitor OpenAI usage and costs
- [ ] Review Supabase database size

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Review and optimize database
- [ ] Analyze user feedback
- [ ] Check for security updates

### Quarterly Tasks

- [ ] Rotate API keys
- [ ] Review and update Assistant instructions
- [ ] Analyze usage patterns
- [ ] Consider new features

## Backup Strategy

### Database Backups

Supabase Pro includes automatic daily backups. For free tier:

```sql
-- Export data periodically
COPY threads TO '/path/to/backup/threads.csv' CSV HEADER;
COPY messages TO '/path/to/backup/messages.csv' CSV HEADER;
```

### Code Backups

- Git repository serves as code backup
- Tag releases: `git tag -a v1.0.0 -m "Initial release"`
- Keep production branch protected

## Rollback Procedure

If something goes wrong:

1. **Instant Rollback** (Vercel):
   - Go to Deployments
   - Find previous working deployment
   - Click "..." > "Promote to Production"

2. **Code Rollback** (Git):
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database Rollback** (Supabase):
   - Use Point-in-Time Recovery (Pro plan)
   - Or restore from backup

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Support**: https://vercel.com/support
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Quick Reference: Environment Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com/api-keys |
| `OPENAI_ASSISTANT_ID` | Assistant ID | platform.openai.com/assistants |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase Dashboard > Settings > API |

---

**Congratulations!** 🎉 Your AI Content Coach is now live and ready to help content creators worldwide!




