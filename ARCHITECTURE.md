# 🏗️ Architecture Documentation

## System Overview

The AI Content Coach is a full-stack Next.js application that provides an anonymous chat interface powered by OpenAI's Assistants API with persistent storage in Supabase.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Sidebar    │    │ ChatInterface│    │   Session    │  │
│  │  Component   │◄───┤  Component   │◄───┤  Management  │  │
│  │              │    │              │    │ (localStorage)│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                              │                               │
│                              │ HTTP Requests                 │
│                              │ (x-session-id header)         │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                         SERVER SIDE                           │
├──────────────────────────────┼───────────────────────────────┤
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes                      │   │
│  │                                                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │ /api/chat  │  │/api/history│  │/api/messages│   │   │
│  │  │  (POST)    │  │   (GET)    │  │   (GET)    │    │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘    │   │
│  │        │               │               │            │   │
│  └────────┼───────────────┼───────────────┼────────────┘   │
│           │               │               │                │
│           │               │               │                │
│     ┌─────▼───────┐ ┌─────▼───────┐ ┌────▼────┐          │
│     │   OpenAI    │ │  Supabase   │ │Supabase │          │
│     │ Assistants  │ │   Admin     │ │ Admin   │          │
│     │     API     │ │   Client    │ │ Client  │          │
│     └─────────────┘ └─────────────┘ └─────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                      EXTERNAL SERVICES                        │
├──────────────────────────────┼───────────────────────────────┤
│                              │                               │
│  ┌──────────────────┐   ┌───▼──────────────┐               │
│  │  OpenAI Platform │   │    Supabase      │               │
│  │                  │   │   PostgreSQL     │               │
│  │  - Assistants    │   │                  │               │
│  │  - Threads       │   │  ┌────────────┐  │               │
│  │  - Messages      │   │  │  threads   │  │               │
│  │  - Streaming     │   │  └────────────┘  │               │
│  │                  │   │  ┌────────────┐  │               │
│  └──────────────────┘   │  │  messages  │  │               │
│                         │  └────────────┘  │               │
│                         └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Sends Message

```
User Input → ChatInterface → POST /api/chat
                                    ↓
                            Validate Session ID
                                    ↓
                            Get/Create Thread
                                    ↓
                            Save User Message (Supabase)
                                    ↓
                            Send to OpenAI Assistant
                                    ↓
                            Stream Response (SSE)
                                    ↓
                            Save AI Response (Supabase)
                                    ↓
                            Display in UI
```

### 2. Load Conversation History

```
Page Load → useEffect → GET /api/history
                              ↓
                      Validate Session ID
                              ↓
                      Query Supabase (threads)
                              ↓
                      Return Thread List
                              ↓
                      Display in Sidebar
```

### 3. Load Thread Messages

```
Thread Click → GET /api/messages?threadId=xxx
                        ↓
                Validate Session ID & Thread Ownership
                        ↓
                Query Supabase (messages)
                        ↓
                Return Messages
                        ↓
                Display in ChatInterface
```

## Technology Stack

### Frontend

| Technology | Purpose | Why? |
|------------|---------|------|
| **Next.js 14** | Framework | App Router, SSR, API routes |
| **React 18** | UI Library | Component-based architecture |
| **TypeScript** | Language | Type safety, better DX |
| **Tailwind CSS** | Styling | Utility-first, fast development |
| **Lucide React** | Icons | Modern, tree-shakeable icons |
| **react-markdown** | Markdown | Render AI responses with formatting |

### Backend

| Technology | Purpose | Why? |
|------------|---------|------|
| **Next.js API Routes** | Backend | Serverless, easy deployment |
| **OpenAI SDK** | AI Integration | Official SDK, streaming support |
| **Supabase Client** | Database | PostgreSQL, real-time, easy setup |

### Infrastructure

