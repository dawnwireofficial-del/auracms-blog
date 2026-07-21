import Link from "next/link";
import React from "react";

export default function Privacy() {
    return (
        <>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Privacy Policy</h3>
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
                        <div className="text-tiny">Privacy Policy</div>
                    </li>
                </ul>
            </div>

            <div className="wg-box">
                <div className="privacy-item">
                    <div className="h3 mb-8">1. Information We Collect</div>
                    <p className="body-title-2">
                        When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site. We refer to this automatically collected information as &quot;Device Information&quot;.
                        <br />
                        <br />
                        We collect Device Information using the following technologies:
                        <br />
                        <br />
                        &quot;Cookies&quot; are data files that are placed on your device or computer and often include an anonymous unique identifier. For more information about cookies, and how to disable cookies, visit this link:
                        (.....)
                        <br />
                        <br />
                        &quot;Log files&quot; track actions occurring on the Site, and collect data including your IP address, browser type, Internet service provider, referring/exit pages, and date/time stamps. &quot;Web beacons&quot;, &quot;tags&quot;, and &quot;pixels&quot; are electronic files used to record information about how you browse the Site. Additionally, when you make a purchase or attempt to purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, and payment information (including credit card number, email address, and phone number). We refer to this information as &quot;Order Information&quot;.
                    </p>
                </div>
                <div className="privacy-item">
                    <div className="h3 mb-8">2. How We Use Your Information</div>
                    <p className="body-title-2">
                        We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:
                        <br />
                        <br />
                        Communicate with you;
                        <br />
                        Screen our orders for potential risk or fraud; and When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.
                        <br />
                        We use the Device Information that we collect to help us screen for potential risk and fraud (in particular, your IP address), and more generally to improve and optimize our Site (for example, by generating analytics about how our customers browse and interact with the Site, and to assess the success of our marketing and advertising campaigns).
                    </p>
                </div>
                <div className="privacy-item">
                    <div className="h3 mb-8">3. Sharing Your Personal Information</div>
                    <p className="body-title-2">
                        We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use Shopify to power our online store--you can read more about how Shopify uses your Personal Information here:
                        <br />
                        https://www.shopify.com/legal/privacy. We also use Google Analytics to help us understand how our customers use the Site--you can read more about how Google uses your Personal Information here:
                        <br />
                        https://www.google.com/intl/en/policies/privacy/. You can also opt-out of Google Analytics here:
                        <br />
                        https://tools.google.com/dlpage/gaoptout.
                        <br />
                        <br />
                        Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant, or other lawful request for information we receive, or to otherwise protect our rights.
                    </p>
                </div>
                <div className="privacy-item">
                    <div className="h3 mb-8">4. Data Retention</div>
                    <p className="body-title-2">
                        When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
                    </p>
                </div>
                <div className="privacy-item">
                    <div className="h3 mb-8">5. Your Rights</div>
                    <p className="body-title-2">
                        You are responsible for maintaining the confidentiality of your account and password information, and you agree to accept responsibility for all activities that occur under your account and password. This website and The Company Pte Ltd reserves the right to refuse service, terminate accounts, remove or edit content, or cancel orders. By placing an order, you warrant that you are over 18 years of age, and that you are providing shop.company.com or shop.beetle.com.sg with accurate, truthful information and that you have the authority to place the order.
                    </p>
                </div>
                <div className="privacy-item">
                    <div className="h3 mb-8">6. Changes</div>
                    <p className="body-title-2">
                        We may update this privacy policy from time to time to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.
                    </p>
                </div>
                <div className="privacy-item">
                    <div className="h3 mb-8">7. Contact Us</div>
                    <p className="body-title-2">
                        For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at [Email Address] or by mail using the details provided below:
                        <br />
                        <br />
                        <Link href="mailto:contact@dataflow.com" className="link body-text fw-medium">
                            contact@dataflow.com
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
