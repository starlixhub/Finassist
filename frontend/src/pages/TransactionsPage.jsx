// src/pages/TransactionsPage.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Search, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
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

const PAGE_SIZE = 20;

const CATEGORIES = ['all', 'rent', 'food', 'transport', 'shopping', 'subscriptions', 'utilities', 'uncategorized', 'income'];

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
    await new Promise(r => setTimeout(r, 450));
    importTransactions(csvData.valid);
    setImporting(false);
    setImportOpen(false);
    setCsvFile(null); setCsvData(null);
    toast.success(`${csvData.valid.length} transactions imported successfully!`);
  };

  const renderSortIcon = (col) => {
    if (sortKey !== col) return <span style={{ color: '#94A3B8', fontSize: 10 }}>↕</span>;
    return sortDir === 'asc' ? <ChevronUp size={13} style={{ color: '#4D7C0F' }} /> : <ChevronDown size={13} style={{ color: '#4D7C0F' }} />;
  };

  const hasFilters = search || category !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  if (loading) return <LoadingSpinner message="Loading transactions..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search & Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Field */}
          <div style={{ flex: 2, minWidth: 220, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search descriptions, payees..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                color: '#0F172A',
                background: '#FFFFFF',
              }}
              onFocus={e => { e.target.style.borderColor = '#65A30D'; }}
              onBlur={e => { e.target.style.borderColor = '#CBD5E1'; }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date range pickers */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, color: '#0F172A', outline: 'none' }}
          />
          <span style={{ color: '#64748B', fontSize: 13, alignSelf: 'center' }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, color: '#0F172A', outline: 'none' }}
          />

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FFFFFF', minWidth: 140, cursor: 'pointer' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : categoryLabels[c] || c}</option>)}
          </select>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FFFFFF', cursor: 'pointer' }}
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} icon={<X size={14} />} size="sm">Reset</Button>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <Button onClick={() => setImportOpen(true)} icon={<Upload size={14} />} variant="soft">
              Import CSV
            </Button>
          </div>
        </div>

        {filtered.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
            Showing {paged.length} of {filtered.length} transactions
          </div>
        )}
      </Card>

      {/* Ledger Table */}
      <Card padding={0}>
        {paged.length === 0 ? (
          <EmptyState icon={<Search size={24} />} title="No matching transactions" message="Try relaxing your filters or importing a bank CSV." action={() => setImportOpen(true)} actionLabel="Import CSV" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th onClick={() => handleSort('date')} style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    Date {renderSortIcon('date')}
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Description</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Category</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Type</th>
                  <th onClick={() => handleSort('amount')} style={{ padding: '12px 18px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    Amount {renderSortIcon('amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((txn, i) => (
                  <tr
                    key={txn.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F7FEE7'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA'; }}
                  >
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {formatDate(txn.date)}
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: '#0F172A', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {txn.description}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <CategoryBadge category={txn.category} />
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <TypeBadge type={txn.type} />
                    </td>
                    <td style={{
                      padding: '12px 18px',
                      textAlign: 'right',
                      fontSize: 13,
                      fontWeight: 700,
                      color: txn.type === 'income' ? '#15803D' : '#B91C1C',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</Button>
            <span style={{ fontSize: 13, color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
              Page {page} of {totalPages}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</Button>
          </div>
        )}
      </Card>

      {/* CSV Import Modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setCsvFile(null); setCsvData(null); }}
        title="Import Statement CSV"
        width={580}
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
          <div style={{ padding: '10px 14px', background: '#F7FEE7', border: '1px solid #D9F99D', borderRadius: 8, fontSize: 12, color: '#365314' }}>
            <strong>Supported Schema:</strong> date (YYYY-MM-DD), description, amount (positive=income, negative=expense).
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#4D7C0F' : '#CBD5E1'}`,
              borderRadius: 10, padding: '30px 20px', textAlign: 'center',
              background: dragging ? '#F7FEE7' : '#F8FAFC', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <Upload size={24} style={{ color: '#64748B', marginBottom: 6 }} />
            <p style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, marginBottom: 2 }}>
              {csvFile ? csvFile.name : 'Drop bank statement CSV or click to select'}
            </p>
            <p style={{ fontSize: 12, color: '#64748B' }}>Parses and categorizes locally</p>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
          </div>

          {csvData && (
            <div style={{ fontSize: 12 }}>
              {csvData.errors?.length > 0 && (
                <div style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: 6, color: '#B91C1C', marginBottom: 10 }}>
                  Found {csvData.errors.length} formatting warnings.
                </div>
              )}
              {csvData.valid?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Preview ({csvData.valid.length} valid rows detected):
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <tbody>
                        {csvData.valid.slice(0, 5).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 10px', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>{row.date}</td>
                            <td style={{ padding: '6px 10px', color: '#0F172A', fontWeight: 500 }}>{row.description}</td>
                            <td style={{ padding: '6px 10px' }}><CategoryBadge category={row.category} /></td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: row.amount < 0 ? '#B91C1C' : '#15803D', fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(Math.abs(row.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
