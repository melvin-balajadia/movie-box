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
      }
    };

    fetchVideo();
  }, [movieId]);

  return (
    <div>
      {videoKey ? (
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${videoKey}`}
          title="Movie Trailer"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <p>No trailer available</p>
      )}
    </div>
  );
};

export default VideoPlayer;
