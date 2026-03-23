// ui/primitives/EmptyState.jsx
export default function EmptyState({ icon = '📭', title = 'Nothing here', description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-sm font-bold text-gray-600 mb-1">{title}</div>
      {description && (
        <div className="text-xs text-gray-400 max-w-xs leading-relaxed">{description}</div>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-semibold text-gold-600 border border-gold-200 rounded-full px-4 py-2 hover:bg-gold-50 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}