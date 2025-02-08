// components/dashboard/StudentDetailsView.js
import React from 'react';
import '../../styles/StudentDetailsView.css';

// This component will be a modal that overlays the teacher dashboard
function StudentDetailsView({ student, onClose }) {
    // In a real application, we would fetch complete student data here
    // For now, we'll use sample service records
    const serviceRecords = [
        {
            hours: 3,
            type: 'School',
            assignedBy: 'Mrs. Johnson',
            date: '2024-01-15',
            description: 'Library organization and assistance'
        },
        {
            hours: 4,
            type: 'Community',
            assignedBy: 'Food Bank',
            date: '2024-01-20',
            description: 'Food sorting and distribution'
        }
    ];

    // Calculate total hours and percentages
    const totalHours = serviceRecords.reduce((sum, record) => sum + record.hours, 0);
    const schoolHours = serviceRecords
        .filter(record => record.type === 'School')
        .reduce((sum, record) => sum + record.hours, 0);
    const communityHours = serviceRecords
        .filter(record => record.type === 'Community')
        .reduce((sum, record) => sum + record.hours, 0);

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{student.name}'s Service Record</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="student-summary">
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Student ID:</label>
                            <span>{student.id}</span>
                        </div>
                        <div className="info-item">
                            <label>Grade:</label>
                            <span>{student.grade}</span>
                        </div>
                        <div className="info-item">
                            <label>Total Hours:</label>
                            <span>{totalHours}</span>
                        </div>
                    </div>

                    <div className="hours-breakdown">
                        <div className="progress-section">
                            <label>Hours Distribution</label>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill school"
                                    style={{ width: `${(schoolHours/totalHours) * 100}%` }}
                                    title={`School Hours: ${schoolHours}`}
                                />
                                <div 
                                    className="progress-fill community"
                                    style={{ width: `${(communityHours/totalHours) * 100}%` }}
                                    title={`Community Hours: ${communityHours}`}
                                />
                            </div>
                            <div className="legend">
                                <span><div className="legend-color school"></div>School: {schoolHours} hours</span>
                                <span><div className="legend-color community"></div>Community: {communityHours} hours</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="service-records">
                    <h3>Service History</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Hours</th>
                                <th>Type</th>
                                <th>Assigned By</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceRecords.map((record, index) => (
                                <tr key={index}>
                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                    <td>{record.hours}</td>
                                    <td>{record.type}</td>
                                    <td>{record.assignedBy}</td>
                                    <td>{record.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StudentDetailsView;