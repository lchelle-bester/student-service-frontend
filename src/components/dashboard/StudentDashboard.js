import React, { useState, useEffect } from "react";
import "../../styles/Dashboard.css";

function StudentDashboard() {
  const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-f1ba5.up.railway.app';
  
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        console.log('Stored user data:', userData); // Add this

        if (!userData?.id) {
          setError("Please log in again");
          return;
        }

        const token = localStorage.getItem("authToken");
        console.log('Auth token:', token); // Add this

        const fullUrl = `${API_URL}/api/service/student-details/${userData.id}`;
        console.log('Making request to:', fullUrl); // Add this

        const response = await fetch(fullUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('Response status:', response.status); // Add this
        const data = await response.json();
        console.log('Response data:', data); // Add this

        if (response.ok) {
          setStudentData({
            name: userData.name,
            studentId: userData.id, // Changed from studentId to id
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
  }, [API_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const REQUIRED_HOURS = {
    8: 25,
    9: 25,
    10: 25,
    11: 25,
    12: 20
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
        <div className="info-grid">
          <div className="info-card">
            <label>Name:</label>
            <span>{studentData.name}</span>
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
        <div className="progress-bars">
            <div
                className="progress-bar school"
                style={{
                    width: `${(studentData.schoolHours / REQUIRED_HOURS[studentData.grade]) * 100}%`
                }}
            />
            <div
                className="progress-bar community"
                style={{
                    width: `${(studentData.communityHours / REQUIRED_HOURS[studentData.grade]) * 100}%`
                }}
            />
        </div>
    </div>
    <div className="progress-labels">
        <span>{`${studentData.totalHours} / ${REQUIRED_HOURS[studentData.grade]} hours`}</span>
        <span>{Math.round((studentData.totalHours / REQUIRED_HOURS[studentData.grade]) * 100)}%</span>
        <div className="progress-key">
        <div className="key-item">
            <span className="dot school"></span>
            <span>School</span>
        </div>
        <div className="key-item">
            <span className="dot community"></span>
            <span>Community</span>
        </div>
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