| Service | Purpose | Why? |
|---------|---------|------|
| **Vercel** | Hosting | Optimized for Next.js, edge network |
| **OpenAI Platform** | AI Model | GPT-4, Assistants API |
| **Supabase** | Database | PostgreSQL, free tier, easy setup |

## Database Schema

### Tables

#### `threads`

Stores conversation threads associated with anonymous sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | OpenAI Thread ID (thread_xxx) |
| `session_id` | TEXT | NOT NULL | Anonymous user UUID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thread creation time |
| `title` | TEXT | NULLABLE | First message preview |

**Indexes:**
- `idx_threads_session_id` on `session_id`
- `idx_threads_created_at` on `created_at DESC`

#### `messages`

Stores individual chat messages (user and assistant).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `thread_id` | TEXT | NOT NULL, FK → threads(id) | Parent thread |
| `role` | TEXT | NOT NULL, CHECK (user/assistant) | Message sender |
| `content` | TEXT | NOT NULL | Message content |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Message timestamp |

**Indexes:**
- `idx_messages_thread_id` on `thread_id`
- `idx_messages_created_at` on `created_at`

**Relationships:**
- `messages.thread_id` → `threads.id` (ON DELETE CASCADE)

## API Endpoints

### POST `/api/chat`

**Purpose**: Send a message and get AI response (streaming)

**Headers:**
- `x-session-id`: UUID (required)
- `Content-Type`: application/json

**Request Body:**
```typescript
{
  message: string;      // User's message
  threadId?: string;    // Optional: existing thread ID
}
```

**Response:**
- Content-Type: `text/event-stream`
- Streaming format (Server-Sent Events)

**Events:**
```
event: thread
data: {"threadId": "thread_xxx"}

event: text
data: {"text": "Hello"}

event: text
data: {"text": " world"}

event: done
data: {}
```

**Error Responses:**
- `401`: Invalid/missing session ID
- `400`: Invalid message
- `500`: Server error

### GET `/api/history`

**Purpose**: Fetch user's conversation threads

**Headers:**
- `x-session-id`: UUID (required)

**Response:**
```typescript
{
  threads: Array<{
    id: string;
    session_id: string;
    created_at: string;
    title?: string;
  }>
}
```

### GET `/api/messages?threadId=xxx`

**Purpose**: Fetch messages for a specific thread

**Headers:**
- `x-session-id`: UUID (required)

**Query Parameters:**
- `threadId`: Thread ID (required)

**Response:**
```typescript
{
  messages: Array<{
    id: number;
    thread_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>
}
```

## Security Model

### Anonymous Authentication

**How it works:**
1. Client generates UUID v4 on first visit
2. UUID stored in `localStorage` as `content_coach_session_id`
3. UUID sent with every API request in `x-session-id` header
4. Server validates UUID format and uses it to filter data

**Limitations:**
- No password protection
- Clearing browser data = losing access
- Anyone with the UUID can access the data

**Production Recommendations:**
- Add rate limiting per session ID
- Implement session expiry
- Add IP-based rate limiting
- Consider adding optional user accounts

### Database Security

**Current Setup:**
- Using Supabase Service Role Key (bypasses RLS)
- Server-side only (never exposed to client)
- All database operations in API routes

**RLS Policies (Optional):**
```sql
-- If you want to add public read access later
CREATE POLICY "Allow public read threads"
  ON threads FOR SELECT
  USING (true);

CREATE POLICY "Allow public read messages"
  ON messages FOR SELECT
  USING (true);
```

### API Key Protection

**Environment Variables:**
- `OPENAI_API_KEY`: Server-side only
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side only
- `NEXT_PUBLIC_SUPABASE_URL`: Public (read-only info)

**Best Practices:**
- Never commit `.env.local` to git
- Use different keys for dev/prod
- Rotate keys periodically
- Monitor usage for anomalies

## Performance Considerations

### Optimizations Implemented

1. **Streaming Responses**
   - AI responses stream in real-time
   - Better perceived performance
   - Lower time-to-first-byte

2. **Lazy Loading**
   - Messages loaded only when thread is selected
   - Reduces initial page load

