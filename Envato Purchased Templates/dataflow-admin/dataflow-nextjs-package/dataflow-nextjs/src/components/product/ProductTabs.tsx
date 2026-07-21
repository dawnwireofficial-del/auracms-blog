"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const tabs = [
    { id: "description", title: "Description", active: true },
    { id: "review", title: "Review", active: false },
    { id: "shiping", title: "Shipping & Returns", active: false },
    { id: "return-policies", title: "Return Policies", active: false },
];

export default function ProductTabs() {
    const [currentTab, setCurrentTab] = useState(1);
    const [openReviewForm, setOpenReviewForm] = useState(false);

    return (

        <div className="widget-tabs style-menu-tab ">
            <ul className="widget-menu-tab" role="tablist">
                {tabs.map((elm, i) => (
                    <li key={i} className="">
                        <a href={`#${elm.id}`} data-bs-toggle="tab" className={`item-title ${elm.active === true ? `active` : " "}`}>
                            <span className="inner">{elm.title}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <div className="widget-content-tab tab-content">
                <div
                    className={`tab-pane widget-content-inner active show`} id="description"
                    role="tabpanel"
                >
                    <div className="tab-description">
                        <div className="right">
                            <div className="letter-1 body-title mb-12">Stretch strap top</div>
                            <p className="mb-12 text-surface-2 text">
                                Nodding to retro styles, this Hyperbola T-shirt is defined by its off-the-shoulder design. It's spun from a green stretch cotton jersey and adorned with an embroidered AC logo on the front, a brand's signature.
                            </p>
                            <p className="text-surface-2 text">
                                Thick knitted fabric. Short design. Straight design. Rounded neck. Sleeveless. Straps. Unclosed. Cable knit finish. Co-ord.
                            </p>
                        </div>
                        <div className="left">
                            <div className="letter-1 body-title mb-12">COMPOSITION, ORIGIN AND CARE GUIDELINES</div>
                            <ul className="list-text type-disc mb-12 gap-6">
                                <li className="text-surface-2 text">Composition: 55% polyester, 30% acrylic, 13% polyamide, 2% elastane</li>
                                <li className="text-surface-2 text">Designed in Barcelona</li>
                                <li className="text-surface-2 text">Origin</li>
                                <li className="text-surface-2 text">Manufacture: USA</li>
                            </ul>
                            <div className="d-flex gap20 mb-12 list-icon-guideline">
                                <div className="d-flex">
                                    {/* SVG 1 */}
                                    <img src="/icon-desc-1.svg" alt="icon" />
                                </div>
                                <div className="d-flex">
                                    {/* SVG 2 */}
                                    <img src="/icon-desc-2.svg" alt="icon" />
                                </div>
                                <div className="d-flex">
                                    {/* SVG 3 */}
                                    <img src="/icon-desc-3.svg" alt="icon" />
                                </div>
                                <div className="d-flex">
                                    {/* SVG 4 */}
                                    <img src="/icon-desc-4.svg" alt="icon" />
                                </div>
                                <div className="d-flex">
                                    {/* SVG 5 */}
                                    <img src="/icon-desc-5.svg" alt="icon" />
                                </div>
                            </div>
                            <div className="text-tiny text-surface-2">MACHINE WASHING MAX 30°C / 85ºF SHORT SPIN DRY</div>
                        </div>
                    </div>
                </div>
                <div
                    className={`tab-pane widget-content-inner`}
                    id="review"
                    role="tabpanel"
                >
                    <div className="tab-reviews write-cancel-review-wrap">
                        <div className="tab-reviews-heading">
                            <div className="top">
                                <div className="text-center">
                                    <div className="number title-display">4.9</div>
                                    <div className="ratings justify-center mb-10">
                                        <i className="icon-star1 active"></i>
                                        <i className="icon-star1 active"></i>
                                        <i className="icon-star1 active"></i>
                                        <i className="icon-star1 active"></i>
                                        <i className="icon-star1"></i>
                                    </div>
                                    <p className="text">(168 Ratings)</p>
                                </div>
                                <div className="rating-score">
                                    <div className="item">
                                        <div className="number-1 text">5</div>
                                        <i className="icon icon-star1"></i>
                                        <div className="line-bg">
                                            <div style={{ width: "94.67%" }}></div>
                                        </div>
                                        <div className="number-2 text">59</div>
                                    </div>
                                    <div className="item">
                                        <div className="number-1 text">4</div>
                                        <i className="icon icon-star1"></i>
                                        <div className="line-bg">
                                            <div style={{ width: "60%" }}></div>
                                        </div>
                                        <div className="number-2 text">46</div>
                                    </div>
                                    <div className="item">
                                        <div className="number-1 text">3</div>
                                        <i className="icon icon-star1"></i>
                                        <div className="line-bg">
                                            <div style={{ width: "0%" }}></div>
                                        </div>
                                        <div className="number-2 text">0</div>
                                    </div>
                                    <div className="item">
                                        <div className="number-1 text">2</div>
                                        <i className="icon icon-star1"></i>
                                        <div className="line-bg">
                                            <div style={{ width: "0%" }}></div>
                                        </div>
                                        <div className="number-2 text">0</div>
                                    </div>
                                    <div className="item">
                                        <div className="number-1 text">1</div>
                                        <i className="icon icon-star1"></i>
                                        <div className="line-bg">
                                            <div style={{ width: "0%" }}></div>
                                        </div>
                                        <div className="number-2 text">0</div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="btns-reviews"
                                onClick={() => setOpenReviewForm((pre) => !pre)}
                            >
                                <div
                                    className={`tf-button text-title style-3 btn-comment-review btn-cancel-review ${openReviewForm ? "d-block" : "d-none"
                                        } `}
                                >
                                    Cancel Review
                                </div>
                                <div
                                    className={`tf-button text-title style-3 btn-comment-review btn-write-review  ${openReviewForm ? "d-none" : "d-block"
                                        } `}
                                >
                                    Write a review
                                </div>
                            </div>
                        </div>
                        <div className={`reply-comment style-1 cancel-review-wrap ${openReviewForm ? "d-none" : "d-block"
                            }`}>
                            <h3 className="mb-24">03 Comments</h3>
                            <div className="reply-comment-wrap">
                                <div className="reply-comment-item">
                                    <div className="user">
                                        <div className="image">
                                            <Image height={60} width={60} src="/images/avatar/user-default.jpg" alt="image" />
                                        </div>
                                        <div>
                                            <div className="h6">
                                                <a href="#" className="link">Superb quality apparel that exceeds expectations</a>
                                            </div>
                                            <div className="day body-text">1 days ago  &nbsp;&nbsp;&nbsp;-</div>
                                        </div>
                                    </div>
                                    <p className="text">Great theme - we were looking for a theme with lots of built in features and flexibility and this was perfect. We expected to need to employ a developer to add a few finishing touches. But we actually managed to do everything ourselves. We did have one small query and the support given was swift and helpful.</p>
                                </div>
                                <div className="reply-comment-item type-reply">
                                    <div className="user">
                                        <div className="image">
                                            <Image width={60} height={60} src="/images/avatar/user-default.jpg" alt="image" />
                                        </div>
                                        <div>
                                            <div className="h6">
                                                <a href="#" className="link">Reply from Dataflow</a>
                                            </div>
                                            <div className="day body-text">1 days ago  &nbsp;&nbsp;&nbsp;-</div>
                                        </div>
                                    </div>
                                    <p className="text">We love to hear it! Part of what we love most about Dataflow is how much it empowers store owners like yourself to build a beautiful website without having to hire a developer :) Thank you for this fantastic review!</p>
                                </div>
                                <div className="reply-comment-item">
                                    <div className="user">
                                        <div className="image">
                                            <Image width={60} height={60} src="/images/avatar/user-default.jpg" alt="image" />
                                        </div>
                                        <div>
                                            <div className="h6">
                                                <a href="#" className="link">Superb quality apparel that exceeds expectations</a>
                                            </div>
                                            <div className="day body-text">1 days ago  &nbsp;&nbsp;&nbsp;-</div>
                                        </div>
                                    </div>
                                    <p className="text">Great theme - we were looking for a theme with lots of built in features and flexibility and this was perfect. We expected to need to employ a developer to add a few finishing touches. But we actually managed to do everything ourselves. We did have one small query and the support given was swift and helpful.</p>
                                </div>
                            </div>
                        </div>
                        <form className={`form-write-review write-review-wrap ${openReviewForm ? "d-block" : "d-none"
                            }`}>
                            <div className="heading">
                                <h4>Write a review:</h4>
                                <div className="list-rating-check">
                                    <input type="radio" id="star5" name="rate" value="5" />
                                    <label htmlFor="star5" title="text"></label>
                                    <input type="radio" id="star4" name="rate" value="4" />
                                    <label htmlFor="star4" title="text"></label>
                                    <input type="radio" id="star3" name="rate" value="3" />
                                    <label htmlFor="star3" title="text"></label>
                                    <input type="radio" id="star2" name="rate" value="2" />
                                    <label htmlFor="star2" title="text"></label>
                                    <input type="radio" id="star1" name="rate" value="1" />
                                    <label htmlFor="star1" title="text"></label>
                                </div>
                            </div>
                            <div className="mb-30">
                                <fieldset className="mb-20">
                                    <div className="body-title mb-8">Review Title</div>
                                    <input className="" type="text" placeholder="Give your review a title" name="text" tabIndex={0} defaultValue="" required />
                                </fieldset>
                                <fieldset className="mb-20">
                                    <div className="body-title mb-8">Review</div>
                                    <textarea className="" name="description" placeholder="Give your review a title" tabIndex={0} required></textarea>
                                </fieldset>
                                <div className="cols gap20 mb-20">
                                    <fieldset className="">
                                        <input className="" type="text" placeholder="You Name (Public)" name="text" tabIndex={0} defaultValue="" required />
                                    </fieldset>
                                    <fieldset className="">
                                        <input className="" type="email" placeholder="Your email (private)" name="email" tabIndex={0} defaultValue="" required />
                                    </fieldset>
                                </div>
                                <div className="flex gap10 items-center">
                                    <input className="tf-check" type="checkbox" id="save" />
                                    <label className="body-text" htmlFor="save">Save my name, email, and website in this browser for the next time I comment.</label>
                                </div>
                            </div>
                            <div className="button-submit">
                                <button className="tf-button " type="submit">Submit Reviews</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div
                    className={`tab-pane widget-content-inner`}
                    id="shiping"
                    role="tabpanel"
                >
                    <div className="tab-shipping">
                        <div className="w-100">
                            <div className="body-title mb-12">We&apos;ve got your back</div>
                            <p className="text mb-12">One delivery fee to most locations (check our Orders &amp; Delivery page)</p>
                            <p className="text">Free returns within 14 days (excludes final sale and made-to-order items, face masks and certain products containing hazardous or flammable materials, such as fragrances and aerosols)</p>
                        </div>
                        <div className="w-100">
                            <div className="body-title mb-12">Import duties information</div>
                            <p className="text">Let us handle the legwork. Delivery duties are included in the item price when shipping to all EU countries (excluding the Canary Islands), plus The United Kingdom, USA, Canada, China Mainland, Australia, New Zealand, Puerto Rico, Switzerland, Singapore, Republic Of Korea, Kuwait, Mexico, Qatar, India, Norway, Saudi Arabia, Taiwan Region, Thailand, U.A.E., Japan, Brazil, Isle of Man, San Marino, Colombia, Chile, Argentina, Egypt, Lebanon, Hong Kong SAR, Bahrain and Turkey. All import duties are included in your order – the price you see is the price you pay.</p>
                        </div>
                        <div className="w-100">
                            <div className="body-title mb-12">Estimated delivery</div>
                            <p className="mb-6 text">Express: May 10 - May 17</p>
                            <p className="text">Sending from USA</p>
                        </div>
                        <div className="w-100">
                            <div className="body-title mb-12">Need more information?</div>
                            <div>
                                <a href="#" className="link text-decoration-underline mb-6 text">Orders &amp; delivery</a>
                            </div>
                            <div>
                                <a href="#" className="link text-decoration-underline mb-6 text">Returns &amp; refunds</a>
                            </div>
                            <div>
                                <a href="#" className="link text-decoration-underline text">Duties &amp; taxes</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className={`tab-pane widget-content-inner`}
                    id="return-policies"
                    role="tabpanel"
                >
                    <div className="tab-policies">
                        <div className="body-title mb-12">Return Policies</div>
                        <p className="mb-12 text">
                            At Modave, we stand behind the quality of our products. If you&apos;re not completely satisfied with your purchase, we offer hassle-free returns within 30 days of delivery.
                        </p>
                        <div className="body-title mb-12">Easy Exchanges or Refunds</div>
                        <ul className="list-text type-disc mb-12 gap-6">
                            <li className="text font-2">Exchange your item for a different size, color, or style, or receive a full refund.</li>
                            <li className="text font-2">All returned items must be unworn, in their original packaging, and with tags attached.</li>
                        </ul>
                        <div className="body-title mb-12">Simple Process</div>
                        <ul className="list-text type-number">
                            <li className="text font-2">Initiate your return online or contact our customer service team for assistance.</li>
                            <li className="text font-2">Pack your item securely and include the original packing slip.</li>
                            <li className="text font-2">Ship your return back to us using our prepaid shipping label.</li>
                            <li className="text font-2">Once received, your refund will be processed promptly.</li>
                        </ul>
                        <p className="text font-2">
                            For any questions or concerns regarding returns, don&apos;t hesitate to reach out to our dedicated customer service team. Your satisfaction is our priority.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
