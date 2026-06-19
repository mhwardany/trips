'use client';
/** Zero-dependency SVG charts (Royal Black theme) */
const GOLD = '#2563EB';
const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FBBF24'];

export function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  let angle = -90;
  const slices = data.filter((d) => d.value > 0).map((d, i) => {
    const sweep = (d.value / total) === 1 ? 359.99 : (d.value / total) * 360;
    const large = sweep > 180 ? 1 : 0;
    const r = 80, cx = 100, cy = 100;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(angle)), y1 = cy + r * Math.sin(rad(angle));
    angle += sweep;
    const x2 = cx + r * Math.cos(rad(angle)), y2 = cy + r * Math.sin(rad(angle));
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`, color: PALETTE[i % PALETTE.length], label: d.label, value: d.value };
  });
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox="0 0 200 200" className="w-40 h-40">
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity={0.9} stroke="var(--surface)" strokeWidth={2} />)}
        <circle cx={100} cy={100} r={45} fill="var(--surface)" />
      </svg>
      <div className="space-y-1 text-xs">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
            <span className="text-zinc-600 dark:text-zinc-300">{s.label}</span>
            <span className="text-royal-muted">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center min-w-[34px] flex-1">
          <div className="w-full rounded-t-md" style={{ height: Math.max(4, (d.value / max) * (height - 40)), background: `linear-gradient(180deg, ${GOLD}, ${GOLD}55)` }} />
          <span className="text-[9px] text-royal-muted mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, height = 140 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length < 2) return <BarChart data={data} height={height} />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 320, h = height;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - 16 - (d.value / max) * (h - 32)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <polyline points={pts.join(' ')} fill="none" stroke={GOLD} strokeWidth={2} />
      <polygon points={`0,${h - 16} ${pts.join(' ')} ${w},${h - 16}`} fill={GOLD} opacity={0.08} />
      {pts.map((p, i) => { const [x, y] = p.split(','); return <circle key={i} cx={x} cy={y} r={2.5} fill={GOLD} />; })}
    </svg>
  );
}
