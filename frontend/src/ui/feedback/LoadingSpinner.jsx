// ui/feedback/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md', color = 'gold' }) {
  const sizes  = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  const colors = { gold: 'border-gold-400', gray: 'border-gray-300', white: 'border-white' };

  return (
    <div className={`${sizes[size] || sizes.md} rounded-full border-2 ${colors[color] || colors.gold} border-t-transparent animate-spin`} />
  );
}