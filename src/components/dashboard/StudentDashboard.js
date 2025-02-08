// src/components/dashboard/StudentDashboard.js
import React, { useState, useEffect } from "react";
import "../../styles/Dashboard.css";

function StudentDashboard() {
  const [studentData, setStudentData] = useState({
    name: "",
    studentId: "",
    grade: "",
    totalHours: 0,
    schoolHours: 0,
    communityHours: 0,
  });
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Redirect to home page
    window.location.href = '/';
};


  // src/components/dashboard/StudentDashboard.js
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        if (!userData?.id) {
          setError("Please log in again");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/service/student-details/${userData.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStudentData({
            name: userData.name,
            studentId: userData.studentId,
            grade: userData.grade,
            totalHours: data.student?.total_hours || 0,
            schoolHours: data.student?.schoolHours || 0,
            communityHours: data.student?.communityHours || 0,
          });
          setServiceRecords(data.serviceRecords || []);
        } else {
          setError(data.message || "Failed to fetch student data");
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  const REQUIRED_HOURS = {
    8: 25,
    9: 25,  // Grade 9 needs 25 hours
    10: 25, // Grade 10 needs 25 hours
    11: 25, // Grade 11 needs 25 hours
    12: 20  // Grade 12 needs 25 hours
};
  return (
    <div className="dashboard-container">
    <div className="dashboard-header">
        <h1>{studentData.name}'s Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
            Log Out
        </button>
    </div>
      <div className="student-info-section">
      
        <h1>{studentData.name}'s Dashboard</h1>
                
        <div className="info-grid">
          <div className="info-card">
            <label>Student ID:</label>
            <span>{studentData.studentId}</span>
          </div>
          <div className="info-card">
            <label>Grade:</label>
            <span>{studentData.grade}</span>
          </div>
          <div className="info-card">
            <label>Total Hours:</label>
            <span>{studentData.totalHours}</span>
          </div>
        </div>
        <div className="progress-section">
          <h3>Progress Towards Required Hours</h3>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(
                  (studentData.totalHours /
                    (REQUIRED_HOURS[studentData.grade] || 25)) *
                    100,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="progress-labels">
            <span>{`${studentData.totalHours} / ${
              REQUIRED_HOURS[studentData.grade] || 25
            } hours`}</span>
            <span>{`${Math.round(
              (studentData.totalHours /
                (REQUIRED_HOURS[studentData.grade] || 25)) *
                100
            )}%`}</span>
          </div>
          <div className="progress-breakdown">
            <div className="progress-item">
              <span className="dot school"></span>
              <span>School: {studentData.schoolHours || 0} hours</span>
            </div>
            <div className="progress-item">
              <span className="dot community"></span>
              <span>Community: {studentData.communityHours || 0} hours</span>
            </div>
          </div>
        </div>
      </div>

      <div className="service-records">
        <h2>Service Records</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hours</th>
              <th>Type</th>
              <th>Description</th>
              <th>Verified By</th>
            </tr>
          </thead>
          <tbody>
            {serviceRecords.length > 0 ? (
              serviceRecords.map((record, index) => (
                <tr key={index}>
                  <td>
                    {new Date(record.date_completed).toLocaleDateString()}
                  </td>
                  <td>{record.hours}</td>
                  <td>{record.service_type}</td>
                  <td>{record.description}</td>
                  <td>{record.assigned_by}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-records">
                  No service records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentDashboard;
