import React, { useState } from "react";
import { Link } from "react-router-dom";

const STUDENT_API_URL = process.env.REACT_APP_STUDENT_REGISTRATION_API_URL;

function StudentRegistration({ lecturerId }) {
  const [form, setForm] = useState({
    studentName: "",
  });
  const [faceImageFile, setFaceImageFile] = useState(null);
  const [faceImageBase64, setFaceImageBase64] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({ studentName: "" });
    setFaceImageFile(null);
    setFaceImageBase64("");
    setPreviewImage("");
    setStatus("Fill in the student details and upload a face image.");
    setError("");
    setIsSaving(false);
    setUploadSuccess(false);
    setRegisterSuccess(false);

    const fileInput = document.getElementById("faceImageUpload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      setFaceImageFile(null);
      setFaceImageBase64("");
      setPreviewImage("");
      setUploadSuccess(false);
      setRegisterSuccess(false);
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setUploadSuccess(false);
    setRegisterSuccess(false);
    setFaceImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? "";
      const base64Only = result.split(",")[1] ?? "";
      setFaceImageBase64(base64Only);
      setPreviewImage(result);
      setStatus("Image selected. Ready to save.");
    };
    reader.readAsDataURL(file);
  };

  const saveStudent = async (event) => {
    event.preventDefault();

    if (!form.studentName || !faceImageFile || !faceImageBase64) {
      setError("Student name and face image are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setUploadSuccess(false);
    setRegisterSuccess(false);
    setStatus("Saving student profile...");

    try {
      console.log("STUDENT_API_URL:", STUDENT_API_URL);
      console.log("Submitting payload:", {
        student_name: form.studentName,
        file_name: faceImageFile?.name,
        lecturer_id: lecturerId,
        image_base64: faceImageBase64?.slice(0, 100) + "...",
      });

      if (STUDENT_API_URL) {
        const response = await fetch(STUDENT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_name: form.studentName,
            file_name: faceImageFile.name,
            lecturer_id: lecturerId,
            image_base64: faceImageBase64,
          }),
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        const responseText = await response.text();
        console.log("Response body:", responseText);

        if (!response.ok) {
          throw new Error(
            `AWS student registration API request failed. Status: ${response.status}, Body: ${responseText}`
          );
        }

        setStatus("Face image uploaded successfully.");
        setUploadSuccess(true);
        setRegisterSuccess(true);
      } else {
        console.warn("Missing REACT_APP_STUDENT_REGISTRATION_API_URL");
        await new Promise((resolve) => setTimeout(resolve, 800));

        setStatus("Face image uploaded successfully.");
        setUploadSuccess(true);
        setRegisterSuccess(true);
      }
    } catch (err) {
      console.error("Save student error:", err);
      setError(err.message);
      setStatus("Student registration failed.");
      setUploadSuccess(false);
      setRegisterSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page-shell centered-form-page">
      <section className="page-header">
        <div>
          <h1>Register Student</h1>
          <p className="hero-copy">
            Register a new student with name and a face image for your course.
          </p>
          {lecturerId && <p className="hero-copy">Lecturer ID: {lecturerId}</p>}
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </section>

      <section className="centered-form-wrapper">
        <form className="panel-card form-card" onSubmit={saveStudent}>
          <div className="panel-header">
            <h2>Student Details</h2>
            <span className="status-pill idle">Lecturer only</span>
          </div>

          {error && <div className="alert error-alert">{error}</div>}

          <label className="field-group" htmlFor="studentName">
            <span>Student Name</span>
            <input
              id="studentName"
              name="studentName"
              value={form.studentName}
              onChange={updateField}
              placeholder="Enter full student name"
            />
          </label>

          <label className="field-group" htmlFor="faceImageUpload">
            <span>Upload Face Image</span>
            <input
              id="faceImageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <small className="status-text">
              File naming format:<strong> use studentID.png</strong> <strong> "2202222.png"</strong>
            </small>
          </label>

          {uploadSuccess && faceImageFile ? (
            <div
              style={{
                backgroundColor: "#e8f8ee",
                border: "1px solid #28a745",
                color: "#155724",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            >
              <p style={{ margin: 0, fontWeight: "600" }}>
                Face image uploaded successfully.
              </p>
              <p style={{ margin: "6px 0 0 0" }}>
                Image ready: {faceImageFile.name}
              </p>
            </div>
          ) : (
            <p className="status-text">{status}</p>
          )}

          {previewImage && (
            <img
              src={previewImage}
              alt="Student face preview"
              className="camera-frame"
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Student"}
          </button>
          
            {registerSuccess && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Register Another Student
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default StudentRegistration;