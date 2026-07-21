"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const firstName = String(formData.get("firstName") || "");
        const lastName = String(formData.get("lastName") || "");
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");
        const confirmPassword = String(formData.get("confirmPassword") || "");

        if (!agree) {
            alert("Please agree with Privacy Policy");
            return;
        }

        if (password !== confirmPassword) {
            alert("Confirm password does not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    confirmPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Register failed");
                return;
            }

            router.push("/login");
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="left">
                <Image
                    width={960}
                    height={919}
                    src="/images/images-section/sign-up.jpg"
                    alt="image"
                />
            </div>

            <div className="right">
                <div className="login-box">
                    <div>
                        <h3 className="mb-10">Create your account</h3>
                        <div className="body-text text-white">
                            Enter your personal details to create account
                        </div>
                    </div>

                    <form
                        className="form-login flex flex-column gap22 w-full"
                        onSubmit={handleSubmit}
                    >
                        <fieldset className="name">
                            <div className="body-title mb-10 text-white">
                                Your name <span className="tf-color-1">*</span>
                            </div>
                            <div className="cols gap10">
                                <input
                                    className="flex-grow sm-mb-10"
                                    type="text"
                                    placeholder="First name"
                                    name="firstName"
                                    defaultValue=""
                                    required
                                />
                                <input
                                    className="flex-grow"
                                    type="text"
                                    placeholder="Last name"
                                    name="lastName"
                                    defaultValue=""
                                    required
                                />
                            </div>
                        </fieldset>

                        <fieldset className="email">
                            <div className="body-title mb-10 text-white">
                                Email address{" "}
                                <span className="tf-color-1">*</span>
                            </div>
                            <input
                                className="flex-grow"
                                type="email"
                                placeholder="Enter your email address"
                                name="email"
                                defaultValue=""
                                required
                            />
                        </fieldset>

                        <fieldset className="password">
                            <div className="body-title mb-10 text-white">
                                Password <span className="tf-color-1">*</span>
                            </div>
                            <input
                                className="password-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                name="password"
                                defaultValue=""
                                required
                            />
                            <span
                                className="show-pass"
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="icon-eye view"></i>
                                <i className="icon-eye-off hide"></i>
                            </span>
                        </fieldset>

                        <fieldset className="password">
                            <div className="body-title mb-10 text-white">
                                Confirm password{" "}
                                <span className="tf-color-1">*</span>
                            </div>
                            <input
                                className="password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                name="confirmPassword"
                                defaultValue=""
                                required
                            />
                            <span
                                className="show-pass"
                                onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                }
                                style={{ cursor: "pointer" }}
                            >
                                <i className="icon-eye view"></i>
                                <i className="icon-eye-off hide"></i>
                            </span>
                        </fieldset>

                        <div className="flex gap10 items-center">
                            <input
                                className="tf-check"
                                type="checkbox"
                                id="agree"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                            />
                            <label
                                className="body-text text-surface-3"
                                htmlFor="agree"
                            >
                                Agree with Privacy Policy
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="tf-button w-full"
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Register"}
                        </button>
                    </form>

                    <div className="flex flex-column gap16 w-full">
                        <div className="flex gap40 items-center">
                            <div className="line"></div>
                            <div className="body-text text-white text-center flex-shrink-0">
                                Or Sign in with
                            </div>
                            <div className="line"></div>
                        </div>

                        <button
                            onClick={() => signIn("google")}
                            className="tf-btn-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="23"
                                height="22"
                                viewBox="0 0 23 22"
                                fill="none"
                            >
                                <g clipPath="url(#clip0_604_19993)">
                                    <path
                                        d="M21.6676 9.08734L12.694 9.08691C12.2978 9.08691 11.9766 9.40806 11.9766 9.80432V12.671C11.9766 13.0672 12.2978 13.3884 12.694 13.3884H17.7474C17.194 14.8244 16.1612 16.0271 14.8435 16.7913L16.9983 20.5213C20.4548 18.5223 22.4983 15.0148 22.4983 11.0884C22.4983 10.5293 22.4571 10.1297 22.3747 9.67967C22.312 9.33777 22.0152 9.08734 21.6676 9.08734Z"
                                        fill="#167EE6"
                                    />
                                    <path
                                        d="M11.5019 17.6959C9.02885 17.6959 6.86993 16.3447 5.71041 14.3452L1.98047 16.4951C3.87861 19.7849 7.43445 22.0002 11.5019 22.0002C13.4972 22.0002 15.38 21.463 17.0019 20.5267V20.5216L14.8471 16.7915C13.8615 17.3632 12.7209 17.6959 11.5019 17.6959Z"
                                        fill="#12B347"
                                    />
                                    <path
                                        d="M17 20.5267V20.5216L14.8452 16.7915C13.8596 17.3631 12.7192 17.6959 11.5 17.6959V22.0002C13.4953 22.0002 15.3782 21.463 17 20.5267Z"
                                        fill="#0F993E"
                                    />
                                    <path
                                        d="M4.80435 10.9998C4.80435 9.78079 5.13702 8.64036 5.70854 7.65478L1.9786 5.50488C1.0372 7.12167 0.5 8.99932 0.5 10.9998C0.5 13.0002 1.0372 14.8779 1.9786 16.4947L5.70854 14.3448C5.13702 13.3592 4.80435 12.2188 4.80435 10.9998Z"
                                        fill="#FFD500"
                                    />
                                    <path
                                        d="M11.5019 4.30435C13.1145 4.30435 14.5958 4.87738 15.7529 5.83056C16.0383 6.06568 16.4532 6.04871 16.7146 5.78725L18.7458 3.75611C19.0424 3.45946 19.0213 2.97387 18.7044 2.69895C16.7658 1.0172 14.2436 0 11.5019 0C7.43445 0 3.87861 2.21534 1.98047 5.50511L5.71041 7.65501C6.86993 5.65555 9.02885 4.30435 11.5019 4.30435Z"
                                        fill="#FF4B26"
                                    />
                                    <path
                                        d="M15.751 5.83056C16.0364 6.06568 16.4513 6.04871 16.7128 5.78725L18.7439 3.75611C19.0405 3.45946 19.0194 2.97387 18.7025 2.69895C16.764 1.01716 14.2417 0 11.5 0V4.30435C13.1126 4.30435 14.594 4.87738 15.751 5.83056Z"
                                        fill="#D93F21"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_604_19993">
                                        <rect
                                            width="22"
                                            height="22"
                                            fill="white"
                                            transform="translate(0.5)"
                                        />
                                    </clipPath>
                                </defs>
                            </svg>
                            <span className="">Sign in with Google</span>
                        </button>

                    </div>

                    <div className="bottom body-text text-center text-white w-full">
                        Already have account?
                        <Link href="/login" className="body-text tf-color">
                            {" "}
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
