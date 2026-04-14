import React, { useEffect, useRef, useState } from "react";

const ATTENDANCE_API_URL = process.env.REACT_APP_ATTENDANCE_API_URL;

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

  const submitAttendance = async () => {
    if (!captured) return;

    setIsSubmitting(true);
    setError("");
    setStatusMsg("Analyzing face, please wait...", "info");

    try {
      const base64Image = captured.split(',')[1];
      const response = await fetch(ATTENDANCE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
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
                {/* ONLY show the Submit button if canSubmit is true */}
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
        </div>
      </section>
    </main>
  );
}

export default TakeAttendance;