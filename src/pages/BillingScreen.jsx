import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth }    from '../context/AuthContext';
import { useToast }   from '../components/common/Toast';
import { mapApiError } from '../components/common/ErrorHandler';
import { useBill, useGenerateBill, usePayBill, useApplyDiscount } from '../hooks/useBilling';
import BillSummary   from '../components/billing/BillSummary';
import PaymentPanel  from '../components/billing/PaymentPanel';
import Spinner       from '../components/common/Spinner';
import styles        from './BillingScreen.module.css';

export default function BillingScreen() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const toast       = useToast();
  const { session } = useAuth();

  const orderId     = params.get('orderId');
  const tableNumber = decodeURIComponent(params.get('tableNumber') || 'Table');

  if (!orderId) { navigate('/tables', { replace: true }); return null; }

  /* Discount — percentage only, single input */
  const [discountPct, setDiscountPct] = useState('');

  const { data: bill, isLoading, isError } = useBill(orderId);
  const generateBill  = useGenerateBill();
  const payBill       = usePayBill();
  const applyDiscount = useApplyDiscount();

  /* Prefill discount from saved bill.discountPct on load */
  useEffect(() => {
    if (bill?.discountPct && Number(bill.discountPct) > 0) {
      setDiscountPct(String(Number(bill.discountPct)));
    }
  }, [bill?.id]);

  /* Auto-generate bill if not yet created */
  useEffect(() => {
    if (!isLoading && !isError && !bill && orderId) {
      generateBill.mutateAsync({
        orderId:         Number(orderId),
        discountPct:     0,
        packagingCharge: 0,
        isGstInvoice:    false,
        createdByUserId: session?.userId,
      }).catch(err => toast.error(mapApiError(err).message, 'Could not generate bill'));
    }
  }, [isLoading, isError, bill, orderId]);

  /* ── LIVE CALCULATION — matches backend exactly ──
   *
   * For each item:
   *   itemSubtotal = unitPrice × qty
   *   itemTaxable  = itemSubtotal × (1 - discountPct/100)
   *   itemCGST     = itemTaxable × cgstRate
   *   itemSGST     = itemTaxable × sgstRate
   *   itemCess     = itemTaxable × cessRate
   *
   * We don't have per-item tax rates on frontend.
   * Derive effective rates from original bill totals:
   *   cgstRate = bill.cgstAmount / bill.subtotal
   *
   * Service charge = totalTaxable × serviceChargeRate
   * (serviceChargeRate derived same way from bill.serviceCharge / bill.subtotal)
   */
  const calc = useMemo(() => {
    if (!bill) return {
      orderDiscount: 0, taxableAmount: 0,
      cgst: 0, sgst: 0, igst: 0, cess: 0,
      serviceCharge: 0, total: 0,
    };

    const subtotal = Number(bill.subtotal || 0);
    const pct      = Math.min(100, Math.max(0, Number(discountPct) || 0));

    /* Effective tax rates derived from original bill (at 0% discount) */
    const cgstRate    = subtotal > 0 ? Number(bill.cgstAmount    || 0) / subtotal : 0;
    const sgstRate    = subtotal > 0 ? Number(bill.sgstAmount    || 0) / subtotal : 0;
    const igstRate    = subtotal > 0 ? Number(bill.igstAmount    || 0) / subtotal : 0;
    const cessRate    = subtotal > 0 ? Number(bill.cessAmount    || 0) / subtotal : 0;
    const svcRate     = subtotal > 0 ? Number(bill.serviceCharge || 0) / subtotal : 0;

    /* Apply discount on subtotal */
    const orderDiscount  = subtotal * pct / 100;
    const taxableAmount  = subtotal - orderDiscount;

    /* GST on taxable amount */
    const cgst           = taxableAmount * cgstRate;
    const sgst           = taxableAmount * sgstRate;
    const igst           = taxableAmount * igstRate;
    const cess           = taxableAmount * cessRate;
    const serviceCharge  = taxableAmount * svcRate;

    const packaging      = Number(bill.packagingCharge || 0);
    const roundOff       = Number(bill.roundOff || 0);

    const totalBeforeRound = taxableAmount + cgst + sgst + igst + cess
      + serviceCharge + packaging;

    /* Round to nearest rupee */
    const total = Math.round(totalBeforeRound);

    return {
      orderDiscount,
      taxableAmount,
      cgst, sgst, igst, cess,
      serviceCharge,
      total,
    };
  }, [bill, discountPct]);

  /* Settle */
  async function handleSettle(payments) {
    if (!bill?.id) return;
    try {
      const pct = Number(discountPct) || 0;

      /* Step 1: apply discount % if entered — backend recalculates all amounts */
      if (pct > 0) {
        await applyDiscount.mutateAsync({
          billId:        bill.id,
          discountPct:   pct,
          discountReason: 'Manual discount',
        });
      }

      /* Step 2: pay using our locally calculated total (matches backend) */
      const finalTotal    = calc.total;
      const finalPayments = payments.length === 1
        ? [{ ...payments[0], amount: finalTotal }]
        : payments;

      await payBill.mutateAsync({ billId: bill.id, payments: finalPayments });
      toast.success('Payment collected! Table is now free.', bill.billNumber);
      navigate('/tables');
    } catch (err) {
      toast.error(mapApiError(err).message, 'Payment failed');
    }
  }

  const isSettling  = applyDiscount.isPending || payBill.isPending;
  const showLoading = isLoading || generateBill.isPending;

  /* Bill with live-calculated total for PaymentPanel */
  const billForPayment = bill ? { ...bill, totalAmount: calc.total } : null;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <div>
            <div className={styles.title}>Billing — {tableNumber}</div>
            {bill && (
              <div className={styles.subtitle}>
                {bill.billNumber} · {bill.orderNumber}
              </div>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          {bill?.billStatus && (
            <span className={`${styles.statusChip} ${styles[bill.billStatus.toLowerCase()]}`}>
              {bill.billStatus}
            </span>
          )}
        </div>
      </div>

      {showLoading ? (
        <div className={styles.loading}>
          <Spinner size="lg" variant="amber" />
          <div className={styles.loadingText}>
            {generateBill.isPending ? 'Generating bill...' : 'Loading bill...'}
          </div>
        </div>
      ) : isError ? (
        <div className={styles.errorState}>
          <div>⚠️ Could not load bill</div>
          <button onClick={() => navigate('/tables')}>← Back to Tables</button>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.summaryWrap}>
            <BillSummary
              bill={bill}
              discountPct={discountPct}
              onDiscountChange={setDiscountPct}
              calc={calc}
            />
          </div>
          <div className={styles.paymentWrap}>
            <PaymentPanel
              bill={billForPayment}
              onSettle={handleSettle}
              isSettling={isSettling}
            />
          </div>
        </div>
      )}
    </div>
  );
}
