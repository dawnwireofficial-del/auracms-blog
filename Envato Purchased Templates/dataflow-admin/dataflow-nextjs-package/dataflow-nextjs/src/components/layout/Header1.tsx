"use client";
import { Menu } from "@headlessui/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import FullScreenButton from "../elements/FullScreenButton";
import Language from "../elements/Language";
import Image from "next/image";
import { useRouter } from "next/navigation";
const ThemeSwitch = dynamic(() => import("../elements/ThemeSwitch"), {
    ssr: false,
});

const listUser = [
    {
        image: "/images/customers/customer-1.jpg",
        name: "Cameron Williamson",
        time: "10:13 PM",
        message: "Hello?",
    },
    {
        image: "/images/customers/customer-2.jpg",
        name: "Ralph Edwards",
        time: "10:13 PM",
        message: "Are you there? interested i this...",
    },
    {
        image: "/images/customers/customer-3.jpg",
        name: "Eleanor Pena",
        time: "10:13 PM",
        message: "Interested in this loads?",
    },
    {
        image: "/images/customers/customer-4.jpg",
        name: "Jane Cooper",
        time: "10:13 PM",
        message: "Okay...Do we have a deal?",
    },
];

export type Header1Props = {
    isSidebar?: boolean;
    handleSidebar: () => void;
    handleOffcanvas: () => void;
};

