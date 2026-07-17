// Placeholder shaped like MovieCard, shown while the browse grid is
// loading so the page doesn't collapse to a lone spinner and jump back.
const SkeletonCard = () => {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-poster" />
      <div className="p-5 space-y-2">
        <div className="skeleton-line w-3/4" />
        <div className="skeleton-line w-1/2" />
      </div>
    </div>
  );
};

export default SkeletonCard;
