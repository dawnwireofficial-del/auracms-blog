import React, { useState } from 'react';

export interface HeatmapDataPoint {
  day: string; // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  hour: number; // 0..23
  value: number;
}

export const ActivityHeatmapD3: React.FC = () => {
  const [eventType, setEventType] = useState<'all' | 'clicks' | 'searches' | 'wishlist' | 'affiliate'>('all');
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; val: number } | null>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate hourly matrix data based on event type
  const generateData = (): HeatmapDataPoint[] => {
    const points: HeatmapDataPoint[] = [];
    const seedMultiplier = eventType === 'searches' ? 1.4 : eventType === 'wishlist' ? 0.7 : eventType === 'affiliate' ? 1.1 : 1.0;

    days.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        const basePeak = Math.sin((hour - 6) / 18 * Math.PI) * 45;
        const isWeekend = dayIndex === 0 || dayIndex === 6;
        const dayFactor = isWeekend ? 1.2 : 0.9;
        const randomNoise = (Math.sin(dayIndex * hour) + 1) * 12;
        const value = Math.max(2, Math.round((Math.max(0, basePeak) + randomNoise) * dayFactor * seedMultiplier));
        points.push({ day, hour, value });
      });
    });
    return points;
  };

  const data = generateData();
  const maxValue = Math.max(...data.map(d => d.value), 100);

  const getColor = (val: number) => {
    const ratio = val / maxValue;
    if (ratio < 0.2) return '#eff6ff';
    if (ratio < 0.4) return '#bfdbfe';
    if (ratio < 0.6) return '#60a5fa';
    if (ratio < 0.8) return '#2563eb';
    return '#1d4ed8';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">
              Activity Matrix
            </span>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
              User Activity Engagement Times (Day & Hour)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing hourly peak interaction volume throughout the week
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'clicks', label: 'Product Clicks' },
            { id: 'searches', label: 'Search Queries' },
            { id: 'wishlist', label: 'Wishlist Adds' },
            { id: 'affiliate', label: 'Amazon Outbound' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setEventType(btn.id as any)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                eventType === btn.id
                  ? 'bg-[#0A1F44] text-white border-blue-900 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="w-full overflow-x-auto relative pt-2">
        <div className="min-w-[700px] space-y-1">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-1">
              <span className="w-10 text-xs font-bold text-slate-500">{day}</span>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {hours.map((hour) => {
                  const pt = data.find(d => d.day === day && d.hour === hour);
                  const val = pt ? pt.value : 0;
                  return (
                    <div
                      key={hour}
                      style={{ backgroundColor: getColor(val) }}
                      className="h-7 rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                      onMouseEnter={() => setHoveredCell({ day, hour, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="w-10 text-[10px] text-slate-400">Hours</span>
            <div className="flex-1 grid grid-cols-24 gap-1 text-[10px] text-slate-400 font-bold text-center">
              {hours.map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredCell && (
          <div className="absolute top-2 right-4 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center gap-2 animate-in fade-in">
            <span className="font-bold text-amber-400">{hoveredCell.day} at {hoveredCell.hour}:00</span>
            <span>—</span>
            <span className="font-extrabold text-emerald-400">{hoveredCell.val} engagement events</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Less Active (0)</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-[#eff6ff] rounded" />
          <div className="w-4 h-3 bg-[#bfdbfe] rounded" />
          <div className="w-4 h-3 bg-[#60a5fa] rounded" />
          <div className="w-4 h-3 bg-[#2563eb] rounded" />
          <div className="w-4 h-3 bg-[#1d4ed8] rounded" />
        </div>
        <span>Peak Traffic ({maxValue}+)</span>
      </div>
    </div>
  );
};
