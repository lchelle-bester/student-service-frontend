// src/components/auth/OrganizationForm.js - CORRECTED with original working logic
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

  // State for service hours form (original structure)
  const [serviceForm, setServiceForm] = useState({
    studentFullName: "",
    hours: "",
    dateCompleted: "",
    description: "",
  });

  // Original working verification function
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

  // Original form change handler
  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for additional students
  const handleAdditionalStudentChange = (index, field, value) => {
    setAdditionalStudents((prev) =>
      prev.map((student, i) =>
        i === index ? { ...student, [field]: value } : student
      )
    );
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
  };

  // Original validation logic
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

  // Enhanced submit handler
  const handleSubmitHours = async (e) => {
    e.preventDefault();

    const customErrors = [];

    // Custom validation for full name format
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
      // Check for valid characters (letters, spaces, accented characters, hyphens, apostrophes, periods)
      const namePattern =
        /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s'.-]+$/;
      if (!namePattern.test(serviceForm.studentFullName.trim())) {
        e.target.studentFullName.setCustomValidity(
          "Name contains invalid characters"
        );
        e.target.studentFullName.reportValidity();
        return;
      }
      // Clear custom validity if name is valid
      e.target.studentFullName.setCustomValidity("");
    }

    // Custom validation for hours format
    if (serviceForm.hours) {
      const hours = parseFloat(serviceForm.hours);
      if (!isNaN(hours) && (hours * 10) % 5 !== 0) {
        e.target.hours.setCustomValidity(
          "Hours must be in half hour increments (e.g., 1.0, 1.5, 2.0)"
        );
        e.target.hours.reportValidity();
        return;
      }
      // Clear custom validity if hours are valid
      e.target.hours.setCustomValidity("");
    }

    // Custom validation for description length
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
    // Clear custom validity if description is valid
    e.target.description.setCustomValidity("");

    // Custom validation for future date
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
      // Clear custom validity if date is valid
      e.target.dateCompleted.setCustomValidity("");
    }

    // Validate additional students
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
        // Check for valid characters
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

    // Show custom errors for additional students using alert (since we can't use HTML5 validation on dynamic fields)
    if (customErrors.length > 0) {
      alert(customErrors.join("\n"));
      return;
    }

    try {
      const hasAdditionalStudents = additionalStudents.length > 0;

      if (hasAdditionalStudents) {
        // Use batch endpoint
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

          if (data.errors && data.errors.length > 0) {
            alert(`Some errors occurred:\n${data.errors.join("\n")}`);
          }
        } else {
          alert(data.message || "Failed to log service hours");
        }
      } else {
        // Use original individual endpoint
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
          alert(data.message || "Failed to log service hours");
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
        // EXACT original verification form
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
        // Enhanced form with batch capability
        <form className="login-form" onSubmit={handleSubmitHours}>
          <h3>Log Community Service Hours</h3>
          <div className="organization-info">
            <h3>Verified Organisation</h3>
            <p className="organization-name">{organizationData.name}</p>
          </div>

          {/* EXACT original form fields with enhanced HTML5 validation */}
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
              title="Please enter first and last name (e.g. Jarryd Braum)"
              required
            />
          </div>

          {/* Hours and Date in side-by-side layout */}
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
                title="Hours must be between 0.5 - 10"
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
                max={new Date().toISOString().split("T")[0]}
                title="Date cannot be in the future"
                required
              />
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
              placeholder="Describe the community service activity completed (8-200 characters)"
              title="Description must be between 8 - 200 characters"
              required
            />
          </div>

          {/* Additional students section - only shows when students are added */}
          {additionalStudents.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
              }}
            >
              <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
                Additional Students ({additionalStudents.length})
              </h4>

              {additionalStudents.map((student, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 30px",
                    gap: "10px",
                    alignItems: "end",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#fff",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", margin: "0 0 4px 0" }}>
                      Full Name:
                    </label>
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
                      required
                      style={{ padding: "6px", fontSize: "14px" }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", margin: "0 0 4px 0" }}>
                      Hours:
                    </label>
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
                      required
                      style={{
                        padding: "6px",
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStudent(index)}
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "14px",
                      alignSelf: "end",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add student button */}
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
