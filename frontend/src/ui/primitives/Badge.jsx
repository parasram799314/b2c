// ui/primitives/Badge.jsx

const BADGE_STYLES = {
  gold:    'bg-gold-50 text-gold-700 border-gold-200',
  green:   'bg-green-50 text-green-700 border-green-200',
  red:     'bg-red-50 text-red-600 border-red-100',
  blue:    'bg-blue-50 text-blue-600 border-blue-200',
  gray:    'bg-gray-50 text-gray-500 border-gray-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  orange:  'bg-orange-50 text-orange-600 border-orange-200',
};

export function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold border rounded-full px-2 py-0.5 ${
      BADGE_STYLES[variant] || BADGE_STYLES.gray
    } ${className}`}>
      {children}
    </span>
  );
}

// Tag — slightly larger, used in PlanPanel
const TAG_STYLES = {
  amber:  'bg-amber-100/70 text-amber-800',
  blue:   'bg-blue-100/60 text-blue-800',
  green:  'bg-green-100/60 text-green-800',
  gray:   'bg-gray-100 text-gray-600',
  gold:   'bg-yellow-100/60 text-yellow-800',
  orange: 'bg-orange-100/60 text-orange-800',
};

export function Tag({ children, color = 'gray', className = '' }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mr-1 mt-1 ${
      TAG_STYLES[color] || TAG_STYLES.gray
    } ${className}`}>
      {children}
    </span>
  );
}