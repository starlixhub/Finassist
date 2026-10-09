// src/pages/TransactionsPage.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Search, Upload, X, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CategoryBadge, TypeBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTransactions } from '../hooks/useTransactions';
import { parseCSV } from '../utils/csvParser';
import { formatCurrency, formatDate, categoryLabels } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import { Select } from '../components/common/Input';

const PAGE_SIZE = 20;

const CATEGORIES = ['all', 'food', 'transport', 'rent', 'shopping', 'subscriptions', 'utilities', 'uncategorized', 'income'];

export default function TransactionsPage() {
  const { transactions, loading, importTransactions } = useTransactions();
  const toast = useToast();
  const fileRef = useRef();

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // CSV Import Modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setCategory('all'); setTypeFilter('all');
    setDateFrom(''); setDateTo(''); setSortKey('date'); setSortDir('desc'); setPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...transactions];
    if (search) data = data.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'all') data = data.filter(t => t.category === category);
    if (typeFilter !== 'all') data = data.filter(t => t.type === typeFilter);
    if (dateFrom) data = data.filter(t => t.date >= dateFrom);
    if (dateTo) data = data.filter(t => t.date <= dateTo);
    data.sort((a, b) => {
      let v;
      if (sortKey === 'date') v = a.date < b.date ? -1 : 1;
      else if (sortKey === 'amount') v = Math.abs(a.amount) - Math.abs(b.amount);
      else v = 0;
      return sortDir === 'asc' ? v : -v;
    });
    return data;
  }, [transactions, search, category, typeFilter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFileSelect = (file) => {
    if (!file || !file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      setCsvData(result);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData?.valid?.length) { toast.error('No valid rows to import.'); return; }
    setImporting(true);
    await new Promise(r => setTimeout(r, 500));
    importTransactions(csvData.valid);
    setImporting(false);
    setImportOpen(false);
    setCsvFile(null); setCsvData(null);
    toast.success(`${csvData.valid.length} transactions imported successfully!`);
  };

  const renderSortIcon = (col) => {
    if (sortKey !== col) return <span style={{ color: '#D9E0E9', fontSize: 10 }}>↕</span>;
    return sortDir === 'asc' ? <ChevronUp size={13} style={{ color: '#0B6E6E' }} /> : <ChevronDown size={13} style={{ color: '#0B6E6E' }} />;
  };

  const hasFilters = search || category !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  if (loading) return <LoadingSpinner message="Loading transactions..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: 2, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52607A', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search transactions..."
              style={{
                width: '100%', padding: '8px 12px 8px 34px',
                border: '1px solid #D9E0E9', borderRadius: 6, fontSize: 13, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52607A' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date range */}
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding: '8px 10px', border: '1px solid #D9E0E9', borderRadius: 6, fontSize: 13, color: '#0F1B2D', outline: 'none' }} />
          <span style={{ color: '#52607A', fontSize: 13, alignSelf: 'center' }}>to</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding: '8px 10px', border: '1px solid #D9E0E9', borderRadius: 6, fontSize: 13, color: '#0F1B2D', outline: 'none' }} />

          {/* Category */}
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{ padding: '8px 10px', border: '1px solid #D9E0E9', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff', minWidth: 130 }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : categoryLabels[c] || c}</option>)}
          </select>

          {/* Type */}
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 10px', border: '1px solid #D9E0E9', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff' }}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} icon={<X size={14} />} size="sm">Clear</Button>
          )}

          <Button onClick={() => setImportOpen(true)} icon={<Upload size={14} />} variant="teal_soft">
            Import CSV
          </Button>
        </div>
        {filtered.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#52607A' }}>
            Showing {paged.length} of {filtered.length} transactions
          </div>
        )}
      </Card>

      {/* Table */}
      <Card padding={0}>
        {paged.length === 0 ? (
          <EmptyState icon="🔍" title="No transactions found" message="Try adjusting your filters or importing a CSV file." action={() => setImportOpen(true)} actionLabel="Import CSV" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F7FA', borderBottom: '1px solid #D9E0E9' }}>
                  <th onClick={() => handleSort('date')} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#52607A', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    Date {renderSortIcon('date')}
                  </th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#52607A' }}>Description</th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#52607A' }}>Category</th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#52607A' }}>Type</th>
                  <th onClick={() => handleSort('amount')} style={{ padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#52607A', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    Amount {renderSortIcon('amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((txn, i) => (
                  <tr key={txn.id} style={{ borderBottom: '1px solid #F5F7FA', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F0F9F9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFC'}
                  >
                    <td style={{ padding: '11px 16px', fontSize: 12, color: '#52607A', whiteSpace: 'nowrap' }}>{formatDate(txn.date)}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: '#0F1B2D', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</td>
                    <td style={{ padding: '11px 16px' }}><CategoryBadge category={txn.category} /></td>
                    <td style={{ padding: '11px 16px' }}><TypeBadge type={txn.type} /></td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: txn.type === 'income' ? '#07704A' : '#B42318', whiteSpace: 'nowrap' }}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #D9E0E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</Button>
            <span style={{ fontSize: 13, color: '#52607A' }}>Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</Button>
          </div>
        )}
      </Card>

      {/* CSV Import Modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setCsvFile(null); setCsvData(null); }}
        title="Import Transactions from CSV"
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setImportOpen(false); setCsvFile(null); setCsvData(null); }}>Cancel</Button>
            <Button onClick={handleImport} disabled={!csvData?.valid?.length} loading={importing}>
              Import {csvData?.valid?.length ? `${csvData.valid.length} Transactions` : ''}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '8px 12px', background: '#E2F1F0', borderRadius: 6, fontSize: 12, color: '#0B6E6E' }}>
            <strong>Required columns:</strong> date (YYYY-MM-DD), description, amount (negative=expense, positive=income)
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#0B6E6E' : '#D9E0E9'}`,
              borderRadius: 10, padding: '28px 20px', textAlign: 'center',
              background: dragging ? '#E2F1F0' : '#F5F7FA', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Upload size={24} style={{ color: '#52607A', marginBottom: 6 }} />
            <p style={{ fontSize: 13, color: '#0F1B2D', fontWeight: 600, marginBottom: 2 }}>
              {csvFile ? csvFile.name : 'Drop CSV file here or click to browse'}
            </p>
            <p style={{ fontSize: 12, color: '#52607A' }}>Supports .csv files</p>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
          </div>

          {csvData && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, padding: '8px 12px', background: '#D1FAE5', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#07704A' }}>{csvData.valid.length}</div>
                  <div style={{ fontSize: 11, color: '#07704A' }}>Valid rows</div>
                </div>
                <div style={{ flex: 1, padding: '8px 12px', background: csvData.invalid.length ? '#FEE2E2' : '#F5F7FA', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: csvData.invalid.length ? '#B42318' : '#52607A' }}>{csvData.invalid.length}</div>
                  <div style={{ fontSize: 11, color: csvData.invalid.length ? '#B42318' : '#52607A' }}>Invalid rows</div>
                </div>
              </div>

              {csvData.valid.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#52607A', marginBottom: 6 }}>Preview (first 5 rows):</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#F5F7FA' }}>
                          {['Date', 'Description', 'Amount', 'Category'].map(h => (
                            <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#52607A', fontWeight: 600, borderBottom: '1px solid #D9E0E9' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.valid.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: '#0F1B2D' }}>{row.date}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: '#0F1B2D', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: row.amount < 0 ? '#B42318' : '#07704A', fontWeight: 600 }}>
                              {row.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(row.amount))}
                            </td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA' }}><CategoryBadge category={row.category} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
