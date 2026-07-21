import Layout from "@/components/layout/Layout";
import TermsConditions from "@/components/orther-page/TermsConditions";
import React from "react";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <>
            <Layout>
                <TermsConditions />
            </Layout>
        </>
    );
}
