// Search box with an autocomplete dropdown. As you type it queries TMDB's
// multi-search (movies + people) and shows quick suggestions that link
// straight to the relevant page; when focused and empty it offers recent
// searches. The text still drives the home grid's movie search via the
// searchTerm prop.
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "react-use";
import { LuSearch } from "react-icons/lu";
import axios from "axios";
import {
  API_BASE_URL,
  API_OPTIONS,
  MultiSearchResult,
} from "../utilities/utils";
import { getRecentSearches, addRecentSearch } from "../utilities/recentSearches";

type SearchProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

const Search: React.FC<SearchProps> = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const [suggestions, setSuggestions] = useState<MultiSearchResult[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setRecent(getRecentSearches()), []);

  useDebounce(() => setDebounced(searchTerm.trim()), 300, [searchTerm]);

  // Fetch suggestions for the debounced term (movies + people only).
  useEffect(() => {
    if (debounced === "") {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    axios
      .get(
        `${API_BASE_URL}/search/multi?query=${encodeURIComponent(debounced)}`,
        API_OPTIONS
      )
      .then((res) => {
        if (cancelled) return;
        const results: MultiSearchResult[] = (res.data.results || [])
          .filter(
            (r: MultiSearchResult) =>
              r.media_type === "movie" ||
              r.media_type === "tv" ||
              r.media_type === "person"
          )
          .slice(0, 7);
        setSuggestions(results);
      })
      .catch((err) => console.log(err));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // Close the dropdown when clicking outside the search box.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToResult = (result: MultiSearchResult) => {
    const label = result.title || result.name || "";
    setRecent(addRecentSearch(label));
    setOpen(false);
    navigate(
      result.media_type === "person"
        ? `/person/${result.id}`
        : result.media_type === "tv"
        ? `/tv/${result.id}`
        : `/movie/${result.id}`
    );
  };

  const runRecent = (term: string) => {
    setSearchTerm(term);
    setRecent(addRecentSearch(term));
  };

  const showRecent = searchTerm.trim() === "" && recent.length > 0;
  const showSuggestions = suggestions.length > 0;

  return (
    <div className="ticket-search" ref={containerRef}>
      <div className="ticket-search-row">
        <LuSearch aria-hidden="true" />
        <input
          type="text"
          placeholder="Search movies & people..."
          aria-label="Search for a movie or person"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (showRecent || showSuggestions) && (
        <div className="search-dropdown">
          {showRecent && (
            <>
              <p className="search-dropdown-label">Recent searches</p>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="search-recent"
                  onClick={() => runRecent(term)}
                >
                  <LuSearch aria-hidden="true" />
                  {term}
                </button>
              ))}
            </>
          )}

          {showSuggestions &&
            suggestions.map((result) => {
              const label = result.title || result.name || "Untitled";
              const image =
                result.media_type === "person"
                  ? result.profile_path
                  : result.poster_path;
              const typeLabel =
                result.media_type === "person"
                  ? "Person"
                  : result.media_type === "tv"
                  ? "TV Show"
                  : "Movie";
              const year =
                result.media_type === "tv"
                  ? result.first_air_date?.split("-")[0]
                  : result.release_date?.split("-")[0];
              const sub =
                result.media_type === "person"
                  ? result.known_for_department || "Acting"
                  : year || typeLabel;
              return (
                <button
                  key={`${result.media_type}-${result.id}`}
                  type="button"
                  className="search-suggestion"
                  onClick={() => goToResult(result)}
                >
                  <img
                    src={
                      image
                        ? `https://image.tmdb.org/t/p/w92${image}`
                        : "/no-movie.png"
                    }
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="search-suggestion-text">
                    <span className="title">{label}</span>
                    <span className="sub">
                      {typeLabel}
                      {" · "}
                      {sub}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Search;
