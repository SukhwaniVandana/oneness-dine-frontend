import { useState, useEffect } from 'react';
import { getPrinterConfig, setPrinterConfig, testPrinter } from '../../services/printService';
import { useToast } from '../common/Toast';
import Spinner from '../common/Spinner';
import styles from './AdminTabs.module.css';

const PRINTER_TYPES = ['EPSON', 'STAR'];
const INTERFACES = [
  { label: 'Network/LAN (TCP)',  value: 'tcp',      placeholder: 'tcp://192.168.1.100' },
  { label: 'USB',                value: 'usb',      placeholder: '/dev/usb/lp0 or USB001' },
  { label: 'Bluetooth',         value: 'bluetooth', placeholder: 'BT address' },
];

export default function PrinterSettings() {
  const toast = useToast();
  const [config,   setConfig]   = useState(null);
  const [testing,  setTesting]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [ifaceType, setIfaceType] = useState('tcp');

  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    getPrinterConfig().then(cfg => {
      if (cfg) {
        setConfig(cfg);
        if (cfg.interface?.startsWith('tcp'))       setIfaceType('tcp');
        else if (cfg.interface?.startsWith('usb') ||
                 cfg.interface?.includes('USB'))     setIfaceType('usb');
        else if (cfg.interface?.startsWith('BT'))   setIfaceType('bluetooth');
      } else {
        setConfig({ type: 'EPSON', interface: 'tcp://192.168.1.100', width: 48, timeout: 3000 });
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await setPrinterConfig(config);
      toast.success('Printer settings saved!');
    } catch (err) {
      toast.error('Could not save printer settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await testPrinter();
      if (result.success) toast.success('Test print sent successfully!');
      else toast.error(result.error || 'Test print failed');
    } catch (err) {
      toast.error('Printer test failed: ' + err.message);
    } finally {
      setTesting(false);
    }
  }

  if (!config) return <div className={styles.loading}><Spinner variant="amber" /></div>;

  return (
    <div className={styles.settingsLayout}>

      {!isElectron && (
        <div className={styles.warningBox}>
          ⚠️ Thermal printer integration requires the ONENESS Dine desktop app (Electron).
          In browser mode, bills and KOTs will open a print dialog instead.
        </div>
      )}

      {/* Printer type */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>🖨️ Printer Configuration</div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Printer Brand</div>
            <div className={styles.settingDesc}>Select your thermal printer brand</div>
          </div>
          <select className={styles.select} value={config.type}
            onChange={e => setConfig(p => ({ ...p, type: e.target.value }))}>
            {PRINTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Paper Width</div>
            <div className={styles.settingDesc}>58mm = 32 chars | 80mm = 48 chars</div>
          </div>
          <select className={styles.select} value={config.width}
            onChange={e => setConfig(p => ({ ...p, width: Number(e.target.value) }))}>
            <option value={32}>58mm (32 chars)</option>
            <option value={48}>80mm (48 chars)</option>
          </select>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Connection Type</div>
            <div className={styles.settingDesc}>How is the printer connected?</div>
          </div>
          <select className={styles.select} value={ifaceType}
            onChange={e => {
              setIfaceType(e.target.value);
              const iface = INTERFACES.find(i => i.value === e.target.value);
              setConfig(p => ({ ...p, interface: iface?.placeholder || '' }));
            }}>
            {INTERFACES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>
              {ifaceType === 'tcp' ? 'Printer IP Address' :
               ifaceType === 'usb' ? 'USB Port' : 'Bluetooth Address'}
            </div>
            <div className={styles.settingDesc}>
              {ifaceType === 'tcp' ? 'e.g. tcp://192.168.1.100' :
               ifaceType === 'usb' ? 'e.g. /dev/usb/lp0 (Linux) or USB001 (Windows)' :
               'e.g. BT:xx:xx:xx:xx:xx'}
            </div>
          </div>
          <input className={styles.input} style={{ maxWidth: 220 }}
            value={config.interface}
            onChange={e => setConfig(p => ({ ...p, interface: e.target.value }))}
            placeholder={INTERFACES.find(i => i.value === ifaceType)?.placeholder} />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Connection Timeout (ms)</div>
            <div className={styles.settingDesc}>How long to wait for printer response</div>
          </div>
          <input className={styles.inputSm} type="number" min={1000} max={10000} step={500}
            value={config.timeout}
            onChange={e => setConfig(p => ({ ...p, timeout: Number(e.target.value) }))} />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.settingsSaveRow} style={{ display: 'flex', gap: 10 }}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? <><Spinner size="sm" variant="dark" /> Saving...</> : '✓ Save Settings'}
        </button>
        <button
          className={styles.cancelBtn}
          onClick={handleTest}
          disabled={testing || !isElectron}
          title={!isElectron ? 'Only available in desktop app' : 'Print a test page'}>
          {testing ? <><Spinner size="sm" variant="amber" /> Testing...</> : '🖨️ Test Print'}
        </button>
      </div>

    </div>
  );
}
