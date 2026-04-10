import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const DASHBOARD_API_URL = process.env.REACT_APP_DASHBOARD_API_URL;
const EXPORT_ATTENDANCE_API_URL = process.env.REACT_APP_EXPORT_ATTENDANCE_API_URL;

function AttendancePieChart({ presentCount, absentCount }) {
  const total = presentCount + absentCount;
  const presentRatio = total > 0 ? presentCount / total : 0;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const presentLength = circumference * presentRatio;
  const absentLength = circumference - presentLength;

  return (
    <div className="pie-card-content">
      <div className="pie-chart-shell">
        <svg viewBox="0 0 200 200" className="pie-chart" aria-label="Attendance pie chart">
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="pie-chart-track"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="pie-chart-present"
            strokeDasharray={`${presentLength} ${circumference - presentLength}`}
            strokeDashoffset="0"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="pie-chart-absent"
            strokeDasharray={`${absentLength} ${circumference - absentLength}`}
            strokeDashoffset={-presentLength}
          />
        </svg>
        <div className="pie-chart-center">
          <strong>{total}</strong>
          <span>Students</span>
        </div>
      </div>

      <div className="pie-legend">
        <div className="pie-legend-row">
          <span className="pie-swatch pie-swatch-present" />
          <span>Present</span>
          <strong>{presentCount}</strong>
        </div>
        <div className="pie-legend-row">
          <span className="pie-swatch pie-swatch-absent" />
          <span>Absent</span>
          <strong>{absentCount}</strong>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, lecturerId, signOut }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [studentFilter, setStudentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        if (DASHBOARD_API_URL) {
          const response = await fetch(`${DASHBOARD_API_URL}?lecturer_id=${lecturerId}`);

          if (!response.ok) {
            throw new Error("AWS dashboard API request failed.");
          }

          const raw = await response.json();
          const data = typeof raw.body === 'string' ? JSON.parse(raw.body) : raw;
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

  const summary = dashboardData?.summary ?? { totalStudents: '-', todayAttendance: '-' };
const studentAttendance = dashboardData?.studentAttendance ?? [];
const attendanceRecords = dashboardData?.attendanceRecords ?? [];

  const totalStudents = summary?.totalStudents ?? 0;
  const presentCount = summary?.todayAttendance ?? 0;
  const absentCount = Math.max(totalStudents - presentCount, 0);
  const attendanceRate =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const filteredAttendanceRecords = attendanceRecords.filter((record) => {
    const matchesStudent = studentFilter
      ? record.studentName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        record.studentId.toLowerCase().includes(studentFilter.toLowerCase())
      : true;
    const matchesDate = dateFilter ? record.date === dateFilter : true;

    return matchesStudent && matchesDate;
  });

  const exportAttendanceRecords = async () => {
    setIsExporting(true);
    setExportStatus("");

    try {
      if (EXPORT_ATTENDANCE_API_URL) {
        const exportUrl = new URL(EXPORT_ATTENDANCE_API_URL);

        if (lecturerId) {
          exportUrl.searchParams.set("lecturer_id", lecturerId);
        }
        if (dateFilter) {
          exportUrl.searchParams.set("date", dateFilter);
        }
        if (studentFilter) {
          exportUrl.searchParams.set("student_filter", studentFilter);
        }

        window.open(exportUrl.toString(), "_blank", "noopener,noreferrer");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      setExportStatus(
        EXPORT_ATTENDANCE_API_URL
          ? "Attendance export opened successfully."
          : "Export button is ready. Add REACT_APP_EXPORT_ATTENDANCE_API_URL to connect AWS."
      );
    } catch (err) {
      setExportStatus(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
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
            <button
              className="btn btn-secondary"
              onClick={exportAttendanceRecords}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export Attendance"}
            </button>
            <button className="btn btn-primary" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </section>

        <section className="center-content">
          <div className="panel-card" style={{ padding: "2rem", textAlign: "center" }}>
            <div className="loader" />
            <p className="status-text">Loading dashboard...</p>
          </div>
        </section>
      </main>
    );
  }

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
          <button
            className="btn btn-secondary"
            onClick={exportAttendanceRecords}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export Attendance"}
          </button>
          <button className="btn btn-primary" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </section>

      {error && <div className="alert error-alert">{error}</div>}
      {exportStatus && (
        <div
          className={`alert ${
            exportStatus.includes("failed") ? "error-alert" : "info-alert"
          }`}
        >
          {exportStatus}
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total Students</span>
          <strong>{totalStudents}</strong>
        </article>
        <article className="stat-card">
          <span>Today Present</span>
          <strong>{presentCount}</strong>
        </article>
        <article className="stat-card">
          <span>Today Absents</span>
          <strong>{absentCount}</strong>
        </article>
        <article className="stat-card">
          <span>Attendance Rate</span>
          <strong>{attendanceRate}%</strong>
        </article>
      </section>

      <section className="two-column-layout">
        <div className="panel-card">
          <div className="panel-header">
            <h2>Today Attendance Overview</h2>
            <span className="status-pill idle">Present vs Absent</span>
          </div>

          <AttendancePieChart
            presentCount={presentCount}
            absentCount={absentCount}
          />
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h2>Student Attendance</h2>
            <span className="status-pill idle">
              {loading ? "Refreshing..." : "Latest view"}
            </span>
          </div>

          <div className="chart-list">
            {studentAttendance.map((item) => (
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
      </section>

      <section className="panel-card attendance-table-card">
        <div className="panel-header">
          <h2>Full Attendance Records</h2>
          <span className="status-pill idle">
            {filteredAttendanceRecords.length} record
            {filteredAttendanceRecords.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="table-filter-row">
          <label className="field-group table-filter-field" htmlFor="studentFilter">
            <span>Filter By Student</span>
            <input
              id="studentFilter"
              type="text"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
              placeholder="Search by student name or ID"
            />
          </label>

          <label className="field-group table-filter-field" htmlFor="dateFilter">
            <span>Filter By Date</span>
            <input
              id="dateFilter"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
        </div>

        <div className="table-shell">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendanceRecords.length > 0 ? (
                filteredAttendanceRecords.map((record) => (
                  <tr key={`${record.studentId}-${record.date}-${record.time}`}>
                    <td>{record.studentId}</td>
                    <td>{record.studentName}</td>
                    <td>{record.course}</td>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>
                      <span
                        className={`table-status-badge ${
                          record.status === "Present"
                            ? "table-status-present"
                            : "table-status-absent"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="table-empty-state">
                    No attendance records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
