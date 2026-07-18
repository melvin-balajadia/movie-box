// No trailing slash — callers all append `/path`, so this avoids the `/3//path`
// double slash TMDB was tolerating.
export const API_BASE_URL = "https://api.themoviedb.org/3";
export const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

// Home Page
export type Movies = {
  id: number;
  title: string;
  vote_average: number;
  poster_path: string;
  release_date: string;
  original_language: string;
};

export type TrendingMovie = {
  $id: string;
  movie_id: number;
  title: string;
  poster_url: string;
};

// A popular movie with enough fields to headline the home page spotlight banner.
export type SpotlightMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
};

// A row from TMDB's /search/multi — movies, people (and TV, which we filter
// out for now since there are no TV pages yet). Fields vary by media_type.
export type MultiSearchResult = {
  id: number;
  media_type: "movie" | "person" | "tv";
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  known_for_department?: string;
};

// Movie Details Page
export type Genre = {
  id: number;
  name: string;
};

export type ProductionCompany = {
  id: number;
  name: string;
  logo_path: string | null;
};

export type CollectionSummary = {
  id: number;
  name: string;
  poster_path: string | null;
};

export type MovieDetail = {
  id: number;
  title: string;
  tagline: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
  runtime: number;
  original_language: string;
  genres: Genre[];
  status: string;
  budget: number;
  revenue: number;
  production_companies: ProductionCompany[];
  belongs_to_collection: CollectionSummary | null;
};

export type Collection = {
  id: number;
  name: string;
  overview: string;
  parts: Movies[];
};

// TV Details Page. TMDB uses different field names for TV (name/first_air_date
// vs title/release_date), so this is its own type.
export type TvDetail = {
  id: number;
  name: string;
  tagline: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  original_language: string;
  genres: Genre[];
  status: string;
  networks: { id: number; name: string }[];
  created_by: { id: number; name: string }[];
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
};

export type Credits = {
  cast: CastMember[];
  crew: CrewMember[];
};

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

export type WatchProviderRegion = {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type WatchProvidersResponse = {
  results: Record<string, WatchProviderRegion>;
};

export type Review = {
  id: string;
  author: string;
  content: string;
  author_details: { rating: number | null };
};

// Recently Viewed (localStorage)
export type RecentlyViewedMovie = {
  id: number;
  title: string;
  poster_path: string;
};

// Person Page
export type Person = {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
};

export type PersonMovieCredit = {
  id: number;
  title: string;
  character: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  original_language: string;
  popularity: number;
};

// Watchlist / Ratings (Supabase, scoped to the signed-in user). media_type
// distinguishes a saved movie from a TV show (same id space can collide).
export type MediaType = "movie" | "tv";

export type WatchlistMovie = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  original_language: string;
  media_type: MediaType;
};

// A rated movie is a watchlist-shaped movie plus the user's 1–5 star rating.
export type RatedMovie = WatchlistMovie & {
  rating: number;
};

// Video Player — works for either a movie or a TV show.
export type VideoPlayerProps = {
  movieId: number;
  mediaType?: "movie" | "tv";
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};
