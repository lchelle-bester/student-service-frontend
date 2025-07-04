import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import '../../styles/Login.css';

function StudentLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.studentLogin(email);
            if (response.token && response.user) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('userData', JSON.stringify(response.user));
                navigate('/student-dashboard');
            }
        } catch (error) {
            setError(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <div className="login-form-container">
        <h2>Student Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
                <label htmlFor="email">School Email Address:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your school email"
                    disabled={isLoading}
                    required
                />
            </div>

            <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
            >
                {isLoading ? 'Logging in...' : 'Log In'}
            </button>
            
            <button
                type="button"
                className="back-button"
                onClick={() => navigate('/')}
                disabled={isLoading}
            >
                Back
            </button>
        </form>
    </div>
);
}

export default StudentLogin;