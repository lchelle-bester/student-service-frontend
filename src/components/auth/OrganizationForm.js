// src/components/auth/OrganizationForm.js - FIXED to keep original look
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
    
    // Keep original form structure
    const [serviceForm, setServiceForm] = useState({
        studentFirstName: '',
        studentSurname: '',
        hours: '',
        dateCompleted: '',
        description: ''
    });

    // Additional students (hidden from UI when only 1 student)
    const [additionalStudents, setAdditionalStudents] = useState([]);
    
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

    // Keep original form change handler
    const handleServiceFormChange = (e) => {
        const { name, value } = e.target;
        setServiceForm(prev => ({ ...prev, [name]: value }));
    };

    // Handler for additional students
    const handleAdditionalStudentChange = (index, field, value) => {
        setAdditionalStudents(prev => 
            prev.map((student, i) => 
                i === index ? { ...student, [field]: value } : student
            )
        );
    };

    const addStudent = () => {
        if (additionalStudents.length < 49) { // 49 + 1 main = 50 max
            setAdditionalStudents(prev => [...prev, { 
                firstName: "", 
                surname: "", 
                hours: "" 
            }]);
        }
    };

    const removeStudent = (index) => {
        setAdditionalStudents(prev => prev.filter((_, i) => i !== index));
    };

    // Enhanced validation (keeps original logic)
    const validateForm = () => {
        const errors = [];
        const hours = parseFloat(serviceForm.hours);

        if (!serviceForm.dateCompleted) {
            errors.push("Date completed is required\n");
        }

        if (isNaN(hours) || hours < 0.5 || hours > 10) {
            errors.push("Hours must be between 0.5 and 10\n");
        }

        if ((hours * 10) % 5 !== 0) {
            errors.push("Hours must be in half hour increments (e.g., 1.0, 1.5, 2.0, 2.5)\n");
        }

        if (serviceForm.description.length < 8) {
            errors.push("Description must be at least 8 characters long\n");
        }

        if (serviceForm.description.length > 200) {
            errors.push("Description must be less than 200 characters long\n");
        }

        if (serviceForm.studentFirstName.trim().length <= 1) {
            errors.push("First name must be longer than 1 character\n");
        }

        if (serviceForm.studentSurname.trim().length <= 1) {
            errors.push("Surname must be longer than 1 character\n");
        }

        // Additional validation for batch students
        additionalStudents.forEach((student, index) => {
            if (!student.firstName.trim() || !student.surname.trim() || !student.hours) {
                errors.push(`Additional student ${index + 1} has missing information\n`);
            }
            
            if (student.hours) {
                const studentHours = parseFloat(student.hours);
                if (isNaN(studentHours) || studentHours < 0.5 || studentHours > 10) {
                    errors.push(`Additional student ${index + 1}: Hours must be between 0.5 and 10\n`);
                }
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
            setError(validationErrors.join(""));
            return;
        }

        setIsSubmitting(true);

        try {
            const hasAdditionalStudents = additionalStudents.length > 0;

            if (hasAdditionalStudents) {
                // Use batch endpoint
                const allStudents = [
                    {
                        firstName: serviceForm.studentFirstName,
                        surname: serviceForm.studentSurname,
                        hours: serviceForm.hours
                    },
                    ...additionalStudents
                ];

                const response = await fetch(`${API_URL}/api/service/batch-log-community`, {
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
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setSuccess(`Successfully logged hours for ${data.successCount} student(s)!`);
                    setResults(data);

                    // Reset form
                    setServiceForm({
                        studentFirstName: "",
                        studentSurname: "",
                        hours: "",
                        dateCompleted: "",
                        description: "",
                    });
                    setAdditionalStudents([]);

                    if (data.errors && data.errors.length > 0) {
                        setError(`Some errors occurred:\n${data.errors.join('\n')}`);
                    }
                } else {
                    setError(data.message || "Failed to log service hours");
                }
            } else {
                // Use original individual endpoint
                const fullName = `${serviceForm.studentFirstName.trim()} ${serviceForm.studentSurname.trim()}`;

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
                    setSuccess("Service hours logged successfully!");
                    setServiceForm({
                        studentFirstName: "",
                        studentSurname: "",
                        hours: "",
                        dateCompleted: "",
                        description: "",
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
            studentFirstName: '',
            studentSurname: '',
            hours: '',
            dateCompleted: '',
            description: ''
        });
        setAdditionalStudents([]);
    };

    const totalStudents = 1 + additionalStudents.length;

    return (
        <div className="organization-form-container">
            <h2>Student Service Diary</h2>
            
            {!isVerified ? (
                <>
                    {/* EXACT same verification UI as original */}
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
                        Back
                    </button>
                </>
            ) : (
                <>
                    {/* EXACT same organization info as original */}
                    <div className="organization-info">
                        <h3>Organization Verified</h3>
                        <p className="organization-name">{organizationName}</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    
                    <form onSubmit={handleSubmitHours}>
                        {/* EXACT same form fields as original */}
                        <div className="form-group">
                            <label htmlFor="studentSurname">Student Surname:</label>
                            <input
                                type="text"
                                id="studentSurname"
                                name="studentSurname"
                                value={serviceForm.studentSurname}
                                onChange={handleServiceFormChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="hours">Hours Completed:</label>
                            <input
                                type="number"
                                id="hours"
                                name="hours"
                                value={serviceForm.hours}
                                onChange={handleServiceFormChange}
                                min="0.5"
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
                            <label htmlFor="description">Activity Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={serviceForm.description}
                                onChange={handleServiceFormChange}
                                rows="4"
                                placeholder="Describe the community service activity (8-200 characters)"
                                required
                            />
                        </div>

                        {/* Additional students section - only shows when students are added */}
                        {additionalStudents.length > 0 && (
                            <div style={{ 
                                marginTop: '30px',
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef'
                            }}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
                                    Additional Students ({additionalStudents.length})
                                </h3>
                                
                                {additionalStudents.map((student, index) => (
                                    <div key={index} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 100px 40px',
                                        gap: '10px',
                                        alignItems: 'end',
                                        marginBottom: '15px',
                                        padding: '15px',
                                        backgroundColor: '#fff',
                                        borderRadius: '6px',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '14px' }}>First Name:</label>
                                            <input
                                                type="text"
                                                value={student.firstName}
                                                onChange={(e) => handleAdditionalStudentChange(index, 'firstName', e.target.value)}
                                                required
                                                style={{ padding: '8px' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '14px' }}>Surname:</label>
                                            <input
                                                type="text"
                                                value={student.surname}
                                                onChange={(e) => handleAdditionalStudentChange(index, 'surname', e.target.value)}
                                                required
                                                style={{ padding: '8px' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '14px' }}>Hours:</label>
                                            <input
                                                type="number"
                                                value={student.hours}
                                                onChange={(e) => handleAdditionalStudentChange(index, 'hours', e.target.value)}
                                                min="0.5"
                                                max="10"
                                                step="0.5"
                                                required
                                                style={{ padding: '8px', textAlign: 'center' }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeStudent(index)}
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                alignSelf: 'end'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add student button - clean and simple */}
                        {additionalStudents.length < 49 && (
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <button
                                    type="button"
                                    onClick={addStudent}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    + Add Another Student
                                </button>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Logging Hours...' : 
                             totalStudents > 1 ? `Log Hours for ${totalStudents} Students` : 'Log Hours'}
                        </button>
                    </form>

                    {/* Results display */}
                    {results && (
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                        }}>
                            <h4>Results:</h4>
                            <div style={{ color: '#28a745' }}>✓ {results.successCount} successful</div>
                            {results.errorCount > 0 && (
                                <div style={{ color: '#dc3545' }}>✗ {results.errorCount} errors</div>
                            )}
                        </div>
                    )}

                    <div className="button-group">
                        <button 
                            type="button" 
                            className="back-button"
                            onClick={handleLogout}
                        >
                            Use Different Key
                        </button>
                        
                        <button 
                            type="button" 
                            className="back-button"
                            onClick={() => navigate('/')}
                        >
                            Back
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default OrganizationForm;