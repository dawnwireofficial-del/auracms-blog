"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/models";
import Image from "next/image";

const EMPTY_ORDERS: Product[] = [];

type OrderDetailProps = {
    products?: Product[];
    items?: number;
};

type SortType = "default" | "name" | "quantity" | "price";

// Helper to safely parse price; gracefully handle falsy/undefined
function parsePrice(price: string | number | undefined): number {
    if (typeof price === "number") return price;
    if (typeof price === "string")
        return isNaN(parseFloat(price.replace(/[^0-9.-]+/g, "")))
            ? 0
            : parseFloat(price.replace(/[^0-9.-]+/g, ""));
    return 0;
}

// Helper to safely parse quantity; gracefully handle undefined/falsy
function parseQty(qty: string | number | undefined): number {
    if (typeof qty === "number" && !isNaN(qty)) return qty;
    if (typeof qty === "string") {
        const parsed = parseInt(qty, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

export default function OrderDetail({ products = EMPTY_ORDERS }: OrderDetailProps) {
    const [sortBy, setSortBy] = useState<SortType>("default");
    const [isOpenSort, setIsOpenSort] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const sortedProducts = useMemo(() => {
        const data = [...products];
        switch (sortBy) {
            case "name":
                return data.sort((a, b) => a.name.localeCompare(b.name));
            case "quantity":
                return data.sort(
                    (a, b) =>
                        parseQty(b.quantity) - parseQty(a.quantity),
                );
            case "price":
                return data.sort(
                    (a, b) => parsePrice(b.price) - parsePrice(a.price),
                );
            default:
                return data;
        }
    }, [products, sortBy]);

    const subtotal = sortedProducts.reduce(
        (sum, item) =>
            sum +
            parsePrice(item.price) * parseQty(item.quantity),
        0,
    );

    const shipping = 10;
    const tax = 5;
    const total = subtotal + shipping + tax;

    const sortLabel =
        sortBy === "name"
            ? "Name"
            : sortBy === "quantity"
            ? "Quantity"
            : sortBy === "price"
            ? "Price"
            : "Sort";

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const t = e.target;
            if (
                t instanceof Node &&
                dropdownRef.current &&
                !dropdownRef.current.contains(t)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="wg-order-detail">
            <div className="left flex-grow">
                <div className="wg-box mb-20">
                    <div className="wg-table table-order-detail">
                        <ul className="table-title bg-dark-1 flex items-center justify-between gap20 mb-24">
                            <li>
                                <div className="body-title">All item</div>
                            </li>
                            <li>
                                <div className="dropdown default">
                                    <button
                                        className="btn btn-secondary dropdown-toggle"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                    >
                                        <span className="body-title-2 flex items-center gap8">
                                            {sortLabel}
                                            <i className="h6 icon-chevron-down"></i>
                                        </span>
                                    </button>
                                    <ul
                                        className={`dropdown-menu dropdown-menu-end${
                                            showDropdown ? " show" : ""
                                        }`}
                                    >
                                        <li>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSortBy("name");
                                                    setIsOpenSort(false);
                                                }}
                                            >
                                                Name
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSortBy("quantity");
                                                    setIsOpenSort(false);
                                                }}
                                            >
                                                Quantity
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSortBy("price");
                                                    setIsOpenSort(false);
                                                }}
                                            >
                                                Price
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        </ul>

                        <ul className="flex flex-column">
                            {sortedProducts.map((item) => (
                                <li className="wg-product" key={item.id}>
                                    <div className="name">
                                        <div className="image">
                                            <Image width={50} height={50} src={item.image} alt="image" />
                                        </div>
                                        <div>
                                            <div className="text-tiny">
                                                Product name
                                            </div>
                                            <div className="title">
                                                <Link
                                                    href={`/product-detail/${item.id}`}
                                                    className="body-title-2"
                                                >
                                                    {item.name}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-tiny mb-4">
                                            Quantity
                                        </div>
                                        <div className="title">
                                            <div className="body-title-2">
                                                {parseQty(item.quantity)}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-tiny mb-4">
                                            Price
                                        </div>
                                        <div className="title">
                                            <div className="body-title-2">
                                                $
                                                {parsePrice(item.price).toFixed(
                                                    2,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="wg-box">
                    <div className="wg-table table-cart-totals">
                        <ul className="table-title flex mb-24">
                            <li>
                                <div className="body-title">Cart Totals</div>
                            </li>
                            <li>
                                <div className="body-title">Price</div>
                            </li>
                        </ul>

                        <ul className="flex flex-column gap14">
                            <li className="cart-totals-item">
                                <span className="body-text">Subtotal:</span>
                                <span className="body-title-2">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </li>
                            <li className="divider"></li>

                            <li className="cart-totals-item">
                                <span className="body-text">Shipping:</span>
                                <span className="body-title-2">
                                    ${shipping.toFixed(2)}
                                </span>
                            </li>
                            <li className="divider"></li>

                            <li className="cart-totals-item">
                                <span className="body-text">Tax (GST):</span>
                                <span className="body-title-2">
                                    ${tax.toFixed(2)}
                                </span>
                            </li>
                            <li className="divider"></li>

                            <li className="cart-totals-item">
                                <span className="body-title">Total price:</span>
                                <span className="body-title tf-color-1">
                                    ${total.toFixed(2)}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="right">
                <div className="wg-box mb-20 gap10">
                    <div className="body-title">Summary</div>
                    <div className="summary-item">
                        <div className="body-text">Order ID</div>
                        <div className="body-title-2">#192847</div>
                    </div>
                    <div className="summary-item">
                        <div className="body-text">Date</div>
                        <div className="body-title-2">20 Nov 2023</div>
                    </div>
                    <div className="summary-item">
                        <div className="body-text">Total</div>
                        <div className="body-title-2 tf-color-1">
                            ${total.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="wg-box mb-20 gap10">
                    <div className="body-title">Shipping Address</div>
                    <div className="body-text">
                        3517 W. Gray St. Utica, Pennsylvania 57867
                    </div>
                </div>

                <div className="wg-box mb-20 gap10">
                    <div className="body-title">Payment Method</div>
                    <div className="body-text">
                        Pay on Delivery (Cash/Card). Cash on delivery (COD)
                        available. Card/Net banking acceptance subject to device
                        availability.
                    </div>
                </div>

                <div className="wg-box gap10">
                    <div className="body-title">Expected Date Of Delivery</div>
                    <div className="body-title-2 text-main">20 Nov 2023</div>
                    <Link
                        className="tf-button style-1 w-full"
                        href={"/order-tracking"}
                    >
                        <i className="icon-truck"></i>
                        Track order
                    </Link>
                </div>
            </div>
        </div>
    );
};

