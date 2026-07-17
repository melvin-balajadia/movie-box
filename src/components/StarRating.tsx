// 1–5 star rating widget. Interactive by default (click a star to set,
// hover to preview, click the current rating again to clear); pass readOnly
// to render a static display of an existing rating.
import { useState } from "react";
import { LuStar } from "react-icons/lu";

type StarRatingProps = {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
};

const STARS = [1, 2, 3, 4, 5];

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const [hover, setHover] = useState(0);

  if (readOnly) {
    return (
      <div className="star-rating readonly" aria-label={`Rated ${value} out of 5`}>
        {STARS.map((star) => (
          <LuStar
            key={star}
            aria-hidden="true"
            className={star <= value ? "filled" : ""}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="star-rating">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button ${star <= (hover || value) ? "filled" : ""}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          // Clicking the currently-set rating clears it.
          onClick={() => onChange?.(star === value ? 0 : star)}
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          aria-pressed={star <= value}
        >
          <LuStar aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
