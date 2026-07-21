"use client";
import { useMemo, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import { asApexOptions } from "@/lib/apexOptions";
import type { RevenueChartPayload } from "@/types/chartProps";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

type RevenueChartProps = {
    chartData?: RevenueChartPayload;
    title?: string;
    defaultPeriod?: string;
    periods?: string[];
    series?: RevenueChartPayload["series"];
    categories?: string[];
    colors?: string[];
    stats?: RevenueChartPayload["stats"];
    filterData?: RevenueChartPayload["filterData"];
};

export default function RevenueChart({
    chartData = {} as RevenueChartPayload,
    title: propTitle = "Revenue",
    defaultPeriod: propDefaultPeriod = "Yearly",
    periods: propPeriods = ["Weekly", "Monthly", "Yearly"],
    series: propSeries = [],
    categories: propCategories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ],
    colors: propColors = ["#FF7433", "#8F77F3"],
    stats: propStats = [],
    filterData: propFilterData = {
        Weekly: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            series: [],
            stats: [],
        },
        Monthly: {
            categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
            series: [],
            stats: [],
        },
        Yearly: {
            categories: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ],
            series: [],
            stats: [],
        },
    },
}: RevenueChartProps) {
    const title = chartData.title ?? propTitle;
    const defaultPeriod = chartData.defaultPeriod ?? propDefaultPeriod;
    const periods = chartData.periods ?? propPeriods;
    const series = chartData.series ?? propSeries;
    const categories = chartData.categories ?? propCategories;
    const colors = chartData.colors ?? propColors;
    const stats = chartData.stats ?? propStats;
    const filterData = chartData.filterData ?? propFilterData;

    const [period, setPeriod] = useState(defaultPeriod);
    const [, setShowDropdown] = useState(false);

    const currentData = useMemo(() => {
        if (filterData && filterData[period]) {
            return filterData[period];
        }

        return {
            categories,
            series,
            stats,
        };
    }, [period, filterData, categories, series, stats]);

    const options = useMemo(
        () => ({
            chart: {
                height: 404,
                type: "line",
                stacked: false,
                toolbar: { show: false },
                background: "transparent",
                animations: {
                    enabled: true,
                    easing: "easeinout",
                    speed: 300,
                    animateGradually: { enabled: true, delay: 100 },
                    dynamicAnimation: { enabled: true, speed: 300 },
                },
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 5,
                    borderRadiusApplication: "end",
                    borderRadiusWhenStacked: "last",
                    columnWidth: "20px",
                },
            },
            dataLabels: { enabled: false },
            legend: { show: true },
            colors,
            stroke: { width: [0, 3], curve: "smooth" },
            markers: {
                size: [0, 0],
                hover: {
                    sizeOffset: 6,
                },
            },
            xaxis: {
                categories: currentData.categories || [],
                labels: { style: { colors: "#95989D" } },
                tooltip: { enabled: false },
            },
            yaxis: { show: false },
            grid: {
                borderColor: "#f0f0f0",
                strokeDashArray: 0,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
            },
            responsive: [
                {
                    breakpoint: 991,
                    options: {
                        chart: { height: 300 },
                    },
                },
            ],
            tooltip: {
                y: {
                    title: {
                        formatter: (seriesName: string) => seriesName,
                    },
                },
            },
        }),
        [colors, currentData.categories],
    );

    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>{title}</h5>
                <div className="dropdown default style-box">
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        <span className="view-all">
                            {period}
                            <i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    <ul className="dropdown-menu dropdown-menu-end">
                        {periods
                            .filter((p) => p !== period)
                            .map((p) => (
                                <li key={p}>
                                    <a
                                        href="#"
                                        onClick={(
                                            e: MouseEvent<HTMLAnchorElement>,
                                        ) => {
                                            e.preventDefault();
                                            setPeriod(p);
                                            setShowDropdown(false);
                                        }}
                                    >
                                        {p}
                                    </a>
                                </li>
                            ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-wrap gap40">
                {(currentData.stats || []).map((stat, i) => (
                    <div key={i}>
                        <div className="mb-1">
                            <div className="block-legend">
                                <div className={`dot ${stat.dotClass}`}></div>
                                <div className="text-tiny">{stat.label}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap12">
                            <h4>{stat.value}</h4>
                            <div
                                className={`box-icon-trending ${stat.trending}`}
                            >
                                <i
                                    className={`icon-trending-${stat.trending}`}
                                ></i>
                                <div className="body-title number">
                                    {stat.percent}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ReactApexChart
                key={period}
                options={asApexOptions(options)}
                series={currentData.series || []}
                type="line"
                height={404}
            />
        </div>
    );
}