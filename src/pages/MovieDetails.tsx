// Movie details page: backdrop banner with poster/title/rating/genres, the
// overview, cast & crew, where to watch, the trailer, similar movies, reviews,
// and a few extra facts (budget/revenue/production).
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  LuArrowLeft,
  LuStar,
  LuClock,
  LuShare2,
  LuCheck,
  LuBookmark,
  LuBookmarkCheck,
} from "react-icons/lu";
import DetailsSkeleton from "../components/DetailsSkeleton";
import VideoPlayer from "../components/VideoPlayer";
import MovieCard from "../components/MovieCard";
import Footer from "../components/Footer";
import StarRating from "../components/StarRating";
import { useWatchlist } from "../components/WatchlistProvider";
import { useAuth } from "../components/AuthProvider";
import { addRecentlyViewed } from "../utilities/recentlyViewed";
import {
  getUserRating,
  setRating,
  removeRating,
} from "../utilities/supabase";
import {
  API_BASE_URL,
  API_OPTIONS,
  Collection,
  Credits,
  Movies,
  MovieDetail,
  Review,
  WatchProviderRegion,
  WatchProvidersResponse,
} from "../utilities/utils";

const formatRuntime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

function MovieDetails() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [credits, setCredits] = useState<Credits | null>(null);
  const [recommendations, setRecommendations] = useState<Movies[]>([]);
  const [watchProviders, setWatchProviders] =
    useState<WatchProviderRegion | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const { isSaved, toggle } = useWatchlist();
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await axios.get<MovieDetail>(
          `${API_BASE_URL}/movie/${id}`,
          API_OPTIONS
        );
        setMovie(response.data);
        addRecentlyViewed({
          id: response.data.id,
          title: response.data.title,
          poster_path: response.data.poster_path,
        });
      } catch (error) {
        console.log(error);
        setErrorMessage(
          "Something went wrong while fetching this movie. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Load the signed-in user's existing rating for this movie (0 = unrated).
  useEffect(() => {
    if (!user || !id) {
      setUserRating(0);
      return;
    }
    getUserRating(user.id, Number(id)).then((r) => setUserRating(r ?? 0));
  }, [user, id]);

  useEffect(() => {
    // Reset so a click-through from "More Like This" doesn't briefly show
    // the previous movie's cast/recommendations while the new ones load.
    setCredits(null);
    setRecommendations([]);
    setWatchProviders(null);
    setReviews([]);

    const fetchExtras = async () => {
      try {
        const response = await axios.get<Credits>(
          `${API_BASE_URL}/movie/${id}/credits`,
          API_OPTIONS
        );
        setCredits(response.data);
      } catch (error) {
        console.log(error);
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/movie/${id}/recommendations`,
          API_OPTIONS
        );
        setRecommendations((response.data.results || []).slice(0, 8));
      } catch (error) {
        console.log(error);
      }

      try {
        const response = await axios.get<WatchProvidersResponse>(
          `${API_BASE_URL}/movie/${id}/watch/providers`,
          API_OPTIONS
        );
        setWatchProviders(response.data.results?.US || null);
      } catch (error) {
        console.log(error);
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/movie/${id}/reviews`,
          API_OPTIONS
        );
        setReviews((response.data.results || []).slice(0, 3));
      } catch (error) {
        console.log(error);
      }
    };

    fetchExtras();
  }, [id]);

  const collectionId = movie?.belongs_to_collection?.id;

  useEffect(() => {
    if (!collectionId) {
      setCollection(null);
      return;
    }

    const fetchCollection = async () => {
      try {
        const response = await axios.get<Collection>(
          `${API_BASE_URL}/collection/${collectionId}`,
          API_OPTIONS
        );
        setCollection(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCollection();
  }, [collectionId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const handleRate = (rating: number) => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!movie) return;

    // Optimistic: reflect the new rating immediately, persist in background.
    setUserRating(rating);
    const meta = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      original_language: movie.original_language,
    };
    if (rating === 0) removeRating(user.id, movie.id);
    else setRating(user.id, meta, rating);
  };

  const director = credits?.crew.find((member) => member.job === "Director");

  const watchProviderList = watchProviders?.flatrate?.length
    ? { label: "Stream on", providers: watchProviders.flatrate }
    : watchProviders?.rent?.length
    ? { label: "Rent on", providers: watchProviders.rent }
    : watchProviders?.buy?.length
    ? { label: "Buy on", providers: watchProviders.buy }
    : null;

  const hasFacts =
    movie &&
    (movie.status ||
      movie.budget > 0 ||
      movie.revenue > 0 ||
      movie.production_companies.length > 0);

  return (
    <main>
      <div className="wrapper">
        <div className="details-toolbar">
          <Link to="/" className="back-link">
            <LuArrowLeft aria-hidden="true" />
            Back to search
          </Link>

          {movie && (
            <button
              type="button"
              className="share-button"
              onClick={handleShare}
            >
              {copied ? (
                <>
                  <LuCheck aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <LuShare2 aria-hidden="true" />
                  Share
                </>
              )}
            </button>
          )}
        </div>

        {loading && <DetailsSkeleton />}

        {!loading && errorMessage && (
          <div className="state-message">
            <p className="text-red-600 font-semibold">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && movie && (
          <>
            <section className="details-hero">
              {movie.backdrop_path && (
                <img
                  className="backdrop"
                  src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                  alt=""
                  aria-hidden="true"
                />
              )}

              <div
                className={`details-hero-content ${
                  movie.backdrop_path ? "" : "no-backdrop"
                }`}
              >
                <img
                  className="poster"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/no-movie.png"
                  }
                  alt={movie.title}
                />

                <div>
                  <h1 className="page-heading">{movie.title}</h1>
                  {movie.tagline && <p className="tagline">{movie.tagline}</p>}

                  <div className="meta-row">
                    <span className="rating-pill">
                      <LuStar aria-hidden="true" />
                      {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                      <span className="text-ink-soft font-normal">
                        ({movie.vote_count.toLocaleString()})
                      </span>
                    </span>
                    <span>
                      {movie.release_date
                        ? movie.release_date.split("-")[0]
                        : "N/A"}
                    </span>
                    {movie.runtime > 0 && (
                      <span className="flex items-center gap-1">
                        <LuClock aria-hidden="true" />
                        {formatRuntime(movie.runtime)}
                      </span>
                    )}
                    <span className="capitalize">
                      {movie.original_language}
                    </span>
                  </div>

                  {movie.genres.length > 0 && (
                    <div className="genres">
                      {movie.genres.map((genre) => (
                        <span key={genre.id} className="genre-chip">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className={`watchlist-button ${
                      isSaved(movie.id) ? "saved" : ""
                    }`}
                    onClick={() =>
                      toggle({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        vote_average: movie.vote_average,
                        release_date: movie.release_date,
                        original_language: movie.original_language,
                      })
                    }
                  >
                    {isSaved(movie.id) ? (
                      <>
                        <LuBookmarkCheck aria-hidden="true" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <LuBookmark aria-hidden="true" />
                        Add to Watchlist
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            <section className="details-body">
              <h2>Your Rating</h2>
              <div className="rating-row">
                <StarRating value={userRating} onChange={handleRate} />
                <span className="rating-hint">
                  {!user
                    ? "Sign in to rate this movie"
                    : userRating > 0
                    ? `You rated this ${userRating}/5`
                    : "Tap a star to rate"}
                </span>
              </div>

              <h2>Overview</h2>
              <p className="overview-text">
                {movie.overview || "No overview available."}
              </p>

              {collection && collection.parts.length > 1 && (
                <>
                  <h2>Part of {collection.name}</h2>
                  <ul className="more-like-this">
                    {collection.parts
                      .filter((part) => part.id !== movie.id)
                      .map((part) => (
                        <MovieCard key={part.id} movie={part} />
                      ))}
                  </ul>
                </>
              )}

              {credits && (credits.cast.length > 0 || director) && (
                <>
                  <h2>Cast &amp; Crew</h2>
                  {director && (
                    <p className="director-line">
                      Directed by <strong>{director.name}</strong>
                    </p>
                  )}
                  {credits.cast.length > 0 && (
                    <ul className="cast-row">
                      {credits.cast.slice(0, 10).map((member) => (
                        <li key={member.id}>
                          <Link to={`/person/${member.id}`}>
                            <img
                              src={
                                member.profile_path
                                  ? `https://image.tmdb.org/t/p/w200${member.profile_path}`
                                  : "/no-movie.png"
                              }
                              alt={member.name}
                            />
                            <p className="name">{member.name}</p>
                            <p className="character">{member.character}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {watchProviderList && (
                <>
                  <h2>Where to Watch</h2>
                  <p className="text-sm text-ink-soft mb-3">
                    {watchProviderList.label} (availability shown for the US)
                  </p>
                  <div className="watch-providers">
                    {watchProviderList.providers.map((provider) => (
                      <a
                        key={provider.provider_id}
                        href={watchProviders?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={provider.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                        />
                      </a>
                    ))}
                  </div>
                </>
              )}

              <h2>Trailer</h2>
              <VideoPlayer movieId={movie.id} />

              {recommendations.length > 0 && (
                <>
                  <h2>More Like This</h2>
                  <ul className="more-like-this">
                    {recommendations.map((rec) => (
                      <MovieCard key={rec.id} movie={rec} />
                    ))}
                  </ul>
                </>
              )}

              {reviews.length > 0 && (
                <>
                  <h2>Reviews</h2>
                  <ul className="reviews">
                    {reviews.map((review) => (
                      <li key={review.id}>
                        <p className="review-author">
                          {review.author}
                          {review.author_details.rating && (
                            <span className="review-rating">
                              <LuStar aria-hidden="true" />
                              {review.author_details.rating}
                            </span>
                          )}
                        </p>
                        <p className="review-content">
                          {review.content.length > 320
                            ? `${review.content.slice(0, 320).trim()}...`
                            : review.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {hasFacts && (
                <>
                  <h2>Details</h2>
                  <dl className="fact-list">
                    {movie.status && (
                      <>
                        <dt>Status</dt>
                        <dd>{movie.status}</dd>
                      </>
                    )}
                    {movie.budget > 0 && (
                      <>
                        <dt>Budget</dt>
                        <dd>${movie.budget.toLocaleString()}</dd>
                      </>
                    )}
                    {movie.revenue > 0 && (
                      <>
                        <dt>Revenue</dt>
                        <dd>${movie.revenue.toLocaleString()}</dd>
                      </>
                    )}
                    {movie.production_companies.length > 0 && (
                      <>
                        <dt>Production</dt>
                        <dd>
                          {movie.production_companies
                            .map((company) => company.name)
                            .join(", ")}
                        </dd>
                      </>
                    )}
                  </dl>
                </>
              )}
            </section>
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}

export default MovieDetails;
