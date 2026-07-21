"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type PermissionValue = "allow" | "deny";

type Permissions = {
  addProduct: PermissionValue;
  updateProduct: PermissionValue;
  deleteProduct: PermissionValue;
  applyDiscount: PermissionValue;
  createCoupon: PermissionValue;
};

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const AddNewUserForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [permissions, setPermissions] = useState<Permissions>({
    addProduct: "allow",
    updateProduct: "deny",
    deleteProduct: "allow",
    applyDiscount: "deny",
    createCoupon: "deny",
  });

  const [errors, setErrors] = useState<Errors>({});

  const handlePermissionChange = (
    key: keyof Permissions,
    value: PermissionValue
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const nextErrors: Errors = {};

    if (!data.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!data.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      nextErrors.email = "Email is invalid";
    }

    if (!data.password) {
      nextErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (!data.confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required";
    } else if (data.password !== data.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
    };

    const nextErrors = validate(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, permissions }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Failed to create user");
        return;
      }

      alert("User created successfully");
      router.push("/all-user");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-add-new-user form-style-2" onSubmit={handleSubmit}>
      <div className="wg-box">
        <div className="left">
          <div className="mb-4 h5">Account</div>
          <div className="body-text">
            Fill in the information below to add a new account
          </div>
        </div>

        <div className="right flex-grow">
          <fieldset className="name mb-24">
            <div className="body-title mb-10">Name</div>
            <input
              className="flex-grow"
              type="text"
              placeholder="Username"
              name="name"
              tabIndex={0}
              defaultValue=""
              required
            />
            {errors.name && (
              <div className="text-tiny" style={{ color: "red", marginTop: 8 }}>
                {errors.name}
              </div>
            )}
          </fieldset>

          <fieldset className="email mb-24">
            <div className="body-title mb-10">Email</div>
            <input
              className="flex-grow"
              type="email"
              placeholder="Email"
              name="email"
              tabIndex={0}
              defaultValue=""
              required
            />
            {errors.email && (
              <div className="text-tiny" style={{ color: "red", marginTop: 8 }}>
                {errors.email}
              </div>
            )}
          </fieldset>

          <fieldset className="password mb-24">
            <div className="body-title mb-10">Password</div>
            <input
              className="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              name="password"
              tabIndex={0}
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
            {errors.password && (
              <div className="text-tiny" style={{ color: "red", marginTop: 8 }}>
                {errors.password}
              </div>
            )}
          </fieldset>

          <fieldset className="password">
            <div className="body-title mb-10">Confirm password</div>
            <input
              className="password-input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              name="confirmPassword"
              tabIndex={0}
              defaultValue=""
              required
            />
            <span
              className="show-pass"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={{ cursor: "pointer" }}
            >
              <i className="icon-eye view"></i>
              <i className="icon-eye-off hide"></i>
            </span>
            {errors.confirmPassword && (
              <div className="text-tiny" style={{ color: "red", marginTop: 8 }}>
                {errors.confirmPassword}
              </div>
            )}
          </fieldset>
        </div>
      </div>

      <div className="wg-box">
        <div className="left">
          <div className="mb-4 h5">Pernission</div>
          <div className="body-text">
            Items that the account is allowed to edit
          </div>
        </div>

        <div className="right flex-grow">
          <fieldset className="mb-24">
            <div className="body-title mb-10">Add product</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  type="radio"
                  name="add-product"
                  id="add-product1"
                  checked={permissions.addProduct === "allow"}
                  onChange={() => handlePermissionChange("addProduct", "allow")}
                />
                <label htmlFor="add-product1">
                  <span className="body-title-2">Allow</span>
                </label>
              </div>
              <div className="item">
                <input
                  type="radio"
                  name="add-product"
                  id="add-product2"
                  checked={permissions.addProduct === "deny"}
                  onChange={() => handlePermissionChange("addProduct", "deny")}
                />
                <label htmlFor="add-product2">
                  <span className="body-title-2">Deny</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-24">
            <div className="body-title mb-10">Update product</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  type="radio"
                  name="update-product"
                  id="update-product1"
                  checked={permissions.updateProduct === "allow"}
                  onChange={() =>
                    handlePermissionChange("updateProduct", "allow")
                  }
                />
                <label htmlFor="update-product1">
                  <span className="body-title-2">Allow</span>
                </label>
              </div>
              <div className="item">
                <input
                  type="radio"
                  name="update-product"
                  id="update-product2"
                  checked={permissions.updateProduct === "deny"}
                  onChange={() =>
                    handlePermissionChange("updateProduct", "deny")
                  }
                />
                <label htmlFor="update-product2">
                  <span className="body-title-2">Deny</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-24">
            <div className="body-title mb-10">Delete product</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  type="radio"
                  name="delete-product"
                  id="delete-product1"
                  checked={permissions.deleteProduct === "allow"}
                  onChange={() =>
                    handlePermissionChange("deleteProduct", "allow")
                  }
                />
                <label htmlFor="delete-product1">
                  <span className="body-title-2">Allow</span>
                </label>
              </div>
              <div className="item">
                <input
                  type="radio"
                  name="delete-product"
                  id="delete-product2"
                  checked={permissions.deleteProduct === "deny"}
                  onChange={() =>
                    handlePermissionChange("deleteProduct", "deny")
                  }
                />
                <label htmlFor="delete-product2">
                  <span className="body-title-2">Deny</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-24">
            <div className="body-title mb-10">Apply discount</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  type="radio"
                  name="apply-product"
                  id="apply-product1"
                  checked={permissions.applyDiscount === "allow"}
                  onChange={() =>
                    handlePermissionChange("applyDiscount", "allow")
                  }
                />
                <label htmlFor="apply-product1">
                  <span className="body-title-2">Allow</span>
                </label>
              </div>
              <div className="item">
                <input
                  type="radio"
                  name="apply-product"
                  id="apply-product2"
                  checked={permissions.applyDiscount === "deny"}
                  onChange={() =>
                    handlePermissionChange("applyDiscount", "deny")
                  }
                />
                <label htmlFor="apply-product2">
                  <span className="body-title-2">Deny</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <div className="body-title mb-10">Create coupon</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  type="radio"
                  name="create-product"
                  id="create-product1"
                  checked={permissions.createCoupon === "allow"}
                  onChange={() =>
                    handlePermissionChange("createCoupon", "allow")
                  }
                />
                <label htmlFor="create-product1">
                  <span className="body-title-2">Allow</span>
                </label>
              </div>
              <div className="item">
                <input
                  type="radio"
                  name="create-product"
                  id="create-product2"
                  checked={permissions.createCoupon === "deny"}
                  onChange={() =>
                    handlePermissionChange("createCoupon", "deny")
                  }
                />
                <label htmlFor="create-product2">
                  <span className="body-title-2">Deny</span>
                </label>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="bot">
        <button className="tf-button w180" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default AddNewUserForm;