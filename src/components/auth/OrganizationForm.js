// src/components/auth/OrganizationForm.js - Fixed version with unified validation
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css";
import FloatingHelpButton from "../feedback/FloatingHelpButton";

function OrganizationForm() {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://api.studentservicediary.co.za";
  const navigate = useNavigate();
  const [orgKey, setOrgKey] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [additionalStudents, setAdditionalStudents] = useState([]);
  const [studentNotFoundError, setStudentNotFoundError] = useState(false);

  const [successNotification, setSuccessNotification] = useState({
    show: false,
    message: "",
    details: null,
  });

  // Enhanced error tracking state for field-level validation
  const [fieldErrors, setFieldErrors] = useState({
    mainStudent: {
      fullName: null,
      hours: null,
    },
    additionalStudents: [],
  });

  // State for service hours form (original structure preserved)
  const [serviceForm, setServiceForm] = useState({
    studentFullName: "",
    hours: "",
    dateCompleted: "",
    description: "",
  });

  // Original working verification function (unchanged)
  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify/organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsVerified(true);
        setOrganizationData(data.organization);
        localStorage.setItem("authToken", data.token);
        setError(null);
      } else {
        setError(data.message || "Failed to verify organisation key");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("Failed to verify organisation key");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Enhanced single student validation with comprehensive error detection
  const validateSingleStudentWithFields = (student) => {
    const { fullName, hours, studentNumber } = student;
    let nameError = null;
    let hoursError = null;

    // Comprehensive name validation
    if (!fullName) {
      nameError = "Full name is required";
    } else if (fullName.length < 3) {
      nameError = "Must be at least 3 characters";
    } else {
      const nameParts = fullName.split(/\s+/);
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
          if (!namePattern.test(fullName)) {
            nameError = "Contains invalid characters";
          }
        }
      }
    }

    // Comprehensive hours validation
    if (!hours) {
      hoursError = "Hours are required";
    } else {
      const hoursNum = parseFloat(hours);
      if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 10) {
        hoursError = "Must be between 0.5 and 10";
      } else if ((hoursNum * 10) % 5 !== 0) {
        hoursError = "Must be in half hour increments";
      }
    }

    return {
      nameError,
      hoursError,
    };
  };

  // Unified validation that handles ALL students through field-level tracking
  const validateAllStudentsWithFieldTracking = () => {
    const newFieldErrors = {
      mainStudent: { fullName: null, hours: null },
      additionalStudents: [],
    };

    let hasAnyErrors = false;

    // Validate main student
    const mainStudentErrors = validateSingleStudentWithFields({
      fullName: serviceForm.studentFullName.trim(),
      hours: serviceForm.hours,
      studentNumber: 1,
    });

    newFieldErrors.mainStudent.fullName = mainStudentErrors.nameError;
    newFieldErrors.mainStudent.hours = mainStudentErrors.hoursError;

    if (mainStudentErrors.nameError || mainStudentErrors.hoursError) {
      hasAnyErrors = true;
    }

    // Validate ALL additional students through the same system
    additionalStudents.forEach((student, index) => {
      const studentErrors = validateSingleStudentWithFields({
        fullName: student.fullName.trim(),
        hours: student.hours,
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

  // Helper functions for error state checking
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
        hasFieldError("main", 0, "fullName") ||
        hasFieldError("main", 0, "hours")
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

    if (name === "studentFullName" && studentNotFoundError) {
      setStudentNotFoundError(false);
    }

    // Clear field-specific errors when user starts typing
    if (name === "studentFullName" && hasFieldError("main", 0, "fullName")) {
      setFieldErrors((prev) => ({
        ...prev,
        mainStudent: { ...prev.mainStudent, fullName: null },
      }));
    }

    if (name === "hours" && hasFieldError("main", 0, "hours")) {
      setFieldErrors((prev) => ({
        ...prev,
        mainStudent: { ...prev.mainStudent, hours: null },
      }));
    }

    // Your existing real-time validation clearing logic (preserved)
    if (name === "studentFullName") {
      const trimmedValue = value.trim();
      const nameParts = trimmedValue.split(/\s+/);
      if (nameParts.length >= 2 && trimmedValue.length >= 3) {
        e.target.setCustomValidity("");
      }
    }

    if (name === "hours") {
      const hours = parseFloat(value);
      if (
        !isNaN(hours) &&
        (hours * 10) % 5 === 0 &&
        hours >= 0.5 &&
        hours <= 10
      ) {
        e.target.setCustomValidity("");
      }
    }

    if (name === "description") {
      if (value.length >= 8 && value.length <= 200) {
        e.target.setCustomValidity("");
      }
    }

    if (name === "dateCompleted") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        e.target.setCustomValidity("");
      }
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

  // STREAMLINED: Submit handler with unified validation (no more dual systems!)
  const handleSubmitHours = async (e) => {
    e.preventDefault();
    setStudentNotFoundError(false);

    // Your existing HTML5 validation for main student (preserved)
    if (serviceForm.studentFullName.trim()) {
      const nameParts = serviceForm.studentFullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        e.target.studentFullName.setCustomValidity(
          "Full name must include both first & last name (e.g. John Smith)"
        );
        e.target.studentFullName.reportValidity();
        return;
      }
      if (serviceForm.studentFullName.trim().length < 3) {
        e.target.studentFullName.setCustomValidity(
          "Full name must be at least 3 characters"
        );
        e.target.studentFullName.reportValidity();
        return;
      }
      const namePattern =
        /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+$/;
      if (!namePattern.test(serviceForm.studentFullName.trim())) {
        e.target.studentFullName.setCustomValidity(
          "Name contains invalid characters"
        );
        e.target.studentFullName.reportValidity();
        return;
      }
      e.target.studentFullName.setCustomValidity("");
    }

    // Your existing validation for other main student fields (preserved)
    if (serviceForm.hours) {
      const hours = parseFloat(serviceForm.hours);
      if (!isNaN(hours) && (hours * 10) % 5 !== 0) {
        e.target.hours.setCustomValidity(
          "Hours must be in half hour increments (e.g., 1.0, 1.5, 2.0)"
        );
        e.target.hours.reportValidity();
        return;
      }
      e.target.hours.setCustomValidity("");
    }

    if (serviceForm.description.trim() && serviceForm.description.length < 8) {
      e.target.description.setCustomValidity(
        "Description must be at least 8 characters"
      );
      e.target.description.reportValidity();
      return;
    }
    if (serviceForm.description.length > 200) {
      e.target.description.setCustomValidity(
        "Description must be less than 200 characters"
      );
      e.target.description.reportValidity();
      return;
    }
    e.target.description.setCustomValidity("");

    if (serviceForm.dateCompleted) {
      const selectedDate = new Date(serviceForm.dateCompleted);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        e.target.dateCompleted.setCustomValidity(
          "Date cannot be in the future"
        );
        e.target.dateCompleted.reportValidity();
        return;
      }
      e.target.dateCompleted.setCustomValidity("");
    }

    // REMOVED: The old customErrors array and alert system that was causing browser notifications
    // REPLACED: With unified field-level validation only

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
          mainStudent: { fullName: null, hours: null },
          additionalStudents: [],
        });

        // Your existing batch submission logic (unchanged)
        const allStudents = [
          {
            firstName: serviceForm.studentFullName.trim().split(/\s+/)[0],
            surname: serviceForm.studentFullName
              .trim()
              .split(/\s+/)
              .slice(1)
              .join(" "),
            hours: serviceForm.hours,
          },
          ...additionalStudents.map((student) => ({
            firstName: student.fullName.trim().split(/\s+/)[0],
            surname: student.fullName.trim().split(/\s+/).slice(1).join(" "),
            hours: student.hours,
          })),
        ];

        const response = await fetch(
          `${API_URL}/api/service/batch-log-community`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify({
              students: allStudents,
              dateCompleted: serviceForm.dateCompleted,
              description: serviceForm.description,
            }),
          }
        );

        const data = await response.json();

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

            setServiceForm({
              studentFullName: "",
              hours: "",
              dateCompleted: "",
              description: "",
            });

            setAdditionalStudents([]);
            setFieldErrors({
              mainStudent: { fullName: null, hours: null },
              additionalStudents: [],
            });
          } else {
            alert(`Some errors occurred:\n${data.errors.join("\n")}`);
          }
        } else {
          if (response.status === 404 && data.message === "Student not found") {
            setStudentNotFoundError(true);
          } else {
            alert(data.message || "Failed to log service hours");
          }
        }
      } else {
        // Individual submission logic (unchanged)
        setFieldErrors({
          mainStudent: { fullName: null, hours: null },
          additionalStudents: [],
        });

        const fullName = serviceForm.studentFullName.trim();

        const response = await fetch(`${API_URL}/api/service/log-community`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            studentName: fullName,
            hours: parseFloat(serviceForm.hours),
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
              hours: parseFloat(serviceForm.hours),
            }
          );
          setServiceForm({
            studentFullName: "",
            hours: "",
            dateCompleted: "",
            description: "",
          });
        } else {
          if (response.status === 404 && data.message === "Student not found") {
            setStudentNotFoundError(true);
          } else {
            alert(data.message || "Failed to log service hours");
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit service hours");
    }
  };

  const totalStudents = 1 + additionalStudents.length;

  return (
    <div className="login-form-container">
      <h2>Student Service Diary</h2>
      {!isVerified ? (
        // Original verification form (unchanged)
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
        >
          {!isVerified && error && (
            <div className="error-container">
              <div className="error-message">{error}</div>
              <button className="help-button" onClick={() => setShowHelp(true)}>
                Help
              </button>
            </div>
          )}

          {showHelp && (
            <>
              <div
                className="modal-overlay"
                onClick={() => setShowHelp(false)}
              />
              <div className="help-modal">
                <button
                  className="close-modal"
                  onClick={() => setShowHelp(false)}
                >
                  ×
                </button>
                <h3>Organisation Key Help</h3>
                <p>If your organisation key is not working:</p>
                <ul>
                  <li>
                    Check that you've entered the key exactly as provided.
                  </li>
                  <li>Make sure there are no extra spaces</li>
                </ul>
                <p>
                  For additional help or a new key, please contact support at
                  lchelle.best@gmail.com
                </p>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="orgKey">Organisation Key:</label>
            <input
              type="text"
              id="orgKey"
              value={orgKey}
              onChange={(e) => setOrgKey(e.target.value)}
              placeholder="Enter organisation key"
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleSubmitHours}>
          <h3>Log Community Service Hours</h3>
          {/* Green Celebration Success Notification */}
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

          <div className="organization-info">
            <h3>Verified Organisation</h3>
            <p className="organization-name">{organizationData.name}</p>
          </div>

          {/* RESTRUCTURED: Main student section with ALL related fields grouped together */}
          <div
            className={`student-section ${
              studentSectionHasErrors("main", 0) ? "has-errors" : "valid"
            }`}
          >
            {/* Student name field with proper spacing */}
            <div className="form-group">
              <label htmlFor="studentFullName">Student's Full Name:</label>
              <input
                type="text"
                id="studentFullName"
                name="studentFullName"
                value={serviceForm.studentFullName}
                onChange={handleServiceFormChange}
                placeholder="e.g. Jarryd Braum"
                minLength="3"
                pattern="^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+\s+[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+.*$"
                className={`${studentNotFoundError ? "error" : ""} ${
                  hasFieldError("main", 0, "fullName") ? "field-error" : ""
                }`}
                title="Please enter first and last name (e.g. Jarryd Braum)"
                required
              />

              {hasFieldError("main", 0, "fullName") && (
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
                  <span>{getFieldError("main", 0, "fullName")}</span>
                </div>
              )}

              {studentNotFoundError && (
                <div className="inline-error">
                  <div className="inline-error-icon">
                    <svg
                      width="12"
                      height="12"
                      fill="white"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="inline-error-text">
                    No student found with this name. Please check the spelling
                    and try again.
                  </span>
                </div>
              )}
            </div>

            {/* Hours and Date with consistent spacing */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hours">Number of Hours:</label>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  value={serviceForm.hours}
                  onChange={handleServiceFormChange}
                  min="0.5"
                  max={orgKey === 'HEO77' ? "50" : "10"}
                  step="0.5"
                  className={
                    hasFieldError("main", 0, "hours") ? "field-error" : ""
                  }
                  title="Hours must be between 0.5 - 10"
                  required
                />

                {hasFieldError("main", 0, "hours") && (
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
                    <span>{getFieldError("main", 0, "hours")}</span>
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
                  max={new Date().toISOString().split("T")[0]}
                  title="Date cannot be in the future"
                  required
                />
              </div>
            </div>

            {/* MOVED: Description field INSIDE the main student section for visual grouping */}
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
                placeholder="Describe the community service activity completed (8-200 characters)"
                title="Description must be between 8 - 200 characters"
                required
              />
            </div>
          </div>

          {/* CLEANED UP: Additional students section with proper spacing and no empty headers */}
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
                  {/* SIMPLIFIED: Remove empty header space, just show remove button in top-right */}
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
                        placeholder="e.g. Jarryd Braum"
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
                        max={orgKey === 'HEO77' ? "50" : "10"}
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

          {/* Add student button with proper spacing */}
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

          <button type="submit" className="submit-button">
            {totalStudents > 1
              ? `Submit Hours for ${totalStudents} Students`
              : "Submit Hours"}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={() => {
              setIsVerified(false);
              setOrganizationData(null);
              setOrgKey("");
              setError(null);
              setAdditionalStudents([]);
              setServiceForm({
                studentFullName: "",
                hours: "",
                dateCompleted: "",
                description: "",
              });
              setFieldErrors({
                mainStudent: { fullName: null, hours: null },
                additionalStudents: [],
              });
            }}
          >
            Back
          </button>
        </form>
      )}
      <FloatingHelpButton
        userInfo={
          isVerified
            ? {
                id: organizationData?.id,
                email: organizationData?.contact_email,
                user_type: "organization",
                org_key: orgKey,
                full_name: organizationData?.name,
              }
            : null
        }
      />
    </div>
  );
}

export default OrganizationForm;
