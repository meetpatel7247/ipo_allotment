import React from 'react';

const SearchTabs = ({ activeTab, onChange, disabled = false, shortLabels = false }) => {
  const tabs = [
    { value: 'PAN', full: 'PAN Number', short: 'PANs' },
    { value: 'ApplicationNo', full: 'Application No', short: 'Apps' },
    { value: 'DematNo', full: 'Demat / DP ID', short: 'Demats' }
  ];

  return (
    <div className="form-group">
      <label>Search {shortLabels ? 'Key' : 'Credential'} Type</label>
      <div className="search-type-tabs">
        {tabs.map(tab => (
          <button 
            key={tab.value}
            type="button" 
            className={`tab-btn ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => onChange(tab.value)}
            disabled={disabled}
          >
            {shortLabels ? tab.short : tab.full}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchTabs;
