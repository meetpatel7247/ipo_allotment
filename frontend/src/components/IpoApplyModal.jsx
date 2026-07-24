import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const RETAIL_LIMIT = 200000;

const IpoApplyModal = ({ ipo, onClose, onApplicationSubmitted }) => {
  const [lotCount, setLotCount] = useState(1);
  const [category, setCategory] = useState('Retail Individual Investor (RII)');
  const [idType, setIdType] = useState('PAN');
  const [idValue, setIdValue] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(null);
  const [mandateApproved, setMandateApproved] = useState(false);

  if (!ipo) return null;

  const isUpcoming = ipo.biddingStatus === 'UPCOMING';
  const price = ipo.cutoffPrice || ipo.maxPrice || ipo.price || 150;
  const lotSize = ipo.lotSize || 100;
  const totalShares = lotCount * lotSize;
  const totalAmount = totalShares * price;
  const isRetail = category.includes('Retail') || category.includes('RII');
  const exceedsRetailLimit = isRetail && totalAmount > RETAIL_LIMIT;
  const maxLotsForRetail = isRetail ? Math.floor(RETAIL_LIMIT / (lotSize * price)) : 14;

  const handleIdChange = (e) => {
    let val = e.target.value;
    if (idType === 'PAN') {
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else {
      val = val.replace(/[^0-9]/g, '').slice(0, 16);
    }
    setIdValue(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!applicantName.trim()) {
      return setError('Enter applicant name as per PAN card.');
    }
    if (idType === 'PAN' && (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idValue))) {
      return setError('Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).');
    }
    if (idType === 'BO_ID' && (!/^\d{16}$/.test(idValue))) {
      return setError('Invalid Demat BO ID. Must be exactly 16 digits.');
    }
    if (!upiId.includes('@') || upiId.trim().length < 5) {
      return setError('Enter a valid UPI ID (e.g. username@okhdfcbank).');
    }
    if (exceedsRetailLimit) {
      return setError(`Retail limit is ₹2,00,000. Your bid is ₹${totalAmount.toLocaleString('en-IN')}. Reduce lots or select HNI.`);
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE_URL}/apply`, {
        ipoId: ipo._id,
        category,
        applicantName: applicantName.trim(),
        panOrBoIdType: idType,
        panOrBoIdValue: idValue,
        lotCount,
        upiId: upiId.trim(),
        bidAtCutoff: true
      });

      if (res.data.success) {
        setSubmittedApp(res.data.application);
        if (onApplicationSubmitted) onApplicationSubmitted();
      } else {
        setError(res.data.error || 'Failed to submit application.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Server error while processing IPO application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmMandate = async () => {
    if (!submittedApp) return;
    try {
      await axios.post(`${API_BASE_URL}/apply/approve-mandate`, {
        applicationNo: submittedApp.applicationNo,
        status: 'Approved'
      });
      setMandateApproved(true);
      if (onApplicationSubmitted) onApplicationSubmitted();
    } catch (e) {
      console.error(e);
    }
  };

  const getUpiAppDetails = (handle) => {
    if (!handle) return { name: 'UPI App', icon: '📲', color: '#10b981' };
    const lower = handle.toLowerCase();
    if (lower.includes('@okicici') || lower.includes('@okhdfcbank') || lower.includes('@okaxis') || lower.includes('@oksbi')) {
      return { name: 'Google Pay', icon: '🟦', color: '#4285F4' };
    }
    if (lower.includes('@ybl') || lower.includes('@ibl') || lower.includes('@axl')) {
      return { name: 'PhonePe', icon: '🟪', color: '#5f259f' };
    }
    if (lower.includes('@paytm')) {
      return { name: 'Paytm', icon: '🔷', color: '#00baf2' };
    }
    return { name: 'UPI App', icon: '📲', color: '#10b981' };
  };

  const upiApp = submittedApp ? getUpiAppDetails(submittedApp.upiId) : null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content ipo-apply-modal">
        <div className="modal-header">
          <div>
            <h2>{submittedApp ? '🎉 Application Submitted' : `${isUpcoming ? 'Pre-Apply' : 'Apply'} — ${ipo.name}`}</h2>
            <span className="sub-title">{ipo.symbol} | {ipo.registrar} | ASBA UPI Bidding</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {!submittedApp ? (
          <form onSubmit={handleSubmit} className="modal-body">
            {error && <div className="error-banner">⚠️ {error}</div>}

            <div className="form-group">
              <label>Applicant Name (as per PAN)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Full name as on PAN card"
                value={applicantName}
                onChange={(e) => { setApplicantName(e.target.value); setError(''); }}
                required
              />
            </div>

            <div className="form-group">
              <label>Investor Category</label>
              <div className="radio-group">
                <button
                  type="button"
                  className={`radio-btn ${category === 'Retail Individual Investor (RII)' ? 'active' : ''}`}
                  onClick={() => setCategory('Retail Individual Investor (RII)')}
                >
                  Retail (Max ₹2 Lakhs)
                </button>
                <button
                  type="button"
                  className={`radio-btn ${category === 'Non-Institutional Investor (HNI)' ? 'active' : ''}`}
                  onClick={() => setCategory('Non-Institutional Investor (HNI)')}
                >
                  HNI (&gt; ₹2 Lakhs)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Number of Lots (Bid at Cut-off ₹{price})</label>
              <div className="lot-selector-box">
                <div className="lot-controls">
                  <button type="button" className="lot-btn" onClick={() => setLotCount(Math.max(1, lotCount - 1))} disabled={lotCount <= 1}>-</button>
                  <div className="lot-display">
                    <span className="lot-num">{lotCount} {lotCount === 1 ? 'Lot' : 'Lots'}</span>
                    <span className="shares-count">({totalShares} Shares @ ₹{price}/share)</span>
                  </div>
                  <button
                    type="button"
                    className="lot-btn"
                    onClick={() => setLotCount(Math.min(isRetail ? maxLotsForRetail : 14, lotCount + 1))}
                    disabled={lotCount >= (isRetail ? maxLotsForRetail : 14)}
                  >+</button>
                </div>
                <div className={`amount-summary ${exceedsRetailLimit ? 'amount-exceeded' : ''}`}>
                  <span>Total Bid Amount:</span>
                  <span className="total-price">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                {isRetail && (
                  <span className="field-hint">Retail limit: ₹2,00,000 | Max {maxLotsForRetail} lot(s) at this price</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Demat & Applicant ID</label>
              <div className="tab-switcher">
                <button type="button" className={`tab-btn-mini ${idType === 'PAN' ? 'active' : ''}`} onClick={() => { setIdType('PAN'); setIdValue(''); }}>PAN Number</button>
                <button type="button" className={`tab-btn-mini ${idType === 'BO_ID' ? 'active' : ''}`} onClick={() => { setIdType('BO_ID'); setIdValue(''); }}>16-Digit Demat BO ID</button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder={idType === 'PAN' ? 'ABCDE1234F' : '1208160012345678'}
                value={idValue}
                onChange={handleIdChange}
                maxLength={idType === 'PAN' ? 10 : 16}
                required
              />
            </div>

            <div className="form-group">
              <label>UPI ID for ASBA Fund Block</label>
              <input
                type="text"
                className="input-field"
                placeholder="username@okhdfcbank / 9876543210@paytm / user@ybl"
                value={upiId}
                onChange={(e) => { setUpiId(e.target.value.toLowerCase()); setError(''); }}
                required
              />
              <span className="field-hint">💡 NPCI ASBA mandate will be sent to your UPI app to block ₹{totalAmount.toLocaleString('en-IN')} until allotment.</span>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting || exceedsRetailLimit}>
                {submitting ? 'Submitting Bid...' : `${isUpcoming ? 'Pre-Apply' : 'Apply'} (₹${totalAmount.toLocaleString('en-IN')})`}
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
                    <h3>{isUpcoming ? 'Pre-Application Registered' : 'IPO Bid Submitted'}</h3>
                    <p className="app-no-tag">App No: <strong>{submittedApp.applicationNo}</strong></p>
                  </div>
                </div>

                <div className="groww-steps-timeline">
                  <div className="timeline-step step-done">
                    <div className="step-num">1</div>
                    <div className="step-content">
                      <h4>Bid Registered</h4>
                      <p>{submittedApp.lotCount} Lot ({submittedApp.lotCount * submittedApp.lotSize} Shares) @ ₹{submittedApp.cutoffPrice}</p>
                    </div>
                  </div>
                  <div className="timeline-step step-active">
                    <div className="step-num animated-pulse">2</div>
                    <div className="step-content">
                      <h4>UPI ASBA Mandate Sent</h4>
                      <p>Approve on <code>{submittedApp.upiId}</code> — Block ₹{submittedApp.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="timeline-step step-pending">
                    <div className="step-num">3</div>
                    <div className="step-content">
                      <h4>Exchange Confirmation</h4>
                      <p>Bid submitted to NSE/BSE after UPI PIN approval</p>
                    </div>
                  </div>
                </div>

                <div className="groww-instruction-card">
                  <div className="inst-top">
                    <span className="app-icon">{upiApp.icon}</span>
                    <div>
                      <h4>Open {upiApp.name} & Approve Mandate</h4>
                      <p className="vpa-text">UPI: <code>{submittedApp.upiId}</code></p>
                    </div>
                  </div>

                  <div className="upi-qr-wrap">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(submittedApp.upiDeepLink)}`}
                      alt="UPI Mandate QR"
                      className="upi-qr-img"
                    />
                    <span className="qr-hint">📷 Scan with {upiApp.name} on mobile</span>
                  </div>

                  <p className="inst-desc">
                    1. Open <strong>{upiApp.name}</strong> and approve the ASBA mandate request.<br />
                    2. Enter UPI PIN to block <strong>₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong>.<br />
                    3. Click below once approved on your phone.
                  </p>
                </div>

                <div className="action-buttons-wrap">
                  <button
                    type="button"
                    className="btn-upi-direct animated-glow"
                    style={{ background: upiApp.color, color: '#fff' }}
                    onClick={() => {
                      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                        window.location.href = submittedApp.upiDeepLink;
                      } else {
                        window.open(submittedApp.upiDeepLink, '_blank');
                        navigator.clipboard?.writeText(submittedApp.upiDeepLink);
                        alert(`Link copied! Open ${upiApp.name} on your phone.`);
                      }
                    }}
                  >
                    ⚡ Open {upiApp.name} to Approve
                  </button>
                  <button type="button" className="btn-approve-sim" onClick={handleConfirmMandate}>
                    ✅ I've Approved UPI Mandate on Phone
                  </button>
                </div>
              </div>
            ) : (
              <div className="groww-success-confirmation">
                <div className="success-badge-icon">🎉</div>
                <h3 className="text-green">Bid Successfully Placed!</h3>
                <p className="success-sub">₹{submittedApp.totalAmount.toLocaleString('en-IN')} blocked via ASBA UPI. Bid submitted to Stock Exchange.</p>

                <div className="app-summary-card">
                  <div className="sum-row"><span>Application No:</span><strong>{submittedApp.applicationNo}</strong></div>
                  <div className="sum-row"><span>IPO:</span><strong>{submittedApp.ipoName}</strong></div>
                  <div className="sum-row"><span>Applicant:</span><strong>{submittedApp.applicantName || 'Investor'}</strong></div>
                  <div className="sum-row"><span>Quantity:</span><strong>{submittedApp.lotCount} Lot ({submittedApp.lotCount * submittedApp.lotSize} Shares)</strong></div>
                  <div className="sum-row"><span>Blocked Amount:</span><strong className="text-green">₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong></div>
                  <div className="sum-row"><span>Status:</span><strong className="text-green">✅ Mandate Approved & Bid Live</strong></div>
                </div>

                <div className="approved-badge-box">
                  ✅ Your IPO application is live. Check allotment status on the allotment date.
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
