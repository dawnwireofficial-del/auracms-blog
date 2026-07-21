import React, { Suspense } from "react";
import LoginForm from "@/components/widgets/LoginForm";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
