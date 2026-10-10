// src/pages/onboarding/OnboardingPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, Wallet, Target, FolderUp } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import BrandLogo from '../../components/common/BrandLogo';
import { updateUser, addSavingsGoal, addTransactions } from '../../data/mockData';
import { parseCSV } from '../../utils/csvParser';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';
import { useCurrency } from '../../context/CurrencyContext';

const STEPS = ['Welcome', 'Income', 'Goals', 'Import'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef();
  const { symbol } = useCurrency();

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('75000');
  const [goalName, setGoalName] = useState('Emergency Fund');
  const [goalAmount, setGoalAmount] = useState('150000');
  const [goalDate, setGoalDate] = useState('2027-03-31');
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const user = { name: 'Kartik' };

  const handleNext = () => {
    if (step === 1) {
      const val = parseFloat(income);
      if (!val || val <= 0) { toast.error('Please enter a valid income.'); return; }
      updateUser({ monthlyIncome: val });
    }
    if (step === 2 && goalName && goalAmount) {
      const amt = parseFloat(goalAmount);
      if (amt > 0) {
        addSavingsGoal({
          name: goalName, targetAmount: amt, savedAmount: 0,
          targetDate: goalDate || null, category: 'emergency',
        });
      }
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleFileSelect = (file) => {
    if (!file || !file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { valid } = parseCSV(e.target.result);
      setCsvPreview(valid.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { valid } = parseCSV(e.target.result);
      addTransactions(valid);
      setImportDone(true);
      toast.success(`${valid.length} transactions imported!`);
    };
    reader.readAsText(csvFile);
  };

  const handleFinish = () => {
    updateUser({ onboardingComplete: true });
    navigate('/dashboard');
  };

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 540,
        boxShadow: '0 10px 25px -5px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ background: '#F8FAFC', padding: '18px 26px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>{STEPS[step]}</span>
          </div>
          <div style={{ height: 4, background: '#E2E8F0', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#4D7C0F', borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i < step ? '#15803D' : i === step ? '#4D7C0F' : '#E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i <= step ? '#FFFFFF' : '#64748B',
                  transition: 'background 0.3s',
                }}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 10, color: i === step ? '#4D7C0F' : '#64748B', fontWeight: i === step ? 700 : 500 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '36px 40px 32px' }}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 14 }}>
                <BrandLogo size={48} showText={false} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 8 }}>
                Welcome, {user.name}!
              </h2>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Let’s personalize your <strong style={{ color: '#4D7C0F' }}>FinAssist</strong> workspace in under 60 seconds.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 8 }}>
                {[
                  { num: '1', text: 'Set your regular monthly income' },
                  { num: '2', text: 'Define your first savings goal' },
                  { num: '3', text: 'Import your recent transactions statement (optional)' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#F7FEE7',
                      color: '#365314', border: '1px solid #D9F99D', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700
                    }}>{item.num}</span>
                    <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Income */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F8F7F4', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F' }}>
                  <Wallet size={24} />
                </div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4, textAlign: 'center', letterSpacing: '-0.02em' }}>
                What is your monthly income?
              </h2>
              <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                Used to calculate your real savings surplus and safety margin.
              </p>
              <Input
                label="Monthly Take-Home Income"
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                prefix={symbol}
                placeholder="e.g. 75000"
                required
                helpText="Salary or regular revenue after taxes."
              />
              {income && !isNaN(parseFloat(income)) && parseFloat(income) > 0 && (
                <div style={{ marginTop: 14, padding: '12px 16px', background: '#F7FEE7', border: '1px solid #D9F99D', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#365314', fontWeight: 600 }}>
                    Annual projection: {formatCurrency(parseFloat(income) * 12)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F8F7F4', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F' }}>
                  <Target size={24} />
                </div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4, textAlign: 'center', letterSpacing: '-0.02em' }}>
                Set your first savings goal
              </h2>
              <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                FinAssist will test mathematical runway feasibility for you.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Goal Name" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. Emergency Fund" />
                <Input label="Target Amount" type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} prefix={symbol} placeholder="e.g. 150000" />
                <Input label="Target Date (optional)" type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Import */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F8F7F4', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F' }}>
                  <FolderUp size={24} />
                </div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4, textAlign: 'center', letterSpacing: '-0.02em' }}>
                Import transactions
              </h2>
              <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 18 }}>
                Upload your bank statement CSV. FinAssist will auto-categorize rows.
              </p>
              <p style={{ fontSize: 11, color: '#475569', background: '#F8F7F4', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                <strong>Supported format:</strong> date (YYYY-MM-DD), description, amount
              </p>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#4D7C0F' : '#CBD5E1'}`,
                  borderRadius: 10, padding: '32px 24px', textAlign: 'center',
                  background: dragging ? '#F7FEE7' : '#F8FAFC', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={28} style={{ color: '#64748B', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, marginBottom: 4 }}>
                  {csvFile ? csvFile.name : 'Drop your CSV here or click to browse'}
                </p>
                <p style={{ fontSize: 12, color: '#64748B' }}>Compatible with standard bank statements</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
              </div>

              {csvPreview.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Preview (first 5 rows):</p>
                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Date', 'Description', 'Amount', 'Category'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #F1F5F9', color: '#0F172A' }}>{row.date}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #F1F5F9', color: '#0F172A', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #F1F5F9', color: row.amount < 0 ? '#B91C1C' : '#15803D', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(Math.abs(row.amount))}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #F1F5F9', color: '#64748B' }}>{row.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!importDone && (
                    <Button onClick={handleImport} style={{ marginTop: 12 }}>Import Transactions</Button>
                  )}
                  {importDone && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#DCFCE7', borderRadius: 8, color: '#15803D', fontSize: 12, fontWeight: 600 }}>
                      ✓ Transactions imported successfully!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 8 }}>
              {step === 3 && (
                <Button variant="secondary" onClick={handleFinish}>Skip to Dashboard</Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext}>Continue →</Button>
              ) : (
                <Button onClick={handleFinish}>Launch Dashboard →</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
