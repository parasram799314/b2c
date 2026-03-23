// ui/primitives/Stepper.jsx
export default function Stepper({ value, onChange, min = 1, max = 30, label }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gold-400 hover:text-gold-500 font-bold text-base transition-all leading-none"
      >−</button>
      <span className="text-sm font-bold text-gray-800 min-w-[1.25rem] text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        type="button"
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gold-400 hover:text-gold-500 font-bold text-base transition-all leading-none"
      >+</button>
    </div>
  );
}