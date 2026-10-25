import { useState } from 'react';
import SalesTab    from '../components/reports/SalesTab';
import PaymentsTab from '../components/reports/PaymentsTab';
import ItemsTab    from '../components/reports/ItemsTab';
import BillsTab    from '../components/reports/BillsTab';
import styles from './ReportsScreen.module.css';

/* Today & 30 days ago */
function todayStr() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/* Active tabs — fully built */
const ACTIVE_TABS = [
  { key: 'sales',    label: '📊 Sales',         range: true  },
  { key: 'payments', label: '💳 Payments',       range: false },
  { key: 'items',    label: '🍽️ Top Items',      range: true  },
  { key: 'bills',    label: '🧾 Bills',           range: true  },
];

/* Coming soon tabs */
const COMING_TABS = [
  { key: 'tables',    label: '🪑 Table Utilization' },
  { key: 'kot',       label: '👨‍🍳 KOT Analytics'    },
  { key: 'cancelled', label: '❌ Cancelled Items'   },
  { key: 'payroll',   label: '💼 Payroll Summary'   },
  { key: 'loyalty',   label: '⭐ Loyalty Report'    },
  { key: 'audit',     label: '🔍 Audit Log'         },
];

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState('sales');
  const [from, setFrom] = useState(daysAgo(6)); // last 7 days
  const [to,   setTo]   = useState(todayStr());

  const currentTab = ACTIVE_TABS.find(t => t.key === activeTab);
  const isRange    = currentTab?.range ?? true;

  function handleQuick(days) {
    setFrom(daysAgo(days - 1));
    setTo(todayStr());
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>Reports</div>
        </div>

        {/* Date controls */}
        <div className={styles.dateControls}>
          {/* Quick presets */}
          <div className={styles.quickBtns}>
            <button className={styles.quickBtn} onClick={() => handleQuick(1)}>Today</button>
            <button className={styles.quickBtn} onClick={() => handleQuick(7)}>7 Days</button>
            <button className={styles.quickBtn} onClick={() => handleQuick(30)}>30 Days</button>
          </div>
          {/* Date inputs */}
          <div className={styles.dateRow}>
            <input
              type="date"
              className={styles.dateInput}
              value={from}
              max={to}
              onChange={e => setFrom(e.target.value)}
            />
            {isRange && (
              <>
                <span className={styles.dateSep}>→</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={to}
                  min={from}
                  max={todayStr()}
                  onChange={e => setTo(e.target.value)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        {/* Active tabs */}
        {ACTIVE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}

        {/* Divider */}
        <div className={styles.tabDivider} />

        {/* Coming soon tabs */}
        {COMING_TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${styles.tabComingSoon}`}
            title="Coming soon"
            disabled
          >
            {tab.label}
            <span className={styles.soonBadge}>Soon</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'sales'    && <SalesTab    from={from} to={to} isRange={from !== to} />}
        {activeTab === 'payments' && <PaymentsTab from={from} to={to} />}
        {activeTab === 'items'    && <ItemsTab    from={from} to={to} />}
        {activeTab === 'bills'    && <BillsTab    from={from} to={to} />}
      </div>

    </div>
  );
}
