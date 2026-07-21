"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const comments = [
    {
        id: 1,
        name: "Kathryn Murphy",
        rating: 4,
        comment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras nec dolor vel est interdum",
        avatar: "/images/avatar/user-2.png",
        time: "This Week",
    },
    {
        id: 2,
        name: "Leslie Alexander",
        rating: 4,
        comment: "Cras nec viverra justo, a mattis lacus. Vestibulum eleifend, leo sit amet aliquam laoreet, turpis leo vulputate orci",
        avatar: "/images/avatar/user-3.png",
        time: "Last Week",
    },
    {
        id: 3,
        name: "Devon Lane",
        rating: 4,
        comment: "Morbi eget commodo diam. Praesent dignissim purus ac turpis porta",
        avatar: "/images/avatar/user-4.png",
        time: "This Week",
    },
    {
        id: 4,
        name: "Eleanor Pena",
        rating: 4,
        comment: "Phasellus et eros ullamcorper, efficitur eros eget, pharetra ante. Sed blandit risus vitae dolor feugiat, eu vulputate elit rhoncus",
        avatar: "/images/avatar/user-5.png",
        time: "Last Week",
    },
    {
        id: 5,
        name: "Eleanor Pena",
        rating: 4,
        comment: "Phasellus et eros ullamcorper, efficitur eros eget, pharetra ante. Sed blandit risus vitae dolor feugiat, eu vulputate elit rhoncus",
        avatar: "/images/avatar/user-5.png",
        time: "This Week",
    },
    {
        id: 6,
        name: "Eleanor Pena",
        rating: 4,
        comment: "Phasellus et eros ullamcorper, efficitur eros eget, pharetra ante. Sed blandit risus vitae dolor feugiat, eu vulputate elit rhoncus",
        avatar: "/images/avatar/user-5.png",
        time: "This Week",
    },
];

export default function NewComments() {
    const [filter, setFilter] = useState("All");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const filteredComments =
        filter === "All"
            ? comments
            : comments.filter((item) => item.time === filter);

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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>New Comments</h5>

                <div className="dropdown default" ref={dropdownRef}>
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                        onClick={() => setShowDropdown((prev) => !prev)}
                    >
                        <span className="icon-more">
                            <i className="icon-more-horizontal"></i>
                        </span>
                    </button>

                    <ul
                        className={`dropdown-menu dropdown-menu-end${showDropdown ? " show" : ""}`}
                    >
                        <li>
                            <button
                                className={`dropdown-item ${filter === "All" ? "active" : ""}`}
                                onClick={() => {
                                    setFilter("All");
                                    setShowDropdown(false);
                                }}
                            >
                                All
                            </button>
                        </li>

                        <li>
                            <button
                                className={`dropdown-item ${filter === "This Week" ? "active" : ""}`}
                                onClick={() => {
                                    setFilter("This Week");
                                    setShowDropdown(false);
                                }}
                            >
                                This Week
                            </button>
                        </li>

                        <li>
                            <button
                                className={`dropdown-item ${filter === "Last Week" ? "active" : ""}`}
                                onClick={() => {
                                    setFilter("Last Week");
                                    setShowDropdown(false);
                                }}
                            >
                                Last Week
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <ul className="flex flex-column gap20">
                {filteredComments.map((comment) => (
                    <li className="comment-item" key={comment.id}>
                        <div className="image">
                            <Image width={36} height={36} src={comment.avatar} alt="avatar" />
                        </div>

                        <div>
                            <div className="mb-4 name">
                                <a href="#" className="body-title-2">
                                    {comment.name}
                                </a>
                            </div>

                            <div className="ratings mb-10">
                                {Array.from({ length: 5 }, (_, index) => (
                                    <i
                                        key={index}
                                        className={`icon-star1 ${index < comment.rating ? "active" : ""}`}
                                    ></i>
                                ))}
                            </div>

                            <div className="text-tiny">{comment.comment}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}