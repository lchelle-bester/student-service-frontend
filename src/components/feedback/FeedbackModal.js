import React, { useState } from "react";
import "./FeedbackModal.css";

const FeedbackModal = ({ isOpen, onClose, userInfo }) => {
  const [formData, setFormData] = useState({
    issueType: "",
    description: "",
    priority: "medium",
    contactEmail: userInfo?.email || "",
    screenshot: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const issueTypes = [
    { value: "bug", label: "Bug Report" },
    { value: "feature_request", label: "Feature Request" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low - Minor issue" },
    { value: "medium", label: "Medium - Moderate impact" },
    { value: "high", label: "High - Blocking my work" },
    { value: "urgent", label: "Urgent - System broken" },
  ];

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      issueType: "",
      description: "",
      priority: "medium",
      contactEmail: userInfo?.email || "",
      screenshot: null,
    });
    setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const contextInfo = {
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        userType: userInfo?.user_type || "unknown",
        userEmail: userInfo?.email || null,
        userKey: userInfo?.org_key || null,
        studentId: userInfo?.student_id || null,
      };

      const submitData = new FormData();
      submitData.append("issueType", formData.issueType);
      submitData.append("description", formData.description);
      submitData.append("priority", formData.priority);
      submitData.append("contactEmail", formData.contactEmail);
      submitData.append("context", JSON.stringify(contextInfo));
      submitData.append("userId", userInfo?.id || "");

      if (formData.screenshot) {
        submitData.append("screenshot", formData.screenshot);
      }

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "https://api.studentservicediary.co.za"
        }/api/feedback/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: submitData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={handleClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h3>Report an Issue or Give Feedback</h3>
          <button className="feedback-close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        {submitStatus === "success" && (
          <div className="feedback-success-message">
            <div className="success-icon">✓</div>
            <p>Thank you! Your feedback has been submitted successfully.</p>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="feedback-error-message">
            <p>
              Sorry, there was an error. Please try again or email
              lchelle.best@gmail.com
            </p>
          </div>
        )}

        {submitStatus !== "success" && (
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="feedback-form-row">
              <div className="feedback-form-group">
                <label htmlFor="issueType">What type of issue is this? *</label>
                <select
                  id="issueType"
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select issue type...</option>
                  {issueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-form-group">
                <label htmlFor="priority">How urgent is this?</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="feedback-form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please describe the issue, what you were trying to do, and any error messages you saw..."
                maxLength="1000"
                rows="6"
                required
              />
              <small>{formData.description.length}/1000 characters</small>
            </div>

            <div className="feedback-form-group">
              <label htmlFor="screenshot">Screenshot (optional)</label>
              <input
                type="file"
                id="screenshot"
                name="screenshot"
                accept="image/*"
                onChange={handleInputChange}
                className="file-input"
              />
              <small>Upload a screenshot to help us understand the issue</small>
            </div>

            <div className="feedback-form-group">
              <label htmlFor="contactEmail">Your email (optional)</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="Only needed if you want a response"
              />
            </div>

            <div className="feedback-form-actions">
              <button
                type="button"
                className="feedback-cancel-button"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="feedback-submit-button"
                disabled={
                  isSubmitting || !formData.issueType || !formData.description
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
