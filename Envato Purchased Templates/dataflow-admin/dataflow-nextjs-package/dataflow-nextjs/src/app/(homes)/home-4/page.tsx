import React from "react";
import Layout from "@/components/layout/Layout";
import { CHART4, revenueOrderData } from "@/data/dataChart";
import { productsTopSeles, recentOrders } from "@/data/dataProduct";
import UserLocationMap from "@/components/chart/UserLocationMap";
import TopCustomers from "@/components/widgets/TopCustomers";
import NewComments from "@/components/widgets/NewComments";
import GoalProgress from "@/components/chart/GoalProgress";
import StartsCard3 from "@/components/chart/StartsCard3";
import SaleByCategory from "@/components/chart/SaleByCategory";
import RecentOrders from "@/components/widgets/RecentOrder";
import RevenueChart from "@/components/chart/RevenueChart";
import TopSale from "@/components/widgets/TopSale";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="tf-section-3 mb-30">
                    <GoalProgress percent={61} />
                    {CHART4.map((card, idx) => (
                        <StartsCard3 key={idx} card={card} />
                    ))}
                </div>
                <div className="tf-section-5 mb-30">
                    <SaleByCategory />
                    <RecentOrders recentOrders={recentOrders} />
                </div>
                <div className="tf-section-1 mb-30">
                    <UserLocationMap
                        idMap="usa-vectormap2"
                        classWrapMap="wrap-usa-vectormap-2"
                    />
                    <RevenueChart chartData={revenueOrderData} />
                </div>
                <div className="tf-section-1">
                    <div className="flex gap20 flex-wrap-mobile">
                        <TopSale productsTopSeles={productsTopSeles} />
                        <TopCustomers />
                    </div>
                    <NewComments />
                </div>
            </Layout>
        </>
    );
}
