// Embeds the movie's YouTube trailer (if TMDB has one on file) in a
// responsive 16:9 frame. Shows a plain message when no trailer exists.
import { useState, useEffect } from "react";
import axios from "axios";
import {
  API_BASE_URL,
  API_OPTIONS,
  Video,
  VideoPlayerProps,
} from "../utilities/utils";

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId }) => {
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const endpoint = `${API_BASE_URL}/movie/${movieId}/videos`;
        const response = await axios.get<{ results: Video[] }>(
          endpoint,
          API_OPTIONS
        );

        const videos = response.data.results;
        const trailer = videos.find(
          (video) => video.type === "Trailer" && video.site === "YouTube"
        );

        if (trailer) setVideoKey(trailer.key);
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setChecked(true);
      }
    };

    fetchVideo();
  }, [movieId]);

  if (!checked) return null;

  return videoKey ? (
    <div className="video-frame">
      <iframe
        src={`https://www.youtube.com/embed/${videoKey}`}
        title="Movie Trailer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  ) : (
    <p className="text-ink-soft text-sm">No trailer available.</p>
  );
};

export default VideoPlayer;
