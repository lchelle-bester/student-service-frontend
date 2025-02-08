import React, { useState } from 'react';
import StudentDetailsModal from './StudentDetailsModal';
import '../../styles/TeacherDashboard.css';

function TeacherDashboard() {
    // States for logging hours form
    const [serviceForm, setServiceForm] = useState({
        studentName: '',
        numberOfHours: '',
        dateCompleted: '',
        description: ''
    });

    // States for student search and details
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);

    // Handle service form changes
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
        console.log('Token:', token); // Add this before fetch
        const response = await fetch('http://localhost:5000/api/service/log', {
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

    // Handle student search
    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/service/search-students?query=${query}`);
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

    // Fetch student details
    const fetchStudentDetails = async (studentId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/service/student-details/${studentId}`);
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

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Teacher Dashboard</h1>
                <button className="logout-button" onClick={() => window.history.back()}>
                    Log Out
                </button>
            </header>

            <div className="dashboard-content">
                {/* Left section: Log Service Hours */}
                <section className="log-hours-section">
                    <h2>Log School Service Hours</h2>
                    <form onSubmit={handleSubmitService} className="service-form">
                        <div className="form-group">
                            <label htmlFor="studentName">Student Full Name:</label>
                            <input
                                type="text"
                                id="studentName"
                                name="studentName"
                                value={serviceForm.studentName}
                                onChange={handleServiceFormChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="numberOfHours">Number of Hours:</label>
                            <input
                                type="number"
                                id="numberOfHours"
                                name="numberOfHours"
                                value={serviceForm.numberOfHours}
                                onChange={handleServiceFormChange}
                                min="0"
                                max="24"
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
                            <label htmlFor="description">Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={serviceForm.description}
                                onChange={handleServiceFormChange}
                                rows="4"
                                required
                            />
                        </div>

                        <button type="submit" className="submit-button">
                            Submit Hours
                        </button>
                    </form>
                </section>

                {/* Right section: Search Students */}
                <section className="search-section">
                    <h2>Search For Students</h2>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>

                    {isLoading && <div className="loading">Searching...</div>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="search-results">
    {searchResults.map(student => (
        <div key={student.id} className="student-card">
            <div className="student-info">
                <h3>{student.full_name}</h3>
                <p>ID: {student.student_id}</p>
                <p>Grade: {student.grade}</p>
                <p>Total Hours: {student.total_hours || 0}</p>
            </div>
            <button 
                className="view-details-button"
                onClick={() => {
                    console.log('Selected student:', student); // Add this to debug
                    fetchStudentDetails(student.id);
                }}
            >
                View Details
            </button>
        </div>
    ))}
    
    {/* Add this to render the modal */}
    {selectedStudent && studentDetails && (
        <StudentDetailsModal
            student={selectedStudent}
            serviceRecords={studentDetails.serviceRecords || []}
            onClose={() => {
                setSelectedStudent(null);
                setStudentDetails(null);
            }}
        />
    )}
</div>
                </section>
            </div>

            {/* Student Details Modal */}
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

//logout

export default TeacherDashboard;
