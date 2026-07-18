// Plays the movie's YouTube trailers/teasers in a responsive 16:9 frame.
// When there's more than one, a thumbnail rail lets you switch between them.
import { useState, useEffect } from "react";
import axios from "axios";
import {
  API_BASE_URL,
  API_OPTIONS,
  Video,
  VideoPlayerProps,
} from "../utilities/utils";

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movieId,
  mediaType = "movie",
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(false);
    setVideos([]);
    setSelectedKey(null);

    const fetchVideos = async () => {
      try {
        const response = await axios.get<{ results: Video[] }>(
          `${API_BASE_URL}/${mediaType}/${movieId}/videos`,
          API_OPTIONS
        );
        const youtube = response.data.results.filter(
          (v) => v.site === "YouTube"
        );
        // Prefer trailers/teasers; fall back to any YouTube clip.
        const preferred = youtube.filter(
          (v) => v.type === "Trailer" || v.type === "Teaser"
        );
        const list = (preferred.length ? preferred : youtube).slice(0, 8);
        setVideos(list);
        setSelectedKey(list[0]?.key ?? null);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setChecked(true);
      }
    };

    fetchVideos();
  }, [movieId, mediaType]);

  if (!checked) return null;
  if (!selectedKey) return <p className="text-ink-soft text-sm">No trailer available.</p>;

  return (
    <>
      <div className="video-frame">
        <iframe
          src={`https://www.youtube.com/embed/${selectedKey}`}
          title="Movie Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {videos.length > 1 && (
        <ul className="video-rail">
          {videos.map((video) => (
            <li key={video.id}>
              <button
                type="button"
                className={`video-thumb ${
                  video.key === selectedKey ? "active" : ""
                }`}
                onClick={() => setSelectedKey(video.key)}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                  alt=""
                  aria-hidden="true"
                />
                <span className="video-name">{video.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default VideoPlayer;
