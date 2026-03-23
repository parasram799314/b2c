// ui/layout/FilterTabBar.jsx
export default function FilterTabBar({ filters = [], active, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 ${className}`}>
      {filters.map((f) => {
        const isActive = active === f.id || (Array.isArray(active) && active.includes(f.id));
        return (
          <button
            key={f.id}
            onClick={() => onChange?.(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
              isActive
                ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gold-300 hover:text-gold-600'
            }`}
          >
            {f.icon && <span>{f.icon}</span>}
            {f.label}
            {f.count != null && (
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-70' : 'text-gray-400'}`}>
                ({f.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}