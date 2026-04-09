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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setStatus("Opening camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      setCameraOn(true);
      setStatus("Camera connected. Starting preview...");
    } catch (err) {
      setError("Unable to access camera. Please allow camera permission.");
      setStatus(err.message);
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

    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCaptured(canvas.toDataURL("image/jpeg", 0.92));
    setStatus("Preview captured. Submit when you are ready.");
    stopCamera();
  };

  const submitAttendance = async () => {
    if (!captured) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setStatus("Submitting attendance...");

    try {
      if (ATTENDANCE_API_URL) {
        const response = await fetch(ATTENDANCE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: captured,
            capturedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("AWS attendance API request failed.");
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      setStatus(
        ATTENDANCE_API_URL
          ? "Attendance sent to AWS successfully."
          : "Attendance capture ready. Add REACT_APP_ATTENDANCE_API_URL to connect AWS."
      );
    } catch (err) {
      setError(err.message);
      setStatus("Attendance submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="hero-card">
          <p className="eyebrow">Student Attendance</p>
          <h1>Open camera, capture face, and record attendance</h1>
          <p className="hero-copy">
            This page keeps the attendance flow public so students can check in
            quickly without lecturer login.
          </p>
          <div className="feature-list">
            <span>Live camera preview</span>
            <span>One-click picture capture</span>
            <span>AWS API hook for later integration</span>
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
                onLoadedMetadata={() => {
                  setVideoReady(true);
                  setStatus("Camera ready. Capture your face image.");
                }}
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

          <canvas ref={canvasRef} className="hidden-canvas" />

          {captured && (
            <div className="capture-stack">
              <img src={captured} alt="Attendance preview" className="camera-frame" />
              <div className="action-row">
                <button
                  className="btn btn-primary"
                  onClick={submitAttendance}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send to AWS"}
                </button>
                <button className="btn btn-secondary" onClick={startCamera}>
                  Retake Picture
                </button>
              </div>
            </div>
          )}

          <p className="status-text">{status}</p>
        </div>
      </section>
    </main>
  );
}

export default TakeAttendance;
