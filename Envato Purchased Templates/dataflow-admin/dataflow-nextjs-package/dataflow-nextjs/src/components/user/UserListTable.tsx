"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/common/ConfirmModal";
import Link from "next/link";
import Image from "next/image";


type UserItem = {
    id: number;
    name: string;
    avatar: string;
    phone: string;
    email: string;
    role: string;
    status: string;
    note?: string;
    viewHref?: string;
    editHref?: string;
};

type UserListTableProps = {
    usersData: UserItem[];
};

export default function UserListTable({ usersData }: UserListTableProps) {
    const [list, setList] = useState<UserItem[]>(usersData ?? []);
    const [entries, setEntries] = useState("10");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [sortBy, setSortBy] = useState("Sort by (Default)");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<UserItem | null>(null);

    useEffect(() => {
        setList(usersData ?? []);
    }, [usersData]);

    const processedData = useMemo(() => {
        let result = [...list];

        if (search.trim()) {
            const keyword = search.toLowerCase();
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(keyword) ||
                    item.email.toLowerCase().includes(keyword) ||
                    item.phone.toLowerCase().includes(keyword),
            );
        }

        if (roleFilter !== "All Roles") {
            result = result.filter((item) => item.role === roleFilter);
        }

        if (statusFilter !== "All Status") {
            result = result.filter((item) => item.status === statusFilter);
        }

        if (sortBy === "Name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (sortBy === "Email") {
            result.sort((a, b) => a.email.localeCompare(b.email));
        }

        if (sortBy === "Role") {
            result.sort((a, b) => a.role.localeCompare(b.role));
        }

        return result;
    }, [list, search, roleFilter, statusFilter, sortBy]);

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
    }, [entries, search, roleFilter, statusFilter, sortBy]);

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
                                    placeholder="Search by name, email, phone..."
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
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option>All Roles</option>
                                <option>Admin</option>
                                <option>Manager</option>
                                <option>Staff</option>
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option>Sort by (Default)</option>
                                <option>Name</option>
                                <option>Email</option>
                                <option>Role</option>
                            </select>
                        </div>

                        <Link className="tf-button px-40" href={"/add-new-user"}>
                            <i className="icon-plus"></i>
                            Add new
                        </Link>
                    </div>
                </div>

                <div className="wg-table table-all-user">
                    <ul className="table-title bg-dark-1 flex gap20 mb-14">
                        <li>
                            <div className="body-title">User</div>
                        </li>
                        <li>
                            <div className="body-title">Phone</div>
                        </li>
                        <li>
                            <div className="body-title">Email</div>
                        </li>
                        <li>
                            <div className="body-title">Action</div>
                        </li>
                    </ul>

                    <ul className="flex flex-column">
                        {paginatedData.map((item, idx) => (
                            <li
                                className="wg-product item-row gap20"
                                key={item.id ?? `user-row-${idx}`}
                            >
                                <div className="name flex-grow">
                                    <div className="image rounded-circle">
                                        <Image width={50} height={50} src={item.avatar} alt="image" />
                                    </div>
                                    <div>
                                        <div className="title">
                                            <Link
                                                href={item.editHref ?? "/add-new-user"}
                                                className="body-text"
                                            >
                                                {item.name}
                                            </Link>
                                        </div>
                                        <div className="text-tiny">
                                            {item.role} • {item.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="body-text">{item.phone}</div>
                                <div className="body-text">{item.email}</div>

                                <div className="list-icon-function">
                                    <Link
                                        href={item.viewHref ?? "/add-new-user"}
                                        className="item eye"
                                    >
                                        <i className="icon-eye"></i>
                                    </Link>
                                    <Link
                                        href={item.editHref ?? "/add-new-user"}
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
                            <li className="body-text text-center" key="no-users-found">
                                No users found
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
                            Are you sure you want to delete user{" "}
                            <strong>{selectedItem.name}</strong>?
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
