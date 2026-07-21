"use client";

import Link from "next/link";
import React from "react";

type FaqItem = {
    id: string;
    question: string;
    answer: string;
    bodyClass?: string;
};

type FaqSection = {
    id: string;
    title: string;
    items: FaqItem[];
};

const faqData: FaqSection[] = [
    {
        id: "accordion1",
        title: "Shopping Information",
        items: [
            {
                id: "collapse1",
                question: "How long will it take for my order to ship?",
                answer: "Orders are typically processed and shipped within 1–3 business days. You'll receive a confirmation email once your order is on the way",
                bodyClass: "widget-desc",
            },
            {
                id: "collapse2",
                question: "Do you offer free shipping?",
                answer: "Yes, we offer free standard shipping on orders over $50. Shipping rates will be calculated at checkout for smaller orders.",
                bodyClass: "widget-material",
            },
            {
                id: "collapse3",
                question:
                    "Can I change my shipping address after placing an order?",
                answer: "If your order hasn't been shipped yet, we may be able to update your shipping address. Please contact our support team as soon as possible for assistance.",
                bodyClass: "",
            },
            {
                id: "collapse4",
                question: "What if my package is delayed or lost?",
                answer: "If your package is delayed or lost, please reach out to our customer support. We'll work with the carrier to locate your order or arrange a replacement if necessary.",
                bodyClass: "",
            },
        ],
    },
    {
        id: "accordion2",
        title: "Payment Information",
        items: [
            {
                id: "collapse5",
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted for your protection",
                bodyClass: "widget-desc",
            },
            {
                id: "collapse6",
                question: "Is my payment information secure?",
                answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted for your protection",
                bodyClass: "widget-material",
            },
            {
                id: "collapse7",
                question: "Can I use multiple payment methods for my order?",
                answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted for your protection",
                bodyClass: "",
            },
            {
                id: "collapse8",
                question: "When will I be charged for my order?",
                answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted for your protection",
                bodyClass: "",
            },
        ],
    },
    {
        id: "accordion3",
        title: "Return & Exchange",
        items: [
            {
                id: "collapse9",
                question: "What is your return policy?",
                answer: "Your payment is processed immediately after you complete your purchase. If there are any issues with the transaction, you'll be notified right away.",
                bodyClass: "widget-desc",
            },
            {
                id: "collapse10",
                question: "How do I return an item?",
                answer: "Your payment is processed immediately after you complete your purchase. If there are any issues with the transaction, you'll be notified right away.",
                bodyClass: "widget-material",
            },
            {
                id: "collapse11",
                question: "Are there any items that cannot be returned?",
                answer: "Your payment is processed immediately after you complete your purchase. If there are any issues with the transaction, you'll be notified right away.",
                bodyClass: "",
            },
            {
                id: "collapse12",
                question: "When will I receive my refund?",
                answer: "Your payment is processed immediately after you complete your purchase. If there are any issues with the transaction, you'll be notified right away.",
                bodyClass: "",
            },
        ],
    },
];

const FAQ: React.FC = () => {
    return (
        <>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>FAQs</h3>
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
                        <div className="text-tiny">FAQs</div>
                    </li>
                </ul>
            </div>
            {faqData.map((section, sectionIndex) => (
                <div
                    key={section.id}
                    className={`wg-box ${sectionIndex < faqData.length - 1 ? "mb-30" : ""}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="h5">{section.title}</div>
                    </div>
                    <div className="faq-wrap" id={section.id}>
                        {section.items.map((item, itemIndex) => {
                            const isFirst = itemIndex === 0;
                            return (
                                <div key={item.id} className="widget-accordion">
                                    <div
                                        className={`accordion-title${isFirst ? "" : " collapsed"}`}
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#${item.id}`}
                                        aria-expanded={
                                            isFirst ? "true" : "false"
                                        }
                                        aria-controls={item.id}
                                        role="button"
                                    >
                                        <span>{item.question}</span>
                                        <span className="icon icon-chevron-down"></span>
                                    </div>
                                    <div
                                        id={item.id}
                                        className={`accordion-collapse collapse${isFirst ? " show" : ""}`}
                                        role="region"
                                        aria-label={
                                            isFirst
                                                ? "headingOne"
                                                : `heading${itemIndex + 1}`
                                        }
                                        data-bs-parent={`#${section.id}`}
                                    >
                                        <div
                                            className={`accordion-body${item.bodyClass ? ` ${item.bodyClass}` : ""}`}
                                        >
                                            <p className="body-text">
                                                {item.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </>
    );
};

export default FAQ;
