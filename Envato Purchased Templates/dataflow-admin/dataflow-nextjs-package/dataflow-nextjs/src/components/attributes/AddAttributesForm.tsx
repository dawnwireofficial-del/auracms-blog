"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const AddAttributesForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      attributeName: formData.get("attributeName"),
      attributeValue: formData.get("attributeValue"),
    };

    try {
      const res = await fetch("/api/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add attribute");
        return;
      }

      alert("Attribute added successfully");
      router.push("/all-attributes");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-add-attributes" onSubmit={handleSubmit}>
      <div className="wg-box mb-30">
        <fieldset className="name mw-585">
          <div className="body-title mb-10">
            Attributes name <span className="tf-color-1">*</span>
          </div>
          <input
            className=""
            type="text"
            placeholder="Attributes name"
            name="attributeName"
            tabIndex={0}
            defaultValue=""
            required
          />
        </fieldset>

        <fieldset className="value mw-585">
          <div className="body-title mb-10">
            Attributes value <span className="tf-color-1">*</span>
          </div>
          <input
            className=""
            type="text"
            placeholder="Attributes value"
            name="attributeValue"
            tabIndex={0}
            defaultValue=""
            required
          />
        </fieldset>
      </div>

      <div className="cols gap10">
        <button className="tf-button w380" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Attributes"}
        </button>
        <a href="#" className="tf-button style-3 w380">
          Cancel
        </a>
      </div>
    </form>
  );
};

export default AddAttributesForm;