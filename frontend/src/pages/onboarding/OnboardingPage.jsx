// src/pages/onboarding/OnboardingPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { updateUser, addSavingsGoal, addTransactions } from '../../data/mockData';
import { parseCSV } from '../../utils/csvParser';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';

const STEPS = ['Welcome', 'Income', 'Goals', 'Import'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef();

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('75000');
  const [goalName, setGoalName] = useState('Emergency Fund');
  const [goalAmount, setGoalAmount] = useState('150000');
  const [goalDate, setGoalDate] = useState('2027-03-31');
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const user = { name: 'Kartik' }; // Simulated

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
      minHeight: '100vh', background: '#F5F7FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
        boxShadow: '0 8px 40px rgba(15,27,45,0.12)', overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ background: '#F5F7FA', padding: '16px 24px', borderBottom: '1px solid #D9E0E9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#52607A' }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ fontSize: 12, color: '#52607A' }}>{STEPS[step]}</span>
          </div>
          <div style={{ height: 4, background: '#D9E0E9', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#0B6E6E', borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 0, marginTop: 10 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i < step ? '#07704A' : i === step ? '#0B6E6E' : '#D9E0E9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i <= step ? '#fff' : '#52607A',
                  transition: 'background 0.3s',
                }}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 10, color: i === step ? '#0B6E6E' : '#52607A', fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '36px 40px 32px' }}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>👋</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1B2D', marginBottom: 8 }}>Hi {user.name}!</h2>
              <p style={{ color: '#52607A', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Welcome to <strong style={{ color: '#0B6E6E' }}>FinAssist</strong> — your intelligent personal finance assistant.
                Let's take a few minutes to set up your profile so we can give you personalized insights.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 8 }}>
                {[
                  { emoji: '1️⃣', text: 'Tell us your monthly income' },
                  { emoji: '2️⃣', text: 'Set a savings goal' },
                  { emoji: '3️⃣', text: 'Import your transactions (optional)' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F5F7FA', borderRadius: 8 }}>
                    <span style={{ fontSize: 18 }}>{item.emoji}</span>
                    <span style={{ fontSize: 13, color: '#0F1B2D' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Income */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>💰</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', marginBottom: 4, textAlign: 'center' }}>What's your monthly income?</h2>
              <p style={{ color: '#52607A', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>This helps us calculate your savings rate and budget recommendations.</p>
              <Input
                label="Monthly Take-Home Income"
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                prefix="₹"
                placeholder="e.g. 75000"
                required
                helpText="Enter your monthly salary after taxes and deductions."
              />
              {income && !isNaN(parseFloat(income)) && parseFloat(income) > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#E2F1F0', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#0B6E6E', fontWeight: 600 }}>
                    Annual income: {formatCurrency(parseFloat(income) * 12)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>🎯</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', marginBottom: 4, textAlign: 'center' }}>Set your first savings goal</h2>
              <p style={{ color: '#52607A', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>You can add more goals later from the Savings Goals page.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Goal Name" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. Emergency Fund" />
                <Input label="Target Amount" type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} prefix="₹" placeholder="e.g. 150000" />
                <Input label="Target Date (optional)" type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Import */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>📁</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', marginBottom: 4, textAlign: 'center' }}>Import your transactions</h2>
              <p style={{ color: '#52607A', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Upload a CSV file with your bank transactions. We'll categorize them automatically.</p>
              <p style={{ fontSize: 11, color: '#52607A', background: '#F5F7FA', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                <strong>Required columns:</strong> date (YYYY-MM-DD), description, amount (negative=expense)
              </p>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#0B6E6E' : '#D9E0E9'}`,
                  borderRadius: 10, padding: '32px 24px', textAlign: 'center',
                  background: dragging ? '#E2F1F0' : '#F5F7FA', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Upload size={28} style={{ color: '#52607A', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: '#0F1B2D', fontWeight: 600, marginBottom: 4 }}>
                  {csvFile ? csvFile.name : 'Drop your CSV here or click to browse'}
                </p>
                <p style={{ fontSize: 12, color: '#52607A' }}>Supports .csv files</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
              </div>

              {csvPreview.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#52607A', marginBottom: 6 }}>Preview (first 5 rows):</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#F5F7FA' }}>
                          {['Date', 'Description', 'Amount', 'Category'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#52607A', fontWeight: 600, borderBottom: '1px solid #D9E0E9' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: '#0F1B2D' }}>{row.date}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: '#0F1B2D', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: row.amount < 0 ? '#B42318' : '#07704A', fontWeight: 600 }}>₹{Math.abs(row.amount)}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #F5F7FA', color: '#52607A' }}>{row.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!importDone && (
                    <Button onClick={handleImport} style={{ marginTop: 10 }}>Import Transactions</Button>
                  )}
                  {importDone && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#D1FAE5', borderRadius: 6, color: '#07704A', fontSize: 12, fontWeight: 600 }}>
                      ✓ Transactions imported successfully!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 8 }}>
              {step === 3 && (
                <Button variant="secondary" onClick={handleFinish}>Skip & Go to Dashboard</Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext}>Continue →</Button>
              ) : (
                <Button onClick={handleFinish}>Go to Dashboard 🚀</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
