// src/components/auth/OrganizationForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/OrganizationForm.css';

function OrganizationForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        orgKey: '',
        studentName: '',
        hoursCompleted: '',
        dateOfCompletion: '',
        serviceDescription: ''
    });
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };


    
   // In OrganizationForm.js
const [verifying, setVerifying] = useState(false);
const [orgName, setOrgName] = useState('') ;

const verifyOrgKey = async () => {
    if (!formData.orgKey.trim()) {
        setError('Please enter an organization key');
        return;
    }

    setVerifying(true);
    setError('');

    try {
        const response = await fetch('http://localhost:5000/api/auth/verify/organization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orgKey: formData.orgKey })
        });

        const data = await response.json();
        
        if (data.success) {
            setIsVerified(true);
            setOrgName(data.organization.name);
            localStorage.setItem('orgToken', data.token);
            // Show success message
            alert(`Verified as: ${data.organization.name}`);
        } else {
            setError(data.message || 'Invalid organization key');
            setIsVerified(false);
        }
    } catch (error) {
        setError('Failed to verify organization key');
        setIsVerified(false);
    } finally {
        setVerifying(false);
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isVerified) {
            setError('Please verify your organization key first');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/service/log-community', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('orgToken')}`
                },
                body: JSON.stringify({
                    studentName: formData.studentName,
                    hours: parseInt(formData.hoursCompleted),
                    dateCompleted: formData.dateOfCompletion,
                    description: formData.serviceDescription
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Service hours logged successfully!');
                setFormData({
                    orgKey: '',
                    studentName: '',
                    hoursCompleted: '',
                    dateOfCompletion: '',
                    serviceDescription: ''
                });
                setIsVerified(false);
            } else {
                setError(data.message || 'Failed to log service hours');
            }
        } catch (error) {
            setError('Failed to submit service hours');
        }
    };

    return (
        <div className="organization-form-container">
            <h2>Log Hours As An Organisation</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="orgKey">Organisation Key:</label>
                    <div className="key-input-group">
                        <input
                            type="text"
                            id="orgKey"
                            name="orgKey"
                            value={formData.orgKey}
                            onChange={handleChange}
                            disabled={isVerified}
                            required
                        />
                        <button 
                            type="button" 
                            onClick={verifyOrgKey}
                            disabled={verifying || isVerified}
                            className="verify-button"
                        >
                             {verifying ? 'Verifying...' : isVerified ? 'Verified' : 'Verify Key'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="studentName">Student Full Name:</label>
                    <input
                        type="text"
                        id="studentName"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleChange}
                        disabled={!isVerified}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="hoursCompleted">Number Of Hours:</label>
                    <input
                        type="number"
                        id="hoursCompleted"
                        name="hoursCompleted"
                        value={formData.hoursCompleted}
                        onChange={handleChange}
                        min="1"
                        max="24"
                        disabled={!isVerified}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="dateOfCompletion">Date Of Completion:</label>
                    <input
                        type="date"
                        id="dateOfCompletion"
                        name="dateOfCompletion"
                        value={formData.dateOfCompletion}
                        onChange={handleChange}
                        disabled={!isVerified}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="serviceDescription">Description Of Service:</label>
                    <textarea
                        id="serviceDescription"
                        name="serviceDescription"
                        value={formData.serviceDescription}
                        onChange={handleChange}
                        rows="4"
                        disabled={!isVerified}
                        required
                    />
                </div>

                <button type="submit" className="submit-button" disabled={!isVerified}>
                    Submit Hours
                </button>
                <button 
                    type="button" 
                    className="back-button"
                    onClick={() => navigate('/')}
                >
                    Back
                </button>
            </form>
        </div>
    );
}

export default OrganizationForm;