export default function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (!score) return <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Unscored</span>;
  const cls = score >= 75 ? 'bg-emerald-50 text-emerald-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600';
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{score}/100</span>;
}
