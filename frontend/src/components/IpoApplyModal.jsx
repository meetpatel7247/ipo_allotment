  // Helper to detect UPI App Provider from handle
  const getUpiAppDetails = (handle) => {
    if (!handle) return { name: 'UPI App', icon: '📲', color: '#10b981' };
    const lower = handle.toLowerCase();
    if (lower.includes('@okicici') || lower.includes('@okhdfcbank') || lower.includes('@okaxis') || lower.includes('@oksbi')) {
      return { name: 'Google Pay (GPay)', icon: '🟦', color: '#4285F4' };
    }
    if (lower.includes('@ybl') || lower.includes('@ibl') || lower.includes('@axl')) {
      return { name: 'PhonePe', icon: '🟪', color: '#5f259f' };
    }
    if (lower.includes('@paytm')) {
      return { name: 'Paytm', icon: '🔷', color: '#00baf2' };
    }
    if (lower.includes('@bhim') || lower.includes('@upi')) {
      return { name: 'BHIM UPI', icon: '🇮🇳', color: '#f59e0b' };
    }
    return { name: 'UPI App', icon: '📲', color: '#10b981' };
  };

  const upiApp = submittedApp ? getUpiAppDetails(submittedApp.upiId) : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content ipo-apply-modal">
        <div className="modal-header">
          <div>
            <h2>{submittedApp ? '🎉 Application Submitted' : `Apply for ${ipo.name}`}</h2>
            <span className="sub-title">Symbol: {ipo.symbol} | Registrar: {ipo.registrar}</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {!submittedApp ? (
          <form onSubmit={handleSubmit} className="modal-body">
            {error && <div className="error-banner">⚠️ {error}</div>}

            {/* Investor Category */}
            <div className="form-group">
              <label>Investor Category</label>
              <div className="radio-group">
                <button
                  type="button"
                  className={`radio-btn ${category === 'Retail Individual Investor (RII)' ? 'active' : ''}`}
                  onClick={() => setCategory('Retail Individual Investor (RII)')}
                >
                  Retail Individual Investor (Max ₹2 Lakhs)
                </button>
                <button
                  type="button"
                  className={`radio-btn ${category === 'Non-Institutional Investor (HNI)' ? 'active' : ''}`}
                  onClick={() => setCategory('Non-Institutional Investor (HNI)')}
                >
                  HNI Category (&gt; ₹2 Lakhs)
                </button>
              </div>
            </div>

            {/* Quantity & Lot Selector */}
            <div className="form-group">
              <label>Select Number of Lots</label>
              <div className="lot-selector-box">
                <div className="lot-controls">
                  <button 
                    type="button" 
                    className="lot-btn" 
                    onClick={() => setLotCount(Math.max(1, lotCount - 1))}
                    disabled={lotCount <= 1}
                  >
                    -
                  </button>
                  <div className="lot-display">
                    <span className="lot-num">{lotCount} {lotCount === 1 ? 'Lot' : 'Lots'}</span>
                    <span className="shares-count">({totalShares} Shares @ ₹{price}/share)</span>
                  </div>
                  <button 
                    type="button" 
                    className="lot-btn" 
                    onClick={() => setLotCount(Math.min(14, lotCount + 1))}
                    disabled={lotCount >= 14}
                  >
                    +
                  </button>
                </div>
                <div className="amount-summary">
                  <span>Total Bid Amount:</span>
                  <span className="total-price">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Demat Identification Details */}
            <div className="form-group">
              <label>Demat & Applicant Identification</label>
              <div className="tab-switcher">
                <button 
                  type="button" 
                  className={`tab-btn-mini ${idType === 'PAN' ? 'active' : ''}`}
                  onClick={() => { setIdType('PAN'); setIdValue(''); }}
                >
                  PAN Card Number
                </button>
                <button 
                  type="button" 
                  className={`tab-btn-mini ${idType === 'BO_ID' ? 'active' : ''}`}
                  onClick={() => { setIdType('BO_ID'); setIdValue(''); }}
                >
                  16-Digit Demat BO ID
                </button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder={idType === 'PAN' ? 'Enter 10-digit PAN (e.g. ABCDE1234F)' : 'Enter 16-digit Demat BO ID / DP Client ID'}
                value={idValue}
                onChange={handleIdChange}
                maxLength={idType === 'PAN' ? 10 : 16}
                required
              />
            </div>

            {/* UPI ID for AutoPay Mandate */}
            <div className="form-group">
              <label>UPI VPA ID for AutoPay Mandate Block</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. username@okhdfcbank, 9876543210@paytm, or user@ybl"
                value={upiId}
                onChange={handleUpiChange}
                required
              />
              <span className="field-hint">💡 Official NPCI AutoPay Mandate request will be sent to your GPay / PhonePe / Paytm app.</span>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Dispatching NPCI AutoPay Mandate...' : `Submit Application (₹${totalAmount.toLocaleString('en-IN')})`}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body mandate-success-body">
            {!mandateApproved ? (
              <div className="groww-timeline-box">
                <div className="timeline-header">
                  <div className="pulse-icon">⏳</div>
                  <div>
                    <h3>IPO Application Submitted</h3>
                    <p className="app-no-tag">App No: <strong>{submittedApp.applicationNo}</strong></p>
                  </div>
                </div>

                {/* Groww 3-Step Progress Timeline */}
                <div className="groww-steps-timeline">
                  <div className="timeline-step step-done">
                    <div className="step-num">1</div>
                    <div className="step-content">
                      <h4>Application Placed</h4>
                      <p>Bid for {submittedApp.lotCount} Lot ({submittedApp.lotCount * submittedApp.lotSize} Shares) registered</p>
                    </div>
                  </div>

                  <div className="timeline-step step-active">
                    <div className="step-num animated-pulse">2</div>
                    <div className="step-content">
                      <h4>AutoPay Mandate Sent to {upiApp.name}</h4>
                      <p>Request sent to <code>{submittedApp.upiId}</code> for blocking <strong>₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong></p>
                    </div>
                  </div>

                  <div className="timeline-step step-pending">
                    <div className="step-num">3</div>
                    <div className="step-content">
                      <h4>Exchange Confirmation</h4>
                      <p>Awaiting UPI AutoPay PIN authorization</p>
                    </div>
                  </div>
                </div>

                {/* Groww Style Mandate Instructions Card */}
                <div className="groww-instruction-card">
                  <div className="inst-top">
                    <span className="app-icon">{upiApp.icon}</span>
                    <div>
                      <h4>Open {upiApp.name} to Pay & Approve</h4>
                      <p className="vpa-text">Target VPA: <code>{submittedApp.upiId}</code></p>
                    </div>
                  </div>
                  <p className="inst-desc">
                    1. Open your <strong>{upiApp.name}</strong> app on your mobile.<br />
                    2. Go to <strong>Profile &gt; AutoPay / Mandates</strong> section.<br />
                    3. Enter your <strong>UPI PIN</strong> to authorize fund block of <strong>₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong>.
                  </p>
                </div>

                <div className="action-buttons-wrap">
                  <button 
                    type="button" 
                    className="btn-upi-direct"
                    style={{ background: upiApp.color }}
                    onClick={() => {
                      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                        window.location.href = submittedApp.upiDeepLink;
                      } else {
                        navigator.clipboard.writeText(submittedApp.upiDeepLink);
                        alert(`📋 AutoPay link copied! Open ${upiApp.name} on your phone or scan QR code above.`);
                      }
                    }}
                  >
                    ⚡ Open {upiApp.name} App to Pay
                  </button>

                  <button type="button" className="btn-approve-sim" onClick={handleSimulateMandateApprove}>
                    ✅ I have Authorized Payment / Approve AutoPay Now
                  </button>
                </div>
              </div>
            ) : (
              /* Groww Step 3: SUCCESS CONFIRMATION STATE */
              <div className="groww-success-confirmation">
                <div className="success-badge-icon">🎉</div>
                <h3 className="text-green">AutoPay Mandate Successful!</h3>
                <p className="success-sub">Fund of <strong>₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong> successfully blocked at bank & Bid submitted to Stock Exchange (NSE/BSE).</p>

                <div className="app-summary-card">
                  <div className="sum-row">
                    <span>Application No:</span>
                    <strong>{submittedApp.applicationNo}</strong>
                  </div>
                  <div className="sum-row">
                    <span>IPO Company:</span>
                    <strong>{submittedApp.ipoName}</strong>
                  </div>
                  <div className="sum-row">
                    <span>Applied Quantity:</span>
                    <strong>{submittedApp.lotCount} Lot ({submittedApp.lotCount * submittedApp.lotSize} Shares)</strong>
                  </div>
                  <div className="sum-row">
                    <span>Blocked Amount:</span>
                    <strong className="text-green">₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="sum-row">
                    <span>Payment Status:</span>
                    <strong className="text-green">✅ AutoPay Mandate Approved</strong>
                  </div>
                </div>

                <div className="approved-badge-box">
                  ✅ Your IPO application is successfully placed. Allotment status will be updated on allotment date.
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IpoApplyModal;

