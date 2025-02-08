// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSelection from './components/auth/LoginSelection';
import TeacherLogin from './components/auth/TeacherLogin';
import StudentLogin from './components/auth/StudentLogin';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard'; // Add this import
import OrganizationForm from './components/auth/OrganizationForm';  
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginSelection />} />
                    <Route path="/teacher-login" element={<TeacherLogin />} />
                    <Route path="/student-login" element={<StudentLogin />} />
                    <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                    <Route path="/organization-form" element={<OrganizationForm />} /> 
                    <Route path="/student-dashboard" element={<StudentDashboard />} /> {/* Add this route */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;