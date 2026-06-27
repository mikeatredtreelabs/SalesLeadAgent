const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'New': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'Researching': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  'Qualified': { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  'Outreach Ready': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'Contacted': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'Follow-Up Needed': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  'Meeting Scheduled': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400' },
  'Won': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Lost': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  'Not a Fit': { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS['New'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export { STATUS_COLORS };
