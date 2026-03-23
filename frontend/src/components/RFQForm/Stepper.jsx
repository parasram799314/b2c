export default function Stepper({ value, onChange, min = 0, max = 99 }) {
  const dec = () => { if (value > min) onChange(value - 1); };
  const inc = () => { if (value < max) onChange(value + 1); };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full justify-between">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
      >
        −
      </button>
      <span className="text-sm font-semibold text-gray-800 min-w-[1.5rem] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
      >
        +
      </button>
    </div>
  );
}