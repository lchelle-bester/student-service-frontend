import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import './FloatingHelpButton.css';

const FloatingHelpButton = ({ userInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        className={`floating-help-button ${isHovered ? 'hovered' : ''}`}
        onClick={handleOpenModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Report an issue or give feedback"
      >
        <div className="help-icon">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" 
              fill="currentColor"
            />
          </svg>
        </div>
        
        <div className="help-text">
          Report Issue
        </div>
      </div>

      <FeedbackModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userInfo={userInfo}
      />
    </>
  );
};

export default FloatingHelpButton;