export default function Header1({
    isSidebar: _isSidebar,
    handleSidebar,
    handleOffcanvas,
}: Header1Props) {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    return (
        <>
            <div className="header-dashboard">
                <div className="wrap">
                    <div className="header-left">
                        <Link href="/">
                            <Image
                                id="logo_header_mobile"
                                alt="Company logo"
                                src="/images/logo/logo.svg"
                                width={154}
                                height={52}
                                data-light="/images/logo/logo.svg"
                                data-dark="/images/logo/logo-white.svg"
                                data-retina="/images/logo/logo@2x.svg"
                                priority
                            />
                        </Link>
                        <div
                            className="button-show-hide"
                            onClick={handleSidebar}
                        >
                            <i className="icon-chevron-left" />
                        </div>
                        <form className="form-search flex-grow">
                            <fieldset className="name">
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    className="show-search"
                                    name="name"
                                    tabIndex={2}
                                    aria-required="true"
                                    required
                                />
                            </fieldset>
                            <div className="button-submit">
                                <button type="submit">
                                    <i className="icon-search" />
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="header-grid">
                        <div className="header-item country">
                            <Language />
                        </div>
                        <ThemeSwitch />
                        <div className="popup-wrap noti type-header">
                            <Menu as="div" className="dropdown">
                                <Menu.Button
                                    className="btn btn-secondary dropdown-toggle"
                                    type="button"
                                >
                                    <span className="header-item">
                                        <span className="dot"></span>
                                        <i className="icon-bell" />
                                    </span>
                                </Menu.Button>
                                <Menu.Items
                                    as="ul"
                                    className="dropdown-menu dropdown-menu-end has-content show d-flex end-0"
                                    aria-labelledby="dropdownMenuButton1"
                                >
                                    <li>
                                        <h6>Message</h6>
                                    </li>
                                    {listUser.map((notification, idx) => (
                                        <li key={idx}>
                                            <div className="noti-item w-full wg-user active">
                                                <div className="image">
                                                    <Image
                                                        height={50}
                                                        width={50}
                                                        src={notification.image}
                                                        alt="avatar"
                                                        className="object-cover rounded-full"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between">
                                                        <Link
                                                            href="#"
                                                            className="body-title"
                                                        >
                                                            {notification.name}
                                                        </Link>
                                                        <div className="time">
                                                            {notification.time}
                                                        </div>
                                                    </div>
                                                    <div className="text-tiny">
                                                        {notification.message}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    <li>
                                        <Link
                                            href="#"
                                            className="tf-button w-full"
                                        >
                                            View all
                                        </Link>
                                    </li>
                                </Menu.Items>
                            </Menu>
                        </div>
                        <div className="popup-wrap message type-header">
                            <Menu as="div" className="dropdown">
                                <Menu.Button
                                    className="btn btn-secondary dropdown-toggle"
                                    type="button"
                                >
                                    <span className="header-item">
                                        <span className="dot"></span>
                                        <i className="icon-message-square" />
                                    </span>
                                </Menu.Button>
                                <Menu.Items
                                    as="ul"
                                    className="dropdown-menu dropdown-menu-end has-content show d-flex end-0"
                                    aria-labelledby="dropdownMenuButton2"
                                >
                                    <li>
                                        <h6>Notifications</h6>
                                    </li>
                                    <li>
                                        <div className="message-item item-1">
                                            <div className="image">
                                                <i className="icon-noti-1" />
                                            </div>
                                            <div>
                                                <div className="body-title-2">
                                                    Discount available
                                                </div>
                                                <div className="text-tiny">
                                                    Morbi sapien massa,
                                                    ultricies at rhoncus at,
                                                    ullamcorper nec diam
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="message-item item-2">
                                            <div className="image">
                                                <i className="icon-noti-2" />
                                            </div>
                                            <div>
                                                <div className="body-title-2">
                                                    Account has been verified
                                                </div>
                                                <div className="text-tiny">
                                                    Mauris libero ex, iaculis
                                                    vitae rhoncus et
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="message-item item-3">
                                            <div className="image">
                                                <i className="icon-noti-3" />
                                            </div>
                                            <div>
                                                <div className="body-title-2">
                                                    Order shipped successfully
                                                </div>
                                                <div className="text-tiny">
                                                    Integer aliquam eros nec
                                                    sollicitudin sollicitudin
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="message-item item-4">
                                            <div className="image">
                                                <i className="icon-noti-4" />
                                            </div>
                                            <div>
                                                <div className="body-title-2">
                                                    Order pending:{" "}
                                                    <span>ID 305830</span>
                                                </div>
                                                <div className="text-tiny">
                                                    Ultricies at rhoncus at
                                                    ullamcorper
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="tf-button w-full"
                                        >
                                            View all
                                        </Link>
                                    </li>
                                </Menu.Items>
                            </Menu>
                        </div>
                        <FullScreenButton />
                        <div className="popup-wrap apps type-header">
                            <Menu as="div" className="dropdown">
                                <Menu.Button
                                    className="btn btn-secondary dropdown-toggle"
                                    type="button"
                                >
                                    <span className="header-item">
                                        <i className="icon-grid" />
                                    </span>
                                </Menu.Button>
                                <Menu.Items
                                    as="ul"
                                    className="dropdown-menu dropdown-menu-end has-content show d-flex end-0"
                                    aria-labelledby="dropdownMenuButton4"
                                >
                                    <li>
                                        <h6>Related apps</h6>
                                    </li>
                                    <li>
                                        <div className="list-apps">
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-1.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Photoshop
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-2.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        illustrator
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-3.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Sheets
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-4.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Gmail
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-5.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Messenger
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-6.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Youtube
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-7.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Flaticon
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-8.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        Instagram
                                                    </div>
                                                </Link>
                                            </a>
                                            <a href="#" className="item">
                                                <div className="image">
                                                    <Image
                                                        width={31}
                                                        height={31}
                                                        src="/images/apps/item-9.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <Link href="#">
                                                    <div className="text text-tiny">
                                                        PDF
                                                    </div>
                                                </Link>
                                            </a>
                                        </div>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="tf-button w-full"
                                        >
                                            View all app
                                        </Link>
                                    </li>
                                </Menu.Items>
                            </Menu>
                        </div>
                        <div className="popup-wrap user type-header">
                            <div className="dropdown">
                                <button
                                    className="btn btn-secondary dropdown-toggle"
                                    type="button"
                                    id="dropdownMenuButton3"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <span className="header-user wg-user">
                                        <span className="image">
                                            <Image
                                                src="/images/avatar/user-1.png"
                                                alt=""
                                                width={40}
                                                height={40}
                                                className="object-cover rounded-full"
                                            />
                                        </span>
                                        <span className="flex flex-column">
                                            <span className="name mb-2">
                                                Kristin Watson
                                            </span>
                                            <span className="text-tiny">
                                                Admin
                                            </span>
                                        </span>
                                    </span>
                                </button>
                                <div
                                    className="dropdown-menu dropdown-menu-end has-content"
                                    role="region"
                                    aria-label="dropdownMenuButton3"
                                >
                                    <Link href="#" className="user-item">
                                        <div className="icon">
                                            <i className="icon-user" />
                                        </div>
                                        <div className="body-title-2">
                                            Account
                                        </div>
                                    </Link>
                                    <Link href="#" className="user-item">
                                        <div className="icon">
                                            <i className="icon-mail" />
                                        </div>
                                        <div className="body-title-2">
                                            Inbox
                                        </div>
                                        <div className="number">27</div>
                                    </Link>
                                    <Link href="#" className="user-item">
                                        <div className="icon">
                                            <i className="icon-file-text" />
                                        </div>
                                        <div className="body-title-2">
                                            Taskboard
                                        </div>
                                    </Link>
                                    <Link
                                        href={"/setting"}
                                        className="user-item"
                                    >
                                        <div className="icon">
                                            <i className="icon-settings" />
                                        </div>
                                        <div className="body-title-2">
                                            Setting
                                        </div>
                                    </Link>
                                    <Link href={"/faqs"} className="user-item">
                                        <div className="icon">
                                            <i className="icon-headphones" />
                                        </div>
                                        <div className="body-title-2">
                                            Support
                                        </div>
                                    </Link>
                                    <a
                                        className="user-item"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleLogout();
                                        }}
                                    >
                                        <div className="icon">
                                            <i className="icon-log-out" />
                                        </div>
                                        <div className="body-title-2">
                                            Log out
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="divider" />

                        <div
                            className="setting cursor-pointer"
                            onClick={handleOffcanvas}
                        >
                            <i className="icon-settings" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
