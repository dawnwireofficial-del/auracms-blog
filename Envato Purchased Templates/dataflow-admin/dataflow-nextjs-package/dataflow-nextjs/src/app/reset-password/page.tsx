import React, { Suspense } from "react";
import ResetPasswordForm from "@/components/widgets/RestPasswordForm";

export const metadata = {
    title: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
    description: "Dataflow - eCommerce Admin Dashboard Nextjs Template",
};

export default function page() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
