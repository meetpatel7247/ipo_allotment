import React from 'react';
import { Layers, Activity, ShieldCheck } from 'lucide-react';

const StatsGrid = ({ ipoCount, queryCount, successRate }) => {
  return (
    <section className="stats-grid">
      <div className="glass-card stat-card">
        <div className="stat-info">
          <span>Total Tracked IPOs</span>
          <h3>{ipoCount}</h3>
        </div>
        <div className="stat-icon">
          <Layers size={22} />
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-info">
          <span>Checks Performed</span>
          <h3>{queryCount}</h3>
        </div>
        <div className="stat-icon">
          <Activity size={22} />
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-info">
          <span>Allotment Success Rate</span>
          <h3>{successRate}%</h3>
        </div>
        <div className="stat-icon">
          <ShieldCheck size={22} />
        </div>
      </div>
    </section>
  );
};

export default StatsGrid;
