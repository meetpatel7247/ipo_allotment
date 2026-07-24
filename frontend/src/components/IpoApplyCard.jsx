import React from 'react';

const IpoApplyCard = ({ ipo, onApplyClick }) => {
  const isOpen = ipo.biddingStatus === 'OPEN';
  const isUpcoming = ipo.biddingStatus === 'UPCOMING';
  const isClosed = ipo.biddingStatus === 'CLOSED';

  const minPrice = ipo.minPrice || ipo.price || 150;
  const maxPrice = ipo.maxPrice || ipo.cutoffPrice || ipo.price || 150;
  const priceDisplay = minPrice !== maxPrice ? `₹${minPrice} – ₹${maxPrice}` : `₹${maxPrice}`;
  const lotSize = ipo.lotSize || 100;
  const minInvestment = ipo.minInvestment || lotSize * maxPrice;

  const dateLabel = isOpen
    ? `Closes: ${ipo.closingDate || 'Soon'}${ipo.closingTime ? ` @ ${ipo.closingTime}` : ''}`
    : isUpcoming
    ? `Opens: ${ipo.closingDate || ipo.biddingStartDate || 'TBA'}`
    : `Closed: ${ipo.closingDate || '—'}`;

  return (
    <div className={`ipo-apply-card ${!isOpen && !isUpcoming ? 'card-disabled' : ''}`}>
      <div className="card-top">
        <div className="ipo-badge-wrap">
          <span className={`status-pill ${isOpen ? 'open-live' : isUpcoming ? 'pre-apply' : 'closed-live'}`}>
            {isOpen ? '🟢 OPEN NOW' : isUpcoming ? '⏰ UPCOMING' : '🔴 CLOSED'}
          </span>
          <span className="category-pill">{ipo.category || 'Mainboard'}</span>
        </div>
        <span className="registrar-tag">{ipo.registrar}</span>
      </div>

      <div className="card-header-main">
        {ipo.logoUrl ? (
          <img src={ipo.logoUrl} alt={ipo.name} className="company-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="company-icon">{ipo.name.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <h3 className="company-title">{ipo.name}</h3>
          <span className="symbol-code">NSE/BSE: {ipo.symbol}</span>
        </div>
      </div>

      {ipo.additionalInfo && (
        <div className="ipo-additional-info">{ipo.additionalInfo}</div>
      )}

      <div className="pricing-grid">
        <div className="price-item">
          <span className="label">Price Band</span>
          <span className="value">{priceDisplay}</span>
        </div>
        <div className="price-item">
          <span className="label">Lot Size</span>
          <span className="value">{lotSize} Shares</span>
        </div>
        <div className="price-item">
          <span className="label">Min. Investment</span>
          <span className="value highlight">₹{minInvestment.toLocaleString('en-IN')}</span>
        </div>
        <div className="price-item">
          <span className="label">Subscription</span>
          <span className="value sub-rate">
            {ipo.subscriptionRate ? `${Number(ipo.subscriptionRate).toFixed(2)}x` : '—'}
          </span>
        </div>
      </div>

      <div className="ipo-date-row">
        <span className="date-label">{dateLabel}</span>
      </div>

      <div className="card-actions">
        {isOpen ? (
          <button className="apply-btn btn-open" onClick={() => onApplyClick(ipo)}>
            ⚡ Apply for IPO
          </button>
        ) : isUpcoming ? (
          <button className="apply-btn btn-pre" onClick={() => onApplyClick(ipo)}>
            📝 Pre-Apply Now
          </button>
        ) : (
          <button className="apply-btn btn-disabled" disabled>
            🔒 Bidding Closed
          </button>
        )}
      </div>
    </div>
  );
};

export default IpoApplyCard;
