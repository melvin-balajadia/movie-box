// Home page: cinematic hero + search, trending / recently-viewed / "because
// you saved" strips, and an infinite-scrolling browse grid with category tabs,
// genre filters, and a sort control (sort applies to genre browsing, which is
// the only mode TMDB's sort_by supports). Clicking any card navigates to the
// movie details page.
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDebounce } from "react-use";
import {
  LuSearch,
  LuTrendingUp,
  LuMonitorSmartphone,
  LuArrowRight,
} from "react-icons/lu";
import Search from "../components/Search";
import MovieCard from "../components/MovieCard";
import SkeletonCard from "../components/SkeletonCard";
import Spinner from "../components/Spinner";
import Footer from "../components/Footer";
import { useAuth } from "../components/AuthProvider";
import { getTrendingMovies, getWatchlistMovies, updateSearchCount } from "../utilities/supabase";
import { getRecentlyViewed } from "../utilities/recentlyViewed";
import {
  API_BASE_URL,
  API_OPTIONS,
  Genre,
  Movies,
  RecentlyViewedMovie,
  SpotlightMovie,
  TrendingMovie,
} from "../utilities/utils";

type Category = "popular" | "top_rated" | "upcoming" | "now_playing";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "top_rated", label: "Top Rated" },
  { key: "upcoming", label: "Upcoming" },
  { key: "now_playing", label: "Now Playing" },
];

const CATEGORY_ENDPOINTS: Record<Category, string> = {
  popular: "movie/popular",
  top_rated: "movie/top_rated",
  upcoming: "movie/upcoming",
  now_playing: "movie/now_playing",
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "title.asc", label: "Title (A–Z)" },
];

function buildEndpoint(
  query: string,
  genre: number | null,
  category: Category,
  sort: string,
  page: number
) {
  if (query) {
    return `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
      query
    )}&page=${page}`;
  }
  if (genre) {
    // A vote-count floor keeps "Highest Rated" from surfacing obscure titles
    // with a perfect score from a handful of votes.
    const ratingFloor =
      sort === "vote_average.desc" ? "&vote_count.gte=200" : "";
    return `${API_BASE_URL}/discover/movie?with_genres=${genre}&sort_by=${sort}${ratingFloor}&page=${page}`;
  }
  return `${API_BASE_URL}/${CATEGORY_ENDPOINTS[category]}?page=${page}`;
}

