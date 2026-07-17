import { createClient } from "@supabase/supabase-js";
import { RatedMovie, WatchlistMovie } from "./utils";

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exported so AuthProvider/AuthModal can call supabase.auth.* directly —
// those are thin, well-documented wrappers already, no need to re-wrap them.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SEARCHES_TABLE = "searches";
const WATCHLIST_TABLE = "watchlist";
const RATINGS_TABLE = "ratings";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
}

// Shape returned to components. Keeps the Appwrite-era `$id` field name so
// existing UI code (TrendingMovie type, App.tsx) didn't need to change for
// this backend swap.
interface TrendingMovieRow {
  $id: string;
  movie_id: number;
  title: string;
  poster_url: string;
}

export const updateSearchCount = async (
  _searchTerm: string,
  movie: Movie
): Promise<void> => {
  try {
    const { data: existing, error: selectError } = await supabase
      .from(SEARCHES_TABLE)
      .select("id, count")
      .eq("movie_id", movie.id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      const { error: updateError } = await supabase
        .from(SEARCHES_TABLE)
        .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from(SEARCHES_TABLE).insert({
        movie_id: movie.id,
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        count: 1,
      });

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error("Error updating search count:", error);
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovieRow[] | undefined
> => {
  try {
    const { data, error } = await supabase
      .from(SEARCHES_TABLE)
      .select("id, movie_id, title, poster_url")
      .order("count", { ascending: false })
      .limit(5);

    if (error) throw error;

    return data?.map((row) => ({
      $id: String(row.id),
      movie_id: row.movie_id,
      title: row.title,
      poster_url: row.poster_url,
    }));
  } catch (error) {
    console.error("Error fetching trending movies:", error);
  }
};

// Watchlist rows are scoped by the signed-in user's id and protected by
// Postgres row-level security policies (see README) — unlike the searches
// table, this data is genuinely personal, so RLS actually matters here.

export const getWatchlistIds = async (userId: string): Promise<number[]> => {
  try {
    const { data, error } = await supabase
      .from(WATCHLIST_TABLE)
      .select("movie_id")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map((row) => row.movie_id);
  } catch (error) {
    console.error("Error fetching watchlist ids:", error);
    return [];
  }
};

export const getWatchlistMovies = async (
  userId: string
): Promise<WatchlistMovie[]> => {
  try {
    const { data, error } = await supabase
      .from(WATCHLIST_TABLE)
      .select("movie_id, title, poster_path, vote_average, release_date, original_language")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.movie_id,
      title: row.title,
      poster_path: row.poster_path,
      vote_average: row.vote_average,
      release_date: row.release_date,
      original_language: row.original_language,
    }));
  } catch (error) {
    console.error("Error fetching watchlist movies:", error);
    return [];
  }
};

export const addToWatchlist = async (
  userId: string,
  movie: WatchlistMovie
): Promise<void> => {
  try {
    const { error } = await supabase.from(WATCHLIST_TABLE).insert({
      user_id: userId,
      movie_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      original_language: movie.original_language,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
  }
};

export const removeFromWatchlist = async (
  userId: string,
  movieId: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(WATCHLIST_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
  }
};

// Ratings: a 1–5 star score per user per movie (also serves as the "seen it"
// signal — you rate what you've watched). Same user_id scoping + RLS as the
// watchlist table.

export const getUserRating = async (
  userId: string,
  movieId: number
): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from(RATINGS_TABLE)
      .select("rating")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .maybeSingle();

    if (error) throw error;
    return data?.rating ?? null;
  } catch (error) {
    console.error("Error fetching rating:", error);
    return null;
  }
};

export const setRating = async (
  userId: string,
  movie: WatchlistMovie,
  rating: number
): Promise<void> => {
  try {
    // Upsert on (user_id, movie_id) so re-rating updates the existing row.
    const { error } = await supabase.from(RATINGS_TABLE).upsert(
      {
        user_id: userId,
        movie_id: movie.id,
        rating,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        original_language: movie.original_language,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,movie_id" }
    );

    if (error) throw error;
  } catch (error) {
    console.error("Error saving rating:", error);
  }
};

export const removeRating = async (
  userId: string,
  movieId: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(RATINGS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing rating:", error);
  }
};

export const getRatedMovies = async (
  userId: string
): Promise<RatedMovie[]> => {
  try {
    const { data, error } = await supabase
      .from(RATINGS_TABLE)
      .select("movie_id, rating, title, poster_path, vote_average, release_date, original_language")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.movie_id,
      rating: row.rating,
      title: row.title,
      poster_path: row.poster_path,
      vote_average: row.vote_average,
      release_date: row.release_date,
      original_language: row.original_language,
    }));
  } catch (error) {
    console.error("Error fetching rated movies:", error);
    return [];
  }
};
