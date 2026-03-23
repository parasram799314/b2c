// ui/feedback/ErrorBanner.jsx
export default function ErrorBanner({ message, onRetry, className = '' }) {
  if (!message) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 ${className}`}>
      <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-red-700">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-red-500 hover:underline mt-1 font-semibold"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}