# Digital Second Brain: Content Coach

A production-ready, dark-mode chat application for structured content ideation and long-term knowledge capture. The app provides a persistent, searchable conversation workspace backed by a relational database and real-time streamed responses.

Built with Next.js (App Router), OpenAI Assistants API, and Supabase (PostgreSQL).

---

## Overview

This project focuses on:
- Persistent conversation history
- Low-friction, anonymous usage
- Real-time streaming responses
- Clean, distraction-free UI for long-form thinking

The system is designed as an MVP foundation that can be extended with authentication, permissions, and advanced workflows.

---

## Features

- Anonymous Sessions  
  Users are identified via a client-generated UUID stored in localStorage. No login required.

- Streaming Responses  
  Responses are streamed incrementally using Server-Sent Events (SSE) for low-latency UX.

- Persistent Storage  
  Conversations and messages are stored in PostgreSQL (Supabase) and retrievable across sessions.

- Dark-Mode Interface  
  Obsidian-inspired UI with responsive layout and keyboard-friendly interactions.

- Markdown Rendering  
  Full support for markdown, including code blocks, tables, and lists.

---

## Tech Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- AI Runtime: OpenAI Assistants API
- Database: Supabase (PostgreSQL)
- State and Streaming: Vercel AI SDK
- Icons: Lucide React
- Markdown: react-markdown and remark-gfm

---

## Installation

### Install dependencies

```bash
npm install
```

### Environment variables

Create a .env.local file in the project root:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_ASSISTANT_ID=asst_xxx
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Note: The service role key is used server-side only.

---

## Database Setup

Run the migration located at:

```bash
supabase/migrations/001_create_tables.sql
```

This creates:
- threads table for conversation metadata
- messages table for message history
- Supporting indexes for performance

---

## Running Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Architecture Notes

### Session Handling

A UUID is generated client-side on first load and stored in localStorage. The UUID is sent via the x-session-id header on every request and is used to group conversations in the database.

### Data Flow

1. User sends a message from the client
2. Frontend sends a POST request to /api/chat
3. Server creates or reuses an OpenAI thread
4. User message is persisted to the database
5. Assistant response is streamed to the client
6. Final response is persisted after completion

---

## Security Notes

This project is an MVP. For production usage:
- Add rate limiting to prevent abuse
- Validate and sanitize all inputs
- Secure and rotate API keys
- Introduce authentication and Row Level Security (RLS)
- Implement moderation and abuse detection

---

## Deployment

The application is designed for deployment on Vercel. Next.js is automatically detected, environment variables are configured via the dashboard, and CI/CD is handled by the platform.

---

## License

MIT
