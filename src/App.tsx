import { useEffect, useState } from "react";
import Search from "./components/Search";
import axios from "axios";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import {
  getTrendingMovies,
  updateSearchCount,
} from "../src/utilities/appwrite";
import {
  API_BASE_URL,
  API_OPTIONS,
  Movies,
  TrendingMovie,
} from "./utilities/utils";

function App() {
  const [debounceSearchTerm, setDebounceSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movieList, setMovieList] = useState<Movies[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useDebounce(
    () => {
      setCurrentPage(1);
      setDebounceSearchTerm(searchTerm);
    },
    1500,
    [searchTerm]
  );

  const fetchMovies = async (query = "", page = 1) => {
    setLoading(true);
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
            query
          )}&page=${page}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}`;

      const response = await axios.get(endpoint, API_OPTIONS);
      setMovieList(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);

      if (query && response.data.results.length > 0)
        await updateSearchCount(query, response.data.results[0]);
    } catch (error) {
      console.log(error);
      setErrorMessage(
        "Something went wrong while fetching movies. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies as any);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchMovies(debounceSearchTerm, newPage);
  };

  useEffect(() => {
    fetchMovies(debounceSearchTerm, currentPage);
  }, [debounceSearchTerm, currentPage]);

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <h1>
              Find <span className="text-gradient">Movies</span> You'll Enjoy
              Without the Hassle
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>
          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>
              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="all-movies">
            <h2>All Movies</h2>
            {loading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-3 justify-end">
                <button
                  className="bg-gray-900 text-gray-50 px-2 py-1.5 rounded-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-gray-50">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="bg-gray-900 text-gray-50 px-2 py-1.5 rounded-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
