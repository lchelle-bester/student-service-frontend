import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css";

//input
function OrganizationForm() {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://web-production-f1ba5.up.railway.app";
  const navigate = useNavigate();
  const [orgKey, setOrgKey] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);


  // State for service hours form
  const [serviceForm, setServiceForm] = useState({
    studentName: "",
    hours: "",
    dateCompleted: "",
    description: "",
  });

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
        setError(data.message || "Failed to verify organization key");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("Failed to verify organization key");
    } finally {
      setIsLoading(false); // Add this
    }
  };


  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];

    // Check for empty fields
    if (!serviceForm.studentName.trim())
      errors.push("Student name is required");
    if (!serviceForm.hours) errors.push("Number of hours is required");
    if (!serviceForm.dateCompleted) errors.push("Date is required");
    if (!serviceForm.description.trim()) errors.push("Description is required");

    // Validate date
    const selectedDate = new Date(serviceForm.dateCompleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      errors.push("Service date cannot be in the future");
    }

    // Validate hours
    const hours = parseInt(serviceForm.hours);
    if (isNaN(hours) || hours <= 0 || hours > 10) {
      errors.push('Hours must be between 0.5 and 10');
     }

     if (hours * 10 % 5 !== 0) {
      errors.push('Hours must be in half hour increments (e.g., 1.0, 1.5, 2.0, 2.5)');
  }
    if (serviceForm.description.length < 8) {
      errors.push("Description must be at least 8 characters long");
    }
    if (serviceForm.description.length > 200) {
      errors.push("Description must be less than 200 characters long");
    }

    return errors;
  };

  const handleSubmitHours = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/service/log-community`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          studentName: serviceForm.studentName,
          hours: parseFloat(serviceForm.hours),
          dateCompleted: serviceForm.dateCompleted,
          description: serviceForm.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Service hours logged successfully!");
        setServiceForm({
          studentName: "",
          hours: "",
          dateCompleted: "",
          description: "",
        });
      } else {
        setError(data.message || "Failed to log service hours");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to submit service hours");
    }
  };

  return (
    <div className="login-form-container">
      <h2>Student Service Diary</h2>
      {!isVerified ? (
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
                <button 
                    className="help-button"
                    onClick={() => setShowHelp(true)}
                >
                    Help
                </button>
            </div>
        )}
        
        {showHelp && (
            <>
                <div className="modal-overlay" onClick={() => setShowHelp(false)} />
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
                        <li>Check that you've entered the key exactly as provided</li>
                        <li>Keys are case-sensitive</li>
                        <li>Make sure there are no extra spaces</li>
                    </ul>
                    <p>For additional help or a new key, please contact support at lchelle.best@gmail.com</p>
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
              placeholder="Enter organization key"
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
          <div className="organization-info">
            <h3>Verified Organisation</h3>
            <p className="organization-name">{organizationData.name}</p>
          </div>

          <div className="form-group">
            {error && <div className="error-message">{error}</div>}

            <label htmlFor="studentName">Student's Full Name:</label>
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={serviceForm.studentName}
              onChange={handleServiceFormChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hours">Number of Hours:</label>
            <input
              type="number"
              id="hours"
              name="hours"
              value={serviceForm.hours}
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

          <button
            type="button"
            className="back-button"
            onClick={() => {
              setIsVerified(false);
              setOrganizationData(null);
              setOrgKey("");
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
