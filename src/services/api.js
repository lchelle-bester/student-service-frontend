// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-f1ba5.up.railway.app';

const apiCall = async (endpoint, options = {}) => {
    const fullUrl = `${API_BASE_URL}/api${endpoint}`;
    const parsedBody = options.body ? JSON.parse(options.body) : undefined;
    
    console.log('Full request details:', {
        url: fullUrl,
        method: options.method,
        body: parsedBody,
        headers: options.headers
    });

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

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
    studentLogin: async (email, password) => {
        console.log('Starting student login process with email:', email);
        return apiCall('/auth/login/student', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    teacherLogin: async (email, password) => {
        console.log('Starting teacher login process with email:', email);
        return apiCall('/auth/login/teacher', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }
};