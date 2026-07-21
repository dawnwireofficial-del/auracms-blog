import Layout from "@/components/layout/Layout";
import FAQ from "@/components/orther-page/FAQ";
import React from "react";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <FAQ />
            </Layout>
        </>
    );
}
