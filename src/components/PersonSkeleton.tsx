// Placeholder shown while a cast member's page loads — photo + info rows.
const PersonSkeleton = () => {
  return (
    <div className="skeleton-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="skeleton-block w-32 sm:w-40 h-44 sm:h-56 shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="skeleton-line h-6 w-1/2" />
          <div className="skeleton-line w-1/4" />
          <div className="skeleton-line w-1/3" />
        </div>
      </div>
      <div className="mt-10 space-y-3">
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-2/3" />
      </div>
    </div>
  );
};

export default PersonSkeleton;
