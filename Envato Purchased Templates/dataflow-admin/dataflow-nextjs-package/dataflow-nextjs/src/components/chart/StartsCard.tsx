"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

export type StatsChartPeriod = string;

export type StatsChartData = Record<
    StatsChartPeriod,
    {
        value?: string | number;
        percent?: string | number;
        series?: number[];
    }
>;

export type StatsChartItem = {
    title: string;
    value: string | number;
    percent: string | number;
    trending?: string;
    defaultPeriod?: StatsChartPeriod;
    periods?: StatsChartPeriod[];
    chartData?: StatsChartData;
    chartColor?: string;
    chartHeight?: number;
    icon?: React.ReactNode;
    shapeBg?: React.ReactNode;
};

type StatsCardProps = StatsChartItem;

export default function StatsCard({
    title,
    value,
    percent,
    trending = "up",
    defaultPeriod = "Weekly",
    periods = ["Daily", "Weekly", "Monthly", "Yearly"],
    chartData = {},
    chartColor = "#22C55E",
    chartHeight = 194,
    icon,
    shapeBg,
}: StatsCardProps) {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const chartInstance = useRef<ApexChartHandle | null>(null);

    const [period, setPeriod] = useState<StatsChartPeriod>(defaultPeriod);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    /* ================== DATA ================== */

    const currentData = useMemo(() => {
        const fallbackPeriod =
            chartData && defaultPeriod in chartData
                ? defaultPeriod
                : Object.keys(chartData || {})[0];

        return chartData?.[period] || chartData?.[fallbackPeriod] || {};
    }, [chartData, period, defaultPeriod]);

    const displayValue = currentData?.value ?? value;
    const displayPercent = currentData?.percent ?? percent;
    const displaySeries = currentData?.series ?? [];

    /* ================== OUTSIDE CLICK ================== */

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | Event) => {
            const t = (e as MouseEvent).target as Node;
            if (dropdownRef.current && t && !dropdownRef.current.contains(t)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside as EventListener);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside as EventListener);
    }, []);

    /* ================== CHART ================== */

    useEffect(() => {
        if (!mounted || !chartRef.current) return;

        let disposed = false;

        const renderChart = async () => {
            const ApexCharts = (await import("apexcharts")).default;
            if (!chartRef.current || disposed) return;

            const options = {
                series: [{ data: displaySeries }],
                colors: [chartColor],
                chart: {
                    type: "area",
                    height: chartHeight,
                    toolbar: { show: false },
                    background: "transparent",
                },
                fill: {
                    type: "gradient",
                    gradient: {
                        colorStops: [
                            { offset: 0, color: chartColor, opacity: 0.4 },
                            { offset: 100, color: chartColor, opacity: 0 },
                        ],
                    },
                },
                stroke: {
                    curve: "smooth",
                    width: 2.5,
                    colors: [chartColor],
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                yaxis: { show: false },
                xaxis: {
                    labels: { show: false },
                    axisTicks: { show: false },
                    axisBorder: { show: false },
                },
                grid: { show: false },
                tooltip: {
                    x: { show: false },
                    y: { title: { formatter: () => "" } },
                    marker: { show: false },
                },
                markers: { size: 0 },
            };

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            chartInstance.current = new ApexCharts(
                chartRef.current,
                asApexOptions(options),
            );

            await chartInstance.current.render();
        };

        renderChart();

        return () => {
            disposed = true;
            chartInstance.current?.destroy();
        };
    }, [mounted, displaySeries, chartColor, chartHeight]);

    if (!mounted) return null;

    /* ================== UI ================== */

    return (
        <div className="wg-chart-default">
            <div className="top">
                <div className="flex items-center gap14">
                    <div className="image type-white">
                        {shapeBg}
                        <span className="icon">{icon}</span>
                    </div>

                    <div>
                        <div className="flex gap10 items-center">
                            <h3 className="body-text mt-2 mb-4 text-[1rem]">
                                {title}
                            </h3>

                            <div className={`box-icon-trending ${trending}`}>
                                <i
                                    style={{ color: chartColor }}
                                    className={`icon-trending-${trending}`}
                                ></i>

                                <div className="body-title number">
                                    <strong>{displayPercent}</strong>
                                </div>
                            </div>
                        </div>

                        <h4>
                            <strong>{displayValue}</strong>
                        </h4>
                    </div>
                </div>

                {/* DROPDOWN */}
                <nav className="dropdown default" ref={dropdownRef}>
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        onClick={() => setShowDropdown((prev) => !prev)}
                    >
                        <span className="view-all">
                            {period}
                            <i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    <ul
                        className={`dropdown-menu dropdown-menu-end ${
                            showDropdown ? "show" : ""
                        }`}
                    >
                        {periods.map((p) => (
                            <li key={p}>
                                <button
                                    type="button"
                                    className={p === period ? "active" : ""}
                                    onClick={() => {
                                        setPeriod(p);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {p}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="wrap-chart">
                <div ref={chartRef} />
            </div>
        </div>
    );
}
