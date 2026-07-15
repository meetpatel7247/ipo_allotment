import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import SingleChecker from './components/SingleChecker';
import BulkChecker from './components/BulkChecker';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function App() {
  const [ipos, setIpos] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeMode, setActiveMode] = useState('single');
  const [selectedIpoId, setSelectedIpoId] = useState('ALL');
  const [searchType, setSearchType] = useState('PAN');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({ totalQueries: 0, allotmentRate: 0, activeIpos: 0 });
  const [activeStep, setActiveStep] = useState(0);
  const [simulationSteps, setSimulationSteps] = useState([
    { name: 'KFintech Live API', resultStatus: 'pending' },
    { name: 'Bigshare Live API', resultStatus: 'pending' }
  ]);

  useEffect(() => {
    fetchIPOs(); fetchHistory();
  }, []);

  useEffect(() => {
    const total = history.length;
    const active = ipos.filter(i => i.status === 'Active').length;
    const allotted = history.filter(h => h.status === 'Allotted').length;
    setStats({ totalQueries: total, allotmentRate: total > 0 ? Math.round((allotted / total) * 100) : 0, activeIpos: active });
  }, [history, ipos]);

  const fetchIPOs = async () => {
    try { setIpos((await axios.get(`${API_BASE_URL}/ipos`)).data); } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try { setHistory((await axios.get(`${API_BASE_URL}/history`)).data); } catch (e) { console.error(e); }
  };

  const handleReset = () => {
    setResults(null); setSearchValue(''); setSelectedIpoId('ALL'); setErrors({});
  };

  const handleValueChange = (e) => {
    let val = e.target.value;
    if (searchType === 'PAN') val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    else if (searchType === 'ApplicationNo') val = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
    else val = val.replace(/[^0-9]/g, '').slice(0, 16);
    setSearchValue(val);
    if (errors.searchValue) setErrors({ ...errors, searchValue: '' });
  };

  const handleCheckAllotment = async (e) => {
    e.preventDefault();
    if (!searchValue) return setErrors({ searchValue: `Enter your ${searchType === 'PAN' ? 'PAN' : searchType === 'ApplicationNo' ? 'App No' : 'Demat ID'}.` });
    if (searchType === 'PAN' && (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(searchValue) || searchValue.length !== 10)) {
      return setErrors({ searchValue: 'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter.' });
    }

    let initialSteps = [];
    if (selectedIpoId === 'ALL') {
      initialSteps = [
        { name: 'KFintech Live API', resultStatus: 'pending' },
        { name: 'Bigshare Live API', resultStatus: 'pending' }
      ];
    } else {
      const selectedIpo = ipos.find(i => i._id === selectedIpoId);
      if (selectedIpo) {
        initialSteps = [
          { name: `${selectedIpo.registrar} Live API`, resultStatus: 'pending' }
        ];
      } else {
        initialSteps = [
          { name: 'KFintech Live API', resultStatus: 'pending' },
          { name: 'Bigshare Live API', resultStatus: 'pending' }
        ];
      }
    }

    try {
      setLoading(true); setResults(null);
      setSimulationSteps(initialSteps);
      const res = await axios.post(`${API_BASE_URL}/check-allotment`, { ipoId: selectedIpoId, searchType, searchValue }, { timeout: selectedIpoId === 'ALL' ? 600000 : 120000 });
      const registrarDetails = res.data.allRegistrarsDetails;

      setActiveStep(0);
      await new Promise(r => setTimeout(r, 400));
      
      const updatedSteps = initialSteps.map(step => {
        if (step.name.includes('KFintech')) {
          const kf = registrarDetails.find(r => r.registrar === 'KFintech') || { status: 'No Record Found' };
          return { ...step, resultStatus: kf.status };
        } else if (step.name.includes('Bigshare')) {
          const bs = registrarDetails.find(r => r.registrar === 'Bigshare') || { status: 'No Record Found' };
          return { ...step, resultStatus: bs.status };
        }
        return step;
      });
      setSimulationSteps(updatedSteps);

      setActiveStep(initialSteps.length);
      await new Promise(r => setTimeout(r, 200));
      setResults(res.data.results); setLoading(false); fetchHistory();
    } catch (err) {
      setLoading(false); setErrors({ apiError: err.response?.data?.error || 'Allotment lookup failed.' });
    }
  };

  const summary = results ? {
    total: results.length,
    allotted: results.filter(r => r.status === 'Allotted').length,
    notAllotted: results.filter(r => r.status === 'Not Allotted').length,
    totalAmount: results.reduce((acc, curr) => acc + curr.amount, 0)
  } : null;

  return (
    <div className="app-container">
      <Header />
      <StatsGrid ipoCount={ipos.length} queryCount={stats.totalQueries} successRate={stats.allotmentRate} />

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginTop: '0.5rem' }}>
        <button type="button" className={`tab-btn ${activeMode === 'single' ? 'active' : ''}`} onClick={() => { setActiveMode('single'); handleReset(); }}>Single Account Checker</button>
        <button type="button" className={`tab-btn ${activeMode === 'bulk' ? 'active' : ''}`} onClick={() => setActiveMode('bulk')}>Excel / CSV Bulk Verify</button>
      </div>

      {activeMode === 'single' ? (
        <SingleChecker
          ipos={ipos} loading={loading} errors={errors} searchType={searchType} searchValue={searchValue}
          selectedIpoId={selectedIpoId} results={results} handleCheckAllotment={handleCheckAllotment}
          handleTabChange={(t) => { setSearchType(t); setSearchValue(''); setErrors({}); }}
          handleValueChange={handleValueChange} setSelectedIpoId={setSelectedIpoId} handleReset={handleReset} summary={summary}
          activeStep={activeStep} simulationSteps={simulationSteps}
        />
      ) : (
        <main><BulkChecker ipos={ipos} fetchHistory={fetchHistory} /></main>
      )}

      <footer className="app-footer">
        <p>© 2026 IPO Allotment Status Portal. Live data from KFintech & Bigshare registrars.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#help">Help Support</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
