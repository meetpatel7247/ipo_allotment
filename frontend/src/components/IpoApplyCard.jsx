import React from 'react';

const IpoApplyCard = ({ ipo, onApplyClick }) => {
  const isPreApply = ipo.biddingStatus === 'PRE_APPLY';
  const priceDisplay = ipo.cutoffPrice ? `₹${ipo.cutoffPrice}` : `₹${ipo.price || 150}`;
  const minInvestment = (ipo.lotSize || 100) * (ipo.cutoffPrice || ipo.price || 150);

  return (
    <div className="ipo-apply-card">
      <div className="card-top">
        <div className="ipo-badge-wrap">
          <span className={`status-pill ${isPreApply ? 'pre-apply' : 'open-live'}`}>
            {isPreApply ? '⚡ PRE-APPLY' : '🟢 OPEN NOW'}
          </span>
          <span className="category-pill">{ipo.category || 'Mainboard'}</span>
        </div>
        <span className="registrar-tag">{ipo.registrar}</span>
      </div>

      <div className="card-header-main">
        <div className="company-icon">{ipo.name.charAt(0).toUpperCase()}</div>
        <div>
          <h3 className="company-title">{ipo.name}</h3>
          <span className="symbol-code">BSE/NSE: {ipo.symbol}</span>
        </div>
      </div>

      <div className="pricing-grid">
        <div className="price-item">
          <span className="label">Cut-off Price</span>
          <span className="value">{priceDisplay}</span>
        </div>
        <div className="price-item">
          <span className="label">Lot Size</span>
          <span className="value">{ipo.lotSize || 100} Shares</span>
        </div>
        <div className="price-item">
          <span className="label">Min. Investment</span>
          <span className="value highlight">₹{minInvestment.toLocaleString('en-IN')}</span>
        </div>
        <div className="price-item">
          <span className="label">Subscription</span>
          <span className="value sub-rate">{ipo.subscriptionRate || 4.5}x</span>
        </div>
      </div>

      <div className="card-actions">
        <button 
          className={`apply-btn ${isPreApply ? 'btn-pre' : 'btn-open'}`}
          onClick={() => onApplyClick(ipo)}
        >
          {isPreApply ? '🚀 Pre-Apply Now' : '⚡ Apply for IPO'}
        </button>
      </div>
    </div>
  );
};

export default IpoApplyCard;
