// Placeholder shown while a movie's details load — mirrors the real layout
// (backdrop banner + poster + text rows) so the page doesn't jump on load.
const DetailsSkeleton = () => {
  return (
    <div className="skeleton-pulse">
      <div className="skeleton-block h-48 sm:h-72 w-full rounded-3xl" />
      <div className="mt-6 flex flex-col sm:flex-row gap-6">
        <div className="skeleton-block w-32 sm:w-44 h-48 sm:h-64 shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="skeleton-line h-6 w-2/3" />
          <div className="skeleton-line w-1/3" />
          <div className="skeleton-line w-1/2" />
          <div className="skeleton-line w-1/4" />
        </div>
      </div>
      <div className="mt-10 space-y-3">
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-3/4" />
      </div>
    </div>
  );
};

export default DetailsSkeleton;
