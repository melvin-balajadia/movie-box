// A rail of backdrop stills for a movie. Clicking one opens it full-size in a
// lightbox overlay (click anywhere or press Escape to close).
import { useState, useEffect } from "react";
import axios from "axios";
import { LuX } from "react-icons/lu";
import { API_BASE_URL, API_OPTIONS } from "../utilities/utils";

const MovieGallery: React.FC<{
  movieId: number;
  mediaType?: "movie" | "tv";
}> = ({ movieId, mediaType = "movie" }) => {
  const [backdrops, setBackdrops] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    setBackdrops([]);
    setLightbox(null);

    const fetchImages = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/${mediaType}/${movieId}/images`,
          API_OPTIONS
        );
        const paths = (response.data.backdrops || [])
          .map((b: { file_path: string }) => b.file_path)
          .slice(0, 12);
        setBackdrops(paths);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [movieId, mediaType]);

  // Close the lightbox on Escape while it's open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (backdrops.length === 0) return null;

  return (
    <>
      <h2>Photos</h2>
      <ul className="gallery-rail">
        {backdrops.map((path) => (
          <li key={path}>
            <button
              type="button"
              className="gallery-thumb"
              onClick={() =>
                setLightbox(`https://image.tmdb.org/t/p/original${path}`)
              }
              aria-label="View photo"
            >
              <img
                src={`https://image.tmdb.org/t/p/w780${path}`}
                alt=""
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      {lightbox && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button
            type="button"
            className="lightbox-close"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          >
            <LuX aria-hidden="true" />
          </button>
          <img src={lightbox} alt="" />
        </div>
      )}
    </>
  );
};

export default MovieGallery;
