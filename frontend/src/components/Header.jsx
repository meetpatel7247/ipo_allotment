import React from 'react';
import { TrendingUp } from 'lucide-react';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo-section">
        <TrendingUp className="logo-icon" size={28} />
        <h1>IPO<span className="gradient-text">Allotment</span></h1>
      </div>
      <div className="system-status">
        <span className="status-dot"></span>
        <span>Registrars Online</span>
      </div>
    </header>
  );
};

export default Header;
