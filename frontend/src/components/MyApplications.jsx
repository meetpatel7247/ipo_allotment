import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/apply/applications`);
      setApplications(res.data);
    } catch (e) {
      console.error('Failed to fetch applications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationNo) => {
    try {
      await axios.post(`${API_BASE_URL}/apply/approve-mandate`, {
        applicationNo,
        status: 'Approved'
      });
      fetchApplications();
    } catch (e) {
      console.error('Failed to approve mandate:', e);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading your IPO Applications...</div>;
  }

  return (
    <div className="my-applications-container">
      <div className="section-header">
        <h2>📋 My Applied IPOs & Bids</h2>
        <button className="refresh-btn" onClick={fetchApplications}>🔄 Refresh List</button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <p>No IPO applications submitted yet.</p>
          <p>Go to the <strong>"🚀 Apply for IPO"</strong> tab to bid on active IPOs!</p>
        </div>
      ) : (
        <div className="applications-table-wrapper">
          <table className="applications-table">
            <thead>
              <tr>
                <th>App Reference No</th>
                <th>IPO Name</th>
                <th>Category</th>
                <th>Lots / Shares</th>
                <th>Total Amount</th>
                <th>Applicant ID</th>
                <th>UPI Handle</th>
                <th>Mandate Status</th>
                <th>Action</th>
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
                  <td><span className="badge-cat">{app.category || 'Retail'}</span></td>
                  <td>{app.lotCount} Lot ({app.lotCount * app.lotSize} Shares)</td>
                  <td className="amount-col">₹{app.totalAmount.toLocaleString('en-IN')}</td>
                  <td><span className="id-tag">{app.panOrBoIdType}: {app.panOrBoIdValue}</span></td>
                  <td><code>{app.upiId}</code></td>
                  <td>
                    <span className={`status-pill status-${(app.mandateStatus || 'sent').toLowerCase().replace(/\s+/g, '-')}`}>
                      {app.mandateStatus === 'Approved' ? '✅ Approved & Submitted' : app.mandateStatus || 'Mandate Sent'}
                    </span>
                  </td>
                  <td>
                    {app.mandateStatus !== 'Approved' && (
                      <button 
                        className="btn-approve-sm"
                        onClick={() => handleApprove(app.applicationNo)}
                      >
                        Approve Mandate
                      </button>
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
