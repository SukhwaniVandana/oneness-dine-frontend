import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMenuCategories, useMenuItems,
  useCreateOrder, useAddItems,
  useCreateKot, useTableOrders,
  useRemoveOrderItem, useGenerateBill,
  usePrintBill, useVoidBill,
} from '../hooks/useOrder';
import { useAuth }      from '../context/AuthContext';
import { useToast }     from '../components/common/Toast';
import { mapApiError }  from '../components/common/ErrorHandler';
import MenuItem           from '../components/order/MenuItem';
import CartPanel          from '../components/order/CartPanel';
import VariantAddonModal  from '../components/order/VariantAddonModal';
import { OrderService, BillService } from '../services/menuOrderService';
import styles from './OrderTaking.module.css';

function MenuSkeleton({ count = 12 }) {
  return (
    <div className={styles.menuGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skelCard}>
          <div className={`skeleton ${styles.skelTop}`} />
          <div className={`skeleton ${styles.skelImg}`} />
          <div className={`skeleton ${styles.skelName}`} />
          <div className={`skeleton ${styles.skelPrice}`} />
        </div>
      ))}
    </div>
  );
}

function makeCartKey(itemId, variantId) {
  return variantId ? `${itemId}-v${variantId}` : `${itemId}-base`;
}

export default function OrderTaking() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const toast       = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const tableId         = params.get('tableId');
  const tableNumber     = decodeURIComponent(params.get('tableNumber') || 'Table');
  const forceNew        = params.get('newSession') === '1';
  const existingOrderId = params.get('orderId') ? Number(params.get('orderId')) : null;
  const tableCapacity   = params.get('capacity') ? Number(params.get('capacity')) : null;

  /* Guard: no tableId → back to tables */
  if (!tableId || tableId === 'null' || tableId === '0') {
    navigate('/tables', { replace: true });
    return null;
  }

  const [activeCatId,   setActiveCatId]   = useState(null);
  const [cart,          setCart]          = useState([]);
  const [paxCount,      setPaxCount]      = useState(2);
  const [paxWarning,    setPaxWarning]    = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [variantItem,   setVariantItem]   = useState(null);

  /* Esc → back to tables */
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') navigate('/tables'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  /* Data */
  const { data: categories = [], isLoading: catsLoading } = useMenuCategories();
  const selectedCatId = activeCatId || categories[0]?.id;
  const { data: items = [], isLoading: itemsLoading } = useMenuItems(selectedCatId);
  const { data: tableOrders = [], refetch: refetchOrders } = useTableOrders(tableId);

  /* Mutations */
  const createOrder    = useCreateOrder();
  const addItems       = useAddItems();
  const createKot      = useCreateKot();
  const removeItem     = useRemoveOrderItem();
  const generateBill   = useGenerateBill();
  const printBill      = usePrintBill();
  const voidBill       = useVoidBill();

  /* Active order */
  const activeOrder = useMemo(() => {
    if (existingOrderId) return tableOrders.find(o => o.id === existingOrderId);
    if (forceNew) return null;
    return tableOrders.find(o => !o.isSettled && o.orderStatus !== 'CANCELLED');
  }, [tableOrders, existingOrderId, forceNew]);

  /* Existing items (not cancelled) */
  const existingItems = useMemo(() =>
    (activeOrder?.items || []).filter(i => i.itemStatus !== 'CANCELLED'),
    [activeOrder]
  );

  /* KOT groups for cart display */
  const [kotGroups, setKotGroups] = useState([]);
  useEffect(() => {
    if (!activeOrder?.id) { setKotGroups([]); return; }
    OrderService.getKots(activeOrder.id)
      .then(r => {
        const kots = r.data?.data ?? [];
        const orderItems = activeOrder?.items || [];
        const enriched = kots.map(kot => ({
          ...kot,
          items: (kot.items || []).map(ki => {
            const oi = orderItems.find(o => o.id === ki.orderItemId);
            return {
              ...ki,
              unitPrice:          Number(oi?.unitPrice ?? 0),
              itemStatus:         oi?.itemStatus ?? ki.kitchenStatus,
              variantName:        oi?.variantName ?? null,
              specialInstruction: ki.specialInstruction || oi?.specialInstruction,
            };
          }),
        }));
        setKotGroups(enriched);
      })
      .catch(() => setKotGroups([]));
  }, [activeOrder?.id, activeOrder?.items]);

  /* Filtered menu */
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) || i.shortName?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  /* Cart qty map */
  const cartQtyMap = useMemo(() =>
    cart.reduce((acc, c) => { acc[c.item.id] = (acc[c.item.id] || 0) + c.quantity; return acc; }, {}),
    [cart]
  );

  /* ── Cart operations ── */
  const handleItemTap = useCallback((item) => {
    if (item.hasVariants || item.hasAddons) {
      setVariantItem(item);
    } else {
      addDirectToCart(item, null, [], Number(item.basePrice) || 0);
    }
  }, []);

  function addDirectToCart(item, variant, addons, unitPrice) {
    const variantId = variant?.id || null;
    const cartKey   = makeCartKey(item.id, variantId);
    const safePrice = Number(unitPrice) || Number(item.basePrice) || 0;
    setCart(prev => {
      const existing = prev.find(c => c.cartKey === cartKey);
      if (existing) return prev.map(c => c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { cartKey, item, variantId, variantName: variant?.name || null, addons: addons || [], unitPrice: safePrice, quantity: 1, specialInstruction: '' }];
    });
  }

  function handleVariantConfirm({ item, variant, addons, quantity, unitPrice }) {
    const variantId = variant?.id || null;
    const cartKey   = makeCartKey(item.id, variantId);
    const safePrice = Number(unitPrice) || Number(item.basePrice) || 0;
    setCart(prev => {
      const existing = prev.find(c => c.cartKey === cartKey);
      if (existing) return prev.map(c => c.cartKey === cartKey ? { ...c, quantity: c.quantity + quantity } : c);
      return [...prev, { cartKey, item, variantId, variantName: variant?.name || null, addons: addons || [], unitPrice: safePrice, quantity, specialInstruction: '' }];
    });
    setVariantItem(null);
  }

  const changeQty  = useCallback((cartKey, delta) =>
    setCart(prev => prev.map(c => c.cartKey === cartKey ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c)), []);
  const removeFromCart = useCallback((cartKey) =>
    setCart(prev => prev.filter(c => c.cartKey !== cartKey)), []);
  const changeNote = useCallback((cartKey, note) =>
    setCart(prev => prev.map(c => c.cartKey === cartKey ? { ...c, specialInstruction: note } : c)), []);

  /* ── Build order items from cart ── */
  function buildOrderItems() {
    return cart.map(c => ({
      itemId:             c.item.id,
      variantId:          c.variantId || null,
      quantity:           c.quantity,
      isComplimentary:    false,
      specialInstruction: c.specialInstruction || '',
    }));
  }

  /* ── Create or add to order ── */
  async function getOrCreateOrder() {
    if (activeOrder) {
      return await addItems.mutateAsync({ orderId: activeOrder.id, items: buildOrderItems() });
    } else {
      const order = await createOrder.mutateAsync({
        branchId: session?.branchId || 1,
        orderType: 'DINE_IN',
        tableId:   Number(tableId),
        paxCount,
        items: buildOrderItems(),
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      return order;
    }
  }

  /* ── KOT — send to kitchen, go back to tables ── */
  async function sendKot(andPrint = false) {
    if (!cart.length) return;
    setLoadingAction(andPrint ? 'kot_print' : 'kot');
    try {
      /* If order is BILLED and captain adds items → void old bill first */
      if (activeOrder?.orderStatus === 'BILLED') {
        const confirmed = window.confirm(
          'Bill already generated. Adding new items will void the current bill. Continue?'
        );
        if (!confirmed) { setLoadingAction(null); return; }
        /* Fetch existing bill and void it */
        const billRes = await BillService.getBillByOrder(activeOrder.id);
        const bill    = billRes.data?.data;
        if (bill?.id) await voidBill.mutateAsync(bill.id);
      }

      const order = await getOrCreateOrder();
      const kotItems = (order.items || [])
        .filter(i => i.itemStatus === 'DRAFT' || i.pendingKotQty > 0)
        .map(i => ({ orderItemId: i.id, quantity: i.quantity, action: 'ADD' }));

      if (kotItems.length > 0) {
        await createKot.mutateAsync({ orderId: order.id, kotType: 'NEW', items: kotItems });
      }

      /* TODO: trigger KOT print if andPrint */
      toast.success(andPrint ? 'KOT sent & printing!' : 'KOT sent to kitchen!', order.orderNumber);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate('/tables');
    } catch (err) {
      toast.error(mapApiError(err).message, mapApiError(err).title);
    } finally {
      setLoadingAction(null);
    }
  }

  /* ── Core: generate bill (used by Save and Save & Print) ── */
  async function ensureBill(order) {
    /* Check if bill already exists */
    try {
      const res  = await BillService.getBillByOrder(order.id);
      const bill = res.data?.data;
      if (bill?.id) return bill; // already exists
    } catch (_) { /* 404 = no bill yet, proceed to create */ }

    /* Generate new bill */
    return await generateBill.mutateAsync({
      orderId:        order.id,
      isGstInvoice:   false,
      orderDiscount:  0,
      packagingCharge: 0,
    });
  }

  /* ── SAVE → generate bill silently, go back to tables ── */
  async function handleSave() {
    if (!cart.length && !activeOrder) return;
    setLoadingAction('save');
    try {
      let order = activeOrder;
      if (cart.length > 0) order = await getOrCreateOrder();
      await ensureBill(order);
      toast.success('Bill generated!', order.orderNumber);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate('/tables');
    } catch (err) {
      toast.error(mapApiError(err).message, mapApiError(err).title);
    } finally {
      setLoadingAction(null);
    }
  }

  /* ── SAVE & PRINT → generate bill + print ── */
  async function handleSaveAndPrint() {
    if (!cart.length && !activeOrder) return;
    setLoadingAction('save_print');
    try {
      let order = activeOrder;
      if (cart.length > 0) order = await getOrCreateOrder();
      const bill = await ensureBill(order);
      /* Print the bill */
      await printBill.mutateAsync(bill.id);
      toast.success('Bill generated & printing!', order.orderNumber);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate('/tables');
    } catch (err) {
      toast.error(mapApiError(err).message, mapApiError(err).title);
    } finally {
      setLoadingAction(null);
    }
  }

  /* ── SETTLE → navigate to billing screen ── */
  function handleSettle() {
    if (!activeOrder) return;
    navigate(`/billing?orderId=${activeOrder.id}&tableId=${tableId}&tableNumber=${encodeURIComponent(tableNumber)}`);
  }

  /* ── Remove existing item with kitchen status check ── */
  async function handleRemoveExistingItem(orderItemId) {
    if (!activeOrder) return;
    try {
      /* Fetch KOTs to check kitchen status */
      const kotRes = await OrderService.getKots(activeOrder.id);
      const kots   = kotRes.data?.data ?? [];
      let kitchenStatus = null;
      for (const kot of kots) {
        const ki = (kot.items || []).find(k => k.orderItemId === orderItemId);
        if (ki) { kitchenStatus = ki.kitchenStatus; break; }
      }

      /* READY/SERVED → block */
      if (kitchenStatus === 'READY' || kitchenStatus === 'SERVED') {
        toast.warning(
          `Item already ${kitchenStatus.toLowerCase()} — cannot cancel.`,
          'Cannot Cancel'
        );
        return;
      }

      /* PREPARING → confirm */
      if (kitchenStatus === 'PREPARING') {
        const ok = window.confirm('Item is being prepared in kitchen. Cancel anyway?');
        if (!ok) return;
      }

      await removeItem.mutateAsync({ orderId: activeOrder.id, itemId: orderItemId });
      await refetchOrders();
      toast.success('Item removed');
    } catch (err) {
      toast.error(mapApiError(err).message, 'Could not remove item');
    }
  }

  /* ── Settle enabled when orderStatus === BILLED ── */
  const canSettle = activeOrder?.orderStatus === 'BILLED';

  return (
    <div className={styles.page}>

      {/* LEFT: MENU */}
      <div className={styles.menuPanel}>
        <div className={styles.searchWrap}>
          <input className={styles.searchInput} placeholder="Search items..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>✕</button>
          )}
          <span className={styles.searchIcon}>🔍</span>
          {/* <span className={styles.escHint}>ESC to go back</span>s */}
        </div>

        {catsLoading ? (
          <div className={styles.catLoading}>
            {[80,95,70,85,75,65].map((w, i) => (
              <div key={i} className={`skeleton ${styles.catSkel}`} style={{ width: w }} />
            ))}
          </div>
        ) : (
          <div className={styles.catTabs}>
            {categories.map(cat => (
              <button key={cat.id}
                className={`${styles.catTab} ${selectedCatId === cat.id ? styles.catActive : ''}`}
                onClick={() => { setActiveCatId(cat.id); setSearchQuery(''); }}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className={styles.menuScroll}>
          {itemsLoading ? <MenuSkeleton /> :
            filteredItems.length === 0 ? (
              <div className={styles.noItems}>
                <div style={{ fontSize: 28, opacity: 0.35 }}>🍽️</div>
                <div>{searchQuery ? `No results for "${searchQuery}"` : 'No items in this category'}</div>
              </div>
            ) : (
              <div className={styles.menuGrid}>
                {filteredItems.map(item => (
                  <MenuItem key={item.id} item={item} onAdd={handleItemTap} cartQty={cartQtyMap[item.id] || 0} />
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* RIGHT: CART */}
      <div className={styles.cartWrap}>
        <CartPanel
          tableNumber={tableNumber}
          existingOrder={activeOrder}
          existingItems={existingItems}
          kotGroups={kotGroups}
          cart={cart}
          onQtyChange={changeQty}
          onRemove={removeFromCart}
          onNoteChange={changeNote}
          onRemoveExistingItem={handleRemoveExistingItem}
          onSave={handleSave}
          onSaveAndPrint={handleSaveAndPrint}
          onKot={() => sendKot(false)}
          onKotAndPrint={() => sendKot(true)}
          onSettle={handleSettle}
          canSettle={canSettle}
          loadingAction={loadingAction}
          paxCount={paxCount}
          onPaxChange={(n) => {
              setPaxCount(n);
              setPaxWarning(tableCapacity && n > tableCapacity);
          }}
          paxWarning={paxWarning}
          tableCapacity={tableCapacity}
        />
      </div>

      {variantItem && (
        <VariantAddonModal
          item={variantItem}
          onConfirm={handleVariantConfirm}
          onClose={() => setVariantItem(null)}
        />
      )}
    </div>
  );
}
