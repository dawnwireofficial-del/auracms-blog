"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/models";

const EMPTY_PRODUCTS: Product[] = [];

type TopSaleProps = {
    productsTopSeles?: Product[];
};

export default function TopSale({ productsTopSeles = EMPTY_PRODUCTS }: TopSaleProps) {
    const [selectedFilter, setSelectedFilter] = useState<"Weekly" | "Monthly" | "Yearly">("Weekly");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredProducts = [...productsTopSeles].sort((a, b) => {
        const sa = a.sales?.[selectedFilter] ?? 0;
        const sb = b.sales?.[selectedFilter] ?? 0;
        return sb - sa;
    });

    const handleSelectFilter = (filter: "Weekly" | "Monthly" | "Yearly") => {
        setSelectedFilter(filter);
        setIsOpen(false);
    };

    return (
        <div className="wg-box w-half">
            <div className="flex items-center justify-between">
                <h5>Top sale</h5>

                <div
                    ref={dropdownRef}
                    className={`dropdown default style-box ${isOpen ? "show" : ""}`}
                >
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span className="view-all">
                            {selectedFilter}
                            <i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    <ul className={`dropdown-menu ${isOpen ? "show" : ""}`}>
                        <li>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSelectFilter("Yearly") }}>
                                Yearly
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSelectFilter("Monthly") }}>
                                Monthly
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSelectFilter("Weekly") }}>
                                Weekly
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <ul className="flex flex-column h-full has-divider-line">
                {filteredProducts.map((item) => (
                    <li key={item.id} className="wg-product">
                        <div className="name flex-grow">
                            <div className="image">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={56}
                                    height={56}
                                />
                            </div>

                            <div>
                                <div className="title">
                                    <Link href={`/product-detail/${item.id}`} className="body-text">
                                        {item.name}
                                    </Link>
                                </div>
                                <div className="price text-tiny">{item.price}</div>
                            </div>
                        </div>

                        <div className="sale body-text">
                            {item.sales?.[selectedFilter] ?? 0} Sales
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}