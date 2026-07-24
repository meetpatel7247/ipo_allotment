import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panFilter, setPanFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async (pan = '') => {
    try {
      setLoading(true);
      const url = pan ? `${API_BASE_URL}/apply/applications?pan=${encodeURIComponent(pan)}` : `${API_BASE_URL}/apply/applications`;
      const res = await axios.get(url);
      setApplications(res.data);
    } catch (e) {
      console.error('Failed to fetch applications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationNo) => {
    try {
      await axios.post(`${API_BASE_URL}/apply/approve-mandate`, { applicationNo, status: 'Approved' });
      fetchApplications(panFilter);
    } catch (e) {
      console.error('Failed to approve mandate:', e);
    }
  };

  const handleCancel = async (applicationNo) => {
    if (!window.confirm('Cancel this IPO application?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/apply/${applicationNo}`);
      fetchApplications(panFilter);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to cancel application.');
    }
  };

  const handlePanSearch = (e) => {
    e.preventDefault();
    fetchApplications(panFilter);
  };

  if (loading) {
    return <div className="loading-state">Loading your IPO Applications...</div>;
  }

  return (
    <div className="my-applications-container">
      <div className="section-header">
        <h2>📋 My IPO Applications</h2>
        <button className="refresh-btn" onClick={() => fetchApplications(panFilter)}>🔄 Refresh</button>
      </div>

      <form className="pan-filter-bar" onSubmit={handlePanSearch}>
        <input
          type="text"
          className="pan-filter-input"
          placeholder="Filter by PAN (first 5 chars e.g. ABCDE)"
          value={panFilter}
          onChange={(e) => setPanFilter(e.target.value.toUpperCase().slice(0, 10))}
          maxLength={10}
        />
        <button type="submit" className="pan-filter-btn">Search</button>
        {panFilter && (
          <button type="button" className="pan-filter-btn secondary" onClick={() => { setPanFilter(''); fetchApplications(); }}>
            Clear
          </button>
        )}
      </form>

      {applications.length === 0 ? (
        <div className="empty-state">
          <p>No IPO applications found.</p>
          <p>Go to <strong>🚀 Apply for IPO</strong> tab to bid on live open IPOs!</p>
        </div>
      ) : (
        <div className="applications-table-wrapper">
          <table className="applications-table">
            <thead>
              <tr>
                <th>App No</th>
                <th>IPO</th>
                <th>Applicant</th>
                <th>Lots / Shares</th>
                <th>Amount</th>
                <th>UPI</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id || app.applicationNo}>
                  <td className="app-no-col">
                    <strong>{app.applicationNo}</strong>
                    <br />
                    <small>{new Date(app.timestamp || app.createdAt).toLocaleString('en-IN')}</small>
                  </td>
                  <td><strong>{app.ipoName}</strong></td>
                  <td>{app.applicantName || '—'}</td>
                  <td>{app.lotCount} Lot ({app.lotCount * app.lotSize} Shares)</td>
                  <td className="amount-col">₹{app.totalAmount.toLocaleString('en-IN')}</td>
                  <td><code>{app.upiId}</code></td>
                  <td>
                    <span className={`status-pill status-${(app.mandateStatus || 'sent').toLowerCase().replace(/\s+/g, '-')}`}>
                      {app.mandateStatus === 'Approved' ? '✅ Approved' : app.mandateStatus || 'Mandate Sent'}
                    </span>
                  </td>
                  <td className="action-col">
                    {app.mandateStatus !== 'Approved' && (
                      <>
                        <button className="btn-approve-sm" onClick={() => handleApprove(app.applicationNo)}>
                          Approve
                        </button>
                        <button className="btn-cancel-sm" onClick={() => handleCancel(app.applicationNo)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
