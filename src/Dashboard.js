import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const DASHBOARD_API_URL = process.env.REACT_APP_DASHBOARD_API_URL;

const mockDashboardData = {
  summary: {
    totalStudents: 128,
    todayAttendance: 94,
    recognitionRate: 96,
    coursesTracked: 7,
  },
  courseAttendance: [
    { name: "AI Fundamentals", percentage: 92 },
    { name: "Machine Learning", percentage: 88 },
    { name: "Cloud Computing", percentage: 95 },
    { name: "Computer Vision", percentage: 84 },
  ],
  recentActivity: [
    "08:15 AM: Attendance session opened for AI Fundamentals.",
    "09:10 AM: 23 student face scans matched successfully.",
    "10:05 AM: Student registration queue synced to AWS.",
  ],
};

function Dashboard({ user, lecturerId, signOut }) {
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        if (DASHBOARD_API_URL) {
          const response = await fetch(DASHBOARD_API_URL);

          if (!response.ok) {
            throw new Error("AWS dashboard API request failed.");
          }

          const data = await response.json();
          if (isMounted) {
            setDashboardData(data);
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <h1>Lecturer Dashboard</h1>
          {lecturerId && <p className="hero-copy">Lecturer ID: {lecturerId}</p>}
        </div>
        <div className="action-row">
          <Link to="/register-student" className="btn btn-secondary">
            Register Student
          </Link>
          <button className="btn btn-primary" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </section>

      {error && <div className="alert error-alert">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total Students</span>
          <strong>{dashboardData.summary.totalStudents}</strong>
        </article>
        <article className="stat-card">
          <span>Today Attendance</span>
          <strong>{dashboardData.summary.todayAttendance}</strong>
        </article>
        <article className="stat-card">
          <span>Recognition Rate</span>
          <strong>{dashboardData.summary.recognitionRate}%</strong>
        </article>
      </section>

      <section className="two-column-layout">
        <div className="panel-card">
          <div className="panel-header">
            <h2>Course Attendance</h2>
            <span className="status-pill idle">
              {loading ? "Refreshing..." : "Latest view"}
            </span>
          </div>

          <div className="chart-list">
            {dashboardData.courseAttendance.map((item) => (
              <div className="chart-row" key={item.name}>
                <div className="chart-label-row">
                  <span>{item.name}</span>
                  <strong>{item.percentage}%</strong>
                </div>
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h2>AWS Activity Feed</h2>
            <span className="status-pill live">Connected-ready</span>
          </div>

          <div className="activity-list">
            {dashboardData.recentActivity.map((activity) => (
              <p key={activity}>{activity}</p>
            ))}
          </div>

          {!DASHBOARD_API_URL && (
            <p className="status-text">
              Add <code>REACT_APP_DASHBOARD_API_URL</code> to replace this mock
              data with live AWS visualisations.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
