import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const IpoSelector = ({ ipos, value, onChange, showAll = false, disabled = false, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Find the selected IPO
  const getSelectedLabel = () => {
    if (value === 'ALL') {
      return 'All IPOs (KFintech, Bigshare & MUFG)';
    }
    const ipo = ipos.find(i => i._id === value);
    return ipo ? `${ipo.name} (${ipo.symbol}) — ${ipo.registrar}` : 'Select IPO...';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter IPOs based on search text
  const filteredIpos = ipos.filter(ipo => 
    ipo.name.toLowerCase().includes(search.toLowerCase()) ||
    ipo.symbol.toLowerCase().includes(search.toLowerCase()) ||
    ipo.registrar.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label>Select IPO to Check {required && '*'}</label>
      
      {/* Dropdown Toggle Trigger Button */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
          boxShadow: isOpen ? '0 0 10px rgba(0, 242, 254, 0.15)' : 'none',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'var(--transition-smooth)',
          userSelect: 'none',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getSelectedLabel()}
        </span>
        <ChevronDown size={18} style={{ color: 'var(--text-secondary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#0b0f19',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          marginTop: '0.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', gap: '0.5rem' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text"
              placeholder="Search IPO by name, symbol, or registrar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                width: '100%',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {showAll && (
              <div 
                onClick={() => handleSelect('ALL')}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  background: value === 'ALL' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                  color: value === 'ALL' ? 'var(--color-primary)' : 'var(--text-primary)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.target.style.background = value === 'ALL' ? 'rgba(0, 242, 254, 0.1)' : 'transparent'}
              >
                All IPOs (KFintech, Bigshare & MUFG)
              </div>
            )}
            
            {filteredIpos.map((ipo) => (
              <div 
                key={ipo._id}
                onClick={() => handleSelect(ipo._id)}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  background: value === ipo._id ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                  color: value === ipo._id ? 'var(--color-primary)' : 'var(--text-primary)',
                  transition: 'background 0.2s',
                  borderTop: '1px solid rgba(255, 255, 255, 0.02)'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.target.style.background = value === ipo._id ? 'rgba(0, 242, 254, 0.1)' : 'transparent'}
              >
                {ipo.name} ({ipo.symbol}) — {ipo.registrar}
              </div>
            ))}

            {filteredIpos.length === 0 && (!showAll || search !== '') && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                No IPOs match &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IpoSelector;
