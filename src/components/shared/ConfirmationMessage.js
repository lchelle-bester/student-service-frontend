// components/shared/ConfirmationMessage.js
import React from 'react';
import '../../styles/ConfirmationMessage.css';

// This component creates a slide-in notification that shows the success message
// and automatically disappears after a few seconds
function ConfirmationMessage({ data, onClose }) {
    // Use React's useEffect to automatically close the message after 5 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        // Clean up the timer if the component unmounts
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="confirmation-message">
            <div className="confirmation-content">
                <div className="confirmation-header">
                    <span className="success-icon">✓</span>
                    <h3>Hours Successfully Logged</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="confirmation-details">
                    <p><strong>Student:</strong> {data.studentName}</p>
                    <p><strong>Hours Logged:</strong> {data.hours}</p>
                    <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString()}</p>
                    <p className="description"><strong>Description:</strong> {data.description}</p>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationMessage;