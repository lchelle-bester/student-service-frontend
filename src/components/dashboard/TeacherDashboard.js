import React, { useState, useEffect } from "react";
import StudentDetailsModal from "./StudentDetailsModal";
import "../../styles/TeacherDashboard.css";
import { useNavigate } from "react-router-dom";

function TeacherDashboard() {
  const [serviceForm, setServiceForm] = useState({
    studentFirstName: "",
    studentSurname: "",
    numberOfHours: "",
    dateCompleted: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);

  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://student-service-backend.onrender.com";
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (!token || !userData) {
      navigate("/teacher-login"); 
      return;
    }
    try {
      const user = JSON.parse(userData);
      if (user.type !== "teacher") {
        navigate("/teacher-login"); 
        console.log("Teacher authenticated:", user);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/teacher-login"); 
    }
  }, [navigate]);

  const TOKEN_KEY = "authToken";

  const validateForm = () => {
    const errors = [];

    // Check for empty fields
    if (!serviceForm.studentFirstName.trim())
      errors.push("Student first name is required\n");
    if (!serviceForm.studentSurname.trim())
      errors.push("Student surname is required\n");
    if (!serviceForm.numberOfHours) errors.push("Number of hours is required\n");
    if (!serviceForm.dateCompleted) errors.push("Date is required\n");
    if (!serviceForm.description.trim()) errors.push("Description is required\n");

    // Validate date
    const selectedDate = new Date(serviceForm.dateCompleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      errors.push("Service date cannot be in the future\n");
    }

    // Validate hours
    const hours = parseInt(serviceForm.numberOfHours);
    if (isNaN(hours) || hours <= 0.5 || hours > 10) {
      errors.push("Hours must be between 0.5 and 10\n");
    }

    if(serviceForm.description.trim().length < 8){
      errors.push("Description must be at least 8 characters long\n");
    }

      // Check field lengths
  if (serviceForm.studentFirstName.trim().length <= 1)
    errors.push("First name must be longer than 1 character\n");
  if (serviceForm.studentSurname.trim().length <= 1)
    errors.push("Surname must be longer than 1 character\n");

    return errors;
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);

    const fullName = `${serviceForm.studentFirstName.trim()} ${serviceForm.studentSurname.trim()}`;
    try {
      console.log("Token:", token);
      const response = await fetch(`${API_URL}/api/service/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentName: fullName,
          numberOfHours: parseFloat(serviceForm.numberOfHours),
          dateCompleted: serviceForm.dateCompleted,
          description: serviceForm.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Service hours logged successfully!");
        setServiceForm({
          studentSurname: "",
          studentFirstName: "",
          numberOfHours: "",
          dateCompleted: "",
          description: "",
        });
      } else {
        alert(data.message || "Failed to log service hours");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit service hours");
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(
        `${API_URL}/api/service/search-students?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data);
        setError("");
      } else {
        setError("Failed to fetch students");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Error searching for students");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(
        `${API_URL}/api/service/student-details/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setStudentDetails(data);
        setSelectedStudent(data.student);
      } else {
        console.error("Failed to fetch student details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/";
  };

  //handleSubmitHours
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        {/* Left section: Log Service Hours */}
        <section className="log-hours-section">
          <h2>Log School Service Hours</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmitService} className="service-form">
          <div className="form-group">
  <label htmlFor="studentFirstName">Student First Name:</label>
  <input
    type="text"
    id="studentFirstName"
    name="studentFirstName"
    value={serviceForm.studentFirstName}
    onChange={handleServiceFormChange}
    required
  />
</div>

<div className="form-group">
  <label htmlFor="studentSurname">Student Surname:</label>
  <input
    type="text"
    id="studentSurname"
    name="studentSurname"
    value={serviceForm.studentSurname}
    onChange={handleServiceFormChange}
    required
  />
</div>

            <div className="form-group">
              <label htmlFor="numberOfHours">Number of Hours:</label>
              <input
                type="number"
                id="numberOfHours"
                name="numberOfHours"
                value={serviceForm.numberOfHours}
                onChange={handleServiceFormChange}
                min="1"
                max="10"
                step="0.5"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateCompleted">Date Completed:</label>
              <input
                type="date"
                id="dateCompleted"
                name="dateCompleted"
                value={serviceForm.dateCompleted}
                onChange={handleServiceFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={serviceForm.description}
                onChange={handleServiceFormChange}
                rows="4"
                required
              />
            </div>

            <button type="submit" className="submit-button">
              Submit Hours
            </button>
          </form>
        </section>
        {/* Right section: Search Students */}
        <section className="search-section">
          <h2>Search For Students</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          {isLoading && <div className="loading">Searching...</div>}

          <div className="search-results">
            {searchResults.map((student) => (
              <div key={student.id} className="student-card">
                <div className="student-info">
                  <h3>{student.full_name}</h3>
                  <p>Grade: {student.grade}</p>
                  <p>Total Hours: {student.total_hours/2.0}</p>
                </div>
                <button
                  className="view-details-button"
                  onClick={() => fetchStudentDetails(student.id)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedStudent && studentDetails && (
        <StudentDetailsModal
          student={selectedStudent}
          serviceRecords={studentDetails.serviceRecords}
          onClose={() => {
            setSelectedStudent(null);
            setStudentDetails(null);
          }}
        />
      )}
    </div>
  );
}

export default TeacherDashboard;
