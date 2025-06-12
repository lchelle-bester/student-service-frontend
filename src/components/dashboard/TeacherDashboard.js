// src/components/dashboard/TeacherDashboard.js - Updated to integrate with existing system
import React, { useState, useEffect } from "react";
import StudentDetailsModal from "./StudentDetailsModal";
import "../../styles/TeacherDashboard.css";
import { useNavigate } from "react-router-dom";

function TeacherDashboard() {
  // Enhanced form state to support multiple students
  const [serviceForm, setServiceForm] = useState({
    dateCompleted: "",
    description: "",
    students: [{ firstName: "", surname: "", hours: "" }]
  });
  
  // Existing state
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

  // Updated form change handlers
  const handleCommonFieldChange = (e) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentChange = (index, field, value) => {
    setServiceForm(prev => ({
      ...prev,
      students: prev.students.map((student, i) => 
        i === index ? { ...student, [field]: value } : student
      )
    }));
  };

  const addStudent = () => {
    if (serviceForm.students.length < 50) {
      setServiceForm(prev => ({
        ...prev,
        students: [...prev.students, { firstName: "", surname: "", hours: "" }]
      }));
    }
  };

  const removeStudent = (index) => {
    if (serviceForm.students.length > 1) {
      setServiceForm(prev => ({
        ...prev,
        students: prev.students.filter((_, i) => i !== index)
      }));
    }
  };

  // Enhanced validation
  const validateForm = () => {
    const errors = [];

    if (!serviceForm.dateCompleted) {
      errors.push("Date completed is required");
    }

    // Validate date
    const selectedDate = new Date(serviceForm.dateCompleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      errors.push("Service date cannot be in the future");
    }

    if (!serviceForm.description || serviceForm.description.length < 8) {
      errors.push("Description must be at least 8 characters long");
    }

    if (serviceForm.description && serviceForm.description.length > 200) {
      errors.push("Description must be less than 200 characters");
    }

    // Check for empty students
    const emptyStudents = serviceForm.students.filter(student => 
      !student.firstName.trim() || !student.surname.trim() || !student.hours
    );

    if (emptyStudents.length > 0) {
      errors.push(`${emptyStudents.length} student(s) have missing information`);
    }

    // Validate each student's hours
    serviceForm.students.forEach((student, index) => {
      if (student.hours) {
        const hours = parseFloat(student.hours);
        if (isNaN(hours) || hours < 0.5 || hours > 10) {
          errors.push(`Student ${index + 1}: Hours must be between 0.5 and 10`);
        }
        if ((hours * 10) % 5 !== 0) {
          errors.push(`Student ${index + 1}: Hours must be in half hour increments`);
        }
      }
      
      if (student.firstName && student.firstName.trim().length <= 1) {
        errors.push(`Student ${index + 1}: First name must be longer than 1 character`);
      }
      
      if (student.surname && student.surname.trim().length <= 1) {
        errors.push(`Student ${index + 1}: Surname must be longer than 1 character`);
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
      setError(validationErrors.join("\n"));
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const isBatch = serviceForm.students.length > 1;

      if (isBatch) {
        // Use batch endpoint
        const response = await fetch(`${API_URL}/api/service/batch-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            students: serviceForm.students,
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
            dateCompleted: "",
            description: "",
            students: [{ firstName: "", surname: "", hours: "" }]
          });

          if (data.errors && data.errors.length > 0) {
            setError(`Some errors occurred:\n${data.errors.join('\n')}`);
          }
        } else {
          setError(data.message || 'Failed to log hours');
          if (data.errors) {
            setError(prev => prev + '\n' + data.errors.join('\n'));
          }
        }
      } else {
        // Use existing individual endpoint
        const student = serviceForm.students[0];
        const fullName = `${student.firstName.trim()} ${student.surname.trim()}`;

        const response = await fetch(`${API_URL}/api/service/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentName: fullName,
            numberOfHours: parseFloat(student.hours),
            dateCompleted: serviceForm.dateCompleted,
            description: serviceForm.description,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess("Service hours logged successfully!");
          setServiceForm({
            dateCompleted: "",
            description: "",
            students: [{ firstName: "", surname: "", hours: "" }]
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

  const isMultipleStudents = serviceForm.students.length > 1;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        {/* Left section: Enhanced Log Service Hours */}
        <section className="log-hours-section">
          <h2>Log School Service Hours</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmitService} className="service-form">
            {/* Common fields */}
            <div className="common-fields">
              <div className="form-group">
                <label htmlFor="dateCompleted">Date Completed:</label>
                <input
                  type="date"
                  id="dateCompleted"
                  name="dateCompleted"
                  value={serviceForm.dateCompleted}
                  onChange={handleCommonFieldChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Activity Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={serviceForm.description}
                  onChange={handleCommonFieldChange}
                  rows="3"
                  placeholder="Describe the service activity (8-200 characters)"
                  required
                />
                <small className="char-count">
                  {serviceForm.description.length}/200 characters
                </small>
              </div>
            </div>
            
            {/* Students section */}
            <div className="students-section">
              <h3>
                {isMultipleStudents ? `Students (${serviceForm.students.length})` : 'Student'}
              </h3>
              
              <div className="students-list">
                {serviceForm.students.map((student, index) => (
                  <div key={index} className="student-row">
                    {isMultipleStudents && (
                      <div className="student-number">#{index + 1}</div>
                    )}
                    
                    <div className="form-group">
                      <label>First Name:</label>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={student.firstName}
                        onChange={(e) => handleStudentChange(index, 'firstName', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Surname:</label>
                      <input
                        type="text"
                        placeholder="Surname"
                        value={student.surname}
                        onChange={(e) => handleStudentChange(index, 'surname', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Hours:</label>
                      <input
                        type="number"
                        placeholder="Hours"
                        value={student.hours}
                        onChange={(e) => handleStudentChange(index, 'hours', e.target.value)}
                        min="0.5"
                        max="10"
                        step="0.5"
                        required
                      />
                    </div>
                    
                    {serviceForm.students.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudent(index)}
                        className="remove-student-btn"
                        title="Remove student"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add student button */}
                <div className="add-student-section">
                  <button 
                    type="button" 
                    onClick={addStudent} 
                    className="add-student-btn"
                    disabled={serviceForm.students.length >= 50}
                  >
                    + Add Another Student
                    {serviceForm.students.length >= 45 && (
                      <span className="limit-warning">
                        ({50 - serviceForm.students.length} remaining)
                      </span>
                    )}
                  </button>
                  {serviceForm.students.length >= 50 && (
                    <p className="limit-message">Maximum of 50 students reached</p>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging Hours...' : 
               isMultipleStudents ? `Log Hours for ${serviceForm.students.length} Students` : 'Submit Hours'}
            </button>
          </form>
          
          {/* Results display */}
          {results && (
            <div className="results-section">
              <h3>Results</h3>
              <div className="results-summary">
                <div className="success-count">✓ {results.successCount} successful</div>
                {results.errorCount > 0 && (
                  <div className="error-count">✗ {results.errorCount} errors</div>
                )}
              </div>
              
              {results.results && results.results.length > 0 && (
                <div className="successful-logs">
                  <h4>Successfully Logged:</h4>
                  <ul>
                    {results.results.map((result, index) => (
                      <li key={index}>
                        {result.studentName} - {result.hours} hours
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right section: Search Students (unchanged) */}
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