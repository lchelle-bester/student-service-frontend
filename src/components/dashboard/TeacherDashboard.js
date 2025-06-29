// src/components/dashboard/TeacherDashboard.js - Enhanced with field-level validation
import React, { useState, useEffect } from "react";
import StudentDetailsModal from "./StudentDetailsModal";
import "../../styles/TeacherDashboard.css";
import { useNavigate } from "react-router-dom";
import FloatingHelpButton from "../feedback/FloatingHelpButton";

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
  const [user, setUser] = useState(null);

  // NEW: Enhanced error tracking state for field-level validation
  const [fieldErrors, setFieldErrors] = useState({
    mainStudent: {
      studentFullName: null,
      numberOfHours: null,
      dateCompleted: null,
      description: null,
    },
    additionalStudents: [],
  });

  // NEW: Student not found error (similar to Organization form)
  const [studentNotFoundError, setStudentNotFoundError] = useState(false);

  // NEW: Success notification state (enhanced like Organization form)
  const [successNotification, setSuccessNotification] = useState({
    show: false,
    message: "",
    details: null,
  });

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://api.studentservicediary.co.za";
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
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser); // Add this line
      if (parsedUser.type !== "teacher") {
        navigate("/teacher-login");
        console.log("Teacher authenticated:", parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/teacher-login");
    }
  }, [navigate]);

  // NEW: Success notification functions
  const showSuccessNotification = (message, details = null) => {
    setSuccessNotification({
      show: true,
      message: message,
      details: details,
    });
  };

  const dismissSuccessNotification = () => {
    setSuccessNotification((prev) => ({ ...prev, show: false }));
  };

  // NEW: Enhanced single student validation with comprehensive error detection
  const validateSingleStudentWithFields = (student) => {
    const {
      studentFullName,
      numberOfHours,
      dateCompleted,
      description,
      studentNumber,
    } = student;
    let nameError = null;
    let hoursError = null;
    let dateError = null;
    let descriptionError = null;

    // Comprehensive name validation
    if (!studentFullName) {
      nameError = "Student full name is required";
    } else if (studentFullName.length < 3) {
      nameError = "Must be at least 3 characters";
    } else {
      const nameParts = studentFullName.split(/\s+/);
      if (nameParts.length < 2) {
        nameError = "Include both first and last name";
      } else {
        if (nameParts[0].length < 2) {
          nameError = "First name too short";
        } else if (nameParts[nameParts.length - 1].length < 2) {
          nameError = "Surname too short";
        } else {
          // Check for valid characters
          const namePattern =
            /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+$/;
          if (!namePattern.test(studentFullName)) {
            nameError = "Contains invalid characters";
          }
        }
      }
    }

    // Comprehensive hours validation
    if (!numberOfHours) {
      hoursError = "Hours are required";
    } else {
      const hoursNum = parseFloat(numberOfHours);
      if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 10) {
        hoursError = "Must be between 0.5 and 10";
      } else if ((hoursNum * 10) % 5 !== 0) {
        hoursError = "Must be in half hour increments";
      }
    }

    // Date validation
    if (!dateCompleted) {
      dateError = "Date is required";
    } else {
      const selectedDate = new Date(dateCompleted);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        dateError = "Date cannot be in the future";
      }
    }

    // Description validation
    if (!description) {
      descriptionError = "Description is required";
    } else if (description.trim().length < 8) {
      descriptionError = "Must be at least 8 characters";
    } else if (description.length > 200) {
      descriptionError = "Must be less than 200 characters";
    }

    return {
      nameError,
      hoursError,
      dateError,
      descriptionError,
    };
  };

  // NEW: Unified validation that handles ALL students through field-level tracking
  const validateAllStudentsWithFieldTracking = () => {
    const newFieldErrors = {
      mainStudent: {
        studentFullName: null,
        numberOfHours: null,
        dateCompleted: null,
        description: null,
      },
      additionalStudents: [],
    };

    let hasAnyErrors = false;

    // Validate main student
    const mainStudentErrors = validateSingleStudentWithFields({
      studentFullName: serviceForm.studentFullName.trim(),
      numberOfHours: serviceForm.numberOfHours,
      dateCompleted: serviceForm.dateCompleted,
      description: serviceForm.description.trim(),
      studentNumber: 1,
    });

    newFieldErrors.mainStudent.studentFullName = mainStudentErrors.nameError;
    newFieldErrors.mainStudent.numberOfHours = mainStudentErrors.hoursError;
    newFieldErrors.mainStudent.dateCompleted = mainStudentErrors.dateError;
    newFieldErrors.mainStudent.description = mainStudentErrors.descriptionError;

    if (
      mainStudentErrors.nameError ||
      mainStudentErrors.hoursError ||
      mainStudentErrors.dateError ||
      mainStudentErrors.descriptionError
    ) {
      hasAnyErrors = true;
    }

    // Validate ALL additional students through the same system
    additionalStudents.forEach((student, index) => {
      const studentErrors = validateSingleStudentWithFields({
        studentFullName: student.fullName.trim(),
        numberOfHours: student.hours,
        dateCompleted: serviceForm.dateCompleted, // shared date
        description: serviceForm.description.trim(), // shared description
        studentNumber: index + 2,
      });

      newFieldErrors.additionalStudents[index] = {
        fullName: studentErrors.nameError,
        hours: studentErrors.hoursError,
      };

      if (studentErrors.nameError || studentErrors.hoursError) {
        hasAnyErrors = true;
      }
    });

    // Update field error state
    setFieldErrors(newFieldErrors);

    return hasAnyErrors;
  };

  // NEW: Helper functions for error state checking
  const hasFieldError = (studentType, studentIndex, fieldName) => {
    if (studentType === "main") {
      return fieldErrors.mainStudent[fieldName] !== null;
    } else {
      return (
        fieldErrors.additionalStudents[studentIndex] &&
        fieldErrors.additionalStudents[studentIndex][fieldName] !== null
      );
    }
  };

  const getFieldError = (studentType, studentIndex, fieldName) => {
    if (studentType === "main") {
      return fieldErrors.mainStudent[fieldName];
    } else {
      return fieldErrors.additionalStudents[studentIndex]
        ? fieldErrors.additionalStudents[studentIndex][fieldName]
        : null;
    }
  };

  const studentSectionHasErrors = (studentType, studentIndex) => {
    if (studentType === "main") {
      return (
        hasFieldError("main", 0, "studentFullName") ||
        hasFieldError("main", 0, "numberOfHours") ||
        hasFieldError("main", 0, "dateCompleted") ||
        hasFieldError("main", 0, "description")
      );
    } else {
      return (
        hasFieldError("additional", studentIndex, "fullName") ||
        hasFieldError("additional", studentIndex, "hours")
      );
    }
  };

  // Enhanced form change handler with intelligent error clearing
  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;

    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear student not found error when name changes
    if (name === "studentFullName" && studentNotFoundError) {
      setStudentNotFoundError(false);
    }

    // Clear field-specific errors when user starts typing
    if (hasFieldError("main", 0, name)) {
      setFieldErrors((prev) => ({
        ...prev,
        mainStudent: { ...prev.mainStudent, [name]: null },
      }));
    }

    // Clear general error
    if (error) {
      setError("");
    }
  };

  // Enhanced additional student change handler
  const handleAdditionalStudentChange = (index, field, value) => {
    setAdditionalStudents((prev) =>
      prev.map((student, i) =>
        i === index ? { ...student, [field]: value } : student
      )
    );

    // Clear field-specific error when user starts typing
    if (hasFieldError("additional", index, field)) {
      setFieldErrors((prev) => {
        const newAdditionalErrors = [...prev.additionalStudents];
        if (newAdditionalErrors[index]) {
          newAdditionalErrors[index] = {
            ...newAdditionalErrors[index],
            [field]: null,
          };
        }
        return {
          ...prev,
          additionalStudents: newAdditionalErrors,
        };
      });
    }
  };

  const addStudent = () => {
    if (additionalStudents.length < 49) {
      // 49 + 1 main = 50 max
      setAdditionalStudents((prev) => [
        ...prev,
        {
          fullName: "",
          hours: "",
        },
      ]);
    }
  };

  const removeStudent = (index) => {
    setAdditionalStudents((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => ({
      ...prev,
      additionalStudents: prev.additionalStudents.filter((_, i) => i !== index),
    }));
  };

  // STREAMLINED: Submit handler with unified validation
  const handleSubmitService = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResults(null);
    setStudentNotFoundError(false);

    try {
      const hasAdditionalStudents = additionalStudents.length > 0;

      if (hasAdditionalStudents) {
        // UNIFIED VALIDATION: Use only our field-level error system
        const hasValidationErrors = validateAllStudentsWithFieldTracking();

        if (hasValidationErrors) {
          // Scroll to first error field for better UX
          const firstErrorField = document.querySelector(".field-error");
          if (firstErrorField) {
            firstErrorField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setTimeout(() => firstErrorField.focus(), 300);
          }
          return; // Stop submission if any errors exist
        }

        // Clear all field errors since validation passed
        setFieldErrors({
          mainStudent: {
            studentFullName: null,
            numberOfHours: null,
            dateCompleted: null,
            description: null,
          },
          additionalStudents: [],
        });

        // Batch submission logic
        const allStudents = [
          {
            firstName: serviceForm.studentFullName.trim().split(/\s+/)[0],
            surname: serviceForm.studentFullName
              .trim()
              .split(/\s+/)
              .slice(1)
              .join(" "),
            hours: serviceForm.numberOfHours,
          },
          ...additionalStudents.map((student) => ({
            firstName: student.fullName.trim().split(/\s+/)[0],
            surname: student.fullName.trim().split(/\s+/).slice(1).join(" "),
            hours: student.hours,
          })),
        ];

        const response = await fetch(`${API_URL}/api/service/batch-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          },
          body: JSON.stringify({
            students: allStudents,
            dateCompleted: serviceForm.dateCompleted,
            description: serviceForm.description,
          }),
        });

        const data = await response.json();

        //in-line-error

        if (response.ok && data.success) {
          if (data.errorCount === 0) {
            showSuccessNotification(
              `You've successfully logged hours for ${data.successCount} student(s)!`,
              {
                type: "batch",
                count: data.successCount,
                students: allStudents.map((s) => `${s.firstName} ${s.surname}`),
              }
            );

            // Reset form
            setServiceForm({
              studentFullName: "",
              numberOfHours: "",
              dateCompleted: "",
              description: "",
            });
            setAdditionalStudents([]);
            setFieldErrors({
              mainStudent: {
                studentFullName: null,
                numberOfHours: null,
                dateCompleted: null,
                description: null,
              },
              additionalStudents: [],
            });
          } else {
            const newFieldErrors = {
              mainStudent: {
                studentFullName: null,
                numberOfHours: null,
                dateCompleted: null,
                description: null,
              },
              additionalStudents: additionalStudents.map(() => ({
                fullName: null,
                hours: null,
              })),
            };

            // Parse each error and assign to the correct student
            data.errors.forEach((errorMessage) => {
              // Extract student number from error message like "Student 1: Jarryd Bra not found in database"
              const studentMatch = errorMessage.match(/Student (\d+):\s*(.+)/);
              if (studentMatch) {
                const studentNumber = parseInt(studentMatch[1]);
                const errorText = studentMatch[2];

                if (studentNumber === 1) {
                  // Main student error
                  if (errorText.includes("not found in database")) {
                    newFieldErrors.mainStudent.studentFullName =
                      "Student not found. Please check the spelling and try again.";
                  } else if (errorText.includes("Hours must be")) {
                    newFieldErrors.mainStudent.numberOfHours = errorText;
                  }
                } else if (studentNumber > 1) {
                  // Additional student error
                  const additionalIndex = studentNumber - 2; // Convert to 0-based index
                  if (
                    additionalIndex >= 0 &&
                    additionalIndex < newFieldErrors.additionalStudents.length
                  ) {
                    if (errorText.includes("not found in database")) {
                      newFieldErrors.additionalStudents[
                        additionalIndex
                      ].fullName =
                        "Student not found. Please check the spelling and try again.";
                    } else if (errorText.includes("Hours must be")) {
                      newFieldErrors.additionalStudents[additionalIndex].hours =
                        errorText;
                    }
                  }
                }
              }
            });

            // Set the field errors
            setFieldErrors(newFieldErrors);

            // Clear the general error since we're showing field-specific errors
            setError("");
          }
        } else {
          if (response.status === 404 && data.message === "Student not found") {
            setStudentNotFoundError(true);
          } else {
            setError(data.message || "Failed to log hours");
          }
        }
      } else {
        // Individual submission - validate main student only
        const mainStudentErrors = validateSingleStudentWithFields({
          studentFullName: serviceForm.studentFullName.trim(),
          numberOfHours: serviceForm.numberOfHours,
          dateCompleted: serviceForm.dateCompleted,
          description: serviceForm.description.trim(),
          studentNumber: 1,
        });

        const newFieldErrors = {
          mainStudent: {
            studentFullName: mainStudentErrors.nameError,
            numberOfHours: mainStudentErrors.hoursError,
            dateCompleted: mainStudentErrors.dateError,
            description: mainStudentErrors.descriptionError,
          },
          additionalStudents: [],
        };

        setFieldErrors(newFieldErrors);

        if (
          mainStudentErrors.nameError ||
          mainStudentErrors.hoursError ||
          mainStudentErrors.dateError ||
          mainStudentErrors.descriptionError
        ) {
          const firstErrorField = document.querySelector(".field-error");
          if (firstErrorField) {
            firstErrorField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setTimeout(() => firstErrorField.focus(), 300);
          }
          return;
        }

        // Use original individual endpoint
        const fullName = serviceForm.studentFullName.trim();

        const response = await fetch(`${API_URL}/api/service/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
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
          showSuccessNotification(
            "You've successfully logged hours for 1 student!",
            {
              type: "individual",
              students: [serviceForm.studentFullName],
              hours: parseFloat(serviceForm.numberOfHours),
            }
          );
          setServiceForm({
            studentFullName: "",
            numberOfHours: "",
            dateCompleted: "",
            description: "",
          });
          setFieldErrors({
            mainStudent: {
              studentFullName: null,
              numberOfHours: null,
              dateCompleted: null,
              description: null,
            },
            additionalStudents: [],
          });
        } else {
          if (response.status === 404 && data.message === "Student not found") {
            setStudentNotFoundError(true);
          } else {
            setError(data.message || "Failed to log service hours");
          }
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
             {/* Left section: Search Students (UNCHANGED) */}
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
                  <p>Total Hours: {student.total_hours}</p>
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



        {/* Right section: Enhanced with field-level validation */}
        <section className="log-hours-section">
          <h2>Log School Service Hours</h2>

          {/* Enhanced Success Notification */}
          {successNotification.show && (
            <div className="success-notification-celebration">
              <div className="celebration-content">
                {/* Animated confetti */}
                <div className="confetti confetti-1"></div>
                <div className="confetti confetti-2"></div>
                <div className="confetti confetti-3"></div>
                <div className="confetti confetti-4"></div>
                <div className="confetti confetti-5"></div>
                <div className="confetti confetti-6"></div>

                {/* Close button */}
                <button
                  type="button"
                  className="celebration-close"
                  onClick={dismissSuccessNotification}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>

                {/* Success icon with animation */}
                <div className="celebration-icon">
                  <svg
                    width="32"
                    height="32"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Title */}
                <h4 className="celebration-title">Awesome Work!</h4>

                {/* Custom message */}
                <p className="celebration-message">
                  {successNotification.message}
                </p>

                {/* Student names display */}
                {successNotification.details &&
                  successNotification.details.students && (
                    <div className="celebration-students">
                      {successNotification.details.students.map(
                        (name, index) => (
                          <span
                            key={index}
                            className="celebration-student-name"
                          >
                            {name}
                          </span>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmitService} className="service-form">
            {/* Enhanced form fields with field-level validation */}
            <div
              className={`student-section ${
                studentSectionHasErrors("main", 0) ? "has-errors" : "valid"
              }`}
            >
              <div className="form-group">
                <label htmlFor="studentFullName">Student Full Name:</label>
                <input
                  type="text"
                  id="studentFullName"
                  name="studentFullName"
                  value={serviceForm.studentFullName}
                  onChange={handleServiceFormChange}
                  placeholder="e.g. Leah Bester"
                  className={`${studentNotFoundError ? "error" : ""} ${
                    hasFieldError("main", 0, "studentFullName")
                      ? "field-error"
                      : ""
                  }`}
                  required
                />

                {hasFieldError("main", 0, "studentFullName") && (
                  <div className="field-error-message">
                    <div className="field-error-icon">
                      <svg
                        width="10"
                        height="10"
                        fill="white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>{getFieldError("main", 0, "studentFullName")}</span>
                  </div>
                )}

                {studentNotFoundError && (
                  <div className="student-not-found-error">
                    <div className="student-not-found-icon">
                      <svg
                        width="12"
                        height="12"
                        fill="white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="student-not-found-error-text">
                      No student found with this name. Please check the spelling
                      and try again.
                    </span>
                  </div>
                )}
              </div>

              <div className="form-row">
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
                    className={
                      hasFieldError("main", 0, "numberOfHours")
                        ? "field-error"
                        : ""
                    }
                    required
                  />

                  {hasFieldError("main", 0, "numberOfHours") && (
                    <div className="field-error-message">
                      <div className="field-error-icon">
                        <svg
                          width="10"
                          height="10"
                          fill="white"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span>{getFieldError("main", 0, "numberOfHours")}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dateCompleted">Date Completed:</label>
                  <input
                    type="date"
                    id="dateCompleted"
                    name="dateCompleted"
                    value={serviceForm.dateCompleted}
                    onChange={handleServiceFormChange}
                    className={
                      hasFieldError("main", 0, "dateCompleted")
                        ? "field-error"
                        : ""
                    }
                    required
                  />

                  {hasFieldError("main", 0, "dateCompleted") && (
                    <div className="field-error-message">
                      <div className="field-error-icon">
                        <svg
                          width="10"
                          height="10"
                          fill="white"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span>{getFieldError("main", 0, "dateCompleted")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={serviceForm.description}
                  onChange={handleServiceFormChange}
                  rows="4"
                  minLength="8"
                  maxLength="200"
                  placeholder="Describe the service activity completed (8-200 characters)"
                  className={
                    hasFieldError("main", 0, "description") ? "field-error" : ""
                  }
                  required
                />

                {hasFieldError("main", 0, "description") && (
                  <div className="field-error-message">
                    <div className="field-error-icon">
                      <svg
                        width="10"
                        height="10"
                        fill="white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>{getFieldError("main", 0, "description")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced additional students section with validation */}
            {additionalStudents.length > 0 && (
              <>
                <h4 className="additional-students-heading">
                  Batch Logging For ({additionalStudents.length}) Students
                </h4>

                {additionalStudents.map((student, index) => (
                  <div
                    key={index}
                    className={`student-section additional-student ${
                      studentSectionHasErrors("additional", index)
                        ? "has-errors"
                        : "valid"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => removeStudent(index)}
                      className="remove-student-button"
                      title={`Remove additional student ${index + 1}`}
                    >
                      ×
                    </button>

                    <div className="additional-student-fields">
                      <div className="form-group">
                        <label>Full Name:</label>
                        <input
                          type="text"
                          value={student.fullName}
                          onChange={(e) =>
                            handleAdditionalStudentChange(
                              index,
                              "fullName",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Mackenzie Comrie"
                          className={
                            hasFieldError("additional", index, "fullName")
                              ? "field-error"
                              : ""
                          }
                          required
                        />

                        {hasFieldError("additional", index, "fullName") && (
                          <div className="field-error-message">
                            <div className="field-error-icon">
                              <svg
                                width="10"
                                height="10"
                                fill="white"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span>
                              {getFieldError("additional", index, "fullName")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Hours:</label>
                        <input
                          type="number"
                          value={student.hours}
                          onChange={(e) =>
                            handleAdditionalStudentChange(
                              index,
                              "hours",
                              e.target.value
                            )
                          }
                          min="0.5"
                          max="10"
                          step="0.5"
                          className={
                            hasFieldError("additional", index, "hours")
                              ? "field-error"
                              : ""
                          }
                          required
                        />

                        {hasFieldError("additional", index, "hours") && (
                          <div className="field-error-message">
                            <div className="field-error-icon">
                              <svg
                                width="10"
                                height="10"
                                fill="white"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span>
                              {getFieldError("additional", index, "hours")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add student button */}
            {additionalStudents.length < 49 && (
              <div className="add-student-section">
                <button
                  type="button"
                  onClick={addStudent}
                  className="add-student-button"
                >
                  + Log this service activity for another student
                </button>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : totalStudents > 1
                ? `Submit Hours for ${totalStudents} Students`
                : "Submit Hours"}
            </button>
          </form>

          {/* Results display (keep existing) */}
          {results && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
                border: "1px solid #e9ecef",
              }}
            >
              <h4>Results:</h4>
              <div style={{ color: "#28a745" }}>
                ✓ {results.successCount} successful
              </div>
              {results.errorCount > 0 && (
                <div style={{ color: "#dc3545" }}>
                  ✗ {results.errorCount} errors
                </div>
              )}
            </div>
          )}
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
      <FloatingHelpButton userInfo={user} />
    </div>
  );
}

export default TeacherDashboard;
