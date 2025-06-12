// src/components/auth/OrganizationForm.js - Updated to integrate with existing system
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/OrganizationForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function OrganizationForm() {
    const navigate = useNavigate();
    const [orgKey, setOrgKey] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [organizationName, setOrganizationName] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    // Enhanced form state to support multiple students
    const [serviceForm, setServiceForm] = useState({
        dateCompleted: '',
        description: '',
        students: [{ firstName: '', surname: '', hours: '' }]
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [results, setResults] = useState(null);

    const handleOrgKeyChange = (e) => {
        setOrgKey(e.target.value.toUpperCase());
    };

    const verifyOrganization = async () => {
        if (!orgKey.trim()) {
            setError('Please enter an organization key');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/verify-org`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orgKey: orgKey.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsVerified(true);
                setOrganizationName(data.organizationName);
                // Store auth token for service logging
                localStorage.setItem('authToken', data.token);
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setError('Failed to verify organization key');
        } finally {
            setIsVerifying(false);
        }
    };

    // Enhanced form change handlers
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
                students: [...prev.students, { firstName: '', surname: '', hours: '' }]
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
    const handleSubmitHours = async (e) => {
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
            const isBatch = serviceForm.students.length > 1;

            if (isBatch) {
                // Use batch endpoint
                const response = await fetch(`${API_URL}/api/service/batch-log-community`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                    body: JSON.stringify({
                        students: serviceForm.students,
                        dateCompleted: serviceForm.dateCompleted,
                        description: serviceForm.description,
                    }),
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
                    setError(data.message || "Failed to log service hours");
                    if (data.errors) {
                        setError(prev => prev + '\n' + data.errors.join('\n'));
                    }
                }
            } else {
                // Use existing individual endpoint
                const student = serviceForm.students[0];
                const fullName = `${student.firstName.trim()} ${student.surname.trim()}`;

                const response = await fetch(`${API_URL}/api/service/log-community`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                    body: JSON.stringify({
                        studentName: fullName,
                        hours: parseFloat(student.hours),
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

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsVerified(false);
        setOrganizationName('');
        setOrgKey('');
        setServiceForm({
            dateCompleted: '',
            description: '',
            students: [{ firstName: '', surname: '', hours: '' }]
        });
    };

    const isMultipleStudents = serviceForm.students.length > 1;

    return (
        <div className="organization-form-container">
            <h2>Community Service Logging</h2>
            
            {!isVerified ? (
                <>
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="key-input-group">
                        <input
                            type="text"
                            placeholder="Enter Organization Key"
                            value={orgKey}
                            onChange={handleOrgKeyChange}
                            disabled={isVerifying}
                            maxLength={10}
                        />
                        <button 
                            onClick={verifyOrganization}
                            className="verify-button"
                            disabled={isVerifying || !orgKey.trim()}
                        >
                            {isVerifying ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>

                    <button 
                        type="button" 
                        className="back-button"
                        onClick={() => navigate('/')}
                        disabled={isVerifying}
                    >
                        Back to Home
                    </button>
                </>
            ) : (
                <>
                    {/* Organization Info */}
                    <div className="organization-info">
                        <div>
                            <h3>Welcome!</h3>
                            <p className="organization-name">{organizationName}</p>
                        </div>
                        <button onClick={handleLogout} className="logout-button">
                            Switch Organization
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    
                    <form onSubmit={handleSubmitHours} className="service-form">
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
                                    placeholder="Describe the community service activity (8-200 characters)"
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
                             isMultipleStudents ? `Log Hours for ${serviceForm.students.length} Students` : 'Log Hours'}
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

                    <button 
                        type="button" 
                        className="back-button"
                        onClick={() => navigate('/')}
                        style={{ marginTop: '20px' }}
                    >
                        Back to Home
                    </button>
                </>
            )}
        </div>
    );
}

export default OrganizationForm;