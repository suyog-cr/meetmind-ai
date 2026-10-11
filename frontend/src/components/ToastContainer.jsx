import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="text-emerald-500" size={18} />,
  error: <XCircle className="text-red-500" size={18} />,
  info: <Info className="text-blue-500" size={18} />,
  warning: <AlertTriangle className="text-amber-500" size={18} />,
};

const styles = {
  success: 'border-emerald-100 bg-emerald-50',
  error: 'border-red-100 bg-red-50',
  info: 'border-blue-100 bg-blue-50',
  warning: 'border-amber-100 bg-amber-50',
};

export default function ToastContainer({ toasts = [], onRemove }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${styles[toast.type] || styles.info} animate-slide-in`}
        >
          <span className="shrink-0 mt-0.5">{icons[toast.type] || icons.info}</span>
          <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
          {onRemove && (
            <button
              onClick={() => onRemove(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
