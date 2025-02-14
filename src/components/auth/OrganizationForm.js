// OrganizationForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function OrganizationForm() {
    const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-f1ba5.up.railway.app';
    const navigate = useNavigate();
    const [orgKey, setOrgKey] = useState('');
    const [error, setError] = useState('');

    const handleVerify = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/verify/organization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orgKey })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store the organization token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('orgData', JSON.stringify(data.organization));
                navigate('/organization-dashboard');
            } else {
                setError(data.message || 'Failed to verify organization key');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setError('Failed to verify organization key');
        }
    };

    return (
        <div className="organization-form">
            <h2>Organization Verification</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
                <label htmlFor="orgKey">Organization Key:</label>
                <input
                    type="text"
                    id="orgKey"
                    value={orgKey}
                    onChange={(e) => setOrgKey(e.target.value)}
                    placeholder="Enter organization key"
                />
            </div>
            <button onClick={handleVerify}>Verify</button>
            <button onClick={() => navigate('/')}>Back</button>
        </div>
    );
}

export default OrganizationForm;