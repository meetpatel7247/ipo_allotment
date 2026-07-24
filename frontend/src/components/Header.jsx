import React from 'react';
import { TrendingUp } from 'lucide-react';

const Header = ({ onApplyClick }) => {
  return (
    <header className="app-header">
      <div className="logo-section">
        <TrendingUp className="logo-icon" size={28} />
        <h1>IPO<span className="gradient-text">Apply</span></h1>
        <span className="header-tagline">Apply & Allotment Portal</span>
      </div>
      <div className="header-actions">
        {onApplyClick && (
          <button type="button" className="header-apply-btn" onClick={onApplyClick}>
            🚀 Apply for IPO
          </button>
        )}
        <div className="system-status">
          <span className="status-dot"></span>
          <span>Live IPO Data</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
