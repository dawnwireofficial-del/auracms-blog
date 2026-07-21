import React from "react";
import Layout from "@/components/layout/Layout";
import StartsCard from "@/components/chart/StartsCard";
import { CHART2, chartData, PagePostData } from "@/data/dataChart";
import { productsTopSeles, recentOrders } from "@/data/dataProduct";
import RecentOrders from "@/components/widgets/RecentOrder";
import RevenueChart2 from "@/components/chart/RevenueChart2";
import TopSale from "@/components/widgets/TopSale";
import TopPagePost from "@/components/widgets/TopPagePost";
import OrderSummary from "@/components/chart/OrderSummary";
import SaleByCategory from "@/components/chart/SaleByCategory";
import UserLocationMap from "@/components/chart/UserLocationMap";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="tf-section-5 mb-30">
                    <div className="d-flex flex-column gap20">
                        {CHART2.map((card, i) => (
                            <StartsCard key={i} {...card} />
                        ))}
                    </div>
                    <RecentOrders recentOrders={recentOrders} items={7} />
                </div>
                <div className="tf-section-1 mb-30">
                    <RevenueChart2 />
                    <div className="flex gap20 flex-wrap-mobile">
                        <TopSale productsTopSeles={productsTopSeles} />
                        <TopPagePost data={PagePostData} />
                    </div>
                </div>
                <div className="tf-section-1">
                    <div className="flex gap20 flex-wrap-mobile">
                        <OrderSummary chartData={chartData} />
                        <SaleByCategory half="w-half" />
                    </div>

                    <UserLocationMap
                        idMap="usa-vectormap2"
                        classWrapMap="wrap-usa-vectormap-2"
                    />
                </div>
            </Layout>
        </>
    );
}
