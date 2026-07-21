"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";

type FormDataType = {
  shopName: string;
  companyName: string;
  taxId: string;
  contact: string;
  email: string;
  address: string;
  city: string;
  zipcode: string;
  enableCash: "yes" | "no";
  enableStripe: "yes" | "no";
  stripeKey: string;
  stripeSecret: string;
  enablePaypal: "yes" | "no";
  paypalId: string;
  paypalSecretKey: string;
  enableGoogle: "yes" | "no";
  googleApiKey: string;
  enableNewsletter: "yes" | "no";
  mailchimpApiKey: string;
  description: string;
};

const STORE_DEFAULTS: FormDataType = {
  shopName: "DataFlow",
  companyName: "DataFlow",
  taxId: "854789542",
  contact: "+1 548 562 1023",
  email: "support@dataflow.com",
  address: "52 Davis Street, Buffalo, New York",
  city: "New York",
  zipcode: "52103",
  enableCash: "no",
  enableStripe: "no",
  stripeKey: "",
  stripeSecret: "",
  enablePaypal: "no",
  paypalId: "",
  paypalSecretKey: "",
  enableGoogle: "yes",
  googleApiKey: "",
  enableNewsletter: "yes",
  mailchimpApiKey: "",
  description: "",
};

export default function StoreSettingForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataType>(STORE_DEFAULTS);

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((saved) => {
        if (saved && Object.keys(saved).length > 0) {
          setFormData((prev) => ({ ...prev, ...saved }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save settings");
        return;
      }

      alert("Store settings saved successfully");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-setting form-style-2" onSubmit={handleSubmit}>
      <div className="wg-box">
        <div className="left">
          <div className="h5 mb-4">Store Information</div>
          <div className="body-text">Setting Store & Invoice information</div>
        </div>
        <div className="right flex-grow">
          <div className="cols gap24">
            <fieldset className="mb-24">
              <div className="body-title mb-10">Shop Name</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Shop Name"
                name="shopName"
                tabIndex={0}
                value={formData.shopName}
                onChange={handleChange}
                required
              />
            </fieldset>
            <fieldset className="mb-24">
              <div className="body-title mb-10">Company Name</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Company Name"
                name="companyName"
                tabIndex={0}
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </fieldset>
          </div>

          <div className="cols gap24">
            <fieldset className="mb-24">
              <div className="body-title mb-10">Tax ID</div>
              <input
                className="flex-grow"
                type="number"
                placeholder="Tax ID"
                name="taxId"
                tabIndex={0}
                value={formData.taxId}
                onChange={handleChange}
                required
              />
            </fieldset>
            <fieldset className="mb-24">
              <div className="body-title mb-10">Contact</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Contact"
                name="contact"
                tabIndex={0}
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </fieldset>
          </div>

          <div className="cols gap24">
            <fieldset className="mb-24">
              <div className="body-title mb-10">Email</div>
              <input
                className="flex-grow"
                type="email"
                placeholder="Email"
                name="email"
                tabIndex={0}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </fieldset>
            <fieldset className="mb-24">
              <div className="body-title mb-10">Address</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Address"
                name="address"
                tabIndex={0}
                value={formData.address}
                onChange={handleChange}
                required
              />
            </fieldset>
          </div>

          <div className="cols gap24">
            <fieldset className="sm-mb-24">
              <div className="body-title mb-10">City</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="City"
                name="city"
                tabIndex={0}
                value={formData.city}
                onChange={handleChange}
                required
              />
            </fieldset>
            <fieldset className="">
              <div className="body-title mb-10">Zipcode</div>
              <input
                className="flex-grow"
                type="number"
                placeholder="Zipcode"
                name="zipcode"
                tabIndex={0}
                value={formData.zipcode}
                onChange={handleChange}
                required
              />
            </fieldset>
          </div>
        </div>
      </div>

      <div className="wg-box">
        <div className="left">
          <div className="h5 mb-4">Payment</div>
          <div className="body-text">Setting payment information</div>
        </div>
        <div className="right flex-grow">
          <fieldset className="mb-24">
            <div className="body-title mb-10">Enable Cash on Delivery?</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableCash"
                  id="enable-cash1"
                  value="yes"
                  checked={formData.enableCash === "yes"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-cash1">
                  <span className="body-title-2">Yes</span>
                </label>
              </div>
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableCash"
                  id="enable-cash2"
                  value="no"
                  checked={formData.enableCash === "no"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-cash2">
                  <span className="body-title-2">No</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-24">
            <div className="body-title mb-10">Enable Stripe Payment?</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableStripe"
                  id="enable-stripe1"
                  value="yes"
                  checked={formData.enableStripe === "yes"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-stripe1">
                  <span className="body-title-2">Yes</span>
                </label>
              </div>
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableStripe"
                  id="enable-stripe2"
                  value="no"
                  checked={formData.enableStripe === "no"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-stripe2">
                  <span className="body-title-2">No</span>
                </label>
              </div>
            </div>
          </fieldset>

          <div
            className="cols gap24"
            style={{ display: formData.enableStripe === "yes" ? "grid" : "none" }}
          >
            <fieldset className="mb-24">
              <div className="body-title mb-10">Stripe Key</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Enter Stripe Key"
                name="stripeKey"
                tabIndex={0}
                value={formData.stripeKey}
                onChange={handleChange}
                required={formData.enableStripe === "yes"}
                disabled={formData.enableStripe !== "yes"}
              />
            </fieldset>
            <fieldset className="mb-24">
              <div className="body-title mb-10">Stripe Secret</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Enter Stripe Secret"
                name="stripeSecret"
                tabIndex={0}
                value={formData.stripeSecret}
                onChange={handleChange}
                required={formData.enableStripe === "yes"}
                disabled={formData.enableStripe !== "yes"}
              />
            </fieldset>
          </div>

          <fieldset className="mb-24">
            <div className="body-title mb-10">Enable Paypal Payment?</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enablePaypal"
                  id="enable-paypal1"
                  value="yes"
                  checked={formData.enablePaypal === "yes"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-paypal1">
                  <span className="body-title-2">Yes</span>
                </label>
              </div>
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enablePaypal"
                  id="enable-paypal2"
                  value="no"
                  checked={formData.enablePaypal === "no"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-paypal2">
                  <span className="body-title-2">No</span>
                </label>
              </div>
            </div>
          </fieldset>

          <div
            className="cols gap24"
            style={{ display: formData.enablePaypal === "yes" ? "grid" : "none" }}
          >
            <fieldset className="sm-mb-24">
              <div className="body-title mb-10">Paypal ID</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Enter Paypal ID"
                name="paypalId"
                tabIndex={0}
                value={formData.paypalId}
                onChange={handleChange}
                required={formData.enablePaypal === "yes"}
                disabled={formData.enablePaypal !== "yes"}
              />
            </fieldset>
            <fieldset className="">
              <div className="body-title mb-10">Paypal Secret Key</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="Enter Paypal Secret Key"
                name="paypalSecretKey"
                tabIndex={0}
                value={formData.paypalSecretKey}
                onChange={handleChange}
                required={formData.enablePaypal === "yes"}
                disabled={formData.enablePaypal !== "yes"}
              />
            </fieldset>
          </div>
        </div>
      </div>

      <div className="wg-box">
        <div className="left">
          <div className="h5 mb-4">Google Analytics</div>
          <div className="body-text">Config Credentials for Google Analytics</div>
        </div>
        <div className="right flex-grow">
          <fieldset className="mb-24">
            <div className="body-title mb-10">Enable Google Analytics?</div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableGoogle"
                  id="enable-google1"
                  value="yes"
                  checked={formData.enableGoogle === "yes"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-google1">
                  <span className="body-title-2">Yes</span>
                </label>
              </div>
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableGoogle"
                  id="enable-google2"
                  value="no"
                  checked={formData.enableGoogle === "no"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-google2">
                  <span className="body-title-2">No</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset
            className="mb-10"
            style={{ display: formData.enableGoogle === "yes" ? "block" : "none" }}
          >
            <div className="body-title mb-10">Google API Key</div>
            <input
              className="flex-grow"
              type="text"
              placeholder="Enter your Google API Key"
              name="googleApiKey"
              tabIndex={0}
              value={formData.googleApiKey}
              onChange={handleChange}
              required={formData.enableGoogle === "yes"}
              disabled={formData.enableGoogle !== "yes"}
            />
          </fieldset>

          <div
            className="block-warning type-main style-1 w-full"
            style={{ display: formData.enableGoogle === "yes" ? "flex" : "none" }}
          >
            <i className="icon-alert-octagon"></i>
            <a
              href="https://support.google.com/analytics/answer/9539598#find-G-ID"
              className="text"
              target="_blank"
              rel="noreferrer"
            >
              https://support.google.com/analytics/answer/9539598#find-G-ID
            </a>
          </div>
        </div>
      </div>

      <div className="wg-box">
        <div className="left">
          <div className="h5 mb-4">Newsletter</div>
          <div className="body-text">
            Settings for newsletter (auto send newsletter email to SendGrid,
            Mailchimp... when someone register newsletter on website).
          </div>
        </div>
        <div className="right flex-grow">
          <fieldset className="mb-24">
            <div className="body-title mb-10">
              Enable newsletter contacts list Popup?
            </div>
            <div className="radio-buttons">
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableNewsletter"
                  id="enable-newsletter1"
                  value="yes"
                  checked={formData.enableNewsletter === "yes"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-newsletter1">
                  <span className="body-title-2">Yes</span>
                </label>
              </div>
              <div className="item">
                <input
                  className=""
                  type="radio"
                  name="enableNewsletter"
                  id="enable-newsletter2"
                  value="no"
                  checked={formData.enableNewsletter === "no"}
                  onChange={handleChange}
                />
                <label className="" htmlFor="enable-newsletter2">
                  <span className="body-title-2">No</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset
            className="mb-24"
            style={{
              display: formData.enableNewsletter === "yes" ? "block" : "none",
            }}
          >
            <div className="body-title mb-10">Mailchimp API Key</div>
            <input
              className="flex-grow"
              type="text"
              placeholder="Enter your Mailchimp API Key"
              name="mailchimpApiKey"
              tabIndex={0}
              value={formData.mailchimpApiKey}
              onChange={handleChange}
              required={formData.enableNewsletter === "yes"}
              disabled={formData.enableNewsletter !== "yes"}
            />
          </fieldset>

          <fieldset
            className=""
            style={{
              display: formData.enableNewsletter === "yes" ? "block" : "none",
            }}
          >
            <div className="body-title mb-10">Email Newsletter Content</div>
            <textarea
              className="flex-grow h100"
              name="description"
              placeholder="Short description for newsletter pop-up"
              tabIndex={0}
              value={formData.description}
              onChange={handleChange}
              required={formData.enableNewsletter === "yes"}
              disabled={formData.enableNewsletter !== "yes"}
            ></textarea>
          </fieldset>
        </div>
      </div>

      <div className="cols gap10">
        <button className="tf-button w380" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Update"}
        </button>
        <a href="#" className="tf-button style-3 w380">
          Cancel
        </a>
      </div>
    </form>
  );
}