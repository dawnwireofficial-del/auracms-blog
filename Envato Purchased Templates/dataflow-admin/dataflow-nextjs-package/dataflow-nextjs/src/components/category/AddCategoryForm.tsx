"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const AddCategoryForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("images/");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add category");
        return;
      }

      alert("Category added successfully");
      router.push("/all-category");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-add-category" onSubmit={handleSubmit}>
      <div className="wg-box mb-30">
        <fieldset className="name mw-585">
          <div className="body-title mb-10">
            Category name <span className="tf-color-1">*</span>
          </div>
          <input
            className="mb-10"
            type="text"
            placeholder="Category name"
            name="categoryName"
            tabIndex={0}
            defaultValue=""
            required
          />
        </fieldset>

        <fieldset className="mw-585">
          <div className="body-title mb-10">Upload images</div>
          <div className="upload-image mb-16">
            <div className="up-load">
              <label className="uploadfile" htmlFor="myFile">
                <span className="icon">
                  <i className="icon-upload-cloud"></i>
                </span>
                <span className="text-tiny">
                  Drop your images here or select{" "}
                  <span className="text-secondary">click to browse</span>
                </span>
                <input
                  type="file"
                  id="myFile"
                  name="filename"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="cols gap10">
        <button className="tf-button w380" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Category"}
        </button>
        <a href="#" className="tf-button style-3 w380">
          Cancel
        </a>
      </div>
    </form>
  );
};

export default AddCategoryForm;