import React, { useEffect, useRef, useState } from "react";

const IMAGE_UPLOAD_API_URL = process.env.REACT_APP_IMAGE_UPLOAD_API_URL;
const ATTENDANCE_API_URL = process.env.REACT_APP_ATTENDANCE_API_URL;

const isWeekend = () => {
  const day = new Date().getDay();
  return day === 0 || day === 6;
};

function TakeAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Waiting for student check-in.");
  const [statusType, setStatusType] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);

  const setStatusMsg = (msg, type = "info") => {
    setStatus(msg);
    setStatusType(type);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!cameraOn || !video || !stream) {
      return;
    }

    video.srcObject = stream;
    video
      .play()
      .then(() => {
        setStatus("Camera connected. Waiting for live preview...");
      })
      .catch(() => {
        setError("Camera stream started, but preview playback could not begin.");
      });
  }, [cameraOn]);

  const startCamera = async () => {
    setError("");
    setCaptured("");
    setVideoReady(false);
    setCanSubmit(true);
    setStatusMsg("Opening camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      streamRef.current = stream;
      setCameraOn(true);
      setStatusMsg("Camera connected. Starting preview...");
    } catch (err) {
      setError("Unable to access camera. Please allow camera permission.");
      setStatusMsg(err.message, "error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setVideoReady(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    setCaptured(canvas.toDataURL("image/png"));
    setCanSubmit(true);
    setStatusMsg("Preview captured. Submit when you are ready.");
    stopCamera();
  };

  const base64ToBlob = (base64, mimeType) => {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mimeType });
  };

  const submitAttendance = async () => {
    if (!captured) return;

    setIsSubmitting(true);
    setError("");
    setStatusMsg("Preparing upload...", "info");

    try {
      const base64Image = captured.split(',')[1];
      const fileName = `attendance_${Date.now()}.png`;
      const uploadUrlRes = await fetch(
        `${IMAGE_UPLOAD_API_URL}?file_name=${encodeURIComponent(fileName)}`
      );
      if (!uploadUrlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, s3_key } = await uploadUrlRes.json();

      //Upload image blob to S3 via presigned URL
      setStatusMsg("Uploading image...", "info");
      const imageBlob = base64ToBlob(base64Image, "image/png");
      const s3Res = await fetch(upload_url, {
        method: "PUT",
        body: imageBlob,
        headers: { "Content-Type": "image/png" },
      });
      if (!s3Res.ok) throw new Error("Failed to upload image to storage");

      //Submit attendance with S3 key
      setStatusMsg("Analyzing face, please wait...", "info");
      const response = await fetch(ATTENDANCE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3_key }),
      });

      const data = await response.json();

      // Results
      switch (data.result) {
        case 'success':
          const name = data.marked_students?.[0]?.student_name || "Student";
          setStatusMsg(`Attendance recorded successfully! Welcome, ${name}.`, "success");
          setCaptured("");
          break;

        case 'duplicate':
          setStatusMsg("Your attendance has already been recorded today.", "warning");
          setCaptured("");
          break;

        case 'no_face':
          setStatusMsg("No face detected. Please retake the photo in better lighting.", "warning");
          setCanSubmit(false);
          break;

        case 'unrecognized':
          setStatusMsg("Face not recognized or registered. Please contact your lecturer for help.", "error");
          setCanSubmit(false);
          break;

        default:
          setStatusMsg("System could not verify identity. Please try again.", "error");
          setCanSubmit(false);
      }

    } catch (err) {
      console.error("API Error:", err);
      setError("Connection error. Please check your internet.");
      setStatusMsg("Submission failed. Please try again.", "error");
      setCanSubmit(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClass = {
    info: "status-text",
    success: "status-text status-success",
    warning: "status-text status-warning",
    error: "status-text status-error",
  }[statusType];

  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="hero-card">
          <p className="eyebrow">Student Attendance</p>
          <h1>Open camera, capture face, and record attendance</h1>
          <p className="hero-copy">Check-in quickly without login.</p>
          <div className="feature-list">
            <span>Live camera preview</span>
            <span>One-click picture capture</span>
            <span>AWS API Integration</span>
          </div>
        </div>

        <div className="panel-card scanner-card">
          <div className="panel-header">
            <h2>Attendance Camera</h2>
            <span className={`status-pill ${cameraOn ? "live" : "idle"}`}>
              {cameraOn ? "Camera live" : "Camera idle"}
            </span>
          </div>

          {isWeekend() ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <p style={{ fontSize: "2rem", marginBottom: "8px" }}>🎉</p>
              <p style={{ fontWeight: "600", fontSize: "1.1rem", marginBottom: "6px" }}>
                No attendance today!
              </p>
              <p className="status-text">
                <br />Attendance is only recorded on weekdays (Monday – Friday). <br />
                Today is a weekend.  Enjoy your break!
              </p>
            </div>
          ) : (
            <>
              {error && <div className="alert error-alert">{error}</div>}

              {!cameraOn && !captured && (
                <button className="btn btn-primary btn-wide" onClick={startCamera}>
                  Open Camera
                </button>
              )}

              {cameraOn && (
                <div className="capture-stack">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-frame"
                    onLoadedMetadata={() => setVideoReady(true)}
                  />
                  {!videoReady && (
                    <div className="camera-overlay">
                      <p>Starting camera preview...</p>
                    </div>
                  )}
                  <div className="action-row">
                    <button className="btn btn-primary" onClick={capturePhoto}>
                      Take Picture
                    </button>
                    <button className="btn btn-secondary" onClick={stopCamera}>
                      Close Camera
                    </button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />

              {captured && (
                <div className="capture-stack">
                  <img src={captured} alt="Attendance preview" className="camera-frame" />
                  <div className="action-row">
                    {canSubmit && (
                      <button
                        className="btn btn-primary"
                        onClick={submitAttendance}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Processing..." : "Submit Photo"}
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      onClick={startCamera}
                      disabled={isSubmitting}
                    >
                      Retake Picture
                    </button>
                  </div>
                </div>
              )}

              <p className={statusClass}>{status}</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default TakeAttendance;