import Layout from "@/components/layout/Layout";
import OrderDetail from "@/components/order/OrderDetail";
import OrderTracking from "@/components/order/OrderTracking";
import { orderDetail } from "@/data/dataProduct";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Order Detail</h3>
                    <ul className="breadcrumbs flex items-center flex-wrap justify-start gap10">
                        <li>
                            <Link href={"/"}>
                                <div className="text-tiny">Dashboard</div>
                            </Link>
                        </li>
                        <li>
                            <i className="icon-chevron-right"></i>
                        </li>
                        <li>
                            <Link href={"/order-list"}>
                                <div className="text-tiny">Order</div>
                            </Link>
                        </li>
                        <li>
                            <i className="icon-chevron-right"></i>
                        </li>
                        <li>
                            <div className="text-tiny">Order Tracking</div>
                        </li>
                    </ul>
                </div>
                <OrderTracking
                    product={{
                        name: "Essential Oversized Zip Hoodie",
                        image: "/images/images-section/track-oder-1.jpg",
                        orderId: "#192847",
                        brand: "Nike",
                        placedDate: "20 Nov 2023",
                        quantity: 1,
                    }}
                    roadMap={[
                        {
                            title: "Receiving orders",
                            time: "05:43 AM",
                            active: true,
                        },
                        {
                            title: "Order processing",
                            time: "01:21 PM",
                            active: true,
                        },
                        {
                            title: "Being delivered",
                            time: "Processing",
                            active: true,
                        },
                        { title: "Delivered", time: "Pending", active: false },
                    ]}
                    history={[
                        {
                            date: "20 Nov 2023",
                            time: "2:30 PM",
                            description: "The sender is preparing the goods",
                            location:
                                "2715 Ash Dr. San Jose, South Dakota 83475",
                        },
                        {
                            date: "20 Nov 2023",
                            time: "01:00 PM",
                            description:
                                "The order has arrived at the post office",
                            location:
                                "3517 W. Gray St. Utica, Pennsylvania 57867",
                        },
                        {
                            date: "21 Nov 2023",
                            time: "03:58 AM",
                            description: "The carrier is picking up the goods",
                            location:
                                "1901 Thornridge Cir. Shiloh, Hawaii 81063",
                        },
                        {
                            date: "22 Nov 2023",
                            time: "06:26 PM",
                            description: "The order has been shipped",
                            location:
                                "4140 Parker Rd. Allentown, New Mexico 31134",
                        },
                        {
                            date: "22 Nov 2023",
                            time: "03:45 PM",
                            description:
                                "Your order will be delivered to you in 30 minutes",
                            location: "8502 Preston Rd. Inglewood, Maine 98380",
                        },
                        {
                            date: "23 Nov 2023",
                            time: "12:21 AM",
                            description:
                                "The order has been delivered successfully",
                            location:
                                "3891 Ranchview Dr. Richardson, California 62639",
                        },
                    ]}
                />
            </Layout>
        </>
    );
}