3. **Database Indexes**
   - Fast queries on `session_id` and `created_at`
   - Optimized for common access patterns

4. **Static Generation**
   - Home page pre-rendered at build time
   - Instant page loads

### Future Optimizations

1. **Caching**
   - Cache common questions/responses
   - Redis for session data
   - CDN for static assets

2. **Pagination**
   - Limit messages per load
   - Infinite scroll for history
   - Reduce database queries

3. **Edge Functions**
   - Deploy API routes to edge network
   - Lower latency globally

4. **Database Connection Pooling**
   - Supabase handles this automatically
   - Consider pgBouncer for high traffic

## Scalability

### Current Limits

- **Supabase Free Tier**: 500MB database, 2GB bandwidth/month
- **Vercel Free Tier**: 100GB bandwidth/month
- **OpenAI**: Rate limits based on tier

### Scaling Strategy

#### Phase 1: 0-1,000 users
- Current architecture sufficient
- Monitor costs and performance
- No changes needed

#### Phase 2: 1,000-10,000 users
- Upgrade Supabase to Pro ($25/month)
- Add rate limiting (Upstash)
- Implement caching
- Consider GPT-3.5-turbo for cost savings

#### Phase 3: 10,000+ users
- Upgrade Vercel to Pro
- Database optimization (partitioning)
- Add CDN (Cloudflare)
- Implement queue system for AI requests
- Consider self-hosted infrastructure

## Error Handling

### Client-Side

- Network errors: Retry with exponential backoff
- Session errors: Regenerate session ID
- Display user-friendly error messages

### Server-Side

- Validation errors: Return 400 with details
- Auth errors: Return 401
- OpenAI errors: Log and return generic message
- Database errors: Log and return 500

### Logging Strategy

**Development:**
- Console logs for debugging
- Detailed error messages

**Production:**
- Vercel logs for server errors
- OpenAI dashboard for API usage
- Supabase logs for database queries
- Consider Sentry for error tracking

## Testing Strategy

### Manual Testing Checklist

- [ ] Send message in new thread
- [ ] Send message in existing thread
- [ ] Load conversation history
- [ ] Switch between threads
- [ ] Test on mobile devices
- [ ] Test with slow network
- [ ] Test with no network (offline behavior)

### Recommended Automated Tests

1. **Unit Tests** (Jest)
   - Session ID generation
   - UUID validation
   - Markdown rendering

2. **Integration Tests** (Playwright)
   - Complete chat flow
   - Thread switching
   - Sidebar navigation

3. **API Tests** (Supertest)
   - Endpoint validation
   - Error handling
   - Session management

## Monitoring & Observability

### Key Metrics to Track

1. **Performance**
   - API response times
   - Streaming latency
   - Database query times

2. **Usage**
   - Messages per day
   - Active sessions
   - Thread creation rate

3. **Costs**
   - OpenAI API usage ($)
   - Supabase bandwidth
   - Vercel function invocations

4. **Errors**
   - API error rate
   - Failed messages
   - Database errors

### Recommended Tools

- **Vercel Analytics**: Built-in performance monitoring
- **OpenAI Dashboard**: API usage and costs
- **Supabase Dashboard**: Database metrics
- **Sentry** (optional): Error tracking and alerting

## Future Enhancements

### Short-term (1-2 weeks)

- [ ] Add message timestamps
- [ ] Implement "copy message" button
- [ ] Add keyboard shortcuts
- [ ] Export conversation as PDF/Markdown
- [ ] Add search within conversations

### Medium-term (1-2 months)

- [ ] User authentication (optional)
- [ ] File upload support
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Custom AI instructions per user

### Long-term (3-6 months)

- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] A/B testing framework
- [ ] API for third-party integrations

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in your API keys

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Deployment Workflow

```bash
# Automatic deployment on push to main
git push origin main

# Or manual deployment
vercel --prod
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Maintainer**: AI Content Coach Team




