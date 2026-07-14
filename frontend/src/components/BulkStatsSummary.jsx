import React from 'react';
import { Download } from 'lucide-react';

const BulkStatsSummary = ({ stats, selectedIpo, handleExportExcel, handleClearFile }) => {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--color-success)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3>Allotment Summary Report</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            IPO: {selectedIpo?.name} ({selectedIpo?.symbol})
          </span>
        </div>
        <button type="button" className="submit-btn" onClick={handleExportExcel} style={{ marginTop: 0 }}>
          <Download size={16} /> Download Report
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '1rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div><span>Total</span><strong>{stats.total}</strong></div>
        <div><span style={{ color: 'var(--color-success)' }}>Allotted</span><strong style={{ color: 'var(--color-success)' }}>{stats.allotted}</strong></div>
        <div><span style={{ color: 'var(--color-danger)' }}>Refunded</span><strong style={{ color: 'var(--color-danger)' }}>{stats.notAllotted}</strong></div>
        <div><span style={{ color: 'var(--color-primary)' }}>Rate</span><strong style={{ color: 'var(--color-primary)' }}>{stats.rate}%</strong></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" className="secondary-btn" onClick={handleClearFile}>Check New File</button>
        <span style={{ fontSize: '0.85rem' }}>
          Total Blocked: <strong style={{ color: 'var(--color-success)' }}>₹{stats.amount.toLocaleString('en-IN')}</strong>
        </span>
      </div>
    </div>
  );
};

export default BulkStatsSummary;
