type Color = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange';

const colors: Record<Color, string> = {
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue:   'bg-blue-100 text-blue-800',
  gray:   'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
};

export function Badge({ label, color = 'gray' }: { label: string; color?: Color }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Color> = {
    live: 'green', pending: 'yellow', ended: 'gray', cancelled: 'red',
    confirmed: 'green', shipped: 'blue', delivered: 'green',
    deposit: 'green', deduction: 'red', refund: 'blue',
  };
  return <Badge label={status} color={map[status] ?? 'gray'} />;
}
