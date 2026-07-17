// App-wide watchlist state. Fetches the signed-in user's saved movie ids
// once and exposes toggle/isSaved so any MovieCard can show/flip its heart
// button without every card re-querying Supabase (avoids an N+1 query per
// grid). Saving requires an account — toggling while signed out opens the
// sign-in modal instead of writing anything.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import {
  getWatchlistIds,
  addToWatchlist,
  removeFromWatchlist,
} from "../utilities/supabase";

interface WatchlistContextValue {
  isSaved: (id: number) => boolean;
  toggle: (movie: {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
    release_date: string;
    original_language: string;
  }) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
  const { user, openAuthModal } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    getWatchlistIds(user.id).then((ids) => setSavedIds(new Set(ids)));
  }, [user]);

  const isSaved = (id: number) => savedIds.has(id);

  const toggle: WatchlistContextValue["toggle"] = (movie) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const alreadySaved = savedIds.has(movie.id);

    // Optimistic update — the UI flips immediately, the Supabase write
    // happens in the background (errors are logged, not rolled back).
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (alreadySaved) next.delete(movie.id);
      else next.add(movie.id);
      return next;
    });

    if (alreadySaved) removeFromWatchlist(user.id, movie.id);
    else addToWatchlist(user.id, movie);
  };

  return (
    <WatchlistContext.Provider value={{ isSaved, toggle }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
};
