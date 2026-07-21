import Layout from "@/components/layout/Layout";
import ProductDetail from "@/components/product/ProductDetail";
import { allProducts } from "@/data/dataProduct";
import ProductTabs from "@/components/product/ProductTabs";
import type { Product } from "@/types/models";
import Link from "next/link";

type PageProps = {
    params: Promise<{ id: string }>;
};

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default async function Page({ params }: PageProps) {
    const resolvedParams = await params;
    const product: Product =
        allProducts.find(
            (elm) => String(elm.id) === String(resolvedParams.id),
        ) ?? allProducts[0];

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Product Detail</h3>
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
                        <Link href={"/all-product"}>
                            <div className="text-tiny">Product</div>
                        </Link>
                    </li>
                    <li>
                        <i className="icon-chevron-right"></i>
                    </li>
                    <li>
                        <div className="text-tiny">Product Detail</div>
                    </li>
                </ul>
            </div>
            <div className="wg-box p-30 gap108">
                <ProductDetail product={product} />
                <ProductTabs />
            </div>
        </Layout>
    );
}
