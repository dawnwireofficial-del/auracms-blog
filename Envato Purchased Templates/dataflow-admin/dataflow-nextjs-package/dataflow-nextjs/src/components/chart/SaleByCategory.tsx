"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

type ChartCategory = {
  totalLabel: string;
  totalValue: string;
  trendValue: string;
  categories: string[];
  mens: number[];
  womens: number[];
};

type ChartDataType = {
  Weekly: ChartCategory;
  Monthly: ChartCategory;
  Yearly: ChartCategory;
};

const chartData: ChartDataType = {
  Weekly: {
    totalLabel: "Total Mar 20, 2023",
    totalValue: "$37,802",
    trendValue: "0.56%",
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    mens: [44, 55, 41, 67, 22, 43, 21],
    womens: [13, 23, 20, 8, 13, 27, 33],
  },
  Monthly: {
    totalLabel: "Total Mar 2023",
    totalValue: "$142,480",
    trendValue: "1.24%",
    categories: ["W1", "W2", "W3", "W4"],
    mens: [52, 61, 48, 70],
    womens: [18, 21, 16, 24],
  },
  Yearly: {
    totalLabel: "Total 2023",
    totalValue: "$982,287",
    trendValue: "4.12%",
    categories: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    mens: [48, 58, 62, 66, 57, 71],
    womens: [16, 19, 22, 18, 21, 24],
  },
};

function normalizeWithGap(topArr: number[], bottomArr: number[], gap: number) {
  const outTop: number[] = [];
  const outGap: number[] = [];
  const outBottom: number[] = [];

  for (let i = 0; i < topArr.length; i += 1) {
    const t = Number(topArr[i]) || 0;
    const b = Number(bottomArr[i]) || 0;
    const sum = t + b;

    if (sum <= 0) {
      outTop.push(0);
      outGap.push(0);
      outBottom.push(0);
      continue;
    }

    const scale = (100 - gap) / sum;
    outTop.push(t * scale);
    outGap.push(gap);
    outBottom.push(b * scale);
  }

  return { top: outTop, gap: outGap, bottom: outBottom };
}

function applyPillRadius(selector: string, radius: number) {
  const root = document.querySelector(selector);
  if (!root) return;

  const rects = root.querySelectorAll("svg .apexcharts-bar-series rect");
  rects.forEach((rect) => {
    const r = String(radius);
    rect.setAttribute("rx", r);
    rect.setAttribute("ry", r);
  });
}

type FilterType = keyof ChartDataType;

type SaleByCategoryProps = {
  defaultFilter?: FilterType;
  title?: string;
  half?: string;
};

export default function SaleByCategory({
  defaultFilter = "Weekly",
  title = "Sale by category",
  half = "",
}: SaleByCategoryProps) {
  const chartRef = useRef<ApexChartHandle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [filter, setFilter] = useState<FilterType>(defaultFilter);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const filters = useMemo(
    () => Object.keys(chartData) as FilterType[],
    []
  );

  const currentData: ChartCategory = chartData[filter] ?? chartData.Weekly;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let disposed = false;

    const renderChart = async () => {
      const ApexCharts = (await import("apexcharts")).default;
      if (disposed || !containerRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      containerRef.current.innerHTML = "";

      const GAP = 6;
      const norm = normalizeWithGap(
        currentData.mens,
        currentData.womens,
        GAP
      );

      const options = {
        series: [
          { name: "Mens", data: norm.top },
          { name: "Gap", data: norm.gap },
          { name: "Women’s", data: norm.bottom },
        ],
        chart: {
          type: "bar",
          height: 409,
          stacked: true,
          stackType: "100%",
          toolbar: { show: false },
          animations: { enabled: true },
          events: {
            mounted: function () {
              applyPillRadius("#line-chart-10", 999);
            },
            updated: function () {
              applyPillRadius("#line-chart-10", 999);
            },
          },
        },
        plotOptions: {
          bar: {
            columnWidth: "10px",
            borderRadius: 0,
          },
        },
        colors: ["#FF7433", "rgba(0,0,0,0)", "#C3C1CF"],
        xaxis: {
          categories: currentData.categories,
          labels: {
            show: true,
            style: { colors: "#95989D" },
          },
          axisTicks: { show: false },
          axisBorder: { show: false },
          tooltip: { enabled: false },
        },
        yaxis: { show: false },
        grid: {
          show: false,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        tooltip: {
          y: {
            formatter: function (
              val: number,
              opts: { seriesIndex: number }
            ) {
              if (opts.seriesIndex === 1) return "";
              return `${Math.round(val)}%`;
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
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [mounted, currentData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target;
      if (t instanceof Element && !t.closest(".dropdown.default.style-box")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className={`wg-box  ${half}`}>
      <h5>{title}</h5>

      <div className="flex justify-between">
        <div className="flex flex-wrap gap40">
          <div>
            <div className="mb-1">
              <div className="block-legend">
                <div className="text-tiny">{currentData.totalLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap10">
              <h4>{currentData.totalValue}</h4>
              <div className="box-icon-trending up">
                <i className="icon-trending-up"></i>
                <div className="body-title number">{currentData.trendValue}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dropdown default style-box">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            aria-haspopup="true"
            aria-expanded={showDropdown}
            onClick={() => setShowDropdown((prev) => !prev)}
          >
            <span className="view-all">
              {filter}
              <i className="icon-chevron-down"></i>
            </span>
          </button>

          {showDropdown && (
            <ul className="dropdown-menu show">
              {filters
                .filter((item) => item !== filter)
                .map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilter(item);
                        setShowDropdown(false);
                      }}
                    >
                      {item}
                    </a>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <div
        id="line-chart-10"
        className="text-center wrap-line-chart"
        ref={containerRef}
      ></div>

      <div className="flex gap20 justify-center">
        <div className="block-legend justify-center gap8">
          <div className="dot-1 t1"></div>
          <div className="text-tiny">Mens</div>
        </div>
        <div className="block-legend justify-center gap8">
          <div className="dot-1 t2"></div>
          <div className="text-tiny">Women’s</div>
        </div>
      </div>
    </div>
  );
}