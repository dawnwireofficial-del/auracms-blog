import RevenueChart3 from "@/components/chart/RevenueChart3";
import Layout from "@/components/layout/Layout";
import TopCustomers from "@/components/widgets/TopCustomers";
import TopPagePost from "@/components/widgets/TopPagePost";
import TransferHistory from "@/components/widgets/TransferHistory";
import { PagePostData, revenueData } from "@/data/dataChart";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    const transferData = [
        {
            id: "11081197",
            name: "Kathryn Murphy",
            date: "Mar 20, 2023",
            total: "$2,700",
        },
        {
            id: "38766940",
            name: "Floyd Miles",
            date: "Dec 30, 2023",
            total: "$1,000",
        },
        {
            id: "43397744",
            name: "Brooklyn Simmons",
            date: "Dec 7, 2023",
            total: "$4,000",
        },
        {
            id: "66277431",
            name: "Wade Warren",
            date: "Mar 20, 2023",
            total: "$9,450",
        },
        {
            id: "58276066",
            name: "Devon Lane",
            date: "Dec 30, 2023",
            total: "$4,400",
        },
        {
            id: "93242854",
            name: "Jenny Wilson",
            date: "Dec 30, 2023",
            total: "$4,750",
        },
        {
            id: "110811923",
            name: "Jane Cooper",
            date: "Dec 4, 2023",
            total: "$1,000",
        },
        {
            id: "55700223",
            name: "Albert Flores",
            date: "Feb 2, 2023",
            total: "$3,250",
        },
        {
            id: "01906912",
            name: "Robert Fox",
            date: "Feb 2, 2023",
            total: "$2,100",
        },
        {
            id: "34034474",
            name: "Theresa Webb",
            date: "Dec 4, 2023",
            total: "$7,750",
        },
    ];
    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Report</h3>
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
                            <div className="text-tiny">Report</div>
                        </li>
                    </ul>
                </div>
                <div className="tf-section-1 mb-30">
                    <RevenueChart3 revenueData={revenueData} />
                    <div className="flex gap20 flex-wrap-mobile">
                        <TopPagePost data={PagePostData} />
                        <TopCustomers />
                    </div>
                </div>
                <TransferHistory data={transferData} />
            </Layout>
        </>
    );
}
