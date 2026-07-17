// Ratings page: every movie the signed-in user has rated, newest first, each
// shown with their star score. Sign-in gated, like the watchlist.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import Spinner from "../components/Spinner";
import MovieCard from "../components/MovieCard";
import StarRating from "../components/StarRating";
import Footer from "../components/Footer";
import { useAuth } from "../components/AuthProvider";
import { getRatedMovies } from "../utilities/supabase";
import { RatedMovie } from "../utilities/utils";

function Ratings() {
  const { user, authLoading, openAuthModal } = useAuth();
  const [movies, setMovies] = useState<RatedMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRatings = async () => {
      setLoading(true);
      const data = await getRatedMovies(user.id);
      setMovies(data);
      setLoading(false);
    };

    fetchRatings();
  }, [user]);

  return (
    <main>
      <div className="wrapper">
        <Link to="/" className="back-link">
          <LuArrowLeft aria-hidden="true" />
          Back to search
        </Link>

        <header className="page-header">
          <h1 className="page-heading">Your Ratings</h1>
          {user && (
            <p className="text-ink-soft mt-2">
              {movies.length} {movies.length === 1 ? "movie" : "movies"} rated.
            </p>
          )}
        </header>

        {(authLoading || (user && loading)) && <Spinner />}

        {!authLoading && !user && (
          <div className="state-message">
            <p className="font-semibold text-ink">Sign in to see your ratings</p>
            <p className="text-sm">
              Rate movies from any movie's page to build your list.
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
          <div className="state-message">
            <p className="font-semibold text-ink">No ratings yet</p>
            <p className="text-sm">
              Open any movie and tap the stars to rate it.
            </p>
          </div>
        )}

        {!authLoading && user && !loading && movies.length > 0 && (
          <section className="all-movies">
            <ul>
              {movies.map((movie) => (
                <li key={movie.id} className="rated-item">
                  <MovieCard movie={movie} />
                  <StarRating value={movie.rating} readOnly />
                </li>
              ))}
            </ul>
          </section>
        )}

        <Footer />
      </div>
    </main>
  );
}

export default Ratings;
