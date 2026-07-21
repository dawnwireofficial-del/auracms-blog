"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

const DATA = {
  Weekly: {
    revenue: "$18,420",
    revenueTrend: "0.42%",
    order: "2,145",
    orderTrend: "0.31%",
    categories: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
    series: [42, 55, 48, 62, 58, 71, 65],
  },
  Monthly: {
    revenue: "$37,802",
    revenueTrend: "0.56%",
    order: "8,305",
    orderTrend: "0.56%",
    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    series: [51, 40, 58, 51, 42, 89],
  },
  Yearly: {
    revenue: "$137,802",
    revenueTrend: "1.12%",
    order: "28,305",
    orderTrend: "1.08%",
    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    series: [51, 40, 58, 51, 42, 89, 80, 51, 60, 78, 81, 92],
  },
};

export default function WebsiteVisitors({
  defaultFilter = "Yearly",
}: {
  defaultFilter?: keyof typeof DATA;
}) {
  const chartRef = useRef<ApexChartHandle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<keyof typeof DATA>(defaultFilter);
  const [showDropdown, setShowDropdown] = useState(false);

  const filters = useMemo(() => Object.keys(DATA) as (keyof typeof DATA)[], []);
  const currentData = useMemo(() => DATA[filter], [filter]);

  useEffect(() => setMounted(true), []);

  // render chart
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let disposed = false;

    const renderChart = async () => {
      const ApexCharts = (await import("apexcharts")).default;
      if (!containerRef.current || disposed) return;

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      containerRef.current.innerHTML = "";

      const options = {
        series: [
          {
            name: "Revenue",
            type: "column",
            data: currentData.series,
          },
        ],
        chart: {
          height: 357,
          type: "line",
          stacked: false,
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 5,
            borderRadiusApplication: "end",
            borderRadiusWhenStacked: "last",
            columnWidth: "10px",
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        colors: ["#FF7433"],
        stroke: {
          width: [0, 3],
          curve: "smooth",
        },
        xaxis: {
          labels: { style: { colors: "#95989D" } },
          tooltip: { enabled: false },
          categories: currentData.categories,
        },
        yaxis: { show: false },
        tooltip: {
          y: {
            title: {
              formatter: (val: number | string) => val,
            },
          },
        },
      };

      const chart = new ApexCharts(containerRef.current, asApexOptions(options));
      chartRef.current = chart;
      await chart.render();
    };

    renderChart();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
    };
  }, [mounted, currentData]);

  // click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  return (
    <div className="wg-box">
      <div className="flex items-center justify-between">
        <h5>Website Visitors</h5>

        <div
          className={`dropdown default style-box${showDropdown ? " show" : ""}`}
          ref={dropdownRef}
        >
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
          >
            <span className="view-all">
              {filter}
              <i className="icon-chevron-down"></i>
            </span>
          </button>

          <ul className={`dropdown-menu dropdown-menu-end`}>
            {filters.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="dropdown-link"
                  onClick={() => {
                    setFilter(item);
                    setShowDropdown(false);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap40">
        <div>
          <div className="mb-1">
            <div className="block-legend">
              <div className="dot t3"></div>
              <div className="text-tiny">Revenue</div>
            </div>
          </div>
          <div className="flex items-center gap12">
            <h4>{currentData.revenue}</h4>
            <div className="box-icon-trending up">
              <i className="icon-trending-up"></i>
              <div className="body-title number">{currentData.revenueTrend}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1">
            <div className="block-legend">
              <div className="dot t5"></div>
              <div className="text-tiny">Order</div>
            </div>
          </div>
          <div className="flex items-center gap12">
            <h4>{currentData.order}</h4>
            <div className="box-icon-trending up">
              <i className={`icon-trending-up`}></i>
              <div className="body-title number">{currentData.orderTrend}</div>
            </div>
          </div>
        </div>
      </div>

      <div id="line-chart-23" ref={containerRef}></div>
    </div>
  );
}