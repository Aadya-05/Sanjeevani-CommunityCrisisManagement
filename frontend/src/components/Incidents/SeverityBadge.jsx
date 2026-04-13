const COLORS = {
  low: 'bg-green-900 text-green-300 border-green-600',
  medium: 'bg-yellow-900 text-yellow-300 border-yellow-600',
  high: 'bg-orange-900 text-orange-300 border-orange-600',
  critical: 'bg-purple-900 text-purple-300 border-purple-600',
};

export default function SeverityBadge({ severity }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${COLORS[severity] || COLORS.low}`}>
      {severity?.toUpperCase()}
    </span>
  );
}