// src/components/auth/TeacherLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';  // This line is crucial - it imports our authentication service

function TeacherLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            console.log('Attempting teacher login with:', { email });
            const response = await authService.teacherLogin(email, password);
            console.log('Login response:', response);
            
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('userData', JSON.stringify(response.user));
                navigate('/teacher-dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };   

    return (
        <div className="login-form-container">
            <h2>Teacher Login</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">School Email:</label>
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

export default TeacherLogin;