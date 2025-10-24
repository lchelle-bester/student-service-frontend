// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSelection from './components/auth/LoginSelection';
import TeacherLogin from './components/auth/TeacherLogin';
import StudentLogin from './components/auth/StudentLogin';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard'; 
import OrganizationForm from './components/auth/OrganizationForm';  
import './App.css';

function App() {
    // Maintenance mode check - add this BEFORE the return statement
    if (process.env.REACT_APP_MAINTENANCE_MODE === 'true') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #53a352 100%)',
                color: 'white',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '40px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)',
                    maxWidth: '500px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔧</div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', margin: '0 0 20px 0' }}>
                        Under Maintenance
                    </h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '15px', opacity: 0.9 }}>
                        Student Service Diary is currently undergoing important security updates.
                    </p>
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
                        We'll be back shortly!
                    </p>
                    <div style={{ marginTop: '30px', fontSize: '0.9rem', opacity: 0.8 }}>
                        <p>For urgent inquiries, please contact:</p>
                        <p><strong>lchelle.best@gmail.com</strong></p>
                    </div>
                </div>
            </div>
        );
    }

    // Your normal app continues here
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginSelection />} />
                    <Route path="/teacher-login" element={<TeacherLogin />} />
                    <Route path="/student-login" element={<StudentLogin />} />
                    <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                    <Route path="/organization-form" element={<OrganizationForm />} /> 
                    <Route path="/student-dashboard" element={<StudentDashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;