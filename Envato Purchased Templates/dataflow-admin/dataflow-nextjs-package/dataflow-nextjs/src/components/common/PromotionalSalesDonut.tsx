"use client";
import React, { memo, useEffect, useRef } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";
import type { DonutSegment } from "@/types/chartProps";

type PromotionalSalesDonutProps = {
    segments?: DonutSegment[];
};

const PromotionalSalesDonut = memo(function PromotionalSalesDonut({
    segments = [],
}: PromotionalSalesDonutProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ApexChartHandle | null>(null);

    const centerBadgeRef = useRef<HTMLSpanElement | null>(null);
    const centerTitleRef = useRef<HTMLParagraphElement | null>(null);
    const centerValueRef = useRef<HTMLDivElement | null>(null);
    const centerDeltaRef = useRef<HTMLDivElement | null>(null);
    const centerDeltaTextRef = useRef<HTMLSpanElement | null>(null);

    const updateCenterUI = (item: DonutSegment | undefined) => {
        if (!item) return;

        if (centerBadgeRef.current) {
            centerBadgeRef.current.style.borderColor = item.color || "transparent";
        }

        if (centerTitleRef.current) {
            centerTitleRef.current.textContent = item.title || "";
        }

        if (centerValueRef.current) {
            centerValueRef.current.textContent = item.valueText || "";
        }

        if (centerDeltaRef.current) {
            centerDeltaRef.current.style.color = item.color || "";
        }

        if (centerDeltaTextRef.current) {
            centerDeltaTextRef.current.textContent = item.deltaText || "";
        }
    };

    useEffect(() => {
        if (!containerRef.current || !segments.length) return;

        let resizeTimer: ReturnType<typeof setTimeout> | undefined;
        let destroyed = false;
        let chartInstance: ApexChartHandle | null = null;

        const renderDonut = async () => {
            if (!containerRef.current || destroyed) return;

            containerRef.current.innerHTML = "";

            const ApexCharts = (await import("apexcharts")).default;
            if (!containerRef.current || destroyed) return;

            const options = {
                series: segments.map((s) => s.pct),
                labels: segments.map((s) => s.title),
                colors: segments.map((s) => s.color),
                chart: {
                    type: "donut",
                    height: 338,
                    toolbar: { show: false },
                    animations: { enabled: true, easing: "easeinout", speed: 600 },
                    events: {
                        dataPointMouseEnter: (
                            event: unknown,
                            chartCtx: unknown,
                            config: { dataPointIndex: number }
                        ) => {
                            const item = segments[config.dataPointIndex];
                            if (item) updateCenterUI(item);
                        },
                        mouseLeave: () => {
                            updateCenterUI(segments[0]);
                        },
                    },
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                stroke: { width: 0 },
                plotOptions: {
                    pie: {
                        donut: {
                            size: "72%",
                            labels: { show: false },
                        },
                    },
                },
                tooltip: {
                    y: { formatter: (val: number | string) => String(val) + "%" },
                },
                states: {
                    hover: { filter: { type: "darken", value: 0.85 } },
                },
            };

            chartInstance = new ApexCharts(containerRef.current, asApexOptions(options));
            chartRef.current = chartInstance;
            await chartInstance.render();

            updateCenterUI(segments[0]);
        };

        renderDonut();

        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(async () => {
                if (chartInstance) {
                    chartInstance.destroy();
                }
                await renderDonut();
            }, 200);
        };

        window.addEventListener("resize", onResize);

        return () => {
            destroyed = true;
            window.removeEventListener("resize", onResize);
            if (resizeTimer !== undefined) clearTimeout(resizeTimer);
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
    }, [segments]);

    return (
        <div className="donut-wrap mb-6">
            <div className="morris-donut" ref={containerRef} />

            <div className="center">
                <div className="center-inner">
                    <span
                        ref={centerBadgeRef}
                        className="center-badge"
                    />
                    <p ref={centerTitleRef} className="center-title"></p>
                    <div className="center-row">
                        <div ref={centerValueRef} className="center-value"></div>
                        <div ref={centerDeltaRef} className="center-delta">
                            <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill="currentColor" d="M13.9978 0.824398L15.3944 2.22102L10.6614 6.95404L7.4705 3.76313C7.09224 3.38488 6.48122 3.38488 6.10297 3.76313L0.28369 9.59211C-0.0945633 9.97036 -0.0945633 10.5814 0.28369 10.9596C0.661943 11.3379 1.27297 11.3379 1.65122 10.9596L6.78188 5.81928L9.97279 9.01018C10.351 9.38843 10.9621 9.38843 11.3403 9.01018L16.7619 3.59825L18.1586 4.99488C18.4592 5.29554 18.983 5.08217 18.983 4.65542V0.48494C18.9927 0.213373 18.7793 0 18.5077 0H14.3469C13.9105 0 13.6971 0.523735 13.9978 0.824398Z" />
                            </svg>
                            <span ref={centerDeltaTextRef} className="text-main-dark"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PromotionalSalesDonut;