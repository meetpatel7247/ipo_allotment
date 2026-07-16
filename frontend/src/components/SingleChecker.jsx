import React from 'react';
import { Search, RefreshCw, User, FileText, CreditCard, Grid } from 'lucide-react';
import ResultCard from './ResultCard';
import Loader from './Loader';

const SingleChecker = ({
  ipos,
  loading,
  errors,
  searchType,
  searchValue,
  selectedIpoId,
  results,
  handleCheckAllotment,
  handleTabChange,
  handleValueChange,
  setSelectedIpoId,
  handleReset,
  summary,
  activeStep,
  simulationSteps
}) => {
  return (
    <main className="main-grid">
      {/* Checker Form */}
      <section className="glass-card checker-section">
        <div className="checker-title">
          <h2>Instant IPO Allotment Checker</h2>
          <p>
            Enter your details and check real allotment status from{' '}
            {selectedIpoId === 'ALL'
              ? 'KFintech, Bigshare & MUFG registrars'
              : `${ipos.find(i => i._id === selectedIpoId)?.registrar || 'the'} registrar`
            }.
          </p>
        </div>

        <form onSubmit={handleCheckAllotment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Select IPO */}
          <div className="form-group">
            <label>Select IPO to Check</label>
            <select 
              className="select-input" 
              value={selectedIpoId} 
              onChange={(e) => setSelectedIpoId(e.target.value)}
              disabled={loading}
            >
              <option value="ALL">All IPOs (KFintech, Bigshare & MUFG)</option>
              {ipos.map((ipo) => (
                <option key={ipo._id} value={ipo._id}>
                  {ipo.name} ({ipo.symbol}) — {ipo.registrar}
                </option>
              ))}
            </select>
          </div>

          {/* Search Credential Type Tabs */}
          <div className="form-group">
            <label>Search Credential Type</label>
            <div className="search-type-tabs">
              {['PAN', 'ApplicationNo', 'DematNo'].map(type => (
                <button 
                  key={type}
                  type="button" 
                  className={`tab-btn ${searchType === type ? 'active' : ''}`}
                  onClick={() => handleTabChange(type)}
                  disabled={loading}
                >
                  {type === 'PAN' ? 'PAN Number' : type === 'ApplicationNo' ? 'Application No' : 'Demat / DP ID'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {searchType === 'PAN' && <User size={16} />}
              {searchType === 'ApplicationNo' && <FileText size={16} />}
              {searchType === 'DematNo' && <CreditCard size={16} />}
              Enter {searchType === 'PAN' ? 'PAN Number' : searchType === 'ApplicationNo' ? 'Application Number' : 'Demat Account Number'} *
            </label>
            <input 
              type="text" 
              className="text-input" 
              placeholder={
                searchType === 'PAN' 
                  ? 'Enter 10-digit PAN (e.g., ABCDE1234F)' 
                  : searchType === 'ApplicationNo' 
                    ? 'Enter application number|PAN' 
                    : 'Enter 16-digit Demat account number'
              }
              value={searchValue}
              onChange={handleValueChange}
              disabled={loading}
              style={{ textTransform: searchType === 'PAN' ? 'uppercase' : 'none', letterSpacing: searchType === 'PAN' ? '0.05em' : 'normal' }}
            />
            {errors.searchValue && <span className="error-msg">{errors.searchValue}</span>}
            {errors.apiError && <span className="error-msg" style={{ marginTop: '0.5rem' }}>{errors.apiError}</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={loading || ipos.length === 0}>
            {loading ? (
              <>
                <RefreshCw className="spin" size={18} />{' '}
                Checking{' '}
                {selectedIpoId === 'ALL'
                  ? 'Registrar Live APIs'
                  : `${ipos.find(i => i._id === selectedIpoId)?.registrar || 'Registrar'} Live API`
                }...
              </>
            ) : (
              <><Search size={18} /> Check Allotment Status</>
            )}
          </button>
        </form>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Live Registrar Data</span>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Results are fetched directly from KFintech, Bigshare, and MUFG&apos;s official allotment APIs. Select an IPO or scan all IPOs at once.
          </p>
        </div>
      </section>

      {/* Outcome Results Panel */}
      <section style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {loading && (
          <Loader 
            searchType={searchType === 'PAN' ? 'PAN' : searchType === 'ApplicationNo' ? 'Application' : 'Demat Account'}
            searchValue={searchValue.toUpperCase()}
            activeStep={activeStep}
            steps={simulationSteps}
          />
        )}
        {!loading && results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Summary Receipts Card */}
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Search Receipt</span>
                <span className="gradient-text" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{searchType}: {searchValue.toUpperCase()}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', textAlign: 'center' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scanned</span>
                  <strong style={{ fontSize: '1.2rem' }}>{summary.total}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-success)' }}>Allotted</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>{summary.allotted}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-danger)' }}>Not Allotted</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--color-danger)' }}>{summary.notAllotted}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="secondary-btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={handleReset}>
                  <RefreshCw size={14} /> Check Another
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total Allotted: <strong style={{ color: 'var(--color-success)' }}>₹{summary.totalAmount.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {results.map((res) => (
              <ResultCard 
                key={res.ipoSymbol} 
                res={res} 
                searchType={searchType} 
                searchValue={searchValue} 
                handleReset={handleReset} 
              />
            ))}
          </div>
        )}

        {!loading && !results && (
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', color: 'var(--text-secondary)', textAlign: 'center', gap: '1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', margin: '0 auto' }}>
              <Grid size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Query Performed</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>Enter details and click the Search button to check your IPO allotment status.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default SingleChecker;
