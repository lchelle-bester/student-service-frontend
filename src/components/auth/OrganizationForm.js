import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Login.css'; // Using the same styling as login forms for consistency

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
        <div className="login-form-container">
            <h2>Organization Verification</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form className="login-form" onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
            }}>
                <div className="form-group">
                    <label htmlFor="orgKey">Organization Key:</label>
                    <input
                        type="text"
                        id="orgKey"
                        value={orgKey}
                        onChange={(e) => setOrgKey(e.target.value)}
                        placeholder="Enter organization key"
                        required
                    />
                </div>

                <button type="submit" className="submit-button">
                    Verify
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