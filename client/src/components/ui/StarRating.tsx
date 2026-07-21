type StarRatingProps = {
  rating: number;
  max?: number;
};

export function StarRating({ rating, max = 5 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < rating;
        return (
          <svg
            key={index}
            viewBox="0 0 20 20"
            className={`h-4 w-4 ${filled ? 'text-accent' : 'text-slate-300 dark:text-slate-600'}`}
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M10 1.5 12.6 7l6 .5-4.6 3.9 1.4 5.8L10 14.4 4.6 17.2l1.4-5.8L1.4 7.5l6-.5L10 1.5Z"
            />
          </svg>
        );
      })}
    </div>
  );
}
