import Link from "next/link";
import React from "react";

export default function TermsConditions() {
    return (
        <>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Terms &amp; Conditions</h3>
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
                        <div className="text-tiny">Terms &amp; Conditions</div>
                    </li>
                </ul>
            </div>
            <div className="wg-box">
                <div className="term-item">
                    <div className="h3 mb-8">Copyright and Trademark</div>
                    <p className="body-title-2">
                        Unless otherwise indicated, material on this website,
                        including but not limited to texts, images,
                        illustrations, software, audio clips, video clips,
                        animation files, is subject to the copyright and
                        trademark rights of The Company Private Limited.
                        Consequently, the material on this website may not be
                        copied, reproduced, modified, posted, transmitted,
                        distributed, in whole or in part in any form whatsoever,
                        without the prior written consent of The Company Private
                        Limited. All rights reserved.
                    </p>
                </div>
                <div className="term-item">
                    <div className="h3 mb-8">
                        Products, Content and Specifications
                    </div>
                    <p className="body-title-2">
                        All features, content, specifications, products and
                        prices of products and services described or depicted on
                        this website are subject to change at any time without
                        notice. Certain weights, measures and similar
                        descriptions are approximate and are provided for
                        convenience purposes only. We make all reasonable
                        efforts to accurately display the attributes of our
                        products, including the applicable colors; however, the
                        actual color you see will depend on your computer system
                        and we cannot guarantee that your computer will
                        accurately display such colors. The inclusion of any
                        products or services in this website at a particular
                        time does not imply or warrant that these products or
                        services will be available at any time. It is your
                        responsibility to ascertain and obey all applicable
                        local, state and international laws in regard to the
                        possession, use and sale of any item purchased from this
                        website. By placing an order, you represent that the
                        products ordered will be used only in a lawful manner.
                    </p>
                </div>
                <div className="term-item">
                    <div className="h3 mb-8">Shipping Limitations</div>
                    <p className="body-title-2">
                        When an order is placed, it will be shipped to an
                        address designated by the purchaser as long as that
                        shipping address is compliant with the shipping
                        restrictions contained on this website. All purchases
                        from this website are made pursuant to a shipment
                        contract. As a result, risk of loss and title for items
                        purchased from this website pass to you upon delivery of
                        the items to the carrier. You are responsible for filing
                        any claims with carriers for damaged and/or lost
                        shipments.
                    </p>
                </div>
                <div className="term-item">
                    <div className="h3 mb-8">Duties and Taxes</div>
                    <p className="body-title-2">
                        You are responsible for duties and taxes outside
                        Singapore. All items entering a foreign country are
                        subject to customs inspection and assessment of the
                        duties and taxes in accordance with that country’s
                        national laws.
                    </p>
                </div>
                <div className="term-item">
                    <div className="h3 mb-8">Your Account</div>
                    <p className="body-title-2">
                        You are responsible for maintaining the confidentiality
                        of your account and password information, and you agree
                        to accept responsibility for all activities that occur
                        under your account and password. This website and The
                        Company Pte Ltd reserves the right to refuse service,
                        terminate accounts remove or edit content or cancel
                        orders.By placing an order, you warrant that you are
                        over 18 years of age, and that you are providing
                        shop.company.com or shop.beetle.com.sg with accurate,
                        truthful information and that you have the authority to
                        place the order.
                    </p>
                </div>
                <div className="term-item">
                    <div className="h3 mb-8">
                        Exchange and Refund Policy (Online Shop)
                    </div>
                    <div className="text-wrap">
                        <p className="body-title-2">
                            Electronic Communications
                        </p>
                        <p className="body-title-2">
                            When you visit this website and/or send email to us,
                            you consent to receive electronic communications
                            from us. You agree that all agreements, notices,
                            disclosures and other communications that we sent
                            you electronically satisfy any legal requirement
                            that such communications be in writing Exclusions of
                            Warranties
                        </p>
                        <p className="body-title-2">
                            The Company Private Limited makes no representative
                            or warranty regarding the good working order or
                            condition of this website, its suitability for use,
                            or that its use will be uninterrupted or error-free.
                            All information or material provided in this website
                            to you and without warranties of any kind, expressed
                            or implied, including without limitation, warranties
                            or conditions of merchantability, fitness, quality,
                            durability or suitability for any particular
                            purpose, or non-infringement.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
