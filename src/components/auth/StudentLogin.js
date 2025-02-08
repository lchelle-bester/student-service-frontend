// StudentLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import '../../styles/Login.css';

function StudentLogin() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e) => {
    console.log('Attempting login with:', {
        studentId: studentId,
        password: password
    });
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const response = await authService.studentLogin(studentId, password);
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
                    <label htmlFor="studentId">Curro email:</label>
                    <input
                        type="text"
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Enter your Curro Email"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
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