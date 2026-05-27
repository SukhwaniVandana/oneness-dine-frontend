import { useState } from 'react';
import Spinner from '../common/Spinner';
import styles from './PaymentPanel.module.css';

const PAYMENT_MODES = [
  { key: 'CASH',   label: 'Cash', icon: '💵' },
  { key: 'CARD',   label: 'Card', icon: '💳' },
  { key: 'UPI',    label: 'UPI',  icon: '📱' },
  { key: 'CREDIT', label: 'Due',  icon: '📋' },
];

export default function PaymentPanel({ bill, onSettle, isSettling }) {
  const totalAmount = Number(bill?.totalAmount || 0);

  const [mode,         setMode]         = useState('CASH');
  const [cashAmount,   setCashAmount]   = useState('');
  const [isSplit,      setIsSplit]      = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ CASH: '', CARD: '', UPI: '', CREDIT: '' });

  /* Cash change */
  const cashPaid  = Number(cashAmount) || 0;
  const changeAmt = mode === 'CASH' && cashPaid > totalAmount
    ? cashPaid - totalAmount : 0;

  /* Build payments */
  function getPayments() {
    if (isSplit) {
      const payments = PAYMENT_MODES
        .filter(m => Number(splitAmounts[m.key]) > 0)
        .map(m => ({ paymentMethod: m.key, amount: Number(splitAmounts[m.key]) }));
      const total = payments.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(total - totalAmount) > 1) return null;
      return payments;
    }
    if (mode === 'CASH') {
      if (cashPaid < totalAmount) return null;
      return [{ paymentMethod: 'CASH', amount: totalAmount }];
    }
    if (mode === 'CREDIT') {
      return [{ paymentMethod: 'CREDIT', amount: totalAmount }];
    }
    return [{ paymentMethod: mode, amount: totalAmount }];
  }

  const payments  = getPayments();
  const canSettle = !!payments && !isSettling && !!bill;

  const splitTotal     = PAYMENT_MODES.reduce((s, m) => s + (Number(splitAmounts[m.key]) || 0), 0);
  const splitRemaining = totalAmount - splitTotal;

  return (
    <div className={styles.panel}>

      {/* Amount due */}
      <div className={styles.dueRow}>
        <span className={styles.dueLabel}>Amount Due</span>
        <span className={styles.dueAmt}>
          ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Split toggle */}
      <div className={styles.splitToggle}>
        <button
          className={`${styles.splitBtn} ${!isSplit ? styles.splitActive : ''}`}
          onClick={() => setIsSplit(false)}
        >
          Single Payment
        </button>
        <button
          className={`${styles.splitBtn} ${isSplit ? styles.splitActive : ''}`}
          onClick={() => setIsSplit(true)}
        >
          Split / Partial Due
        </button>
      </div>

      {/* ── SINGLE PAYMENT ── */}
      {!isSplit && (
        <div className={styles.section}>
          <div className={styles.modeGrid}>
            {PAYMENT_MODES.map(m => (
              <button
                key={m.key}
                className={`${styles.modeBtn}
                  ${mode === m.key ? styles.modeActive : ''}
                  ${m.key === 'CREDIT' ? styles.modeDue : ''}`}
                onClick={() => { setMode(m.key); setCashAmount(''); }}
              >
                <span className={styles.modeIcon}>{m.icon}</span>
                <span className={styles.modeLabel}>{m.label}</span>
                {m.key === 'CREDIT' && (
                  <span className={styles.dueTag}>Credit</span>
                )}
              </button>
            ))}
          </div>

          {/* Cash input */}
          {mode === 'CASH' && (
            <div className={styles.cashRow}>
              <label className={styles.cashLabel}>Amount Received</label>
              <div className={styles.cashInputWrap}>
                <span className={styles.cashPrefix}>₹</span>
                <input
                  className={styles.cashInput}
                  type="number"
                  placeholder={totalAmount.toFixed(2)}
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  min={0}
                  autoFocus
                />
              </div>
              <div className={styles.quickAmts}>
                {getQuickAmounts(totalAmount).map(amt => (
                  <button key={amt} className={styles.quickBtn}
                    onClick={() => setCashAmount(String(amt))}>
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              {changeAmt > 0 && (
                <div className={styles.changeRow}>
                  <span className={styles.changeLabel}>Return Change</span>
                  <span className={styles.changeAmt}>
                    ₹ {changeAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {cashPaid > 0 && cashPaid < totalAmount && (
                <div className={styles.insufficientMsg}>
                  ⚠ Insufficient — ₹{(totalAmount - cashPaid).toFixed(2)} short
                </div>
              )}
            </div>
          )}

          {/* Due info */}
          {mode === 'CREDIT' && (
            <div className={styles.dueInfo}>
              <div className={styles.dueInfoIcon}>📋</div>
              <div>
                <div className={styles.dueInfoTitle}>Full amount marked as Due</div>
                <div className={styles.dueInfoText}>
                  ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} recorded as credit.
                  Table will be freed immediately.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SPLIT PAYMENT ── */}
      {isSplit && (
        <div className={styles.section}>
          <div className={styles.splitHint}>
            Enter amount per mode — remaining goes to Due automatically.
          </div>
          {PAYMENT_MODES.map(m => (
            <div key={m.key} className={styles.splitRow}>
              <div className={styles.splitModeLabel}>
                {m.icon} {m.label}
                {m.key === 'CREDIT' && <span className={styles.dueTag}>Due</span>}
              </div>
              <div className={styles.splitInputWrap}>
                <span className={styles.cashPrefix}>₹</span>
                <input
                  className={styles.cashInput}
                  type="number"
                  placeholder="0.00"
                  value={splitAmounts[m.key]}
                  onChange={e => setSplitAmounts(prev => ({
                    ...prev, [m.key]: e.target.value
                  }))}
                  min={0}
                />
              </div>
            </div>
          ))}
          <div className={`${styles.splitRemaining}
            ${splitRemaining < 0  ? styles.splitOver :
              splitRemaining === 0 ? styles.splitDone : ''}`}>
            {splitRemaining > 0
              ? `₹ ${splitRemaining.toFixed(2)} remaining`
              : splitRemaining < 0
              ? `₹ ${Math.abs(splitRemaining).toFixed(2)} over — please adjust`
              : '✓ Amounts match — ready to settle'}
          </div>
        </div>
      )}

      {/* Settle button */}
      <div className={styles.settleWrap}>
        <button
          className={styles.settleBtn}
          onClick={() => canSettle && onSettle(payments)}
          disabled={!canSettle}
        >
          {isSettling
            ? <><Spinner size="sm" variant="dark" /> Processing...</>
            : mode === 'CREDIT' && !isSplit
            ? `📋 Mark as Due — ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : `✓ Settle ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          }
        </button>
      </div>
    </div>
  );
}

function getQuickAmounts(total) {
  const ceil50  = Math.ceil(total / 50)  * 50;
  const ceil100 = Math.ceil(total / 100) * 100;
  const ceil500 = Math.ceil(total / 500) * 500;
  return [...new Set([Math.ceil(total), ceil50, ceil100, ceil500])]
    .filter(a => a >= total).slice(0, 4);
}
