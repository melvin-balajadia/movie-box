// Profile page: the signed-in user's identity plus stats derived from their
// ratings and watchlist (counts, average rating, star distribution, top-rated
// picks). Sign-in gated, like the watchlist/ratings pages.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowLeft, LuLogOut } from "react-icons/lu";
import Spinner from "../components/Spinner";
import MovieCard from "../components/MovieCard";
import Footer from "../components/Footer";
import { useAuth } from "../components/AuthProvider";
import { getRatedMovies, getWatchlistMovies } from "../utilities/supabase";
import { RatedMovie, WatchlistMovie } from "../utilities/utils";
import { usePageTitle } from "../utilities/usePageTitle";

function Profile() {
  const { user, authLoading, signOut, openAuthModal } = useAuth();
  const [rated, setRated] = useState<RatedMovie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarFailed, setAvatarFailed] = useState(false);

  usePageTitle("Profile");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const [r, w] = await Promise.all([
        getRatedMovies(user.id),
        getWatchlistMovies(user.id),
      ]);
      setRated(r);
      setWatchlist(w);
      setLoading(false);
    };
    load();
  }, [user]);

  const ratedCount = rated.length;
  const avgRating = ratedCount
    ? (rated.reduce((sum, m) => sum + m.rating, 0) / ratedCount).toFixed(1)
    : "—";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: rated.filter((m) => m.rating === star).length,
  }));
  const maxDist = Math.max(1, ...distribution.map((d) => d.count));
  const topRated = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 4);

  const displayName = user?.user_metadata?.full_name || user?.email || "You";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = (displayName as string).charAt(0).toUpperCase();

  return (
    <main>
      <div className="wrapper">
        <Link to="/" className="back-link">
          <LuArrowLeft aria-hidden="true" />
          Back to search
        </Link>

        {(authLoading || (user && loading)) && <Spinner />}

        {!authLoading && !user && (
          <div className="state-message">
            <p className="font-semibold text-ink">Sign in to view your profile</p>
            <p className="text-sm">
              Your stats are built from the movies you rate and save.
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

        {!authLoading && user && !loading && (
          <>
            <section className="profile-hero">
              <div className="profile-identity">
                {avatarUrl && !avatarFailed ? (
                  <img
                    className="profile-avatar"
                    src={avatarUrl}
                    alt=""
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="profile-avatar profile-avatar-initial">
                    {initial}
                  </span>
                )}
                <div>
                  <h1 className="page-heading">{displayName}</h1>
                  {user.email && displayName !== user.email && (
                    <p className="text-ink-soft text-sm mt-1">{user.email}</p>
                  )}
                </div>
              </div>
              <button type="button" className="share-button" onClick={signOut}>
                <LuLogOut aria-hidden="true" />
                Sign out
              </button>
            </section>

            <section className="stat-grid">
              <Link to="/ratings" className="stat-tile">
                <span className="stat-value">{ratedCount}</span>
                <span className="stat-label">Movies rated</span>
              </Link>
              <div className="stat-tile">
                <span className="stat-value">{avgRating}</span>
                <span className="stat-label">Average rating</span>
              </div>
              <Link to="/watchlist" className="stat-tile">
                <span className="stat-value">{watchlist.length}</span>
                <span className="stat-label">On watchlist</span>
              </Link>
            </section>

            {ratedCount > 0 && (
              <section className="details-body">
                <h2>Rating breakdown</h2>
                <div className="rating-dist">
                  {distribution.map(({ star, count }) => (
                    <div key={star} className="dist-row">
                      <span className="dist-star">{star}★</span>
                      <span className="dist-track">
                        <span
                          className="dist-fill"
                          style={{ width: `${(count / maxDist) * 100}%` }}
                        />
                      </span>
                      <span className="dist-count">{count}</span>
                    </div>
                  ))}
                </div>

                <h2>Your top rated</h2>
                <ul className="more-like-this">
                  {topRated.map((movie) => (
                    <MovieCard
                      key={`${movie.media_type}-${movie.id}`}
                      movie={movie}
                      mediaType={movie.media_type}
                    />
                  ))}
                </ul>
              </section>
            )}

            {ratedCount === 0 && watchlist.length === 0 && (
              <div className="state-message">
                <p className="font-semibold text-ink">Nothing here yet</p>
                <p className="text-sm">
                  Rate a few movies and add some to your watchlist to see your
                  stats.
                </p>
              </div>
            )}
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}

export default Profile;
