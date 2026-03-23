// ui/feedback/InlineLoader.jsx
export default function InlineLoader({ color = 'gray' }) {
  const c = color === 'gold' ? 'bg-gold-400' : 'bg-gray-300';

  return (
    <div className="flex gap-1 items-center">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className={`w-1.5 h-1.5 ${c} rounded-full animate-bounce`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}