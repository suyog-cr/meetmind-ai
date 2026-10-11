export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-1/3 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-6 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-6 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonDetails() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card p-6">
        <div className="h-6 bg-slate-200 rounded-lg w-1/2 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-1/4" />
      </div>
      <div className="card p-6">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
          <div className="h-3 bg-slate-100 rounded w-4/6" />
        </div>
      </div>
      <div className="card p-6">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="w-2 h-2 bg-slate-200 rounded-full mt-2 shrink-0" />
            <div className="h-4 bg-slate-100 rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
