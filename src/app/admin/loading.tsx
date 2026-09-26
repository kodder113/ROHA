export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-40 rounded bg-navy-100" />
      <div className="h-8 w-72 rounded bg-navy-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white shadow-card" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white shadow-card" />
    </div>
  );
}
