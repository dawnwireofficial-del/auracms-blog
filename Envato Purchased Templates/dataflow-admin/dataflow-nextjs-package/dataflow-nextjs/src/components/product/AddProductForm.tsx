"use client";

import Image from "next/image";
import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const categoryOptions = ["Women", "Dress", "Sports", "Clothing"];
const colorOptions = ["Orange", "Blue", "Yellow", "Black"] as const;
const sizeOptions = ["S", "M", "L", "XL"] as const;

type ColorType = (typeof colorOptions)[number];
type SizeType = (typeof sizeOptions)[number];

const AddProductForm: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([
        "/images/upload/img-1.jpg",
        "/images/upload/img-2.jpg",
    ]);
    const [mainPreview, setMainPreview] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([
        "Women",
        "Dress",
    ]);
    const [isOpenCategory, setIsOpenCategory] = useState(false);
    const [selectedColor, setSelectedColor] = useState<ColorType>("Orange");
    const [selectedSize, setSelectedSize] = useState<SizeType>("M");

    const displayPreview = useMemo(() => {
        if (mainPreview) return mainPreview;
        return images[0] || "images/";
    }, [mainPreview, images]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const nextImages = files.map((file) => URL.createObjectURL(file));
        setImages((prev) => [...prev, ...nextImages]);
        if (!mainPreview) setMainPreview(nextImages[0]);
    };

    const removeCategory = (item: string) => {
        setSelectedCategories((prev) => prev.filter((x) => x !== item));
    };

    const addCategory = (item: string) => {
        setSelectedCategories((prev) => {
            if (prev.includes(item)) return prev;
            return [...prev, item];
        });
        setIsOpenCategory(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const payload = {
            title: formData.get("title"),
            price: formData.get("price"),
            salePrice: formData.get("salePrice"),
            date: formData.get("date"),
            brand: formData.get("brand"),
            sku: formData.get("sku"),
            stock: formData.get("stock"),
            tags: formData.get("tags"),
            description: formData.get("description"),
            color: selectedColor,
            size: selectedSize,
            categories: selectedCategories,
        };

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to add product");
                return;
            }

            alert("Product added successfully");
            router.push("/all-product");
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="form-add-product" onSubmit={handleSubmit}>
            <div className="wg-box mb-30">
                <fieldset>
                    <div className="body-title mb-10">Upload images</div>
                    <div className="upload-image mb-16">
                        <div className="up-load">
                            <label className="uploadfile" htmlFor="myFile">
                                <span className="icon">
                                    <i className="icon-upload-cloud"></i>
                                </span>
                                <span className="text-tiny">
                                    Drop your images here or select{" "}
                                    <span className="text-secondary">
                                        click to browse
                                    </span>
                                </span>
                                <input
                                    type="file"
                                    id="myFile"
                                    name="filename"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>

                        <div className="flex gap20 flex-wrap">
                            {images.map((src, index) => (
                                <div className="item" key={`${src}-${index}`}>
                                    <Image
                                        width={237}
                                        height={207}
                                        src={src}
                                        alt="image"
                                        onClick={() => setMainPreview(src)}
                                        style={{ cursor: "pointer" }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="body-text">
                        You need to add at least 4 images. Pay attention to the
                        quality of the pictures you add, comply with the
                        background color standards. Pictures must be in certain
                        dimensions. Notice that the product shows all the
                        details
                    </div>
                </fieldset>
            </div>

            <div className="wg-box mb-30">
                <fieldset className="name">
                    <div className="body-title mb-10">
                        Product title <span className="tf-color-1">*</span>
                    </div>
                    <input
                        className="mb-10"
                        type="text"
                        placeholder="Enter title"
                        name="title"
                        tabIndex={0}
                        defaultValue=""
                        required
                    />
                    <div className="text-tiny text-surface-2">
                        Do not exceed 20 characters when entering the product
                        name.
                    </div>
                </fieldset>

                <fieldset className="category">
                    <div className="body-title mb-10">
                        Category <span className="tf-color-1">*</span>
                    </div>

                    <div
                        className="multi-select"
                        style={{ position: "relative" }}
                    >
                        <div className="selected-tags">
                            {selectedCategories.map((item) => (
                                <div key={item} className="tag">
                                    <span
                                        className="icon icon-x"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeCategory(item);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    ></span>
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div
                            className="toggle-dropdown"
                            onClick={() => setIsOpenCategory((prev) => !prev)}
                            style={{ cursor: "pointer" }}
                        >
                            <i className="icon icon-chevron-down"></i>
                        </div>

                        <div
                            className="list-dropdown"
                            style={{
                                display: isOpenCategory ? "flex" : "none",
                                flexDirection: "column",
                            }}
                        >
                            {categoryOptions.map((item) => (
                                <div
                                    key={item}
                                    onClick={() => addCategory(item)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </fieldset>

                <div className="cols-lg gap22">
                    <fieldset className="price">
                        <div className="body-title mb-10">
                            Price <span className="tf-color-1">*</span>
                        </div>
                        <div className="input-has-pre">
                            <svg
                                className="icon"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M8.62587 3.1499H9.31187V15.0499H8.62587V3.1499ZM6.73587 11.5079C6.79187 11.7599 6.90853 12.0119 7.08587 12.2639C7.27253 12.5066 7.52453 12.7119 7.84187 12.8799C8.16853 13.0386 8.58387 13.1179 9.08787 13.1179C9.80653 13.1179 10.3385 12.9499 10.6839 12.6139C11.0292 12.2779 11.2019 11.8812 11.2019 11.4239C11.2019 11.0599 11.1039 10.7612 10.9079 10.5279C10.7119 10.2946 10.4459 10.1032 10.1099 9.9539C9.77387 9.79524 9.39587 9.65524 8.97587 9.5339C8.60253 9.43124 8.2292 9.31924 7.85587 9.1979C7.49187 9.06724 7.16053 8.90857 6.86187 8.7219C6.5632 8.5259 6.3252 8.2739 6.14787 7.9659C5.97053 7.6579 5.88187 7.27524 5.88187 6.8179C5.88187 6.26724 6.01253 5.79124 6.27387 5.3899C6.5352 4.97924 6.90387 4.6619 7.37987 4.4379C7.85587 4.2139 8.4112 4.1019 9.04587 4.1019C9.59653 4.1019 10.0772 4.18124 10.4879 4.3399C10.8985 4.49857 11.2392 4.72257 11.5099 5.0119C11.7899 5.2919 11.9952 5.61857 12.1259 5.9919L11.1319 6.3699C11.0665 6.15524 10.9405 5.9499 10.7539 5.7539C10.5672 5.54857 10.3245 5.38057 10.0259 5.2499C9.7272 5.11924 9.38653 5.0539 9.00387 5.0539C8.63053 5.0539 8.28987 5.11924 7.98187 5.2499C7.6832 5.38057 7.4452 5.56724 7.26787 5.8099C7.09053 6.05257 7.00187 6.34657 7.00187 6.6919C7.00187 7.06524 7.10453 7.3639 7.30987 7.5879C7.52453 7.80257 7.80453 7.9799 8.14987 8.1199C8.50453 8.25057 8.89187 8.37657 9.31187 8.4979C9.69453 8.61924 10.0632 8.7499 10.4179 8.8899C10.7819 9.0299 11.1039 9.20257 11.3839 9.4079C11.6732 9.61324 11.9019 9.8699 12.0699 10.1779C12.2379 10.4859 12.3219 10.8639 12.3219 11.3119C12.3219 11.8066 12.2052 12.2686 11.9719 12.6979C11.7385 13.1179 11.3839 13.4586 10.9079 13.7199C10.4412 13.9719 9.8392 14.0979 9.10187 14.0979C8.48587 14.0979 7.94453 14.0046 7.47787 13.8179C7.0112 13.6219 6.62853 13.3606 6.32987 13.0339C6.0312 12.7072 5.82587 12.3339 5.71387 11.9139L6.73587 11.5079Z"
                                    fill="#303030"
                                    fillOpacity="0.5"
                                />
                            </svg>
                            <input
                                className=""
                                type="number"
                                placeholder="Price"
                                name="price"
                                tabIndex={0}
                                defaultValue=""
                                required
                            />
                        </div>
                    </fieldset>

                    <fieldset className="sale-price">
                        <div className="body-title mb-10">Sale Price </div>
                        <div className="input-has-pre">
                            <svg
                                className="icon"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M8.62587 3.1499H9.31187V15.0499H8.62587V3.1499ZM6.73587 11.5079C6.79187 11.7599 6.90853 12.0119 7.08587 12.2639C7.27253 12.5066 7.52453 12.7119 7.84187 12.8799C8.16853 13.0386 8.58387 13.1179 9.08787 13.1179C9.80653 13.1179 10.3385 12.9499 10.6839 12.6139C11.0292 12.2779 11.2019 11.8812 11.2019 11.4239C11.2019 11.0599 11.1039 10.7612 10.9079 10.5279C10.7119 10.2946 10.4459 10.1032 10.1099 9.9539C9.77387 9.79524 9.39587 9.65524 8.97587 9.5339C8.60253 9.43124 8.2292 9.31924 7.85587 9.1979C7.49187 9.06724 7.16053 8.90857 6.86187 8.7219C6.5632 8.5259 6.3252 8.2739 6.14787 7.9659C5.97053 7.6579 5.88187 7.27524 5.88187 6.8179C5.88187 6.26724 6.01253 5.79124 6.27387 5.3899C6.5352 4.97924 6.90387 4.6619 7.37987 4.4379C7.85587 4.2139 8.4112 4.1019 9.04587 4.1019C9.59653 4.1019 10.0772 4.18124 10.4879 4.3399C10.8985 4.49857 11.2392 4.72257 11.5099 5.0119C11.7899 5.2919 11.9952 5.61857 12.1259 5.9919L11.1319 6.3699C11.0665 6.15524 10.9405 5.9499 10.7539 5.7539C10.5672 5.54857 10.3245 5.38057 10.0259 5.2499C9.7272 5.11924 9.38653 5.0539 9.00387 5.0539C8.63053 5.0539 8.28987 5.11924 7.98187 5.2499C7.6832 5.38057 7.4452 5.56724 7.26787 5.8099C7.09053 6.05257 7.00187 6.34657 7.00187 6.6919C7.00187 7.06524 7.10453 7.3639 7.30987 7.5879C7.52453 7.80257 7.80453 7.9799 8.14987 8.1199C8.50453 8.25057 8.89187 8.37657 9.31187 8.4979C9.69453 8.61924 10.0632 8.7499 10.4179 8.8899C10.7819 9.0299 11.1039 9.20257 11.3839 9.4079C11.6732 9.61324 11.9019 9.8699 12.0699 10.1779C12.2379 10.4859 12.3219 10.8639 12.3219 11.3119C12.3219 11.8066 12.2052 12.2686 11.9719 12.6979C11.7385 13.1179 11.3839 13.4586 10.9079 13.7199C10.4412 13.9719 9.8392 14.0979 9.10187 14.0979C8.48587 14.0979 7.94453 14.0046 7.47787 13.8179C7.0112 13.6219 6.62853 13.3606 6.32987 13.0339C6.0312 12.7072 5.82587 12.3339 5.71387 11.9139L6.73587 11.5079Z"
                                    fill="#303030"
                                    fillOpacity="0.5"
                                />
                            </svg>
                            <input
                                className=""
                                type="number"
                                placeholder="Sale Price "
                                name="salePrice"
                                tabIndex={0}
                                defaultValue=""
                            />
                        </div>
                    </fieldset>

                    <fieldset className="schedule">
                        <div className="body-title mb-10">Schedule</div>
                        <input type="date" name="date" />
                    </fieldset>
                </div>

                <div className="cols-lg gap22">
                    <fieldset className="choose-brand">
                        <div className="body-title mb-10">
                            Brand <span className="tf-color-1">*</span>
                        </div>
                        <input
                            className=""
                            type="text"
                            placeholder="Choose brand"
                            name="brand"
                            tabIndex={0}
                            defaultValue=""
                            required
                        />
                    </fieldset>

                    <fieldset className="variant-picker-item">
                        <div className="variant-picker-label body-title">
                            Color:{" "}
                            <span className="body-title-2 fw-4 variant-picker-label-value">
                                {selectedColor}
                            </span>
                        </div>
                        <div className="variant-picker-values">
                            <input
                                id="values-orange"
                                type="radio"
                                name="color"
                                checked={selectedColor === "Orange"}
                                onChange={() => setSelectedColor("Orange")}
                            />
                            <label
                                className="radius-60"
                                htmlFor="values-orange"
                                data-value="Orange"
                            >
                                <span className="btn-checkbox bg-color-orange"></span>
                            </label>

                            <input
                                id="values-blue"
                                type="radio"
                                name="color"
                                checked={selectedColor === "Blue"}
                                onChange={() => setSelectedColor("Blue")}
                            />
                            <label
                                className="radius-60"
                                htmlFor="values-blue"
                                data-value="Blue"
                            >
                                <span className="btn-checkbox bg-color-blue"></span>
                            </label>

                            <input
                                id="values-yellow"
                                type="radio"
                                name="color"
                                checked={selectedColor === "Yellow"}
                                onChange={() => setSelectedColor("Yellow")}
                            />
                            <label
                                className="radius-60"
                                htmlFor="values-yellow"
                                data-value="Yellow"
                            >
                                <span className="btn-checkbox bg-color-yellow"></span>
                            </label>

                            <input
                                id="values-black"
                                type="radio"
                                name="color"
                                checked={selectedColor === "Black"}
                                onChange={() => setSelectedColor("Black")}
                            />
                            <label
                                className="radius-60"
                                htmlFor="values-black"
                                data-value="Black"
                            >
                                <span className="btn-checkbox bg-color-black"></span>
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className="variant-picker-item">
                        <div className="variant-picker-label body-title">
                            Size:{" "}
                            <span className="body-title-2 variant-picker-label-value">
                                {selectedSize}
                            </span>
                        </div>
                        <div className="variant-picker-values">
                            <input
                                type="radio"
                                name="size"
                                id="values-s"
                                checked={selectedSize === "S"}
                                onChange={() => setSelectedSize("S")}
                            />
                            <label
                                className="style-text"
                                htmlFor="values-s"
                                data-value="S"
                            >
                                <span className="text">S</span>
                            </label>

                            <input
                                type="radio"
                                name="size"
                                id="values-m"
                                checked={selectedSize === "M"}
                                onChange={() => setSelectedSize("M")}
                            />
                            <label
                                className="style-text"
                                htmlFor="values-m"
                                data-value="M"
                            >
                                <span className="text">M</span>
                            </label>

                            <input
                                type="radio"
                                name="size"
                                id="values-l"
                                checked={selectedSize === "L"}
                                onChange={() => setSelectedSize("L")}
                            />
                            <label
                                className="style-text"
                                htmlFor="values-l"
                                data-value="L"
                            >
                                <span className="text">L</span>
                            </label>

                            <input
                                type="radio"
                                name="size"
                                id="values-xl"
                                checked={selectedSize === "XL"}
                                onChange={() => setSelectedSize("XL")}
                            />
                            <label
                                className="style-text"
                                htmlFor="values-xl"
                                data-value="XL"
                            >
                                <span className="text">XL</span>
                            </label>
                        </div>
                    </fieldset>
                </div>

                <div className="cols-lg gap22">
                    <fieldset className="sku">
                        <div className="body-title mb-10">SKU</div>
                        <input
                            className=""
                            type="text"
                            placeholder="Enter SKU"
                            name="sku"
                            tabIndex={0}
                            defaultValue=""
                            required
                        />
                    </fieldset>

                    <fieldset className="category">
                        <div className="body-title mb-10">
                            Stock <span className="tf-color-1">*</span>
                        </div>
                        <input
                            className=""
                            type="text"
                            placeholder="Enter Stock"
                            name="stock"
                            tabIndex={0}
                            defaultValue=""
                            required
                        />
                    </fieldset>

                    <fieldset className="sku">
                        <div className="body-title mb-10">Tags</div>
                        <input
                            className=""
                            type="text"
                            placeholder="Enter a tag"
                            name="tags"
                            tabIndex={0}
                            defaultValue=""
                            required
                        />
                    </fieldset>
                </div>

                <fieldset className="description">
                    <div className="body-title mb-10">
                        Description <span className="tf-color-1">*</span>
                    </div>
                    <textarea
                        className="mb-10"
                        name="description"
                        placeholder="Short description about product"
                        tabIndex={0}
                        required
                    ></textarea>
                    <div className="text-tiny">
                        Do not exceed 100 characters when entering the product
                        name.
                    </div>
                </fieldset>
            </div>

            <div className="cols gap10">
                <button className="tf-button w380" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Add product"}
                </button>
                <a href="#" className="tf-button style-3 w380">
                    Cancel
                </a>
            </div>
        </form>
    );
};

export default AddProductForm;
