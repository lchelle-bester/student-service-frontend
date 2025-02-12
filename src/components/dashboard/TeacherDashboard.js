import React, { useState } from 'react';
import StudentDetailsModal from './StudentDetailsModal';
import '../../styles/TeacherDashboard.css';

function TeacherDashboard() {
    const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-f1ba5.up.railway.app';
    
    const [serviceForm, setServiceForm] = useState({
        studentName: '',
        numberOfHours: '',
        dateCompleted: '',
        description: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);

    const handleServiceFormChange = (e) => {
        const { name, value } = e.target;
        setServiceForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const TOKEN_KEY = 'authToken';

    const handleSubmitService = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem(TOKEN_KEY);

        try {
            console.log('Token:', token);
            const response = await fetch(`${API_URL}/api/service/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentName: serviceForm.studentName,
                    numberOfHours: parseInt(serviceForm.numberOfHours),
                    dateCompleted: serviceForm.dateCompleted,
                    description: serviceForm.description
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Service hours logged successfully!');
                setServiceForm({
                    studentName: '',
                    numberOfHours: '',
                    dateCompleted: '',
                    description: ''
                });
            } else {
                alert(data.message || 'Failed to log service hours');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit service hours');
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_URL}/api/service/search-students?query=${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setSearchResults(data);
                setError('');
            } else {
                setError('Failed to fetch students');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setError('Error searching for students');
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudentDetails = async (studentId) => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_URL}/api/service/student-details/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setStudentDetails(data);
                setSelectedStudent(data.student);
            } else {
                console.error('Failed to fetch student details');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/';
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Teacher Dashboard</h1>
                <button className="logout-button" onClick={handleLogout}>
                    Log Out
                </button>
            </header>

            {/* Rest of your JSX remains the same */}
            <div className="dashboard-content">
                <section className="log-hours-section">
                    {/* Your existing form JSX */}
                    {/* ... */}
                </section>

                <section className="search-section">
                    {/* Your existing search section JSX */}
                    {/* ... */}
                </section>
            </div>

            {selectedStudent && studentDetails && (
                <StudentDetailsModal
                    student={selectedStudent}
                    serviceRecords={studentDetails.serviceRecords}
                    onClose={() => {
                        setSelectedStudent(null);
                        setStudentDetails(null);
                    }}
                />
            )}
        </div>
    );
}

export default TeacherDashboard;