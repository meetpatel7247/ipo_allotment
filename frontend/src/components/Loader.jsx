import React from 'react';
import { Loader2, CheckCircle2, XCircle, Search, HelpCircle } from 'lucide-react';

/**
 * Loader component displays live KFintech API check progress.
 */
const Loader = ({ searchType, searchValue, activeStep, steps }) => {
  const hasKFintech = steps.some(s => s.name.includes('KFintech'));
  const hasBigshare = steps.some(s => s.name.includes('Bigshare'));
  const hasMUFG = steps.some(s => s.name.includes('MUFG'));
  let loaderTitle = 'Checking Registrars';
  if (hasKFintech && !hasBigshare && !hasMUFG) loaderTitle = 'Checking KFintech';
  else if (hasBigshare && !hasKFintech && !hasMUFG) loaderTitle = 'Checking Bigshare';
  else if (hasMUFG && !hasKFintech && !hasBigshare) loaderTitle = 'Checking MUFG';

  return (
    <div className="glass-card simulation-card">
      <div className="sim-header" style={{ textAlign: 'center' }}>
        <div className="sim-loader-spinner" style={{ margin: '0 auto 1rem auto' }}>
          <div className="outer-ring"></div>
          <div className="inner-icon">
            <Search size={32} />
          </div>
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{loaderTitle}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Verifying {searchType} <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{searchValue}</span> with live registrar data...
        </p>
      </div>

      <div className="simulation-steps">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          const isCompleted = activeStep > idx;
          const isPending = activeStep < idx;

          let statusClass = 'pending';
          let StatusIcon = HelpCircle;

          if (isActive) {
            statusClass = 'running';
            StatusIcon = Loader2;
          } else if (isCompleted) {
            statusClass = step.resultStatus === 'No Record Found' ? 'notFound' : 'success';
            StatusIcon = step.resultStatus === 'No Record Found' ? XCircle : CheckCircle2;
          }

          return (
            <div 
              key={step.name} 
              className={`step-row ${isActive ? 'active' : ''}`}
            >
              <div className="step-left">
                <div className={`step-status-icon ${statusClass}`}>
                  <StatusIcon size={18} className={isActive ? 'spin' : ''} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: isActive ? '600' : '400', color: isPending ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {step.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: isPending ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                    {isActive 
                      ? 'Fetching live allotment data...' 
                      : isCompleted 
                        ? step.resultStatus === 'No Record Found' 
                          ? 'Check complete (no records)' 
                          : 'Allotment data received'
                        : 'Waiting...'}
                  </span>
                </div>
              </div>

              {!isPending && isCompleted && (
                <span 
                  className={`step-result-badge ${step.resultStatus === 'No Record Found' ? 'none' : 'found'}`}
                >
                  {step.resultStatus === 'No Record Found' ? 'No Record' : 'Record Found'}
                </span>
              )}

              {!isPending && isActive && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>
                  Scanning...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Loader;
