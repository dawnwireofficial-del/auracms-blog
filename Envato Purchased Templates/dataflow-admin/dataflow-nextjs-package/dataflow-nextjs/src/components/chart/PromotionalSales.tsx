"use client";
import { useState, useMemo } from "react";
import PromotionalSalesDonut from "../common/PromotionalSalesDonut";
import type { PromotionalChartPayload } from "@/types/chartProps";

type PromotionalSalesProps = {
    chartData?: PromotionalChartPayload;
    title?: string;
    defaultPeriod?: string;
    periods?: string[];
    visitors?: PromotionalChartPayload["visitors"];
    segments?: PromotionalChartPayload["segments"];
};

export default function PromotionalSales({
    chartData = {} as PromotionalChartPayload,
    title = "Promotional Sales",
    defaultPeriod = "Weekly",
    periods = ["Weekly", "Yearly", "Monthly"],
    visitors = { value: "7,802", percent: "0.56%", trending: "up" },
    segments = [],
}: PromotionalSalesProps) {
    const finalTitle = chartData.title ?? title;
    const finalDefaultPeriod = chartData.defaultPeriod ?? defaultPeriod;
    const finalPeriods = chartData.periods ?? periods;

    const fallbackData = useMemo(() => {
        return {
            visitors: chartData.visitors ?? visitors,
            segments: chartData.segments ?? segments,
        };
    }, [chartData.visitors, chartData.segments, visitors, segments]);

    const filterData = chartData.filterData ?? null;

    const [period, setPeriod] = useState(finalDefaultPeriod);
    const [showDropdown, setShowDropdown] = useState(false);

    const currentData = useMemo(() => {
        if (filterData && filterData[period]) {
            return {
                visitors: filterData[period].visitors ?? fallbackData.visitors,
                segments: filterData[period].segments ?? fallbackData.segments,
            };
        }
        return fallbackData;
    }, [period, filterData, fallbackData]);

    return (
        <div className="wg-box w-half">
            <div className="flex items-center justify-between">
                <h5>{finalTitle}</h5>
                <div className="dropdown default style-box">
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        onClick={() => setShowDropdown((v) => !v)}
                    >
                        <span className="view-all">
                            {period}<i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    {showDropdown && (
                        <ul className="dropdown-menu show">
                            {finalPeriods
                                .filter((p) => p !== period)
                                .map((p) => (
                                    <li key={p}>
                                        <a
                                            href="#"
                                            onClick={(e) => {
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
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap40">
                <div>
                    <div className="mb-1">
                        <div className="block-legend">
                            <div className="text-tiny">Visitors</div>
                        </div>
                    </div>
                    <div className="flex items-center gap10">
                        <h4>{currentData.visitors?.value}</h4>
                        <div className={`box-icon-trending ${currentData.visitors?.trending}`}>
                            <i className={`icon-trending-${currentData.visitors?.trending}`}></i>
                            <div className="body-title number text-grey">
                                {currentData.visitors?.percent}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PromotionalSalesDonut segments={currentData.segments || []} />

            {currentData.segments && currentData.segments.length > 0 && (
                <div className="flex gap15 justify-center">
                    {currentData.segments.map((seg, idx) => (
                        <div className="block-legend style-1" key={seg.title || idx}>
                            <div
                                className="dot t4"
                                style={seg.color ? { borderColor: seg.color } : undefined}
                            ></div>
                            <div className="text-tiny">{seg.title}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}