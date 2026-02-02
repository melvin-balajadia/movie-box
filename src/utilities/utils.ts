export const API_BASE_URL = "https://api.themoviedb.org/3/";
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
  title: string;
  poster_url: string;
};

// Video Player
export type VideoPlayerProps = {
  movieId: number;
};

export type Video = {
  id: string;
  key: string;
  site: string;
  type: string;
};
