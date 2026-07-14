import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Upload, Download, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import BulkResultsTable from './BulkResultsTable';
import BulkStatsSummary from './BulkStatsSummary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const BulkChecker = ({ ipos, fetchHistory }) => {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedColumnIdx, setSelectedColumnIdx] = useState(0);
  const [selectedIpoId, setSelectedIpoId] = useState('');
  const [searchType, setSearchType] = useState('PAN');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ipos.length > 0 && !selectedIpoId) setSelectedIpoId(ipos[0]._id);
  }, [ipos, selectedIpoId]);

  const processFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) return setError('Upload Excel (.xlsx, .xls) or CSV files only.');
    setFile(selectedFile); setError(''); setResults(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!rawData || rawData.length === 0) return setError('Spreadsheet is empty.');
        setHeaders(rawData[0]);
        setParsedRows(rawData.slice(1).filter(r => r.some(c => c !== '')));
      } catch (err) { setError('Failed to parse file.'); }
    };
    reader.readAsBinaryString(selectedFile);
  };

  useEffect(() => {
    if (headers.length > 0) {
      const idx = headers.findIndex(h => {
        const name = String(h).toUpperCase().replace(/[^A-Z]/g, '');
        return (searchType === 'PAN' && name.includes('PAN')) ||
               (searchType === 'ApplicationNo' && name.includes('APP')) ||
               (searchType === 'DematNo' && (name.includes('DEMAT') || name.includes('CLIENT')));
      });
      setSelectedColumnIdx(idx !== -1 ? idx : 0);
    }
  }, [searchType, headers]);

  const handleClearFile = () => {
    setFile(null); setHeaders([]); setParsedRows([]); setResults(null); setError('');
  };

  const handleBulkCheck = async () => {
    if (!selectedIpoId) return setError('Select an IPO first.');
    const checkValues = parsedRows.map(row => String(row[selectedColumnIdx] || '').trim()).filter(v => v !== '');
    if (checkValues.length === 0) return setError('No values in selected column.');
    if (searchType === 'PAN' && checkValues.some(v => !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(v))) return setError('Invalid PAN format found in column.');

    try {
      setLoading(true); setError(''); setResults(null);
      const res = await axios.post(`${API_BASE_URL}/check-bulk-allotment`, { ipoId: selectedIpoId, searchType, values: checkValues }, { timeout: 600000 });
      const merged = parsedRows.map(row => {
        const key = String(row[selectedColumnIdx] || '').trim().toUpperCase();
        const check = res.data.results.find(r => r.searchKey === key);
        return { rowCells: row, searchKey: key, status: check ? check.status : 'Invalid/Error', sharesAllotted: check ? check.sharesAllotted : 0, amount: check ? check.amount : 0, remarks: check ? check.remarks : 'Error.' };
      });
      setResults(merged); setLoading(false); fetchHistory();
    } catch (err) {
      setLoading(false); setError(err.response?.data?.error || 'Allotment bulk query failed.');
    }
  };

  const handleExportExcel = () => {
    if (!results) return;
    const worksheet = XLSX.utils.aoa_to_sheet([[...headers, 'Allotment Status', 'Shares Allotted', 'Amount Blocked', 'Remarks'], ...results.map(r => [...r.rowCells, r.status, r.sharesAllotted, r.amount, r.remarks])]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, 'Allotment Report');
    XLSX.writeFile(wb, `${ipos.find(i => i._id === selectedIpoId)?.symbol}_report.xlsx`);
  };

  const stats = results ? {
    total: results.length, allotted: results.filter(r => r.status === 'Allotted').length,
    notAllotted: results.filter(r => r.status !== 'Allotted').length,
    rate: results.length ? Math.round((results.filter(r => r.status === 'Allotted').length / results.length) * 100) : 0,
    amount: results.reduce((a, c) => a + c.amount, 0)
  } : { total: 0, allotted: 0, notAllotted: 0, rate: 0, amount: 0 };

  const selectedIpo = ipos.find(i => i._id === selectedIpoId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {loading && <RefreshCw className="spin" size={32} style={{ margin: '3rem auto', color: 'var(--color-primary)' }} />}

      {!loading && !results && (
        <div className="glass-card checker-section">
          <div className="checker-title">
            <h2>Excel/CSV Bulk Checker</h2>
            <p>Upload your PAN card list (Excel/CSV) and check real allotment status from KFintech.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Select IPO to Check *</label>
              <select className="select-input" value={selectedIpoId} onChange={(e) => setSelectedIpoId(e.target.value)}>
                {ipos.map(ipo => <option key={ipo._id} value={ipo._id}>{ipo.name} ({ipo.symbol}) — {ipo.registrar}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Search Key Type</label>
              <div className="search-type-tabs">
                {['PAN', 'ApplicationNo', 'DematNo'].map(t => (
                  <button key={t} type="button" className={`tab-btn ${searchType === t ? 'active' : ''}`} onClick={() => setSearchType(t)}>{t === 'PAN' ? 'PANs' : t === 'ApplicationNo' ? 'Apps' : 'Demats'}</button>
                ))}
              </div>
            </div>
            {!file ? (
              <div className="file-dropzone" onClick={() => document.getElementById('fileInput').click()} style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}>
                <input type="file" id="fileInput" style={{ display: 'none' }} accept=".xlsx,.xls,.csv" onChange={e => processFile(e.target.files[0])} />
                <Upload size={36} style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }} />
                <h4 style={{ color: '#fff', marginBottom: '0.25rem' }}>Upload Excel or CSV</h4>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.95rem', color: '#fff' }}>{file.name} ({parsedRows.length} rows)</span>
                  <button type="button" className="secondary-btn" style={{ padding: '0.4rem', border: 'none', background: 'rgba(244,63,94,0.1)', color: 'var(--color-danger)' }} onClick={handleClearFile}><Trash2 size={16} /></button>
                </div>
                <div className="form-group">
                  <label>Select Key Header Column *</label>
                  <select className="select-input" value={selectedColumnIdx} onChange={(e) => setSelectedColumnIdx(Number(e.target.value))}>
                    {headers.map((h, i) => <option key={i} value={i}>Column {i + 1}: {h || `Column ${i + 1}`}</option>)}
                  </select>
                </div>
                <button type="button" className="submit-btn" onClick={handleBulkCheck}>Check {parsedRows.length} PANs via KFintech API</button>
              </div>
            )}
            {error && <div style={{ color: 'var(--color-danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><AlertTriangle size={16} />{error}</div>}
          </div>
        </div>
      )}

      {!loading && results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <BulkStatsSummary stats={stats} selectedIpo={selectedIpo} handleExportExcel={handleExportExcel} handleClearFile={handleClearFile} />
          <BulkResultsTable results={results} searchType={searchType} headers={headers} selectedColumnIdx={selectedColumnIdx} />
        </div>
      )}
    </div>
  );
};

export default BulkChecker;
