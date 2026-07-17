import React from 'react';
import { Search, RefreshCw, User, FileText, CreditCard, Grid } from 'lucide-react';
import ResultCard from './ResultCard';
import Loader from './Loader';
import IpoSelector from './IpoSelector';
import SearchTabs from './SearchTabs';
import StatsSummaryCard from './StatsSummaryCard';

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
          <IpoSelector
            ipos={ipos}
            value={selectedIpoId}
            onChange={setSelectedIpoId}
            showAll={true}
            disabled={loading}
          />

          {/* Search Credential Type Tabs */}
          <SearchTabs
            activeTab={searchType}
            onChange={handleTabChange}
            disabled={loading}
          />

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
            <StatsSummaryCard
              title="Search Receipt"
              subtitle={
                <span className="gradient-text" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {searchType}: {searchValue.toUpperCase()}
                </span>
              }
              stats={{
                total: summary.total,
                allotted: summary.allotted,
                notAllotted: summary.notAllotted,
                amount: summary.totalAmount
              }}
              secondaryAction={
                <button type="button" className="secondary-btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={handleReset}>
                  <RefreshCw size={14} /> Check Another
                </button>
              }
              borderLeftColor="var(--color-primary)"
            />

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
