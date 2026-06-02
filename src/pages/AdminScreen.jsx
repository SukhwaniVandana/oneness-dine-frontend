import { useState } from 'react';
import MenuTab      from '../components/admin/MenuTab';
import TablesTab    from '../components/admin/TablesTab';
import SettingsTab  from '../components/admin/SettingsTab';
import TaxGroupsTab from '../components/admin/TaxGroupsTab';
import PrinterSettings from '../components/admin/PrinterSettings';
import styles from './AdminScreen.module.css';

const TABS = [
  { key: 'menu',     label: '🍽️ Menu',         desc: 'Categories & items'    },
  { key: 'tables',   label: '🪑 Tables',       desc: 'Sections & tables'     },
  { key: 'settings', label: '⚙️ Settings',     desc: 'Branch configuration'  },
  { key: 'tax',      label: '📋 Tax Groups',   desc: 'GST & tax setup'       },
  { key: 'printer',  label: '🖨️ Printer',      desc: 'Thermal printer setup' },
];

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>Admin Panel</div>
        <div className={styles.tabsRow}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className={styles.tabDesc}>{tab.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'menu'     && <MenuTab />}
        {activeTab === 'tables'   && <TablesTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'tax'      && <TaxGroupsTab />}
        {activeTab === 'printer'  && <PrinterSettings />}
      </div>

    </div>
  );
}
