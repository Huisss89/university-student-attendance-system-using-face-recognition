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
  const [status, setStatus] = useState("Fill in the student details and upload a face image.");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      setFaceImageFile(null);
      setFaceImageBase64("");
      setPreviewImage("");
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setFaceImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? "";
      setFaceImageBase64(result);
      setPreviewImage(result);
      setStatus("Face image uploaded successfully.");
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
    setStatus("Saving student profile...");

    try {
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

        if (!response.ok) {
          throw new Error("AWS student registration API request failed.");
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setStatus(
        STUDENT_API_URL
          ? "Student registration image sent to AWS successfully."
          : "Student registration image captured. Add REACT_APP_STUDENT_REGISTRATION_API_URL to connect AWS."
      );
    } catch (err) {
      setError(err.message);
      setStatus("Student registration failed.");
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
          </label>

          <p className="status-text">{status}</p>

          {faceImageFile && (
            <p className="status-text">Image ready: {faceImageFile.name}</p>
          )}

          {previewImage && (
            <img src={previewImage} alt="Student face preview" className="camera-frame" />
          )}

          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Student"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default StudentRegistration;
