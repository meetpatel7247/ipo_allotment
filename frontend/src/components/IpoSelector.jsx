import React from 'react';

const IpoSelector = ({ ipos, value, onChange, showAll = false, disabled = false, required = false }) => {
  return (
    <div className="form-group">
      <label>Select IPO to Check {required && '*'}</label>
      <select 
        className="select-input" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {showAll && <option value="ALL">All IPOs (KFintech, Bigshare & MUFG)</option>}
        {ipos.map((ipo) => (
          <option key={ipo._id} value={ipo._id}>
            {ipo.name} ({ipo.symbol}) — {ipo.registrar}
          </option>
        ))}
      </select>
    </div>
  );
};

export default IpoSelector;
