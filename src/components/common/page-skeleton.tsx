/** Sahifa yuklanayotganda (loading.tsx): sarlavha, kartochkalar va ro'yxat shakli */
export function PageSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      role="status"
      aria-label="Yuklanmoqda"
    >
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-7 w-2/3 max-w-sm rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-muted h-20 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="bg-muted h-12 rounded-lg" />
        ))}
      </div>
      <span className="sr-only">Yuklanmoqda...</span>
    </div>
  );
}
