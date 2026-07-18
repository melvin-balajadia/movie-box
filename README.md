# Movie Box

A movie & TV discovery hub built with React, TypeScript, Vite, and Tailwind CSS.
It pulls live data from **TMDB** and uses **Supabase** (Postgres + Auth) for
accounts, watchlists, and ratings.

## Features

- Search movies, TV shows, and people (autocomplete + recent searches)
- Browse by category, genre, and sort; infinite scroll
- Trending chart driven by real user searches
- Rich detail pages: cast & crew, trailers, image gallery, "where to watch"
  (by region), recommendations, reviews, and collections
- Accounts (Google, magic link, or email/password) with a per-user watchlist
  and 1–5 star ratings, plus a profile stats page
- Movies **and** TV shows, with their own detail pages
- Dark mode (default), responsive layout, skeleton loading states

## Tech stack

React · TypeScript · Vite · Tailwind CSS · React Router · Supabase
(Postgres, Auth, Row-Level Security) · TMDB API · deployed on Vercel.

---

## Getting started

### Prerequisites

- **Node.js 18+**
- A **TMDB** account — grab an API **Read Access Token** (v4 auth) from
  https://www.themoviedb.org/settings/api
- A free **Supabase** project — https://supabase.com

### 1. Install

```bash
git clone https://github.com/melvin-balajadia/movie-box.git
cd movie-box
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

```ini
VITE_TMDB_API_KEY=your-tmdb-read-access-token
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

The Supabase URL and anon key are under **Project Settings → API**. The anon
key is safe to expose in the client — Row-Level Security (below) is what
protects user data.

### 3. Set up the database

In the Supabase dashboard, open **SQL Editor → New query**, paste the following,
and run it. It creates all three tables (trending searches, watchlists, and
ratings) with the right policies.

```sql
-- Trending: search counts (written anonymously, so no RLS needed)
create table searches (
  id bigint generated always as identity primary key,
  movie_id integer not null unique,
  title text not null,
  poster_url text not null,
  count integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Per-user watchlist
create table watchlist (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id integer not null,
  media_type text not null default 'movie',
  title text not null,
  poster_path text not null,
  vote_average numeric not null,
  release_date text not null,
  original_language text not null,
  created_at timestamptz not null default now(),
  unique (user_id, media_type, movie_id)
);
alter table watchlist enable row level security;
create policy "Users read own watchlist"   on watchlist for select using (auth.uid() = user_id);
create policy "Users insert own watchlist" on watchlist for insert with check (auth.uid() = user_id);
create policy "Users delete own watchlist" on watchlist for delete using (auth.uid() = user_id);

-- Per-user ratings (1–5 stars)
create table ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id integer not null,
  media_type text not null default 'movie',
  rating integer not null check (rating between 1 and 5),
  title text not null,
  poster_path text not null,
  vote_average numeric not null,
  release_date text not null,
  original_language text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, media_type, movie_id)
);
alter table ratings enable row level security;
create policy "Users read own ratings"   on ratings for select using (auth.uid() = user_id);
create policy "Users insert own ratings" on ratings for insert with check (auth.uid() = user_id);
create policy "Users update own ratings" on ratings for update using (auth.uid() = user_id);
create policy "Users delete own ratings" on ratings for delete using (auth.uid() = user_id);
```

### 4. Configure authentication

In the Supabase dashboard → **Authentication**:

- **URL Configuration** → set **Site URL** to `http://localhost:5183` for local
  dev, and add both `http://localhost:5183/**` and your deployed URL (e.g.
  `https://your-app.vercel.app/**`) to **Redirect URLs**.
- **Email** and **magic link** work out of the box.
- **Google** (optional) → **Providers → Google**: create an OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com/), add
  `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect
  URI, then paste the Client ID/Secret into Supabase and enable it.

### 5. Run

```bash
npm run dev
```

Open http://localhost:5183

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start the dev server (port 5183)  |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build      |
| `npm run lint`    | Run ESLint                        |

## Deployment (Vercel)

1. Import the repo into Vercel — it auto-detects Vite (build: `npm run build`,
   output: `dist`). The included `vercel.json` handles SPA routing.
2. Add the environment variables (`VITE_TMDB_API_KEY`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in **Project Settings → Environment Variables**.
3. **Optional — social link previews:** the `middleware.ts` edge function
   serves Open Graph tags to crawlers on `/movie/:id` and `/tv/:id`. For it to
   work, add a server-side `TMDB_API_KEY` env var in Vercel (same TMDB token,
   without the `VITE_` prefix so it isn't bundled into the client).
4. After the first deploy, add the Vercel URL to Supabase's auth Redirect URLs
   (step 4) so sign-in works in production.

## Credits

Movie and TV data from [TMDB](https://www.themoviedb.org/) (not endorsed or
certified by TMDB). Built by
[Melvin Balajadia](https://melvinbalajadia.vercel.app/).
