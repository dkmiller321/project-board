# Vibe Coder Project Board

A modern, real-time project management application built with React and Supabase. Features a Kanban board with drag-and-drop functionality, a quick todo list, and a freeform notes area—all synced in real-time across devices.

**Live Demo:** [https://project-board-pink.vercel.app](https://project-board-pink.vercel.app)

## Features

- **Kanban Board** - Organize tasks across three columns (To Do, In Progress, Done) with smooth drag-and-drop powered by dnd-kit
- **Quick Todos** - Lightweight checklist for quick tasks that don't need full cards
- **Freeform Notes** - Scratchpad area with debounced auto-save for jotting down thoughts
- **User Authentication** - Secure email/password auth with Supabase
- **Real-time Sync** - Changes sync instantly across all connected devices via Supabase Realtime
- **Per-user Data Isolation** - Row Level Security ensures users only see their own data
- **Responsive Design** - Works on desktop and mobile with adaptive layout
- **Dark Theme** - Easy on the eyes with a carefully crafted dark color palette

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 |
| **Language** | TypeScript 5.9 |
| **Build Tool** | Vite 7 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Real-time** | Supabase Realtime (Postgres Changes) |
| **Drag & Drop** | @dnd-kit/core, @dnd-kit/sortable |
| **Styling** | CSS Modules with CSS Custom Properties |
| **Deployment** | Vercel |

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Login/signup form
│   ├── KanbanBoard/    # Board, columns, and draggable cards
│   ├── TodoPanel/      # Quick todo checklist
│   └── NotesArea/      # Freeform notes textarea
├── context/
│   ├── AuthContext.tsx # Authentication state & methods
│   └── AppContext.tsx  # Application state wrapper
├── hooks/
│   ├── useSupabaseState.ts  # Data fetching, mutations, realtime
│   └── usePersistedState.ts # Local storage utilities
├── lib/
│   └── supabase.ts     # Supabase client initialization
├── styles/
│   ├── tokens.css      # Design tokens (colors, spacing, etc.)
│   ├── reset.css       # CSS reset
│   └── global.css      # Global styles
├── types/
│   ├── index.ts        # Application types
│   └── database.ts     # Supabase database types
├── App.tsx             # Main application component
└── main.tsx            # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dkmiller321/project-board.git
   cd project-board
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Database Setup

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cards table
CREATE TABLE public.cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  column_id TEXT DEFAULT 'todo' NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create todos table
CREATE TABLE public.todos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create notes table (one per user)
CREATE TABLE public.notes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  content TEXT DEFAULT '' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can manage their own cards"
  ON public.cards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notes"
  ON public.notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
```

## Deployment

The app is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

Make sure to add your production URL to the allowed redirect URLs in Supabase Auth settings.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## License

MIT
