"use client";

import Drift from "drift-zoom";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";
import "photoswipe/dist/photoswipe.css";
import { Navigation, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";

type DriftInstance = { disable?: () => void };

type SlideThumbsProps = {
    currentColor?: string;
    handleColor?: (colorValue: string) => void;
    firstImage?: string;
};

export default function SlideThumbs({
    currentColor = "Beige",
    handleColor = () => {},
    firstImage,
}: SlideThumbsProps) {
    const images = useMemo(
        () => [
            {
                id: 1,
                src: firstImage || "/images/products/product-detail-1.jpg.png",
                alt: "",
                width: 770,
                height: 1075,
                dataValue: "orange",
            },
            {
                id: 2,
                src: "/images/products/product-detail-2.jpg",
                alt: "",
                width: 713,
                height: 1070,
                dataValue: "orange",
            },
            {
                id: 3,
                src: "/images/products/product-detail-3.jpg",
                alt: "img-compare",
                width: 713,
                height: 1070,
                dataValue: "orange",
            },
            {
                id: 4,
                src: "/images/products/product-detail-4.jpg",
                alt: "img-compare",
                width: 713,
                height: 1070,
                dataValue: "orange",
            },
            {
                id: 5,
                src: "/images/products/product-detail-5.jpg",
                alt: "img-compare",
                width: 768,
                height: 1152,
                dataValue: "gray",
            },
            {
                id: 6,
                src: "/images/products/product-detail-6.jpg",
                alt: "img-compare",
                width: 713,
                height: 1070,
                dataValue: "gray",
            },
            {
                id: 7,
                src: "/images/products/product-detail-1.jpg",
                alt: "",
                width: 768,
                height: 1152,
                dataValue: "purple",
            },
            {
                id: 8,
                src: "/images/products/product-detail-2.jpg",
                alt: "",
                width: 713,
                height: 1070,
                dataValue: "purple",
            },
        ],
        [firstImage],
    );

    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
    const swiperRef = useRef<SwiperType | null>(null);
    const driftInstancesRef = useRef<DriftInstance[]>([]);

    useEffect(() => {
        const normalizedColor = String(currentColor || "").toLowerCase();

        const slideIndex = images.findIndex(
            (elm) => elm.dataValue.toLowerCase() === normalizedColor,
        );

        if (
            swiperRef.current &&
            typeof swiperRef.current.slideTo === "function" &&
            slideIndex >= 0 &&
            slideIndex < images.length
        ) {
            swiperRef.current.slideTo(slideIndex);
        }
    }, [currentColor, images]);

    useEffect(() => {
        const zoomElements = document.querySelectorAll(".tf-image-zoom");
        const pane = document.querySelector(".tf-zoom-main");

        driftInstancesRef.current.forEach((instance) => {
            if (instance && typeof instance.disable === "function") {
                instance.disable();
            }
        });
        driftInstancesRef.current = [];

        if (!pane || !zoomElements.length) return;

        zoomElements.forEach((el) => {
            const driftInstance = new Drift(el as HTMLElement, {
                zoomFactor: 2,
                paneContainer: pane,
                inlinePane: false,
                handleTouch: false,
                hoverBoundingBox: true,
                containInline: true,
            });

            driftInstancesRef.current.push(driftInstance);
        });

        const handleMouseOver = (event: Event) => {
            const target = event.target as HTMLElement | null;
            const parent = target?.closest(".section-image-zoom");
            if (parent) {
                parent.classList.add("zoom-active");
            }
        };

        const handleMouseLeave = (event: Event) => {
            const target = event.target as HTMLElement | null;
            const parent = target?.closest(".section-image-zoom");
            if (parent) {
                parent.classList.remove("zoom-active");
            }
        };

        zoomElements.forEach((element) => {
            element.addEventListener("mouseover", handleMouseOver);
            element.addEventListener("mouseleave", handleMouseLeave);
        });

        return () => {
            zoomElements.forEach((element) => {
                element.removeEventListener("mouseover", handleMouseOver);
                element.removeEventListener("mouseleave", handleMouseLeave);
            });

            driftInstancesRef.current.forEach((instance) => {
                if (instance && typeof instance.disable === "function") {
                    instance.disable();
                }
            });
            driftInstancesRef.current = [];
        };
    }, [images]);

    return (
        <>
            <Swiper
                dir="ltr"
                direction="vertical"
                spaceBetween={10}
                slidesPerView={6}
                className="tf-product-media-thumbs other-image-zoom"
                onSwiper={setThumbsSwiper}
                modules={[Thumbs]}
                breakpoints={{
                    0: {
                        direction: "horizontal",
                    },
                    1441: {
                        direction: "vertical",
                    },
                }}
            >
                {images.map((slide) => (
                    <SwiperSlide key={slide.id} className="stagger-item">
                        <div className="item">
                            <Image
                                className="lazyload"
                                data-src={slide.src}
                                alt={slide.alt || "image"}
                                src={slide.src}
                                width={slide.width}
                                height={slide.height}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <Gallery>
                <Swiper
                    dir="ltr"
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation={{
                        nextEl: ".swiper-button-next",
                        prevEl: ".swiper-button-prev",
                    }}
                    className="tf-product-media-main"
                    id="gallery-swiper-started"
                    thumbs={{
                        swiper:
                            thumbsSwiper && !thumbsSwiper.destroyed
                                ? thumbsSwiper
                                : null,
                    }}
                    modules={[Thumbs, Navigation]}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    onSlideChange={(swiper) => {
                        const activeSlide = images[swiper.activeIndex];
                        if (activeSlide?.dataValue) {
                            handleColor(activeSlide.dataValue);
                        }
                    }}
                >
                    {images.map((slide) => (
                        <SwiperSlide key={slide.id}>
                            <Item
                                original={slide.src}
                                thumbnail={slide.src}
                                width={slide.width}
                                height={slide.height}
                            >
                                {({ ref, open }) => (
                                    <a
                                        className="item"
                                        data-pswp-width={slide.width}
                                        data-pswp-height={slide.height}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            open(e);
                                        }}
                                        href={slide.src}
                                    >
                                        <Image
                                            className="tf-image-zoom lazyload"
                                            data-zoom={slide.src}
                                            data-src={slide.src}
                                            ref={ref}
                                            alt={slide.alt || "image"}
                                            width={slide.width}
                                            height={slide.height}
                                            src={slide.src}
                                        />
                                    </a>
                                )}
                            </Item>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Gallery>
        </>
    );
}
