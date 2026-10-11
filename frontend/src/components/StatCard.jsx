import { Link } from 'react-router-dom';

export default function StatCard({ label, value, icon: Icon, color = 'violet', loading = false, to }) {
  const colorMap = {
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600', hover: 'hover:border-violet-200 hover:shadow-violet-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', hover: 'hover:border-blue-200 hover:shadow-blue-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', hover: 'hover:border-amber-200 hover:shadow-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', hover: 'hover:border-red-200 hover:shadow-red-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', hover: 'hover:border-emerald-200 hover:shadow-emerald-100' },
  };

  const colors = colorMap[color] || colorMap.violet;

  const content = (
    <>
      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={colors.icon} size={22} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md mt-1" />
        ) : (
          <p className={`text-2xl font-bold ${colors.text}`}>{value ?? 0}</p>
        )}
        {to && !loading && (
          <p className="text-xs text-slate-400 mt-0.5">Click to view →</p>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={typeof to === 'string' ? to : to.pathname}
        state={typeof to === 'object' ? to.state : undefined}
        className={`card p-6 flex items-center gap-4 transition-all duration-200 hover:shadow-md ${colors.hover} cursor-pointer`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="card p-6 flex items-center gap-4">
      {content}
    </div>
  );
}
