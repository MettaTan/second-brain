# 🧠 Digital Second Brain - AI Content Coach

A high-quality, dark-mode chat application that serves as your personal AI assistant for content creation. Built with Next.js 14, OpenAI Assistants API, and Supabase.

## ✨ Features

- **Anonymous Sessions**: No login required. Users are tracked via UUID in LocalStorage.
- **Real-time Streaming**: Responses stream in real-time using OpenAI's Assistants API.
- **Persistent History**: All conversations stored in Supabase for future reference.
- **Beautiful UI**: Obsidian-inspired dark theme with smooth animations.
- **Mobile Responsive**: Fully functional on desktop, tablet, and mobile devices.
- **Markdown Support**: AI responses rendered with full markdown support.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI Assistants API
- **Database**: Supabase (PostgreSQL)
- **State Management**: Vercel AI SDK
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- An OpenAI account with API access
- A Supabase project
- An OpenAI Assistant created (with instructions for content coaching)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
OPENAI_ASSISTANT_ID=asst_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE
```

**Getting your OpenAI Assistant ID:**
1. Go to [OpenAI Platform](https://platform.openai.com/assistants)
2. Create a new Assistant
3. Set the instructions (e.g., "You are an expert content creation advisor...")
4. Copy the Assistant ID (starts with `asst_`)

**Getting your Supabase credentials:**
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings > API
4. Copy the `URL` and `service_role` key (NOT the anon key)

### 3. Set Up Supabase Database

Run the SQL migration in your Supabase SQL Editor:

1. Open your Supabase project
2. Go to the SQL Editor
3. Copy the contents of `supabase/migrations/001_create_tables.sql`
4. Execute the SQL

This creates:
- `threads` table: Stores conversation threads
- `messages` table: Stores individual messages
- Indexes for optimal performance
- RLS policies (optional, bypassed by service role)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
second-brain/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Main chat endpoint (OpenAI streaming)
│   │   ├── history/route.ts       # Fetch user's threads
│   │   └── messages/route.ts      # Fetch messages for a thread
│   ├── globals.css                # Global styles & theme
│   ├── layout.tsx                 # Root layout with fonts
│   └── page.tsx                   # Main app page
├── components/
│   ├── ChatInterface.tsx          # Main chat UI component
│   └── Sidebar.tsx                # Thread history sidebar
├── lib/
│   ├── session.ts                 # Client-side session management
│   ├── supabase.ts                # Supabase admin client
│   └── types.ts                   # TypeScript interfaces
└── supabase/
    └── migrations/
        └── 001_create_tables.sql  # Database schema
```

## 🎨 Architecture

### Session Management (Anonymous Auth)

1. **Client Side**: On first load, generate a UUID and store it in `localStorage` as `content_coach_session_id`.
2. **Every Request**: Include this UUID in the `x-session-id` header.
3. **Server Side**: Use this to query/store data in Supabase associated with the user.

### Data Flow

1. User sends a message
2. Frontend sends POST to `/api/chat` with `sessionId` header
3. Backend:
   - Creates/retrieves OpenAI Thread
   - Saves user message to Supabase
   - Streams AI response to client
   - Saves AI response to Supabase
4. Frontend displays streamed response in real-time

### Database Schema

**threads**
- `id` (TEXT): OpenAI Thread ID (PK)
- `session_id` (TEXT): Anonymous user UUID
- `created_at` (TIMESTAMPTZ): Thread creation time
- `title` (TEXT): First message preview

**messages**
- `id` (BIGSERIAL): Auto-incrementing ID (PK)
- `thread_id` (TEXT): Foreign key to threads
- `role` (TEXT): 'user' or 'assistant'
- `content` (TEXT): Message content
- `created_at` (TIMESTAMPTZ): Message timestamp

## 🎯 Key Features Explained

### Real-time Streaming

Uses OpenAI's Assistants API streaming mode with Server-Sent Events (SSE):
- Streams text deltas as they're generated
- Updates UI in real-time
- Saves complete response to database when done

### Anonymous Sessions

No authentication required:
- UUID generated client-side
- Stored in localStorage
- Sent with every API request
- Used to filter database queries

### Markdown Support

AI responses support full markdown:
- **Bold**, *italic*, `code`
- Lists and tables
- Code blocks with syntax highlighting
- Links and images

## 🔒 Security Considerations

⚠️ **Important**: This is an MVP with anonymous sessions. For production:

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Input Validation**: Sanitize all user inputs
3. **API Keys**: Keep service role keys secure (never expose client-side)
4. **Content Moderation**: Implement OpenAI's moderation API
5. **Row Level Security**: Add proper RLS policies in Supabase
6. **Session Expiry**: Consider implementing session timeouts

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Detect Next.js
- Configure build settings
- Set up CI/CD

### Environment Variables in Production

Ensure all four environment variables are set in your Vercel project settings:
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🐛 Troubleshooting

### "Failed to send message"
- Check your OpenAI API key is valid
- Verify your Assistant ID exists
- Check OpenAI API usage limits

### "Database error"
- Verify Supabase tables are created
- Check service role key is correct
- Ensure Supabase project is not paused

### Styling issues
- Clear browser cache
- Check Tailwind CSS is properly configured
- Verify globals.css is imported

## 📝 Customization

### Change Theme Colors

Edit `app/globals.css`:

```css
:root {
  --background: #09090b;  /* Main background */
  --surface: #18181b;     /* Cards/surfaces */
  --primary: #6366f1;     /* Accent color */
  /* ... */
}
```

### Modify Assistant Behavior

1. Go to OpenAI Platform > Assistants
2. Edit your assistant's instructions
3. Changes take effect immediately (no code changes needed)

### Add Features

Some ideas for enhancements:
- Export chat history as PDF/Markdown
- Search across conversations
- File upload support
- Voice input/output
- User authentication (for premium features)

## 📄 License

MIT License - feel free to use this project however you like!

## 🤝 Contributing

This is an MVP project. Feel free to fork and customize for your needs!

## 💡 Tips

- Keep your Assistant instructions clear and specific
- Monitor OpenAI usage in the OpenAI dashboard
- Regularly backup your Supabase database
- Test on multiple devices for responsive design

---

Built with ❤️ using Next.js, OpenAI, and Supabase
