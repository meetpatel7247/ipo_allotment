import React, { useState } from 'react';
import { CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const BulkResultsTable = ({ results, searchType, headers, selectedColumnIdx }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 10;

  // Filter to show only successfully allotted records
  const allottedRows = results.filter(res => res.status === 'Allotted');

  // Search filter applied on top of allotted records
  const filteredResults = allottedRows.filter(res => 
    res.rowCells.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredResults.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredResults.length / rowsPerPage);

  const paginate = (no) => { if (no >= 1 && no <= totalPages) setCurrentPage(no); };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Allotted Investors Details ({allottedRows.length} matches)</h3>
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" placeholder="Search allotted..." className="text-input" 
            style={{ padding: '0.4rem 0.6rem 0.4rem 1.8rem', fontSize: '0.85rem', borderRadius: '6px' }}
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="history-table" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Row #</th>
              <th>Selected Key ({searchType})</th>
              {headers.map((hdr, idx) => idx !== selectedColumnIdx && <th key={idx}>{hdr || `Col ${idx + 1}`}</th>)}
              <th>Allotted</th>
              <th>Shares</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ color: 'var(--text-muted)' }}>{indexOfFirstRow + idx + 1}</td>
                <td style={{ fontWeight: '600', color: 'var(--color-success)' }}>{row.searchKey}</td>
                {headers.map((_, colIdx) => colIdx !== selectedColumnIdx && (
                  <td key={colIdx} style={{ color: 'var(--text-secondary)' }}>{String(row.rowCells[colIdx] || '')}</td>
                ))}
                <td style={{ color: 'var(--color-success)' }}>Yes (1 Lot)</td>
                <td style={{ fontWeight: '500' }}>{row.sharesAllotted}</td>
                <td>
                  <span className="badge allotted" style={{ gap: '0.25rem' }}>
                    <CheckCircle2 size={12} /> {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {currentRows.length === 0 && (
              <tr>
                <td colSpan={headers.length + 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No allotted records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredResults.length)} of {filteredResults.length} rows
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button type="button" className="secondary-btn" style={{ padding: '0.3rem 0.5rem', borderRadius: '4px' }} onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                return <button key={p} type="button" className={`tab-btn ${currentPage === p ? 'active' : ''}`} style={{ padding: '0.3rem 0.65rem', borderRadius: '4px', minWidth: '32px' }} onClick={() => paginate(p)}>{p}</button>;
              }
              return (p === 2 || p === totalPages - 1) ? <span key={p} style={{ alignSelf: 'center', color: 'var(--text-muted)', padding: '0 0.25rem' }}>...</span> : null;
            })}
            <button type="button" className="secondary-btn" style={{ padding: '0.3rem 0.5rem', borderRadius: '4px' }} onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkResultsTable;
