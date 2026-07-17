// Watchlist page: movies saved via the bookmark toggle on MovieCard, scoped
// to the signed-in account (saving requires sign-in — see WatchlistProvider).
// When the list is empty, popular picks are shown so the page is never a
// dead end.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { LuArrowLeft } from "react-icons/lu";
import Spinner from "../components/Spinner";
import MovieCard from "../components/MovieCard";
import Footer from "../components/Footer";
import { useAuth } from "../components/AuthProvider";
import { getWatchlistMovies } from "../utilities/supabase";
import { API_BASE_URL, API_OPTIONS, Movies, WatchlistMovie } from "../utilities/utils";

function Watchlist() {
  const { user, authLoading, openAuthModal } = useAuth();
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [suggestions, setSuggestions] = useState<Movies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      const data = await getWatchlistMovies(user.id);
      setMovies(data);
      setLoading(false);

      // Empty list → offer popular picks so there's somewhere to go next.
      if (data.length === 0) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/movie/popular?page=1`,
            API_OPTIONS
          );
          setSuggestions((res.data.results || []).slice(0, 8));
        } catch (error) {
          console.log(error);
        }
      }
    };

    fetchWatchlist();
  }, [user]);

  return (
    <main>
      <div className="wrapper">
        <Link to="/" className="back-link">
          <LuArrowLeft aria-hidden="true" />
          Back to search
        </Link>

        <header className="page-header">
          <h1 className="page-heading">Your Watchlist</h1>
          {user && (
            <p className="text-ink-soft mt-2">
              {movies.length} {movies.length === 1 ? "title" : "titles"} saved
              to your account.
            </p>
          )}
        </header>

        {(authLoading || (user && loading)) && <Spinner />}

        {!authLoading && !user && (
          <div className="state-message">
            <p className="font-semibold text-ink">
              Sign in to see your watchlist
            </p>
            <p className="text-sm">
              Movies you save are tied to your account, not this device.
            </p>
            <button
              type="button"
              className="ticket-button mt-2"
              onClick={openAuthModal}
            >
              Sign In
            </button>
          </div>
        )}

        {!authLoading && user && !loading && movies.length === 0 && (
          <>
            <div className="state-message">
              <p className="font-semibold text-ink">Nothing saved yet</p>
              <p className="text-sm">
                Tap the bookmark icon on any movie to add it here.
              </p>
            </div>

            {suggestions.length > 0 && (
              <section className="all-movies">
                <h2>Popular right now</h2>
                <ul>
                  {suggestions.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {!authLoading && user && !loading && movies.length > 0 && (
          <section className="all-movies">
            <ul>
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          </section>
        )}

        <Footer />
      </div>
    </main>
  );
}

export default Watchlist;
