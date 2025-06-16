// src/components/auth/OrganizationForm.js - Enhanced with Level 2 & 3 Error Handling
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css";

function OrganizationForm() {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://student-service-backend.onrender.com";
  const navigate = useNavigate();
  const [orgKey, setOrgKey] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [additionalStudents, setAdditionalStudents] = useState([]);
  const [studentNotFoundError, setStudentNotFoundError] = useState(false);

  // NEW: Enhanced error tracking state for field-level validation
  // This creates a detailed map of which specific fields have errors
  const [fieldErrors, setFieldErrors] = useState({
    // Main student errors - tracks name and hours field errors separately
    mainStudent: {
      fullName: null,
      hours: null
    },
    // Additional students errors - array of error objects for each additional student
    additionalStudents: []
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

  // NEW: Enhanced single student validation that returns field-specific errors
  // This function analyzes a single student's data and returns detailed error information
  const validateSingleStudentWithFields = (student) => {
    const { fullName, hours, studentNumber } = student;
    let nameError = null;
    let hoursError = null;

    // Name validation with specific error categorization
    // Each error is designed to be concise since it appears directly next to the field
    if (!fullName) {
      nameError = "Full name is required";
    } else if (fullName.length < 3) {
      nameError = "Must be at least 3 characters";
    } else {
      // Check for first and last name structure
      const nameParts = fullName.split(/\s+/);
      if (nameParts.length < 2) {
        nameError = "Include both first and last name";
      } else {
        // Check individual name part lengths - this catches cases like "John D"
        if (nameParts[0].length < 2) {
          nameError = "First name too short";
        } else if (nameParts[nameParts.length - 1].length < 2) {
          nameError = "Surname too short"; // This addresses your original "surname too short" error
        } else {
          // Check for valid characters using your existing pattern
          const namePattern = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+$/;
          if (!namePattern.test(fullName)) {
            nameError = "Contains invalid characters";
          }
        }
      }
    }

    // Hours validation with specific error categorization
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
      hoursError
    };
  };

  // NEW: Comprehensive validation that tracks field-specific errors
  // This function validates all students and updates the field error state
  const validateAllStudentsWithFieldTracking = () => {
    const newFieldErrors = {
      mainStudent: { fullName: null, hours: null },
      additionalStudents: []
    };

    let hasAnyErrors = false; // Boolean flag to determine if submission should be prevented

    // Validate main student (Student 1)
    const mainStudentErrors = validateSingleStudentWithFields({
      fullName: serviceForm.studentFullName.trim(),
      hours: serviceForm.hours,
      studentNumber: 1
    });

    // Track main student field errors in our state structure
    newFieldErrors.mainStudent.fullName = mainStudentErrors.nameError;
    newFieldErrors.mainStudent.hours = mainStudentErrors.hoursError;

    // Check if main student has any errors that would prevent submission
    if (mainStudentErrors.nameError || mainStudentErrors.hoursError) {
      hasAnyErrors = true;
    }

    // Validate additional students and track their errors individually
    additionalStudents.forEach((student, index) => {
      const studentErrors = validateSingleStudentWithFields({
        fullName: student.fullName.trim(),
        hours: student.hours,
        studentNumber: index + 2
      });

      // Track additional student field errors
      newFieldErrors.additionalStudents[index] = {
        fullName: studentErrors.nameError,
        hours: studentErrors.hoursError
      };

      // Check if this additional student has any errors
      if (studentErrors.nameError || studentErrors.hoursError) {
        hasAnyErrors = true;
      }
    });

    // Update the field error state with all detected errors
    setFieldErrors(newFieldErrors);
    
    return hasAnyErrors; // Return boolean instead of error array for cleaner logic
  };

  // NEW: Helper functions for clean error state checking
  // These functions abstract the complexity of checking error states
  const hasFieldError = (studentType, studentIndex, fieldName) => {
    if (studentType === 'main') {
      return fieldErrors.mainStudent[fieldName] !== null;
    } else {
      return fieldErrors.additionalStudents[studentIndex] && 
             fieldErrors.additionalStudents[studentIndex][fieldName] !== null;
    }
  };

  // Helper to get the specific error message for display
  const getFieldError = (studentType, studentIndex, fieldName) => {
    if (studentType === 'main') {
      return fieldErrors.mainStudent[fieldName];
    } else {
      return fieldErrors.additionalStudents[studentIndex] ? 
             fieldErrors.additionalStudents[studentIndex][fieldName] : null;
    }
  };

  // Helper to determine if an entire student section has any errors (for Level 2 visual grouping)
  const studentSectionHasErrors = (studentType, studentIndex) => {
    if (studentType === 'main') {
      return hasFieldError('main', 0, 'fullName') || hasFieldError('main', 0, 'hours');
    } else {
      return hasFieldError('additional', studentIndex, 'fullName') || 
             hasFieldError('additional', studentIndex, 'hours');
    }
  };

  // ENHANCED: Form change handler with intelligent error clearing
  // This provides immediate positive feedback as users fix problems
  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;

    // Update the form state (unchanged from your original)
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear student not found error when user starts typing in name field (unchanged)
    if (name === "studentFullName" && studentNotFoundError) {
      setStudentNotFoundError(false);
    }

    // NEW: Clear field-specific errors for main student when they start typing
    // This creates a satisfying "problem being solved" experience
    if (name === 'studentFullName' && hasFieldError('main', 0, 'fullName')) {
      setFieldErrors(prev => ({
        ...prev,
        mainStudent: { ...prev.mainStudent, fullName: null }
      }));
    }
    
    if (name === 'hours' && hasFieldError('main', 0, 'hours')) {
      setFieldErrors(prev => ({
        ...prev,
        mainStudent: { ...prev.mainStudent, hours: null }
      }));
    }

    // Your existing real-time validation clearing logic (preserved)
    if (name === "studentFullName") {
      const trimmedValue = value.trim();
      const nameParts = trimmedValue.split(/\s+/);

      // If the name now meets our criteria, clear any previous custom validity
      if (nameParts.length >= 2 && trimmedValue.length >= 3) {
        e.target.setCustomValidity(""); // Remove the sticky note!
      }
    }

    // Similar real-time clearing for hours field (preserved)
    if (name === "hours") {
      const hours = parseFloat(value);
      // If hours are now valid, clear any previous custom validity
      if (
        !isNaN(hours) &&
        (hours * 10) % 5 === 0 &&
        hours >= 0.5 &&
        hours <= 10
      ) {
        e.target.setCustomValidity(""); // Remove the sticky note!
      }
    }

    // Similar real-time clearing for description field (preserved)
    if (name === "description") {
      // If description is now valid, clear any previous custom validity
      if (value.length >= 8 && value.length <= 200) {
        e.target.setCustomValidity(""); // Remove the sticky note!
      }
    }

    // Similar real-time clearing for date field (preserved)
    if (name === "dateCompleted") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If date is now valid, clear any previous custom validity
      if (selectedDate <= today) {
        e.target.setCustomValidity(""); // Remove the sticky note!
      }
    }
  };

  // ENHANCED: Additional student change handler with field-specific error clearing
  const handleAdditionalStudentChange = (index, field, value) => {
    // Update additional students state (unchanged)
    setAdditionalStudents((prev) =>
      prev.map((student, i) =>
        i === index ? { ...student, [field]: value } : student
      )
    );

    // NEW: Clear field-specific error for this particular student and field
    // This creates immediate positive feedback when users fix problems
    if (hasFieldError('additional', index, field)) {
      setFieldErrors(prev => {
        const newAdditionalErrors = [...prev.additionalStudents];
        if (newAdditionalErrors[index]) {
          newAdditionalErrors[index] = {
            ...newAdditionalErrors[index],
            [field]: null
          };
        }
        return {
          ...prev,
          additionalStudents: newAdditionalErrors
        };
      });
    }
  };

  // Existing helper functions (unchanged)
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
    
    // NEW: Also clear any field errors for the removed student
    setFieldErrors(prev => ({
      ...prev,
      additionalStudents: prev.additionalStudents.filter((_, i) => i !== index)
    }));
  };

  // Original validation logic (preserved for compatibility)
  const validateForm = () => {
    const errors = [];

    // Check for empty fields
    if (!serviceForm.studentFullName.trim())
      errors.push("Student full name is required\n");
    if (!serviceForm.hours) errors.push("Number of hours is required\n");
    if (!serviceForm.dateCompleted) errors.push("Date is required\n");
    if (!serviceForm.description.trim())
      errors.push("Description is required\n");

    // Validate full name (should contain at least first and last name)
    const nameParts = serviceForm.studentFullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      errors.push("Full name must include both first & last name\n");
    }
    if (serviceForm.studentFullName.trim().length < 3) {
      errors.push("Full name must be at least 3 characters\n");
    }

    // Validate date
    const selectedDate = new Date(serviceForm.dateCompleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      errors.push("Date cannot be in the future\n");
    }

    // Validate hours
    const hours = parseFloat(serviceForm.hours);
    if (isNaN(hours) || hours < 0.5 || hours > 10) {
      errors.push("Hours must be between 0.5 - 10\n");
    }

    if ((hours * 10) % 5 !== 0) {
      errors.push(
        "Hours must be in half hour increments (e.g., 1.0, 1.5, 2.0)\n"
      );
    }

    if (serviceForm.description.length < 8) {
      errors.push("Description must be at least 8 characters\n");
    }

    if (serviceForm.description.length > 200) {
      errors.push("Description must be less than 200 characters\n");
    }

    // Additional validation for batch students
    additionalStudents.forEach((student, index) => {
      if (!student.fullName.trim() || !student.hours) {
        errors.push(
          `Additional student ${index + 1} has missing information\n`
        );
      }

      if (student.fullName.trim()) {
        const nameParts = student.fullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
          errors.push(
            `Additional student ${
              index + 1
            }: Full name must include both first & last name\n`
          );
        }
        if (student.fullName.trim().length < 3) {
          errors.push(
            `Additional student ${
              index + 1
            }: Full name must be at least 3 characters\n`
          );
        }
      }

      if (student.hours) {
        const studentHours = parseFloat(student.hours);
        if (isNaN(studentHours) || studentHours < 0.5 || studentHours > 10) {
          errors.push(
            `Additional student ${
              index + 1
            }: Hours must be between 0.5 and 10\n`
          );
        }
        if ((studentHours * 10) % 5 !== 0) {
          errors.push(
            `Additional student ${
              index + 1
            }: Hours must be in half hour increments\n`
          );
        }
      }
    });

    return errors;
  };

  // ENHANCED: Submit handler with integrated Level 2 & 3 error handling
  const handleSubmitHours = async (e) => {
    e.preventDefault();
    setStudentNotFoundError(false);

    const customErrors = [];

    // Your existing custom validation for main student (preserved)
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

    // Your existing custom validation for other fields (preserved)
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

    // Your existing validation for additional students (preserved)
    for (let i = 0; i < additionalStudents.length; i++) {
      const student = additionalStudents[i];

      if (student.fullName.trim()) {
        const nameParts = student.fullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
          customErrors.push(
            `Additional student ${
              i + 1
            }: Full name must include both first & last name (e.g. John Smith)`
          );
        }
        if (student.fullName.trim().length < 3) {
          customErrors.push(
            `Additional student ${
              i + 1
            }: Full name must be at least 3 characters`
          );
        }
        const namePattern =
          /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+$/;
        if (!namePattern.test(student.fullName.trim())) {
          customErrors.push(
            `Additional student ${i + 1}: Name contains invalid characters`
          );
        }
      }

      if (student.hours) {
        const studentHours = parseFloat(student.hours);
        if (!isNaN(studentHours) && (studentHours * 10) % 5 !== 0) {
          customErrors.push(
            `Additional student ${i + 1}: Hours must be in half hour increments`
          );
        }
      }
    }

    try {
      const hasAdditionalStudents = additionalStudents.length > 0;

      if (hasAdditionalStudents) {
        // NEW: Enhanced validation for batch submissions
        // Check for field-level errors using our new validation system
        const hasValidationErrors = validateAllStudentsWithFieldTracking();
        
        if (hasValidationErrors || customErrors.length > 0) {
          // If we have custom errors from the loop above, show them via alert (preserved behavior)
          if (customErrors.length > 0) {
            alert(customErrors.join("\n"));
          }
          
          // NEW: Scroll to the first error field for better user experience
          const firstErrorField = document.querySelector('.field-error');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            setTimeout(() => firstErrorField.focus(), 300);
          }
          
          return; // Stop submission if any errors exist
        }

        // Clear all field errors since validation passed
        setFieldErrors({
          mainStudent: { fullName: null, hours: null },
          additionalStudents: []
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
          // Only show success if NO errors occurred (fixed partial logging issue)
          if (data.errorCount === 0) {
            alert(
              `Successfully logged hours for ${data.successCount} student(s)!`
            );
            // Reset form
            setServiceForm({
              studentFullName: "",
              hours: "",
              dateCompleted: "",
              description: "",
            });
            setAdditionalStudents([]);
            // Clear any remaining field errors
            setFieldErrors({
              mainStudent: { fullName: null, hours: null },
              additionalStudents: []
            });
          } else {
            // This shouldn't happen with our validation, but provide fallback
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
        // For individual submissions, clear any field errors
        setFieldErrors({
          mainStudent: { fullName: null, hours: null },
          additionalStudents: []
        });

        // Your existing individual submission logic (unchanged)
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
          alert("Service hours logged successfully!");
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
        // EXACT original verification form (unchanged)
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
        // ENHANCED: Form with Level 2 & 3 error handling
        <form className="login-form" onSubmit={handleSubmitHours}>
          <h3>Log Community Service Hours</h3>
          <div className="organization-info">
            <h3>Verified Organisation</h3>
            <p className="organization-name">{organizationData.name}</p>
          </div>

          {/* ENHANCED: Main student section with Level 2 visual grouping */}
          <div className={`student-section ${studentSectionHasErrors('main', 0) ? 'has-errors' : 'valid'}`}>
            <div className="student-section-header">
              <span className="student-number-badge">1</span>
              <span>Primary Student</span>
            </div>

            {/* ENHANCED: Student name field with Level 3 field-level error display */}
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
                className={`${studentNotFoundError ? 'error' : ''} ${hasFieldError('main', 0, 'fullName') ? 'field-error' : ''}`}
                title="Please enter first and last name (e.g. Jarryd Braum)"
                required
              />
              
              {/* NEW: Level 3 field-specific error message */}
              {hasFieldError('main', 0, 'fullName') && (
                <div className="field-error-message">
                  <div className="field-error-icon">
                    <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span>{getFieldError('main', 0, 'fullName')}</span>
                </div>
              )}

              {/* Existing inline error message for student not found (preserved) */}
              {studentNotFoundError && (
                <div className="inline-error">
                  <div className="inline-error-icon">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="inline-error-text">
                    No student found with this name. Please check the spelling and
                    try again.
                  </span>
                </div>
              )}
            </div>

            {/* ENHANCED: Hours and Date with error tracking */}
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
                  max="10"
                  step="0.5"
                  className={hasFieldError('main', 0, 'hours') ? 'field-error' : ''}
                  title="Hours must be between 0.5 - 10"
                  required
                />
                
                {/* NEW: Level 3 field-specific error message for hours */}
                {hasFieldError('main', 0, 'hours') && (
                  <div className="field-error-message">
                    <div className="field-error-icon">
                      <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <span>{getFieldError('main', 0, 'hours')}</span>
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
          </div>

          {/* Description field (outside student section as it applies to all) */}
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

          {/* ENHANCED: Additional students section with Level 2 & 3 error integration */}
          {additionalStudents.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
                Additional Students ({additionalStudents.length})
              </h4>

              {additionalStudents.map((student, index) => (
                <div 
                  key={index} 
                  className={`student-section ${studentSectionHasErrors('additional', index) ? 'has-errors' : 'valid'}`}
                >
                  <div className="student-section-header">
                    <span className="student-number-badge">{index + 2}</span>
                    <span>Additional Student {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeStudent(index)}
                      style={{
                        marginLeft: 'auto',
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '15px' }}>
                    {/* Additional student name field with error tracking */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "14px", margin: "0 0 6px 0", display: 'block' }}>
                        Full Name:
                      </label>
                      <input
                        type="text"
                        value={student.fullName}
                        onChange={(e) =>
                          handleAdditionalStudentChange(index, "fullName", e.target.value)
                        }
                        placeholder="e.g. Jarryd Braum"
                        className={hasFieldError('additional', index, 'fullName') ? 'field-error' : ''}
                        required
                        style={{ 
                          padding: "8px", 
                          fontSize: "14px",
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                      
                      {/* NEW: Level 3 field-specific error for additional student name */}
                      {hasFieldError('additional', index, 'fullName') && (
                        <div className="field-error-message">
                          <div className="field-error-icon">
                            <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <span>{getFieldError('additional', index, 'fullName')}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional student hours field with error tracking */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "14px", margin: "0 0 6px 0", display: 'block' }}>
                        Hours:
                      </label>
                      <input
                        type="number"
                        value={student.hours}
                        onChange={(e) =>
                          handleAdditionalStudentChange(index, "hours", e.target.value)
                        }
                        min="0.5"
                        max="10"
                        step="0.5"
                        className={hasFieldError('additional', index, 'hours') ? 'field-error' : ''}
                        required
                        style={{
                          padding: "8px",
                          fontSize: "14px",
                          textAlign: "center",
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                      
                      {/* NEW: Level 3 field-specific error for additional student hours */}
                      {hasFieldError('additional', index, 'hours') && (
                        <div className="field-error-message">
                          <div className="field-error-icon">
                            <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <span>{getFieldError('additional', index, 'hours')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add student button (unchanged) */}
          {additionalStudents.length < 49 && (
            <div style={{ textAlign: "center", margin: "15px 0" }}>
              <button
                type="button"
                onClick={addStudent}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                + Log this service activty for another student
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
              // NEW: Clear field errors when going back
              setFieldErrors({
                mainStudent: { fullName: null, hours: null },
                additionalStudents: []
              });
            }}
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default OrganizationForm;