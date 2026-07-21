"use client";

import { useEffect, useMemo, useRef, useState, MouseEvent } from "react";
import dynamic from "next/dynamic";
import { asApexOptions } from "@/lib/apexOptions";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RevenueChart2() {
    const chartData = {
        Weekly: {
            revenue: "$8,420",
            revenueGrowth: "0.22%",
            order: "1,245",
            orderGrowth: "0.18%",
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            series: [
                {
                    name: "Profit",
                    data: [21, 35, 18, 24, 42, 29, 15],
                },
                {
                    name: "Revenue",
                    data: [34, 48, 28, 39, 56, 43, 26],
                },
            ],
        },
        Monthly: {
            revenue: "$18,950",
            revenueGrowth: "0.41%",
            order: "3,420",
            orderGrowth: "0.33%",
            categories: ["W1", "W2", "W3", "W4"],
            series: [
                {
                    name: "Profit",
                    data: [81, 121, 90, 112],
                },
                {
                    name: "Revenue",
                    data: [135, 182, 146, 168],
                },
            ],
        },
        Yearly: {
            revenue: "$37,802",
            revenueGrowth: "0.56%",
            order: "8,305",
            orderGrowth: "0.56%",
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
            ],
            series: [
                {
                    name: "Profit",
                    data: [81, 121, 40, 52, 164, 113, 26, 68, 164, 113],
                },
                {
                    name: "Revenue",
                    data: [135, 182, 76, 112, 199, 168, 49, 120, 164, 113],
                },
            ],
        },
    };

    const [period, setPeriod] = useState<keyof typeof chartData>("Yearly");
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const currentData = chartData[period];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | MouseEventInit | any) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpenDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const options = useMemo(() => {
        return {
            chart: {
                type: "bar",
                height: 451,
                toolbar: {
                    show: false,
                },
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: "10px",
                    borderRadius: 4,
                    borderRadiusApplication: "end",
                },
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            colors: ["#FF7433", "#8D79F6"],
            stroke: {
                show: false,
            },
            xaxis: {
                labels: {
                    style: {
                        colors: "#95989D",
                    },
                },
                categories: currentData.categories,
            },
            yaxis: {
                show: false,
            },
            fill: {
                opacity: 1,
            },
            tooltip: {
                y: {
                    formatter: function (val: number) {
                        return "$ " + val + " thousands";
                    },
                },
            },
            grid: {
                borderColor: "#ECECEC",
                strokeDashArray: 4,
            },
        };
    }, [currentData]);

    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>Revenue</h5>
                <div className="dropdown default style-box" ref={dropdownRef}>
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded={openDropdown}
                        onClick={() => setOpenDropdown((prev) => !prev)}
                    >
                        <span className="view-all">
                            {period}
                            <i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    <ul className={`dropdown-menu dropdown-menu-end${openDropdown ? " show" : ""}`}>
                        {(["Weekly", "Monthly", "Yearly"] as (keyof typeof chartData)[])
                            .filter((p) => p !== period)
                            .map((p) => (
                                <li key={p}>
                                    <a
                                        href="#"
                                        className="dropdown-item"
                                        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                                            setPeriod(p);
                                            setOpenDropdown(false);
                                            e.preventDefault();
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
                            <div className="body-title number">
                                {currentData.revenueGrowth}
                            </div>
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
                            <i className="icon-trending-up"></i>
                            <div className="body-title number">
                                {currentData.orderGrowth}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="wrap-line-chart" id="line-chart-9">
                <Chart
                    options={asApexOptions(options)}
                    series={currentData.series}
                    type="bar"
                    height={451}
                />
            </div>
        </div>
    );
}
