export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-navy-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-white shadow-card" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-white shadow-card" />
    </div>
  );
}
