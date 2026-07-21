import Layout from "@/components/layout/Layout";
import Privacy from "@/components/orther-page/Privacy";
import React from "react";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <Privacy />
            </Layout>
        </>
    );
}
