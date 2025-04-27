// StudentDetailsModal.js
import React from 'react';
import '../../styles/StudentDetailsModal.css';

function StudentDetailsModal({ student, serviceRecords, onClose }) {
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{student.full_name}'s Details</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="student-details">
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Grade:</label>
                            <span>{student.grade}</span>
                        </div>
                        <div className="info-item">
                            <label>Total Community Service Hours:</label>
                            <span>{student.communityHours}</span>
                        </div>
                        <div className="info-item">
                            <label>Total School Service Hours:</label>
                            <span>{student.schoolHours}</span>
                        </div>
                    </div>

                    <div className="service-history">
                        <h3>Service History</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Hours</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Verified By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceRecords && serviceRecords.length > 0 ? (
                                    serviceRecords.map((record) => (
                                        <tr key={record.id}>
                                            <td>{new Date(record.date_completed).toLocaleDateString()}</td>
                                            <td>{record.hours}</td>
                                            <td>{record.service_type}</td>
                                            <td>{record.description}</td>
                                            <td>{record.assigned_by}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="no-records">
                                            No service records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDetailsModal;