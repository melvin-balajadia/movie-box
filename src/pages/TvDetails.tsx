// TV show details page — mirrors the movie details page but for TV's data
// shape (name/first_air_date, seasons/episodes, creators, networks). Reuses
// the shared VideoPlayer / MovieGallery / MovieCard components in "tv" mode.
// Watchlist/ratings are movie-only for now, so they're omitted here.
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
import MovieGallery from "../components/MovieGallery";
import MovieCard from "../components/MovieCard";
import StarRating from "../components/StarRating";
import Footer from "../components/Footer";
import { useWatchlist } from "../components/WatchlistProvider";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { usePageTitle } from "../utilities/usePageTitle";
import {
  getUserRating,
  setRating,
  removeRating,
} from "../utilities/supabase";
import {
  API_BASE_URL,
  API_OPTIONS,
  Credits,
  Movies,
  Review,
  TvDetail,
  WatchProviderRegion,
  WatchProvidersResponse,
} from "../utilities/utils";

const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const regionName = (code: string) => {
  try {
    return REGION_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
};

// TV recommendations come back with name/first_air_date; normalize to the
// card's movie-ish shape so MovieCard can render them (in "tv" mode).
const toCard = (show: any): Movies => ({
  id: show.id,
  title: show.name,
  vote_average: show.vote_average,
  poster_path: show.poster_path,
  release_date: show.first_air_date || "",
  original_language: show.original_language,
});

function TvDetails() {
  const { id } = useParams<{ id: string }>();

  const [show, setShow] = useState<TvDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [credits, setCredits] = useState<Credits | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [watchRegions, setWatchRegions] = useState<
    Record<string, WatchProviderRegion>
  >({});
  const [region, setRegion] = useState("US");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const { isSaved, toggle } = useWatchlist();
  const { user, openAuthModal } = useAuth();
  const { show: showToast } = useToast();

  useEffect(() => {
    if (!user || !id) {
      setUserRating(0);
      return;
    }
    getUserRating(user.id, Number(id), "tv").then((r) => setUserRating(r ?? 0));
  }, [user, id]);

  useEffect(() => {
    const fetchShow = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await axios.get<TvDetail>(
          `${API_BASE_URL}/tv/${id}`,
          API_OPTIONS
        );
        setShow(response.data);
      } catch (error) {
        console.log(error);
        setErrorMessage(
          "Something went wrong while fetching this show. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
  }, [id]);

  useEffect(() => {
    setCredits(null);
    setRecommendations([]);
    setWatchRegions({});
    setReviews([]);

    const fetchExtras = async () => {
      try {
        const res = await axios.get<Credits>(
          `${API_BASE_URL}/tv/${id}/credits`,
          API_OPTIONS
        );
        setCredits(res.data);
      } catch (error) {
        console.log(error);
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/tv/${id}/recommendations`,
          API_OPTIONS
        );
        setRecommendations((res.data.results || []).slice(0, 8));
      } catch (error) {
        console.log(error);
      }
      try {
        const res = await axios.get<WatchProvidersResponse>(
          `${API_BASE_URL}/tv/${id}/watch/providers`,
          API_OPTIONS
        );
        setWatchRegions(res.data.results || {});
      } catch (error) {
        console.log(error);
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/tv/${id}/reviews`,
          API_OPTIONS
        );
        setReviews((res.data.results || []).slice(0, 3));
      } catch (error) {
        console.log(error);
      }
    };
    fetchExtras();
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  // Watchlist/rating payload for this show (media_type "tv").
  const asItem = show && {
    id: show.id,
    title: show.name,
    poster_path: show.poster_path,
    vote_average: show.vote_average,
    release_date: show.first_air_date || "",
    original_language: show.original_language,
    media_type: "tv" as const,
  };

  const handleRate = (rating: number) => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!asItem) return;
    setUserRating(rating);
    if (rating === 0) {
      removeRating(user.id, asItem.id, "tv");
      showToast("Rating removed");
    } else {
      setRating(user.id, asItem, rating);
      showToast(`Rated ${rating}/5`);
    }
  };

  usePageTitle(show?.name);

  const availableRegions = Object.keys(watchRegions).sort();
  const activeRegion = watchRegions[region] ? region : availableRegions[0];
  const watchProviders = activeRegion ? watchRegions[activeRegion] : null;
  const watchProviderList = watchProviders?.flatrate?.length
    ? { label: "Stream on", providers: watchProviders.flatrate }
    : watchProviders?.rent?.length
    ? { label: "Rent on", providers: watchProviders.rent }
    : watchProviders?.buy?.length
    ? { label: "Buy on", providers: watchProviders.buy }
    : null;

  const runtime = show?.episode_run_time?.[0];
  const hasFacts =
    show && (show.status || show.networks?.length || show.number_of_episodes);

  return (
    <main>
      <div className="wrapper">
        <div className="details-toolbar">
          <Link to="/" className="back-link">
            <LuArrowLeft aria-hidden="true" />
            Back to search
          </Link>
          {show && (
            <button type="button" className="share-button" onClick={handleShare}>
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

        {!loading && !errorMessage && show && (
          <>
            <section className="details-hero">
              {show.backdrop_path && (
                <img
                  className="backdrop"
                  src={`https://image.tmdb.org/t/p/w1280${show.backdrop_path}`}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <div
                className={`details-hero-content ${
                  show.backdrop_path ? "" : "no-backdrop"
                }`}
              >
                <img
                  className="poster"
                  src={
                    show.poster_path
                      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                      : "/no-movie.png"
                  }
                  alt={show.name}
                />
                <div>
                  <h1 className="page-heading">{show.name}</h1>
                  {show.tagline && <p className="tagline">{show.tagline}</p>}
                  <div className="meta-row">
                    <span className="rating-pill">
                      <LuStar aria-hidden="true" />
                      {show.vote_average ? show.vote_average.toFixed(1) : "N/A"}
                      <span className="text-ink-soft font-normal">
                        ({show.vote_count.toLocaleString()})
                      </span>
                    </span>
                    <span>
                      {show.first_air_date
                        ? show.first_air_date.split("-")[0]
                        : "N/A"}
                    </span>
                    <span>
                      {show.number_of_seasons}{" "}
                      {show.number_of_seasons === 1 ? "season" : "seasons"}
                    </span>
                    {runtime ? (
                      <span className="flex items-center gap-1">
                        <LuClock aria-hidden="true" />~{runtime}m/ep
                      </span>
                    ) : null}
                    <span className="capitalize">{show.original_language}</span>
                  </div>
                  {show.genres.length > 0 && (
                    <div className="genres">
                      {show.genres.map((genre) => (
                        <span key={genre.id} className="genre-chip">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {asItem && (
                    <button
                      type="button"
                      className={`watchlist-button ${
                        isSaved(show.id, "tv") ? "saved" : ""
                      }`}
                      onClick={() => toggle(asItem)}
                    >
                      {isSaved(show.id, "tv") ? (
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
                  )}
                </div>
              </div>
            </section>

            <section className="details-body">
              <h2>Your Rating</h2>
              <div className="rating-row">
                <StarRating value={userRating} onChange={handleRate} />
                <span className="rating-hint">
                  {!user
                    ? "Sign in to rate this show"
                    : userRating > 0
                    ? `You rated this ${userRating}/5`
                    : "Tap a star to rate"}
                </span>
              </div>

              <h2>Overview</h2>
              <p className="overview-text">
                {show.overview || "No overview available."}
              </p>

              {credits && (credits.cast.length > 0 || show.created_by.length > 0) && (
                <>
                  <h2>Cast &amp; Crew</h2>
                  {show.created_by.length > 0 && (
                    <p className="director-line">
                      Created by{" "}
                      <strong>
                        {show.created_by.map((c) => c.name).join(", ")}
                      </strong>
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
                  <div className="watch-header">
                    <p className="text-sm text-ink-soft">
                      {watchProviderList.label}
                    </p>
                    {availableRegions.length > 1 && (
                      <select
                        className="sort-select"
                        value={activeRegion}
                        onChange={(e) => setRegion(e.target.value)}
                        aria-label="Region"
                      >
                        {availableRegions.map((code) => (
                          <option key={code} value={code}>
                            {regionName(code)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
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
              <VideoPlayer movieId={show.id} mediaType="tv" />

              <MovieGallery movieId={show.id} mediaType="tv" />

              {recommendations.length > 0 && (
                <>
                  <h2>More Like This</h2>
                  <ul className="more-like-this">
                    {recommendations.map((rec) => (
                      <MovieCard key={rec.id} movie={toCard(rec)} mediaType="tv" />
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
                    {show.status && (
                      <>
                        <dt>Status</dt>
                        <dd>{show.status}</dd>
                      </>
                    )}
                    {show.number_of_episodes > 0 && (
                      <>
                        <dt>Episodes</dt>
                        <dd>{show.number_of_episodes}</dd>
                      </>
                    )}
                    {show.networks?.length > 0 && (
                      <>
                        <dt>Network</dt>
                        <dd>{show.networks.map((n) => n.name).join(", ")}</dd>
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

export default TvDetails;