function Home() {
  const { user } = useAuth();

  const [debounceSearchTerm, setDebounceSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movieList, setMovieList] = useState<Movies[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedMovie[]>(
    []
  );
  const [spotlight, setSpotlight] = useState<SpotlightMovie | null>(null);
  const [recommendation, setRecommendation] = useState<{
    basedOn: string;
    movies: Movies[];
  } | null>(null);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("popular");
  const [sortBy, setSortBy] = useState("popularity.desc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useDebounce(() => setDebounceSearchTerm(searchTerm), 800, [searchTerm]);

  const fetchMovies = async (pageToLoad: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setInitialLoading(true);
      setErrorMessage("");
    }

    try {
      const endpoint = buildEndpoint(
        debounceSearchTerm,
        activeGenre,
        activeCategory,
        sortBy,
        pageToLoad
      );
      const response = await axios.get(endpoint, API_OPTIONS);
      const results: Movies[] = response.data.results || [];
      setTotalPages(response.data.total_pages || 1);

      setMovieList((prev) => {
        if (!append) return results;
        // TMDB can repeat a title across pages — dedupe by id so appended
        // pages don't create duplicate React keys or repeated cards.
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...results.filter((m) => !seen.has(m.id))];
      });

      if (debounceSearchTerm && pageToLoad === 1 && results.length > 0)
        await updateSearchCount(debounceSearchTerm, results[0]);
    } catch (error) {
      console.log(error);
      setErrorMessage(
        "Something went wrong while fetching movies. Please try again."
      );
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset to page 1 and reload whenever the query/filters change.
  useEffect(() => {
    setPage(1);
    fetchMovies(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceSearchTerm, activeCategory, activeGenre, sortBy]);

  // Infinite scroll: load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !initialLoading &&
          !loadingMore &&
          page < totalPages
        ) {
          const next = page + 1;
          setPage(next);
          fetchMovies(next, true);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages, initialLoading, loadingMore, debounceSearchTerm, activeCategory, activeGenre, sortBy]);

  useEffect(() => {
    getTrendingMovies().then((movies) => setTrendingMovies((movies as any) || []));
    axios
      .get(`${API_BASE_URL}/genre/movie/list`, API_OPTIONS)
      .then((res) => setGenres(res.data.genres || []))
      .catch((err) => console.log(err));
    axios
      .get(`${API_BASE_URL}/movie/popular?page=1`, API_OPTIONS)
      .then((res) => {
        const withBackdrop = (res.data.results || []).find(
          (movie: SpotlightMovie) => movie.backdrop_path
        );
        setSpotlight(withBackdrop || null);
      })
      .catch((err) => console.log(err));
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // "Because you saved X": seed recommendations from the user's most recently
  // saved movie. Only runs for signed-in users with something on their list.
  useEffect(() => {
    if (!user) {
      setRecommendation(null);
      return;
    }
    const loadRecommendation = async () => {
      const saved = await getWatchlistMovies(user.id);
      if (saved.length === 0) {
        setRecommendation(null);
        return;
      }
      const seed = saved[0];
      try {
        const res = await axios.get(
          `${API_BASE_URL}/movie/${seed.id}/recommendations`,
          API_OPTIONS
        );
        const movies = (res.data.results || []).slice(0, 8);
        if (movies.length > 0)
          setRecommendation({ basedOn: seed.title, movies });
      } catch (error) {
        console.log(error);
      }
    };
    loadRecommendation();
  }, [user]);

  const hasResults = movieList.length > 0;
  const noResultsForSearch =
    !initialLoading && !errorMessage && !hasResults && debounceSearchTerm !== "";
  const isBrowsing = debounceSearchTerm === "";

  return (
    <main>
      <div className="wrapper">
        {/* Cinematic hero: the current featured movie's backdrop sits behind
            the headline + search, so the page reads as a movie site at a
            glance. Falls back to a plain dark panel until the backdrop loads. */}
        <header className="home-hero">
          {spotlight?.backdrop_path && (
            <img
              className="home-hero-bg"
              src={`https://image.tmdb.org/t/p/w1280${spotlight.backdrop_path}`}
              alt=""
              aria-hidden="true"
            />
          )}
          <div className="home-hero-inner">
            <span className="home-hero-eyebrow">Now Showing</span>
            <h1>
              Find something <span className="accent-word">worth</span>{" "}
              watching
            </h1>
            <p className="home-hero-subtitle">
              Search thousands of titles, or see what everyone else is
              watching right now.
            </p>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {spotlight && (
              <Link to={`/movie/${spotlight.id}`} className="home-hero-featured">
                <span className="label">Featured</span>
                <span className="title">{spotlight.title}</span>
                <LuArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>
        </header>

        <section className="features">
          <div className="feature">
            <span className="icon">
              <LuSearch aria-hidden="true" />
            </span>
            <h3>Search Instantly</h3>
            <p>Look up any title from a catalog of thousands, pulled straight from TMDB.</p>
          </div>
          <div className="feature">
            <span className="icon">
              <LuTrendingUp aria-hidden="true" />
            </span>
            <h3>Real Trending Charts</h3>
            <p>Rankings based on what people are actually searching for right now.</p>
          </div>
          <div className="feature">
            <span className="icon">
              <LuMonitorSmartphone aria-hidden="true" />
            </span>
            <h3>Any Screen, Any Size</h3>
            <p>A layout that holds up just as well on your phone as it does on a desktop.</p>
          </div>
        </section>

        {trendingMovies.length > 0 && (
          <section className="poster-row">
            <p className="section-label">Ranked by searches</p>
            <h2>Trending Now</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <Link to={`/movie/${movie.movie_id}`} className="poster-tile">
                    <div className="poster-wrap">
                      <img src={movie.poster_url} alt={movie.title} />
                      <span className="rank">{index + 1}</span>
                    </div>
                    <p className="title">{movie.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentlyViewed.length > 0 && (
          <section className="poster-row">
            <p className="section-label">Pick up where you left off</p>
            <h2>Recently Viewed</h2>
            <ul>
              {recentlyViewed.map((movie) => (
                <li key={movie.id}>
                  <Link to={`/movie/${movie.id}`} className="poster-tile">
                    <div className="poster-wrap">
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                            : "/no-movie.png"
                        }
                        alt={movie.title}
                      />
                    </div>
                    <p className="title">{movie.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recommendation && (
          <section className="all-movies">
            <p className="section-label">From your watchlist</p>
            <h2>Because you saved {recommendation.basedOn}</h2>
            <ul className="more-like-this">
              {recommendation.movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>Browse All Movies</h2>

          {isBrowsing && (
            <div className="browse-toolbar">
              {/* Category stays a quick-tap segmented control; genre and sort
                  are compact dropdowns so the row stays clean. */}
              <div className="filter-group">
                <p className="filter-label">Category</p>
                <div className="category-tabs">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.key}
                      className={`category-tab ${
                        activeCategory === category.key && !activeGenre
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setActiveCategory(category.key);
                        setActiveGenre(null);
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="toolbar-selects">
                {genres.length > 0 && (
                  <div className="filter-group">
                    <label className="filter-label" htmlFor="genre-select">
                      Genre
                    </label>
                    <select
                      id="genre-select"
                      className="sort-select"
                      value={activeGenre ?? ""}
                      onChange={(e) =>
                        setActiveGenre(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    >
                      <option value="">All Genres</option>
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sort only applies to genre browsing — TMDB's search and
                    category endpoints don't honor sort_by. */}
                {activeGenre && (
                  <div className="filter-group">
                    <label className="filter-label" htmlFor="sort-select">
                      Sort by
                    </label>
                    <select
                      id="sort-select"
                      className="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {initialLoading && (
            <ul>
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </ul>
          )}

          {!initialLoading && errorMessage && (
            <div className="state-message">
              <p className="text-red-600 font-semibold">{errorMessage}</p>
            </div>
          )}

          {!initialLoading && !errorMessage && noResultsForSearch && (
            <div className="state-message">
              <p className="font-semibold text-ink">
                No matches for &ldquo;{debounceSearchTerm}&rdquo;
              </p>
              <p className="text-sm">Try a different title.</p>
            </div>
          )}

          {!initialLoading && !errorMessage && hasResults && (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

          {/* Sentinel + spinner drive infinite scroll (replaces Prev/Next). */}
          {!initialLoading && hasResults && page < totalPages && (
            <div ref={sentinelRef} className="load-more-sentinel">
              {loadingMore && <Spinner />}
            </div>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

export default Home;
