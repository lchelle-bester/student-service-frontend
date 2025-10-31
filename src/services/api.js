// src/services/api.js
const API_BASE_URL = 'https://api.studentservicediary.co.za';

const apiCall = async (endpoint, options = {}) => {
    const fullUrl = API_BASE_URL.endsWith('/')
        ? `${API_BASE_URL}api${endpoint}`
        : `${API_BASE_URL}/api${endpoint}`;

    const parsedBody = options.body ? JSON.parse(options.body) : undefined;

    console.log('Full request details:', {
        url: fullUrl,
        method: options.method,
        body: parsedBody,
        headers: options.headers,
    });

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(
                data.message ||
                    'An error occurred during login. Please try again.'
            );
        }

        return data;
    } catch (error) {
        console.error('Detailed error information:', {
            message: error.message,
            stack: error.stack,
        });
        throw error;
    }
};

export const authService = {
    teacherLogin: async (email, password) => {
        console.log('Starting teacher login with:', { email });
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        };
        console.log('Request options:', requestOptions);
        return apiCall('/auth/login/teacher', requestOptions);
    },

    // 🧠 UPDATED: Students now log in with full name (case & space insensitive)
    studentLogin: async (name) => {
        const normalizedName = name.toLowerCase().trim(); // normalize before sending
        console.log('Starting student login with normalized name:', normalizedName);

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: normalizedName }),
        };
        console.log('Request options:', requestOptions);
        return apiCall('/auth/login/student', requestOptions);
    },
};
