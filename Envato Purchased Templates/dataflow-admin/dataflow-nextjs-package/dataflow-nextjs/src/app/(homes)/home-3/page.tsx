import React from "react";
import Layout from "@/components/layout/Layout";
import { CHART3, trafficSourceData, revenueData } from "@/data/dataChart";
import { recentOrders } from "@/data/dataProduct";
import RecentOrder2 from "@/components/widgets/RecentOrder2";
import UserLocationMap from "@/components/chart/UserLocationMap";
import StasrtsCard2 from "@/components/chart/StartsCard2";
import RevenueChart3 from "@/components/chart/RevenueChart3";
import TrafficSources from "@/components/chart/TrafficSources";
import TopCustomers from "@/components/widgets/TopCustomers";
import NewComments from "@/components/widgets/NewComments";
import WebsiteVisitors from "@/components/widgets/WebsiteVisitors";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="tf-section-2 mb-30">
                    {CHART3.map((card, idx) => (
                        <StasrtsCard2 key={idx} card={card} />
                    ))}
                </div>
                <div className="tf-section-1 mb-30">
                    <RevenueChart3 revenueData={revenueData} />
                    <div className="flex gap20 flex-wrap-mobile">
                        <TrafficSources trafficSourceData={trafficSourceData} />
                        <TopCustomers />
                    </div>
                </div>
                <div className="tf-section-1 mb-30">
                    <RecentOrder2 recentOrders={recentOrders} />
                    <NewComments />
                </div>
                <div className="tf-section-1">
                    <WebsiteVisitors />
                    <UserLocationMap
                        idMap="usa-vectormap2"
                        classWrapMap="wrap-usa-vectormap-2"
                    />
                </div>
            </Layout>
        </>
    );
}
