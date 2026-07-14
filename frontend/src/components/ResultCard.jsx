import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Share2, Layers } from 'lucide-react';

const ResultCard = ({ res, searchType, searchValue, handleReset }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Allotted':
        return <CheckCircle2 size={24} />;
      case 'Not Allotted':
        return <XCircle size={24} />;
      default:
        return <AlertCircle size={24} />;
    }
  };

  return (
    <div 
      className={`glass-card result-card ${res.status.toLowerCase().replace(' ', '-')}`}
      style={{ minHeight: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>{res.ipoName}</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
            <Layers size={12} style={{ color: 'var(--color-primary)' }} /> {res.registrar} | Lot Size: {res.lotSize} shares
          </span>
        </div>
        <span className={`badge ${res.status.toLowerCase().replace(' ', '-')}`} style={{ gap: '0.25rem' }}>
          {getStatusIcon(res.status)}
          {res.status}
        </span>
      </div>

      <div className="result-details" style={{ margin: 0, padding: '0.75rem', gap: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
        <div className="detail-row" style={{ fontSize: '0.85rem' }}>
          <span className="detail-label">Shares Allotted</span>
          <strong className={`detail-value ${res.sharesAllotted > 0 ? 'success' : ''}`}>
            {res.sharesAllotted} shares {res.sharesAllotted > 0 ? `(1 Lot)` : ''}
          </strong>
        </div>
        <div className="detail-row" style={{ fontSize: '0.85rem' }}>
          <span className="detail-label">Offer Price</span>
          <span className="detail-value">₹{res.price} / share</span>
        </div>
        {res.sharesAllotted > 0 && (
          <div className="detail-row" style={{ fontSize: '0.85rem' }}>
            <span className="detail-label">Total Amount Allotted</span>
            <strong className="detail-value success">₹{res.amount.toLocaleString('en-IN')}</strong>
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem', fontStyle: 'italic' }}>
        {res.remarks}
      </div>
    </div>
  );
};

export default ResultCard;
