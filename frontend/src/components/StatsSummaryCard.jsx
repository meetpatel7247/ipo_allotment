import React from 'react';
import { RefreshCw, Download } from 'lucide-react';

const StatsSummaryCard = ({ 
  title, 
  subtitle,
  stats, // { total, allotted, notAllotted, rate, amount }
  actionButton, // custom action button on the top right
  secondaryAction, // custom action button on the bottom left
  isBulk = false,
  borderLeftColor = 'var(--color-primary)'
}) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: `4px solid ${borderLeftColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: isBulk ? '1.1rem' : '0.85rem', margin: 0, color: isBulk ? '#fff' : 'var(--text-secondary)' }}>{title}</h3>
          {subtitle}
        </div>
        {actionButton}
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${isBulk ? 4 : 3}, 1fr)`, 
        gap: '0.5rem', 
        borderTop: '1px solid var(--border-color)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '0.75rem 0', 
        textAlign: 'center' 
      }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isBulk ? 'Total' : 'Scanned'}</span>
          <strong style={{ fontSize: '1.2rem' }}>{stats.total}</strong>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-success)' }}>Allotted</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>{stats.allotted}</strong>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-danger)' }}>{isBulk ? 'Refunded' : 'Not Allotted'}</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--color-danger)' }}>{stats.notAllotted}</strong>
        </div>
        {isBulk && (
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-primary)' }}>Rate</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{stats.rate}%</strong>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {secondaryAction}
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isBulk ? 'Total Blocked' : 'Total Allotted'}: <strong style={{ color: 'var(--color-success)' }}>₹{stats.amount.toLocaleString('en-IN')}</strong>
        </span>
      </div>
    </div>
  );
};

export default StatsSummaryCard;
