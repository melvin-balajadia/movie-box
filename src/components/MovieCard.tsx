// A movie tile: poster with an amber rating badge and a watchlist toggle on
// the corners, then title/year/language below. Links to the details page.
import { Link } from "react-router-dom";
import { LuBookmark, LuBookmarkCheck } from "react-icons/lu";
import { useWatchlist } from "./WatchlistProvider";

type Movie = {
  id: number;
  title: string;
  vote_average: number;
  poster_path: string;
  release_date: string;
  original_language: string;
};

// mediaType controls the link target (/movie or /tv) and which watchlist
// bucket the bookmark writes to.
const MovieCard: React.FC<{
  movie: Movie;
  mediaType?: "movie" | "tv";
}> = ({
  movie: {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
  },
  mediaType = "movie",
}) => {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(id, mediaType);

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggle({
      id,
      title,
      poster_path,
      vote_average,
      release_date,
      original_language,
      media_type: mediaType,
    });
  };

  return (
    <Link to={`/${mediaType}/${id}`} className="movie-card">
      <div className="poster">
        <img
          src={
            poster_path
              ? `https://image.tmdb.org/t/p/w500/${poster_path}`
              : "/no-movie.png"
          }
          alt={title}
        />
        <span className="rating-stamp">
          {vote_average ? vote_average.toFixed(1) : "N/A"}
        </span>
        <button
          type="button"
          className={`watchlist-toggle ${saved ? "saved" : ""}`}
          onClick={handleToggle}
          aria-pressed={saved}
          aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
          title={saved ? "Remove from watchlist" : "Add to watchlist"}
        >
          {saved ? (
            <LuBookmarkCheck aria-hidden="true" />
          ) : (
            <LuBookmark aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="details">
        <h3>{title}</h3>

        <div className="meta">
          <span className="capitalize">{original_language}</span>
          <span className="dot">&bull;</span>
          <span>{release_date ? release_date.split("-")[0] : "N/A"}</span>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
