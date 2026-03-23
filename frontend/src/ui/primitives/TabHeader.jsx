// ui/primitives/TabHeader.jsx
export default function TabHeader({ tabs = [], active, onChange }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange?.(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            active === tab.id
              ? 'bg-gold-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.count != null && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              active === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}