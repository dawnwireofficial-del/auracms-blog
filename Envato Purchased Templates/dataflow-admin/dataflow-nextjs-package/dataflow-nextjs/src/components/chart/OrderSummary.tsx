"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

type ChartSegment = {
    key: string;
    title: string;
    pct: number;
    color: string;
    valueText: string;
    deltaText: string;
    dotClass: string;
    fillClass: string;
    barLabel: string;
};

export type ChartDataLoad = {
    Weekly: ChartSegment[];
    Monthly: ChartSegment[];
    Yearly: ChartSegment[];
};

type OrderSummaryProps = {
  chartData: ChartDataLoad;
  title?: string;
  defaultPeriod?: keyof ChartDataLoad;
};

export default function OrderSummary({
  chartData,
  title = "Order Summary",
  defaultPeriod = "Weekly",
}: OrderSummaryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ApexChartHandle | null>(null);

  const periods = useMemo(() => Object.keys(chartData) as (keyof ChartDataLoad)[], [chartData]);
  const [period, setPeriod] = useState<keyof ChartDataLoad>(defaultPeriod as keyof ChartDataLoad);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const segments = useMemo<ChartSegment[]>(() => {
    return chartData[period] || chartData.Weekly || [];
  }, [chartData, period]);

  const base = segments[0];
  const [center, setCenter] = useState<ChartSegment | undefined>(base);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCenter(segments[0]);
  }, [segments]);

  useEffect(() => {
    if (!mounted || !containerRef.current || !segments.length) return;

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const renderDonut = async () => {
      if (!containerRef.current || disposed) return;

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      containerRef.current.innerHTML = "";

      const ApexCharts = (await import("apexcharts")).default;
      if (!containerRef.current || disposed) return;

      const options = {
        series: segments.map((s: ChartSegment) => s.pct),
        labels: segments.map((s: ChartSegment) => s.key),
        colors: segments.map((s: ChartSegment) => s.color),
        chart: {
          type: "donut",
          height: 338,
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 600,
          },
          events: {
            dataPointMouseEnter: (_event: any, _chartCtx: any, config: any) => {
              const item = segments[config.dataPointIndex];
              if (item) setCenter(item);
            },
            mouseLeave: () => {
              setCenter(segments[0]);
            },
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        stroke: {
          width: 0,
        },
        plotOptions: {
          pie: {
            expandOnClick: false,
            donut: {
              size: "72%",
              labels: { show: false },
            },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => `${val}%`,
          },
        },
        states: {
          hover: {
            filter: {
              type: "darken",
              value: 0.85,
            },
          },
          active: {
            allowMultipleDataPointsSelection: false,
            filter: {
              type: "none",
            },
          },
        },
      };

      const chart = new ApexCharts(containerRef.current, asApexOptions(options));
      chartRef.current = chart;
      await chart.render();
    };

    renderDonut();

    const onResize = () => {
      if (resizeTimer !== undefined) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderDonut();
        setCenter(segments[0]);
      }, 200);
    };

    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      if (resizeTimer !== undefined) clearTimeout(resizeTimer);

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [mounted, segments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".dropdown.default.style-box")) {
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
    <div className="wg-box w-half">
      <div className="flex items-center justify-between">
        <h5>{title}</h5>

        <div className="dropdown default style-box">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={showDropdown}
          >
            <span className="view-all">
              {period}
              <i className="icon-chevron-down"></i>
            </span>
          </button>

          {showDropdown && (
            <ul className="dropdown-menu show">
              {periods.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPeriod(item);
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

      <div className="flex gap34 justify-center">
        {segments.map((item) => (
          <div className="block-legend style-1" key={item.key}>
            <div className={`dot ${item.dotClass}`}></div>
            <div className="text-tiny">{item.key}</div>
          </div>
        ))}
      </div>

      <div className="donut-wrap">
        <div className="morris-donut" id="morris-donut-2" ref={containerRef}></div>

        <div className="center">
          <div className="center-inner">
            <span
              className="center-badge"
              id="centerBadge"
              style={{ borderColor: center?.color }}
            ></span>

            <p className="center-title" id="centerTitle">
              {center?.title}
            </p>

            <div className="center-row">
              <div className="center-value" id="centerValue">
                {center?.valueText}
              </div>

              <div
                className="center-delta"
                id="centerDeltaWrap"
                style={{ color: center?.color }}
              >
                <svg
                  width="19"
                  height="12"
                  viewBox="0 0 19 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M13.9978 0.824398L15.3944 2.22102L10.6614 6.95404L7.4705 3.76313C7.09224 3.38488 6.48122 3.38488 6.10297 3.76313L0.28369 9.59211C-0.0945633 9.97036 -0.0945633 10.5814 0.28369 10.9596C0.661943 11.3379 1.27297 11.3379 1.65122 10.9596L6.78188 5.81928L9.97279 9.01018C10.351 9.38843 10.9621 9.38843 11.3403 9.01018L16.7619 3.59825L18.1586 4.99488C18.4592 5.29554 18.983 5.08217 18.983 4.65542V0.48494C18.9927 0.213373 18.7793 0 18.5077 0H14.3469C13.9105 0 13.6971 0.523735 13.9978 0.824398Z"
                  />
                </svg>
                <span className="text-main-dark" id="centerDelta">
                  {center?.deltaText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="donut-bars">
        {segments.map((item) => (
          <div className="bar-row" key={item.key}>
            <div className="text-tiny">{item.barLabel}</div>
            <div className="text-tiny fw-7">{item.pct}%</div>
            <div className="track">
              <div
                className={`fill ${item.fillClass}`.trim()}
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.color,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}