import React from 'react';

export const CURRENCIES = {
  INR: { label: '₹ INR', symbol: '₹', rate: 1 },
  USD: { label: '$ USD', symbol: '$', rate: 0.012 },
  EUR: { label: '€ EUR', symbol: '€', rate: 0.011 },
  AED: { label: 'د.إ AED', symbol: 'AED ', rate: 0.044 },
};

export default function CurrencySelector({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
      {Object.keys(CURRENCIES).map((code) => (
        <button
          key={code}
          onClick={() => onSelect(code)}
          className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
            selected === code 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {CURRENCIES[code].symbol}
        </button>
      ))}
    </div>
  );
}