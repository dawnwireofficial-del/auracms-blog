"use client";

import {
    useEffect,
    useMemo,
    useState,
    type MouseEvent as ReactMouseEvent,
} from "react";
import { geoAlbersUsa, geoPath, type GeoPath } from "d3-geo";
import { feature as topojsonFeature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";

import usStates from "../../../public/data/states-10m.json";

type HighlightInfo = { color: string; percent: string; dotClass: string };
const HIGHLIGHT: Record<string, HighlightInfo> = {
    California: { color: "#F97316", percent: "40%", dotClass: "t6" },
    Arizona: { color: "#FB923C", percent: "15%", dotClass: "t6" },
    Texas: { color: "#FDBA74", percent: "10%", dotClass: "t3" },
    Georgia: { color: "#FED7AA", percent: "3.5%", dotClass: "t3" },
    "North Carolina": { color: "#FCD9BD", percent: "2%", dotClass: "t3" },
    Florida: { color: "#FFEDD5", percent: "1.5%", dotClass: "t3" },
};

const MAP_WIDTH = 959;
const MAP_HEIGHT = 593;

type MapTooltip = {
    name: string;
    percent: string;
    x: number;
    y: number;
};

type StateGeoFeature = Feature<Geometry, { name?: string }>;

type UserLocationMapProps = {
    idMap?: string;
    classWrapMap?: string;
};

export default function UserLocationMap({
    idMap = "usa-vectormap",
    classWrapMap = "wrap-usa-vectormap",
}: UserLocationMapProps) {
    const [tooltip, setTooltip] = useState<MapTooltip | null>(null);
    const [geographies, setGeographies] = useState<StateGeoFeature[]>([]);
    const [hoveredState, setHoveredState] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // Sync load of local static JSON data
        function loadMap() {
            try {
                // usStates is JSON already imported via import statement
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const topo: any = usStates;

                const result = topojsonFeature(
                    topo,
                    topo.objects.states,
                ) as unknown as FeatureCollection<Geometry, { name?: string }>;

                if (result && Array.isArray(result.features)) {
                    if (mounted)
                        setGeographies(result.features as StateGeoFeature[]);
                } else {
                    if (mounted) setGeographies([]);
                }
            } catch (error) {
                console.error("Failed to load US map:", error);
            }
        }

        loadMap();

        return () => {
            mounted = false;
        };
    }, []);

    const pathGenerator = useMemo<GeoPath | null>(() => {
        if (!geographies.length) return null;

        const projection = geoAlbersUsa().fitSize([MAP_WIDTH, MAP_HEIGHT], {
            type: "FeatureCollection",
            features: geographies,
        });

        return geoPath(projection);
    }, [geographies]);

    const handleMouseEnter = (
        e: ReactMouseEvent<SVGPathElement>,
        name: string,
        match?: HighlightInfo,
    ) => {
        setHoveredState(name);
        setTooltip({
            name,
            percent: match?.percent ?? "0%",
            x: e.clientX,
            y: e.clientY,
        });
    };

    const handleMouseMove = (e: ReactMouseEvent<SVGPathElement>) => {
        setTooltip((prev) =>
            prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
        );
    };

    const handleMouseLeave = () => {
        setHoveredState(null);
        setTooltip(null);
    };

    const legendEntries: [string, HighlightInfo][] = Object.entries(HIGHLIGHT);

    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>User Location</h5>
            </div>

            <div className={classWrapMap}>
                <div id={idMap} style={{ position: "relative" }}>
                    <svg
                        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                        width="100%"
                        height="100%"
                        role="img"
                        aria-label="USA user location map"
                    >
                        {pathGenerator &&
                            geographies.map((geo) => {
                                const name = geo.properties?.name || "";
                                const match = HIGHLIGHT[name];
                                const isHovered = hoveredState === name;
                                const d = pathGenerator(geo);

                                if (!d) return null;

                                return (
                                    <path
                                        key={String(geo.id ?? name)}
                                        d={d}
                                        fill={
                                            isHovered
                                                ? match
                                                    ? match.color
                                                    : "#4b4b4b"
                                                : match
                                                  ? match.color
                                                  : "#30303080"
                                        }
                                        stroke="#fff"
                                        strokeWidth={0.5}
                                        onMouseEnter={(e) =>
                                            handleMouseEnter(e, name, match)
                                        }
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        style={{
                                            outline: "none",
                                            opacity: isHovered ? 0.8 : 1,
                                            cursor: "pointer",
                                            transition:
                                                "opacity 0.2s ease, fill 0.2s ease",
                                        }}
                                    />
                                );
                            })}
                    </svg>

                    {tooltip && (
                        <div
                            className="jvectormap-label"
                            style={{
                                position: "fixed",
                                top: tooltip.y - 30,
                                left: tooltip.x - 40,
                                zIndex: 50,
                                pointerEvents: "none",
                            }}
                        >
                            {tooltip.name} <strong>{tooltip.percent}</strong>
                        </div>
                    )}
                </div>

                <div className="bot">
                    <div className="flex flex-wrap items-center justify-between gap20 mb-20">
                        {legendEntries.slice(0, 3).map(([state, data]) => (
                            <div className="block-legend" key={state}>
                                <div className={`dot ${data.dotClass}`}></div>
                                <div className="text-tiny text-surface-2">
                                    {state}{" "}
                                    <span className="fw-7 text-main-dark">
                                        {data.percent}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap20">
                        {legendEntries.slice(3).map(([state, data]) => (
                            <div className="block-legend" key={state}>
                                <div className={`dot ${data.dotClass}`}></div>
                                <div className="text-tiny text-surface-2">
                                    {state}{" "}
                                    <span className="fw-7 text-main-dark">
                                        {data.percent}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
