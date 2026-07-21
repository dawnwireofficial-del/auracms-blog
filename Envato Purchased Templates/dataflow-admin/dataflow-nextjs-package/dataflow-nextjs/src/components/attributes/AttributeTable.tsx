"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/common/ConfirmModal";
import Link from "next/link";
import { Attribute } from "@/types/models";

const EMPTY_ATTRIBYTE: Attribute[] = [];

type AttributeListProps = {
    AttributeItem?: Attribute[];
};


export default function AttributeTable({ AttributeItem = EMPTY_ATTRIBYTE }: AttributeListProps) {
    const [list, setList] = useState<Attribute[]>(AttributeItem);
    const [entries, setEntries] = useState("10");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [status, setStatus] = useState("All Status");
    const [sortBy, setSortBy] = useState("Sort by (Defaut)");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<Attribute | null>(
        null,
    );

    useEffect(() => {
        setList(AttributeItem);
    }, [AttributeItem]);

    const processedData = useMemo(() => {
        let result = [...list];

        if (search.trim()) {
            const keyword = search.toLowerCase();
            result = result.filter(
                (item) =>
                    item.category.toLowerCase().includes(keyword) ||
                    item.value.toLowerCase().includes(keyword),
            );
        }

        if (categoryFilter !== "All Categories") {
            result = result.filter((item) => item.group === categoryFilter);
        }

        if (status !== "All Status") {
            result = result.filter((item) => item.status === status);
        }

        if (sortBy === "ID") {
            result.sort((a, b) => a.id - b.id);
        }

        if (sortBy === "Name") {
            result.sort((a, b) => a.category.localeCompare(b.category));
        }

        if (sortBy === "Price") {
            result.sort((a, b) => a.value.localeCompare(b.value));
        }

        if (sortBy === "Payment") {
            result.sort((a, b) => a.status.localeCompare(b.status));
        }

        return result;
    }, [list, search, categoryFilter, status, sortBy]);

    const itemsPerPage = Number(entries);
    const totalPages = Math.max(
        1,
        Math.ceil(processedData.length / itemsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = processedData.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [entries, search, categoryFilter, status, sortBy]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const handleDelete = () => {
        if (!selectedItem) return;
        setList((prev) => prev.filter((item) => item.id !== selectedItem.id));
        setSelectedItem(null);
    };

    return (
        <>
            <div className="wg-box">
                <div className="flex items-center justify-between gap10 flex-wrap">
                    <div className="wg-filter flex-grow">
                        <div className="show">
                            <div className="text-tiny">Showing</div>
                            <div className="select">
                                <select
                                    value={entries}
                                    onChange={(e) => setEntries(e.target.value)}
                                >
                                    <option>10</option>
                                    <option>20</option>
                                    <option>30</option>
                                </select>
                            </div>
                            <div className="text-tiny">entries</div>
                        </div>

                        <form
                            className="form-search"
                            onSubmit={handleSearchSubmit}
                        >
                            <fieldset className="name">
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    name="name"
                                    tabIndex={2}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </fieldset>
                            <div className="button-submit">
                                <button type="submit">
                                    <i className="icon-search"></i>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center justify-between gap10 flex-wrap">
                        <div className="tf-select">
                            <select
                                value={categoryFilter}
                                onChange={(e) =>
                                    setCategoryFilter(e.target.value)
                                }
                            >
                                <option>All Categories</option>
                                <option>TShirt</option>
                                <option>Pants</option>
                                <option>Hat</option>
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option>All Status</option>
                                <option>Publish</option>
                                <option>Draft</option>
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option>Sort by (Defaut)</option>
                                <option>ID</option>
                                <option>Name</option>
                                <option>Price</option>
                                <option>Payment</option>
                            </select>
                        </div>

                        <Link
                            className="tf-button px-40"
                            href={"/add-attributes"}
                        >
                            <i className="icon-plus"></i>
                            Add new
                        </Link>
                    </div>
                </div>

                <div className="wg-table table-all-attribute">
                    <ul className="table-title flex gap20 mb-14">
                        <li>
                            <div className="body-title">Category</div>
                        </li>
                        <li>
                            <div className="body-title">Value</div>
                        </li>
                        <li>
                            <div className="body-title">Action</div>
                        </li>
                    </ul>

                    <ul className="flex flex-column">
                        {paginatedData.map((item) => (
                            <li
                                className="wg-product item-row gap20"
                                key={item.id}
                            >
                                <div className="body-title-2 fw-5 text-info">
                                    {item.category}
                                </div>

                                <div className="body-text text-info">
                                    {item.value}
                                </div>

                                <div className="list-icon-function">
                                    <Link
                                        href={"/add-attributes"}
                                        className="item eye"
                                    >
                                        <i className="icon-eye text-main"></i>
                                    </Link>
                                    <Link
                                        href={"/add-attributes"}
                                        className="item edit"
                                    >
                                        <i className="icon-edit-3"></i>
                                    </Link>
                                    <div
                                        className="item trash"
                                        onClick={() => setSelectedItem(item)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <i className="icon-trash-2"></i>
                                    </div>
                                </div>
                            </li>
                        ))}

                        {paginatedData.length === 0 && (
                            <li className="body-text text-center">
                                No attributes found
                            </li>
                        )}
                    </ul>
                </div>

                <div className="divider"></div>

                <div className="flex items-center justify-between flex-wrap gap10">
                    <div className="text-tiny text-surface-2">
                        {processedData.length > 0
                            ? `Showing ${startIndex + 1} to ${Math.min(
                                  endIndex,
                                  processedData.length,
                              )} of ${processedData.length} entries`
                            : "Showing 0 entries"}
                    </div>

                    {/* Hide pagination if only 1 page */}
                    {totalPages > 1 && (
                        <ul className="wg-pagination">
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safeCurrentPage > 1)
                                            setCurrentPage(safeCurrentPage - 1);
                                    }}
                                >
                                    <i className="icon-chevron-left"></i>
                                </a>
                            </li>

                            {Array.from({ length: totalPages }, (_, index) => {
                                const page = index + 1;
                                return (
                                    <li
                                        key={page}
                                        className={
                                            safeCurrentPage === page ? "active" : ""
                                        }
                                    >
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(page);
                                            }}
                                        >
                                            {page}
                                        </a>
                                    </li>
                                );
                            })}

                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safeCurrentPage < totalPages) {
                                            setCurrentPage(
                                                safeCurrentPage + 1,
                                            );
                                        }
                                    }}
                                >
                                    <i className="icon-chevron-right"></i>
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={!!selectedItem}
                title="Confirm delete"
                message={
                    selectedItem ? (
                        <>
                            Are you sure you want to delete attribute{" "}
                            <strong>{selectedItem.category}</strong>?
                        </>
                    ) : null
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setSelectedItem(null)}
            />
        </>
    );
}
