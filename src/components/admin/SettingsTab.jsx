import { useState, useEffect } from 'react';
import { useSettings, useSettingsMutation } from '../../hooks/useAdmin';
import { useToast } from '../common/Toast';
import { mapApiError } from '../common/ErrorHandler';
import Spinner from '../common/Spinner';
import styles from './AdminTabs.module.css';

export default function SettingsTab() {
  const toast = useToast();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useSettingsMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  async function handleSave() {
    try {
      await updateSettings.mutateAsync(form);
      toast.success('Settings saved!');
    } catch (err) { toast.error(mapApiError(err).message); }
  }

  if (isLoading || !form) return <div className={styles.loading}><Spinner variant="amber" /></div>;

  return (
    <div className={styles.settingsLayout}>

      {/* Operations */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>⚙️ Operations</div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>KOT Print Mode</div>
            <div className={styles.settingDesc}>AUTO prints KOT automatically, MANUAL requires confirmation</div>
          </div>
          <select className={styles.select} value={form.kotPrintMode}
            onChange={e => setForm(p => ({ ...p, kotPrintMode: e.target.value }))}>
            <option value="AUTO">Auto</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Bill Print Copies</div>
            <div className={styles.settingDesc}>Number of copies to print per bill</div>
          </div>
          <input className={styles.inputSm} type="number" min={1} max={5}
            value={form.billPrintCopies}
            onChange={e => setForm(p => ({ ...p, billPrintCopies: Number(e.target.value) }))} />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Service Charge %</div>
            <div className={styles.settingDesc}>Applied on taxable amount</div>
          </div>
          <input className={styles.inputSm} type="number" min={0} max={20} step={0.5}
            value={form.serviceChargePct}
            onChange={e => setForm(p => ({ ...p, serviceChargePct: Number(e.target.value) }))} />
        </div>
      </div>

      {/* Features */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>🔧 Features</div>
        {[
          { key: 'roundOffEnabled',      label: 'Round Off',              desc: 'Round bill total to nearest rupee'           },
          { key: 'loyaltyEnabled',       label: 'Loyalty Program',        desc: 'Enable loyalty points for customers'         },
          { key: 'tableMergeEnabled',    label: 'Table Merge',            desc: 'Allow merging multiple tables'               },
          { key: 'splitBillEnabled',     label: 'Split Bill',             desc: 'Allow splitting bill between customers'      },
          { key: 'multiOrderPerTable',   label: 'Multiple Sessions',      desc: 'Allow multiple order sessions per table'     },
          { key: 'dualScreenMode',       label: 'Dual Screen Mode',       desc: 'Show customer display on second screen'      },
          { key: 'captainAppEnabled',    label: 'Captain App',            desc: 'Enable captain mobile app'                   },
          { key: 'kitchenDisplayEnabled',label: 'Kitchen Display (KDS)',  desc: 'Enable digital kitchen display system'       },
        ].map(({ key, label, desc }) => (
          <div key={key} className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>{label}</div>
              <div className={styles.settingDesc}>{desc}</div>
            </div>
            <button
              className={`${styles.toggle} ${form[key] ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}>
              {form[key] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>

      {/* Platform */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>🛵 Online Platforms</div>
        {[
          { key: 'swiggyEnabled', label: 'Swiggy Integration', desc: 'Enable Swiggy order sync' },
          { key: 'zomatoEnabled', label: 'Zomato Integration', desc: 'Enable Zomato order sync' },
        ].map(({ key, label, desc }) => (
          <div key={key} className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>{label}</div>
              <div className={styles.settingDesc}>{desc}</div>
            </div>
            <button
              className={`${styles.toggle} ${form[key] ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}>
              {form[key] ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className={styles.settingsSaveRow}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <><Spinner size="sm" variant="dark" /> Saving...</> : '✓ Save Settings'}
        </button>
      </div>
    </div>
  );
}
