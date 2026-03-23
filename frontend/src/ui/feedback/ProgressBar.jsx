// ui/feedback/ProgressBar.jsx
export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercent = true,
  color = 'gold',
  className = '',
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  const barColor = {
    gold:  'bg-gold-400',
    green: 'bg-green-400',
    blue:  'bg-blue-400',
    red:   'bg-red-400',
  }[color] || 'bg-gold-400';

  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-semibold text-gray-600">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-bold text-gold-600">{value}/{max}</span>
          )}
        </div>
      )}

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {showPercent && (
        <div className="text-xs text-gray-400 mt-1">{pct}% complete</div>
      )}
    </div>
  );
}