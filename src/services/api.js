// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-f1ba5.up.railway.app';

const apiCall = async (endpoint, options = {}) => {
    // Log the complete request details
    console.log('Making API call to:', `${API_BASE_URL}${endpoint}`);
    console.log('Request options:', {
        ...options,
        body: options.body ? JSON.parse(options.body) : undefined
    });

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        // Log the complete response
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred during login. Please try again.');
        }

        return data;
    } catch (error) {
        console.error('Detailed error information:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export const authService = {
    teacherLogin: async (email, password) => {
        console.log('Starting teacher login process with email:', email);
        return apiCall('/auth/login/teacher', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    studentLogin: async (studentId, password) => {
        console.log('Starting student login process with ID:', studentId);
        return apiCall('/auth/login/student', {
            method: 'POST',
            body: JSON.stringify({ studentId, password })
        });
    }
};