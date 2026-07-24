import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const IpoApplyModal = ({ ipo, onClose, onApplicationSubmitted }) => {
  const [lotCount, setLotCount] = useState(1);
  const [category, setCategory] = useState('Retail Individual Investor (RII)');
  const [idType, setIdType] = useState('PAN'); // 'PAN' or 'BO_ID'
  const [idValue, setIdValue] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(null);
  const [mandateApproved, setMandateApproved] = useState(false);

  if (!ipo) return null;

  const price = ipo.cutoffPrice || ipo.price || 150;
  const lotSize = ipo.lotSize || 100;
  const totalShares = lotCount * lotSize;
  const totalAmount = totalShares * price;

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

  const handleUpiChange = (e) => {
    setUpiId(e.target.value.toLowerCase());
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (idType === 'PAN' && (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idValue))) {
      return setError('Invalid PAN Card format. Must be 10 characters (e.g. ABCDE1234F).');
    }
    if (idType === 'BO_ID' && (!/^\d{16}$/.test(idValue))) {
      return setError('Invalid Demat BO ID format. Must be exactly 16 digits (DP ID + Client ID).');
    }
    if (!upiId.includes('@') || upiId.trim().length < 5) {
      return setError('Enter a valid UPI ID (e.g. username@okhdfcbank or 9876543210@paytm).');
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE_URL}/apply`, {
        ipoId: ipo._id,
        category,
        panOrBoIdType: idType,
        panOrBoIdValue: idValue,
        lotCount,
        upiId: upiId.trim()
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

  const handleSimulateMandateApprove = async () => {
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
              <label>UPI ID for AutoPay Mandate Block</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                value={upiId}
                onChange={handleUpiChange}
                required
              />
              <span className="field-hint">💡 An official UPI AutoPay payment block link will be sent to your UPI App (PhonePe, GPay, Paytm).</span>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Processing Bid Application...' : `Submit Application (₹${totalAmount.toLocaleString('en-IN')})`}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body mandate-success-body">
            <div className="success-badge-icon">✅</div>
            <h3>Application Registered Successfully!</h3>
            <p className="app-no-tag">Application Reference No: <strong>{submittedApp.applicationNo}</strong></p>

            <div className="app-summary-card">
              <div className="sum-row">
                <span>IPO Name:</span>
                <strong>{submittedApp.ipoName}</strong>
              </div>
              <div className="sum-row">
                <span>Applied Quantity:</span>
                <strong>{submittedApp.lotCount} Lot ({submittedApp.lotCount * submittedApp.lotSize} Shares)</strong>
              </div>
              <div className="sum-row">
                <span>Total Amount Blocked:</span>
                <strong className="text-green">₹{submittedApp.totalAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="sum-row">
                <span>Applicant Details:</span>
                <strong>{submittedApp.panOrBoIdType}: {submittedApp.panOrBoIdValue}</strong>
              </div>
              <div className="sum-row">
                <span>UPI Handle:</span>
                <strong>{submittedApp.upiId}</strong>
              </div>
            </div>

            <div className="mandate-step-box">
              <h4>📲 UPI AutoPay Mandate Action</h4>
              <p>A mandate notification has been dispatched to <strong>{submittedApp.upiId}</strong>.</p>
              
              <div className="action-buttons-wrap">
                {submittedApp.upiDeepLink && (
                  <a href={submittedApp.upiDeepLink} target="_blank" rel="noreferrer" className="btn-upi-direct">
                    ⚡ Open UPI App to Approve Mandate
                  </a>
                )}
                {!mandateApproved ? (
                  <button type="button" className="btn-approve-sim" onClick={handleSimulateMandateApprove}>
                    ✅ Approve Mandate Now (Simulate Approval)
                  </button>
                ) : (
                  <div className="approved-badge">
                    🎉 Mandate Approved & Bid Confirmed to Stock Exchange!
                  </div>
                )}
              </div>
            </div>

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
