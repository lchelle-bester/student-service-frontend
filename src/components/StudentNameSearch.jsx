// src/components/StudentNameSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/StudentNameSearch.css';

const StudentNameSearch = ({ 
  onSelectStudent, 
  currentValue,
  placeholder = "Search for student...",
  studentIndex = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.studentservicediary.co.za';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStudents = async (query) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/api/students/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setHighlightedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchStudents(value);
    }, 300);
  };

  const handleSelectStudent = (student) => {
    onSelectStudent(student.name, studentIndex);
    setIsOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectStudent(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen && currentValue && !searchQuery) {
      setSearchQuery(currentValue);
      searchStudents(currentValue);
    }
  }, [isOpen]);

  return (
    <div className="student-name-search" ref={searchRef}>
      <button
        type="button"
        className="search-trigger-button"
        onClick={() => setIsOpen(true)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" strokeWidth="2"/>
        </svg>
        Search for similar names
      </button>

      {isOpen && (
        <div className="search-dropdown">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" strokeWidth="2"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder={placeholder}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              type="button"
              className="search-close-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="search-results">
            {isLoading && (
              <div className="search-loading">
                <div className="loading-spinner"></div>
                Searching...
              </div>
            )}

            {!isLoading && suggestions.length === 0 && searchQuery.length >= 2 && (
              <div className="search-no-results">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                </svg>
                <p>No students found matching "{searchQuery}"</p>
                <span className="search-hint">Try a different spelling or first name only</span>
              </div>
            )}

            {!isLoading && searchQuery.length < 2 && (
              <div className="search-hint-message">
                Type at least 2 characters to search
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
              <ul className="search-suggestions-list">
                {suggestions.map((student, index) => (
                  <li
                    key={student.id}
                    className={`search-suggestion-item ${
                      index === highlightedIndex ? 'highlighted' : ''
                    }`}
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div className="suggestion-content">
                      <span className="suggestion-name">{student.name}</span>
                      {student.grade && (
                        <span className="suggestion-grade">Grade {student.grade}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNameSearch;