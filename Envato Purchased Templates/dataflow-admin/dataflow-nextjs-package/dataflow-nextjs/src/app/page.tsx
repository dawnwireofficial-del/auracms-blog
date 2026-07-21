import Image from "next/image";
import Layout from "@/components/layout/Layout";
import RevenueChart from "@/components/chart/RevenueChart";
import StartsCard from "@/components/chart/StartsCard";
import { CHART1, promotionData, revenueOrderData } from "@/data/dataChart";
import PromotionalSales from "@/components/chart/PromotionalSales";
import TopSale from "@/components/widgets/TopSale";
import { productsTopSeles, recentOrders } from "@/data/dataProduct";
import RecentOrders from "@/components/widgets/RecentOrder";
import UserLocationMap from "@/components/chart/UserLocationMap";


export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function Home() {
    return (
        <>
            <Layout>
                <div className="tf-section-3 mb-30">
                    {CHART1.map((card, i) => (
                        <StartsCard key={i} {...card} />
                    ))}
                </div>

                <div className="tf-section-1 mb-30">
                    <RevenueChart chartData={revenueOrderData} />
                    <div className="flex gap20 flex-wrap-mobile">
                        <PromotionalSales chartData={promotionData} />
                        <TopSale productsTopSeles={productsTopSeles} />
                    </div>
                </div>

                <div className="tf-section-4">
                    <RecentOrders recentOrders={recentOrders} />
                    <UserLocationMap />
                </div>
            </Layout>
        </>
    );
}
