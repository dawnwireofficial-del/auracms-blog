"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

type StackedBarChartData = {
    categories: string[];
    top: number[];
    bottom: number[];
};
type StartsCard3Card = {
    title?: string;
    value?: string | number;
    percent?: string | number;
    trending?: string;
    chartColor?: string;
    chartHeight?: number;
    icon?: React.ReactNode;
    shapeBg?: React.ReactNode;
    color?: string;
    chartData?: Record<string, StackedBarChartData>;
};

type StartsCard3Props = {
    card: StartsCard3Card;
    chartId?: string;
    defaultFilter?: string;
    showFilter?: boolean;
};

export default function StartsCard3({
    card,
    chartId = "line-chart-25",
    defaultFilter = "Weekly",
    showFilter = false,
}: StartsCard3Props) {
    const chartRef = useRef<ApexChartHandle | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const chartData = card?.chartData || {};
    const filters = useMemo(() => Object.keys(chartData), [chartData]);
    const initialFilter = filters.includes(defaultFilter)
        ? defaultFilter
        : filters[0] || "Weekly";

    const [filter] = useState(initialFilter);
    const [mounted, setMounted] = useState(false);

    const current = chartData[filter] || {
        categories: [],
        top: [],
        bottom: [],
    };

    useEffect(() => {
        setMounted(true);
    }, []);

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
                    { name: "", data: current.top || [] },
                    { name: "", data: current.bottom || [] },
                ],
                chart: {
                    type: "bar",
                    height: card?.chartHeight || 208,
                    stacked: true,
                    stackType: "100%",
                    toolbar: {
                        show: false,
                    },
                },
                plotOptions: {
                    bar: {
                        columnWidth: "10px",
                    },
                },
                xaxis: {
                    categories: current.categories || [],
                    axisTicks: {
                        show: false,
                    },
                    labels: {
                        style: {
                            colors: "#545454",
                        },
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                fill: {
                    opacity: 1,
                },
                stroke: {
                    show: false,
                },
                legend: {
                    show: false,
                },
                grid: {
                    show: false,
                    yaxis: {
                        lines: {
                            show: false,
                        },
                    },
                    xaxis: {
                        lines: {
                            show: false,
                        },
                    },
                },
                yaxis: {
                    show: false,
                },
                dataLabels: {
                    enabled: false,
                },
                colors: ["#EBEBEB", card?.chartColor],
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
    }, [mounted, current.top, current.bottom, current.categories, card?.chartHeight, card?.chartColor]);

    if (!mounted) return null;

    return (
        <div className="wg-chart-default style-1">
            <div className="flex flex-column gap18 flex-shrink-0">
                <div className="flex gap14 flex-column">
                    <div className="image type-white">
                        {card?.shapeBg}
                        <span className="icon">{card?.icon}</span>
                    </div>

                    <div>
                        <div className="body-text mb-2">{card?.title || "Total Order"}</div>
                        <h3>{card?.value || "0"}</h3>
                    </div>
                </div>

                <div className="box-icon-trending color-main">
                    <div className="body-title number" style={{ color: card?.color }}>
                        {card?.percent || "0%"}
                    </div>
                    <i
                        className={`icon-trending-${card?.trending || "up"}`}
                        style={{ color: card?.color }}
                    ></i>
                </div>
            </div>

            <div className="wrap-chart flex-grow">
                <div
                    className="wrap-line-chart"
                    id={chartId}
                    ref={containerRef}
                ></div>
            </div>
        </div>
    );
}