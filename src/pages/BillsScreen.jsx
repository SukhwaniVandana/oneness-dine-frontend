import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { BillService } from '../services/menuOrderService';
import Spinner from '../components/common/Spinner';
import styles from './BillsScreen.module.css';
import { useToast } from '../components/common/Toast';
import { generateBillPdf } from '../utils/billPdf';

const STATUS_COLORS = {
  DRAFT: { bg: 'var(--badge-amber-bg)', color: 'var(--accent)' },
  PRINTED: { bg: 'var(--badge-blue-bg)', color: 'var(--accent3)' },
  PAID: { bg: 'var(--badge-green-bg)', color: 'var(--accent2)' },
  VOIDED: { bg: 'var(--badge-red-bg)', color: 'var(--accent4)' },
  REFUNDED: { bg: 'var(--badge-purple-bg)', color: 'var(--accent5)' },
};

const PAYMENT_ICONS = {
  CASH: '💵', CARD: '💳', UPI: '📱',
  CREDIT: '📋', WALLET: '👝',
};

const fmtC = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});
const fmtT = (s) => s ? new Date(s).toLocaleTimeString('en-IN', {
  hour: '2-digit', minute: '2-digit', hour12: true
}) : '—';

export default function BillsScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const branchId = session?.branchId || 1;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBill, setSelectedBill] = useState(null);
  const toast = useToast();

  /* Fetch today's bills */
  const { data: bills = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bills-today', branchId],
    queryFn: () => import('../services/apiClient')
      .then(m => m.default.get('/bills', { params: { branchId } }))
      .then(r => r.data?.data ?? []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  /* Summary totals */
  const summary = useMemo(() => {
    const paid = bills.filter(b => b.billStatus === 'PAID');
    const due = bills.filter(b => b.billStatus !== 'PAID' && b.billStatus !== 'VOIDED');
    return {
      total: bills.length,
      paid: paid.length,
      revenue: paid.reduce((s, b) => s + Number(b.totalAmount || 0), 0),
      discount: paid.reduce((s, b) => s + Number(b.orderDiscount || 0) + Number(b.itemDiscount || 0), 0),
      pending: due.length,
    };
  }, [bills]);

  /* Filtered bills */
  const filtered = useMemo(() => {
    let result = bills;
    if (statusFilter !== 'ALL') result = result.filter(b => b.billStatus === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.billNumber?.toLowerCase().includes(q) ||
        b.orderNumber?.toLowerCase().includes(q) ||
        b.customerName?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bills, statusFilter, search]);

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>Today's Bills</div>
          <div className={styles.date}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className={styles.headerRight}>
          {isFetching && <Spinner size="sm" variant="amber" />}
          <button className={styles.refreshBtn} onClick={() => refetch()}>↺ Refresh</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <SummaryCard label="Total Bills" value={summary.total}           color="blue"   icon="🧾" />
        <SummaryCard label="Paid"        value={summary.paid}            color="green"  icon="✅" />
        <SummaryCard label="Revenue"     value={fmtC(summary.revenue)}   color="accent" icon="💰" isAmount />
        <SummaryCard label="Discount"    value={fmtC(summary.discount)}  color="amber"  icon="🏷️" isAmount />
        <SummaryCard label="Pending"     value={summary.pending}         color="red"    icon="⏳" />
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search bill #, order #, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className={styles.statusFilters}>
          {['ALL', 'DRAFT', 'PRINTED', 'PAID', 'VOIDED'].map(s => (
            <button key={s}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s}
              <span className={styles.filterCount}>
                {s === 'ALL' ? bills.length : bills.filter(b => b.billStatus === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Bills list */}
        <div className={`${styles.listPanel} ${selectedBill ? styles.listPanelSplit : ''}`}>
          {isLoading ? (
            <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>🧾</div>
              <div>{search || statusFilter !== 'ALL' ? 'No bills match this filter' : 'No bills today yet'}</div>
            </div>
          ) : (
            <div className={styles.billList}>
              {filtered.map(bill => {
                const sc = STATUS_COLORS[bill.billStatus] || STATUS_COLORS.DRAFT;
                const isSelected = selectedBill?.id === bill.id;
                return (
                  <div key={bill.id}
                    className={`${styles.billRow} ${isSelected ? styles.billRowActive : ''}`}
                    onClick={() => setSelectedBill(isSelected ? null : bill)}>
                    <div className={styles.billRowLeft}>
                      <div className={styles.billNum}>{bill.billNumber}</div>
                      <div className={styles.billMeta}>
                        {bill.orderNumber}
                        {bill.customerName && ` · ${bill.customerName}`}
                      </div>
                    </div>
                    <div className={styles.billRowMid}>
                      <div className={styles.billTime}>{fmtT(bill.createdAt)}</div>
                      <div className={styles.payModes}>
                        {(bill.payments || []).map((p, i) => (
                          <span key={i} title={p.paymentMethod}>
                            {PAYMENT_ICONS[p.paymentMethod] || '💰'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.billRowRight}>
                      <div className={styles.billAmt}>{fmtC(bill.totalAmount)}</div>
                      <span className={styles.statusBadge}
                        style={{ background: sc.bg, color: sc.color }}>
                        {bill.billStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bill detail panel */}
        {selectedBill && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailBillNum}>{selectedBill.billNumber}</div>
                <div className={styles.detailMeta}>{selectedBill.orderNumber}</div>
              </div>
              <button className={styles.closeDetail} onClick={() => setSelectedBill(null)}>✕</button>
            </div>

            {/* Items */}
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>Items</div>
              {(selectedBill.items || []).map((item, i) => (
                <div key={i} className={styles.detailItem}>
                  <span className={styles.detailItemName}>{item.itemName}</span>
                  <span className={styles.detailItemQty}>×{item.quantity}</span>
                  <span className={styles.detailItemPrice}>{fmtC(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className={styles.detailSection}>
              {[
                { label: 'Subtotal', value: fmtC(selectedBill.subtotal) },
                Number(selectedBill.orderDiscount) > 0 && { label: 'Discount', value: `− ${fmtC(selectedBill.orderDiscount)}`, green: true },
                Number(selectedBill.cgstAmount) > 0 && { label: 'CGST', value: fmtC(selectedBill.cgstAmount) },
                Number(selectedBill.sgstAmount) > 0 && { label: 'SGST', value: fmtC(selectedBill.sgstAmount) },
                Number(selectedBill.serviceCharge) > 0 && { label: 'Service', value: fmtC(selectedBill.serviceCharge) },
              ].filter(Boolean).map((row, i) => (
                <div key={i} className={styles.detailRow}>
                  <span>{row.label}</span>
                  <span style={row.green ? { color: 'var(--accent2)' } : {}}>{row.value}</span>
                </div>
              ))}
              <div className={`${styles.detailRow} ${styles.detailTotal}`}>
                <span>Total</span>
                <span>{fmtC(selectedBill.totalAmount)}</span>
              </div>
            </div>

            {/* Payments */}
            {(selectedBill.payments || []).length > 0 && (
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Payments</div>
                {selectedBill.payments.map((p, i) => (
                  <div key={i} className={styles.detailRow}>
                    <span>{PAYMENT_ICONS[p.paymentMethod]} {p.paymentMethod}</span>
                    <span>{fmtC(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className={styles.detailActions}>
              {selectedBill.billStatus !== 'PAID' && selectedBill.billStatus !== 'VOIDED' && (
                <button className={styles.settleBtn}
                  onClick={() => navigate(`/billing?orderId=${selectedBill.orderId}&tableNumber=Bill`)}>
                  🧾 Settle
                </button>
              )}
              <button className={styles.reprintBtn}
                onClick={async () => {
                  try {
                    const { printBill: sendToPrinter } = await import('../services/printService');
                    await sendToPrinter(selectedBill, {
                      restaurantName:    selectedBill?.branchName    || '',
                      restaurantAddress: selectedBill?.branchAddress || '',
                      gstNumber:         selectedBill?.branchGstin   || '',
                    });
                    toast.success('Bill sent to printer!');
                  } catch (err) {
                    toast.error('Print failed: ' + err.message);
                  }
                }}>
                🖨️ Reprint
              </button>
              <button className={styles.pdfBtn}
                onClick={() => {
                  try {
                    generateBillPdf(selectedBill);
                  } catch (err) {
                    toast.error('PDF failed: ' + err.message);
                  }
                }}>
                📄 PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon, isAmount }) {
  return (
    <div className={`${styles.summaryCard} ${styles['card_' + color]}`}>
      <div className={styles.summaryIcon}>{icon}</div>
      <div className={`${styles.summaryValue} ${isAmount ? styles.summaryValueSm : ''}`}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}
