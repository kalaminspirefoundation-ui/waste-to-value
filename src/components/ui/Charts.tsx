import React, { useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  secondaryValue?: number;
}

export const SimpleBarChart: React.FC<{
  data: BarDatum[];
  unit?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
}> = ({ data, unit = '', primaryLabel = 'Value', secondaryLabel = 'Secondary', height = 210 }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondaryValue || 0)));

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-xs text-[#202820]/50">
        No chart records available for this period.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
            <div key={tick} className="flex items-center gap-2 w-full">
              <span className="w-12 text-right font-mono text-[11px] tabular-nums text-[#202820]/45">
                {Math.round(max * tick).toLocaleString('en-IN')}
              </span>
              <div className="flex-1 border-b border-dashed border-[#202820]/10" />
            </div>
          ))}
        </div>
        <div className="relative z-10 h-full pl-14 pr-2 pt-2 pb-6 flex items-end gap-2 sm:gap-3">
          {data.map((d, idx) => {
            const h1 = Math.max(4, Math.round((d.value / max) * 100));
            const h2 = d.secondaryValue !== undefined ? Math.max(4, Math.round((d.secondaryValue / max) * 100)) : 0;
            return (
              <div
                key={d.label}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
              >
                {hovered === idx && (
                  <div className="absolute -top-2 z-20 -translate-y-full bg-[#174B37] text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap pointer-events-none font-mono tabular-nums">
                    <div>{d.label}</div>
                    <div>
                      {primaryLabel}: {unit}
                      {d.value.toLocaleString('en-IN')}
                    </div>
                    {d.secondaryValue !== undefined && (
                      <div className="text-[#A5D66D]">
                        {secondaryLabel}: {unit}
                        {d.secondaryValue.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}
                <div className="w-full max-w-[38px] h-full flex items-end justify-center gap-1">
                  <div
                    className="flex-1 rounded-t-md bg-[#174B37] group-hover:bg-[#28A66A] transition-colors"
                    style={{ height: `${h1}%` }}
                  />
                  {d.secondaryValue !== undefined && (
                    <div
                      className="flex-1 rounded-t-md bg-[#A5D66D] group-hover:bg-[#28A66A]/70 transition-colors"
                      style={{ height: `${h2}%` }}
                    />
                  )}
                </div>
                <span className="absolute -bottom-6 text-[11px] text-[#202820]/65 font-medium truncate max-w-full">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DonutBreakdownChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}> = ({ segments, centerLabel, centerValue }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#202820]/50">
        No verified volume recorded yet.
      </div>
    );
  }
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#F0F4EF" strokeWidth="18" />
          {segments.map((seg) => {
            const pct = seg.value / total;
            const dash = pct * circumference;
            const strokeDashoffset = -offsetAccumulator;
            offsetAccumulator += dash;
            return (
              <circle
                key={seg.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[11px] text-[#202820]/55">{centerLabel}</span>
          <span className="font-display font-bold text-base text-[#174B37] tabular-nums">{centerValue}</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={seg.label} className="flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[#202820]/80 truncate">{seg.label}</span>
              </div>
              <span className="font-mono tabular-nums font-medium text-[#202820]">
                {seg.value.toLocaleString('en-IN')} kg ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
