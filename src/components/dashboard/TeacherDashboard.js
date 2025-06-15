// src/components/dashboard/TeacherDashboard.js - FIXED to keep original look
import React, { useState, useEffect } from "react";
import StudentDetailsModal from "./StudentDetailsModal";
import "../../styles/TeacherDashboard.css";
import { useNavigate } from "react-router-dom";

function TeacherDashboard() {
  // Keep original form structure but enhanced for multiple students
  const [serviceForm, setServiceForm] = useState({
    studentFullName: "",
    numberOfHours: "",
    dateCompleted: "",
    description: "",
  });
  
  // Additional students (hidden from UI when only 1 student)
  const [additionalStudents, setAdditionalStudents] = useState([]);
  
  // Existing state (unchanged)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [results, setResults] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "https://student-service-backend.onrender.com";
  const navigate = useNavigate();
  const TOKEN_KEY = "authToken";

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

  // Keep original form change handler
  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for additional students
  const handleAdditionalStudentChange = (index, field, value) => {
    setAdditionalStudents(prev => 
      prev.map((student, i) => 
        i === index ? { ...student, [field]: value } : student
      )
    );
  };

  const addStudent = () => {
    if (additionalStudents.length < 49) { // 49 + 1 main = 50 max
      setAdditionalStudents(prev => [...prev, { 
        fullName: "", 
        hours: "" 
      }]);
    }
  };

  const removeStudent = (index) => {
    setAdditionalStudents(prev => prev.filter((_, i) => i !== index));
  };

  // Enhanced validation (keeps original logic)
  const validateForm = () => {
    const errors = [];

    // Original validation for main student
    if (!serviceForm.studentFullName.trim())
      errors.push("Student full name is required\n");
    if (!serviceForm.numberOfHours) errors.push("Number of hours is required\n");
    if (!serviceForm.dateCompleted) errors.push("Date is required\n");
    if (!serviceForm.description.trim()) errors.push("Description is required\n");

    // Validate full name (should contain at least first and last name)
    const nameParts = serviceForm.studentFullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      errors.push("Full name must include both first & last name (e.g. John Smith)\n");
    }
    if (serviceForm.studentFullName.trim().length < 3) {
      errors.push("Full name must be at least 3 characters\n");
    }
    // Check for valid characters (letters, spaces, accented characters, hyphens, apostrophes, periods)
    const namePattern = /^[a-zA-ZäéêëÉÊË\s'.-]+$/;
    if (!namePattern.test(serviceForm.studentFullName.trim())) {
      errors.push("Name contains invalid characters\n");
    }

    // Validate date
    const selectedDate = new Date(serviceForm.dateCompleted);
    const today = new Date() +1;
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      errors.push("Date cannot be in the future\n");
    }

    // Validate hours for main student
    const hours = parseFloat(serviceForm.numberOfHours);
    if (isNaN(hours) || hours < 0.5 || hours > 10) {
      errors.push("Hours must be between 0.5 - 10\n");
    }

    if (serviceForm.description.trim().length < 8) {
      errors.push("Description must be at least 8 characters\n");
    }

    // Additional validation for batch students
    additionalStudents.forEach((student, index) => {
      if (!student.fullName.trim() || !student.hours) {
        errors.push(`Additional student ${index + 1} has missing information\n`);
      }
      
      if (student.fullName.trim()) {
        const nameParts = student.fullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
          errors.push(`Additional student ${index + 1}: Full name must include both first & last name (e.g. John Smith)\n`);
        }
        if (student.fullName.trim().length < 3) {
          errors.push(`Additional student ${index + 1}: Full name must be at least 3 characters\n`);
        }
        // Check for valid characters
        const namePattern = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+$/;
        if (!namePattern.test(student.fullName.trim())) {
          errors.push(`Additional student ${index + 1}: Name contains invalid characters\n`);
        }
      }
      
      if (student.hours) {
        const studentHours = parseFloat(student.hours);
        if (isNaN(studentHours) || studentHours < 0.5 || studentHours > 10) {
          errors.push(`Additional student ${index + 1}: Hours must be between 0.5 - 10\n`);
        }
      }
    });

    return errors;
  };

  // Enhanced submit handler
  const handleSubmitService = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResults(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(""));
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const hasAdditionalStudents = additionalStudents.length > 0;

      if (hasAdditionalStudents) {
        // Use batch endpoint
        const allStudents = [
          {
            firstName: serviceForm.studentFullName.trim().split(/\s+/)[0],
            surname: serviceForm.studentFullName.trim().split(/\s+/).slice(1).join(' '),
            hours: serviceForm.numberOfHours
          },
          ...additionalStudents.map(student => ({
            firstName: student.fullName.trim().split(/\s+/)[0],
            surname: student.fullName.trim().split(/\s+/).slice(1).join(' '),
            hours: student.hours
          }))
        ];

        const response = await fetch(`${API_URL}/api/service/batch-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            students: allStudents,
            dateCompleted: serviceForm.dateCompleted,
            description: serviceForm.description
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccess(`Successfully logged hours for ${data.successCount} student(s)!`);
          setResults(data);

          // Reset form
          setServiceForm({
            studentFullName: "",
            numberOfHours: "",
            dateCompleted: "",
            description: "",
          });
          setAdditionalStudents([]);

          if (data.errors && data.errors.length > 0) {
            setError(`Some errors occurred:\n${data.errors.join('\n')}`);
          }
        } else {
          setError(data.message || 'Failed to log hours');
        }
      } else {
        // Use original individual endpoint
        const fullName = serviceForm.studentFullName.trim();

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
          setSuccess("Service hours logged successfully!");
          setServiceForm({
            studentFullName: "",
            numberOfHours: "",
            dateCompleted: "",
            description: "",
          });
        } else {
          setError(data.message || "Failed to log service hours");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to submit service hours");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Existing search functions (unchanged)
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

  const totalStudents = 1 + additionalStudents.length;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        {/* Left section: EXACTLY same layout as original */}
        <section className="log-hours-section">
          <h2>Log School Service Hours</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message" style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>{success}</div>}
          
          <form onSubmit={handleSubmitService} className="service-form">
            {/* EXACT same form fields as original */}
            <div className="form-group">
              <label htmlFor="studentFullName">Student Full Name:</label>
              <input
                type="text"
                id="studentFullName"
                name="studentFullName"
                value={serviceForm.studentFullName}
                onChange={handleServiceFormChange}
                placeholder="e.g. John Smith"
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
                min="0.5"
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

            {/* Additional students section - only shows when students are added */}
            {additionalStudents.length > 0 && (
              <div style={{ 
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
                  Additional Students ({additionalStudents.length})
                </h3>
                
                {additionalStudents.map((student, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 40px',
                    gap: '10px',
                    alignItems: 'end',
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '14px' }}>Full Name:</label>
                      <input
                        type="text"
                        value={student.fullName}
                        onChange={(e) => handleAdditionalStudentChange(index, 'fullName', e.target.value)}
                        placeholder="e.g. Zoë Van De Merwe"
                        required
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '14px' }}>Hours:</label>
                      <input
                        type="number"
                        value={student.hours}
                        onChange={(e) => handleAdditionalStudentChange(index, 'hours', e.target.value)}
                        min="0.5"
                        max="10"
                        step="0.5"
                        required
                        style={{ padding: '8px', textAlign: 'center' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStudent(index)}
                      style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '16px',
                        alignSelf: 'end'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add student button - clean and simple */}
            {additionalStudents.length < 49 && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button
                  type="button"
                  onClick={addStudent}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Add Another Student
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 
               totalStudents > 1 ? `Submit Hours for ${totalStudents} Students` : 'Submit Hours'}
            </button>
          </form>

          {/* Results display */}
          {results && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <h4>Results:</h4>
              <div style={{ color: '#28a745' }}>✓ {results.successCount} successful</div>
              {results.errorCount > 0 && (
                <div style={{ color: '#dc3545' }}>✗ {results.errorCount} errors</div>
              )}
            </div>
          )}
        </section>

        {/* Right section: Search Students (UNCHANGED) */}
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
                  <p>Total Hours: {student.total_hours / 2.0}</p>
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