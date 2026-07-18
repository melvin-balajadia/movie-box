// App-wide watchlist state. Fetches the signed-in user's saved items once and
// exposes toggle/isSaved so any card can show/flip its bookmark without an
// N+1 query. Items are keyed by "mediaType:id" so a saved movie and a TV show
// with the same numeric id don't collide. Saving requires an account —
// toggling while signed out opens the sign-in modal instead of writing.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import {
  getWatchlistKeys,
  addToWatchlist,
  removeFromWatchlist,
} from "../utilities/supabase";
import { MediaType } from "../utilities/utils";

type ToggleItem = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  original_language: string;
  media_type: MediaType;
};

interface WatchlistContextValue {
  isSaved: (id: number, mediaType?: MediaType) => boolean;
  toggle: (item: ToggleItem) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const keyOf = (id: number, mediaType: MediaType) => `${mediaType}:${id}`;

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
  const { user, openAuthModal } = useAuth();
  const { show } = useToast();
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setSavedKeys(new Set());
      return;
    }
    getWatchlistKeys(user.id).then((keys) => setSavedKeys(new Set(keys)));
  }, [user]);

  const isSaved = (id: number, mediaType: MediaType = "movie") =>
    savedKeys.has(keyOf(id, mediaType));

  const toggle = (item: ToggleItem) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const key = keyOf(item.id, item.media_type);
    const alreadySaved = savedKeys.has(key);

    // Optimistic update — UI flips immediately, Supabase write is background.
    setSavedKeys((prev) => {
      const next = new Set(prev);
      if (alreadySaved) next.delete(key);
      else next.add(key);
      return next;
    });

    if (alreadySaved) {
      removeFromWatchlist(user.id, item.id, item.media_type);
      show("Removed from watchlist");
    } else {
      addToWatchlist(user.id, item);
      show("Added to watchlist");
    }
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
