import AddCategoryForm from "@/components/category/AddCategoryForm";
import Layout from "@/components/layout/Layout";
import Privacy from "@/components/orther-page/Privacy";
import EditProductForm from "@/components/product/EditProductForm";
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
                    <h3>Add Category</h3>
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
                            <Link href={"/all-category"}>
                                <div className="text-tiny">All Category</div>
                            </Link>
                        </li>
                        <li>
                            <i className="icon-chevron-right"></i>
                        </li>
                        <li>
                            <div className="text-tiny">Add Category</div>
                        </li>
                    </ul>
                </div>
                <AddCategoryForm />
            </Layout>
        </>
    );
}
