// src/components/auth/LoginSelection.js
import React, { useState } from 'react';              // We need useState for managing component state
import { useNavigate } from 'react-router-dom';       // This lets us navigate between pages
import '../../styles/LoginSelection.css';             // Our component's styles

function LoginSelection() {
    // useNavigate is a React Router hook that lets us programmatically navigate
    const navigate = useNavigate();

    // When the organization button is clicked, navigate to the organization form
    const handleOrganizationClick = () => {
        navigate('/organization-form');
    };

    // When the teacher button is clicked, navigate to the teacher login
    const handleTeacherClick = () => {
        navigate('/teacher-login');
    };

    // When the student button is clicked, navigate to the student login
    const handleStudentClick = () => {
        navigate('/student-login');
    };

    // This is what gets rendered on the screen
    return (
        <div className="login-container">
            <div className="logo-section">
                <h1>Curro Student Service Diary</h1>
                <p>Welcome to Curro Hillcrest's Student Service Management System</p>
            </div>

            <div className="selection-section">
                <h2>Proceed as...</h2>
                <div className="button-group">
                    {/* Each button calls its respective handler when clicked */}
                    <button 
                        className="login-button organization"
                        onClick={handleOrganizationClick}
                    >
                        Organization
                    </button>

                    <button 
                        className="login-button teacher"
                        onClick={handleTeacherClick}
                    >
                        Teacher
                    </button>

                    <button 
                        className="login-button student"
                        onClick={handleStudentClick}
                    >
                        Student
                    </button>
                </div>
            </div>
        </div>
    );
}

// Make this component available to other parts of our application
export default LoginSelection;