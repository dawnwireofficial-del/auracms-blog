import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface HeatmapDataPoint {
  day: string; // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  hour: number; // 0..23
  value: number;
}

export const ActivityHeatmapD3: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [eventType, setEventType] = useState<'all' | 'clicks' | 'searches' | 'wishlist' | 'affiliate'>('all');
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; val: number } | null>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate mock/real synthetic hourly matrix data based on event type
  const generateData = (): HeatmapDataPoint[] => {
    const points: HeatmapDataPoint[] = [];
    const seedMultiplier = eventType === 'searches' ? 1.4 : eventType === 'wishlist' ? 0.7 : eventType === 'affiliate' ? 1.1 : 1.0;

    days.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        // Peak user engagement during 9 AM - 9 PM, with weekday evening spikes
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

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const g = svg
      .attr('width', containerWidth)
      .attr('height', 280)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Hours 0 - 23)
    const xScale = d3
      .scaleBand<number>()
      .range([0, width])
      .domain(hours)
      .padding(0.08);

    // Y Scale (Days Sun - Sat)
    const yScale = d3
      .scaleBand<string>()
      .range([0, height])
      .domain(days)
      .padding(0.08);

    // Color Scale
    const maxValue = d3.max(data, (d) => d.value) || 100;
    const colorScale = d3
      .scaleSequential<string>()
      .interpolator(d3.interpolateBlues)
      .domain([0, maxValue]);

    // Render X Axis (Hours)
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(xScale).tickFormat((h) => `${h}:00`)
      )
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#94a3b8');

    // Render Y Axis (Days)
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-weight', '800')
      .style('fill', '#64748b');

    // Remove axis lines for clean aesthetic
    g.selectAll('.domain, .tick line').remove();

    // Render Heatmap Rectangles
    g.selectAll('.cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.hour) || 0)
      .attr('y', (d) => yScale(d.day) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', (d) => colorScale(d.value))
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.15s ease, opacity 0.15s ease')
      .on('mouseover', function (_event, d) {
        d3.select(this)
          .style('stroke', '#3b82f6')
          .style('stroke-width', '2px')
          .attr('opacity', 0.9);
        setHoveredCell({ day: d.day, hour: d.hour, val: d.value });
      })
      .on('mouseout', function () {
        d3.select(this).style('stroke', 'none').attr('opacity', 1);
        setHoveredCell(null);
      });

  }, [eventType, containerRef.current?.clientWidth]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">
              D3.js Heatmap
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

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full overflow-x-auto relative pt-2">
        <svg ref={svgRef} className="w-full overflow-visible" />

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
          <div className="w-4 h-3 bg-[#eff6ff] dark:bg-slate-800 rounded" />
          <div className="w-4 h-3 bg-[#bfdbfe] rounded" />
          <div className="w-4 h-3 bg-[#60a5fa] rounded" />
          <div className="w-4 h-3 bg-[#2563eb] rounded" />
          <div className="w-4 h-3 bg-[#1d4ed8] rounded" />
        </div>
        <span>Peak Traffic (100+)</span>
      </div>
    </div>
  );
};
