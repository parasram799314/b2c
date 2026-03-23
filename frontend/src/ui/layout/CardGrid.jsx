// ui/layout/CardGrid.jsx

export function SectionHeader({ icon, title, subtitle, action, onAction }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="w-7 h-7 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gold-600 text-sm">{icon}</span>
          </div>
        )}
        <div>
          <div className="font-bold text-sm text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="text-xs text-gold-600 font-semibold hover:underline flex-shrink-0"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// Horizontal scroll card grid (flights, hotels style)
export function CardGrid({ children, horizontal = false, cols = 2, className = '' }) {
  if (horizontal) {
    return (
      <div className={`flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 ${className}`}>
        {children}
      </div>
    );
  }
  return (
    <div className={`grid gap-3 ${
      cols === 1 ? 'grid-cols-1' :
      cols === 2 ? 'grid-cols-2' :
      cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
    } ${className}`}>
      {children}
    </div>
  );
}

export function PageTopBar({ title, subtitle, onBack, actions }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all flex-shrink-0"
        >
          ←
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-gray-900 truncate">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}