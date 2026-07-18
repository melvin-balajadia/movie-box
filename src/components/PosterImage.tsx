// A poster <img> that falls back to a branded placeholder (clapperboard +
// title on a subtle amber-tinted gradient) when the poster is missing or fails
// to load — instead of a broken-image icon. Used anywhere a poster is shown.
import { useState } from "react";
import { LuClapperboard } from "react-icons/lu";

type PosterImageProps = {
  src: string | null | undefined;
  alt: string;
};

// TMDB paths can come through as ".../null" or ".../undefined" when a title
// has no poster, so treat those as missing too.
const isValid = (src: string | null | undefined) =>
  !!src && !src.endsWith("null") && !src.endsWith("undefined");

const PosterImage: React.FC<PosterImageProps> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!isValid(src) || failed) {
    return (
      <div className="poster-fallback" role="img" aria-label={alt}>
        <LuClapperboard aria-hidden="true" />
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src as string}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export default PosterImage;
