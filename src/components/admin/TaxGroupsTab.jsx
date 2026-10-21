import { useState } from 'react';
import { useTaxGroups, useTaxGroupMutations } from '../../hooks/useAdmin';
import { useToast } from '../common/Toast';
import { mapApiError } from '../common/ErrorHandler';
import Spinner from '../common/Spinner';
import styles from './AdminTabs.module.css';

const emptyTG = { name: '', cgstPct: 0, sgstPct: 0, igstPct: 0, cessPct: 0, isInclusive: false };

export default function TaxGroupsTab() {
  const toast = useToast();
  const { data: taxGroups = [], isLoading } = useTaxGroups();
  const { create, remove, setDefault } = useTaxGroupMutations();
  const [form, setForm] = useState(null);

  async function handleSave() {
    try {
      await create.mutateAsync(form);
      toast.success('Tax group created');
      setForm(null);
    } catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleDelete(id) {
    if (!window.confirm('Delete this tax group? Items using it will be unlinked.')) return;
    try { await remove.mutateAsync(id); toast.success('Tax group deleted'); }
    catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleSetDefault(id) {
    try {
      await setDefault.mutateAsync(id);
      toast.success('Default tax group updated!');
    } catch (err) { toast.error(mapApiError(err).message); }
  }

  const fmt = (n) => Number(n || 0).toFixed(2);

  return (
    <div className={styles.tabContent}>

      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Tax Groups</span>
        <button className={styles.addBtn} onClick={() => setForm(emptyTG)}>+ Add Tax Group</button>
      </div>

      {/* Form */}
      {form && (
        <div className={styles.inlineForm}>
          <input className={styles.input} placeholder="Tax group name *"
            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className={styles.formRow}>
            {[
              { key: 'cgstPct', label: 'CGST %' },
              { key: 'sgstPct', label: 'SGST %' },
              { key: 'igstPct', label: 'IGST %' },
              { key: 'cessPct', label: 'Cess %' },
            ].map(({ key, label }) => (
              <div key={key} className={styles.taxInputGroup}>
                <label className={styles.taxLabel}>{label}</label>
                <input className={styles.input} type="number" min={0} max={100} step={0.5}
                  value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.isInclusive}
              onChange={e => setForm(p => ({ ...p, isInclusive: e.target.checked }))} />
            Tax inclusive (prices include GST)
          </label>
          <div className={styles.formActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={!form.name || create.isPending}>
              {create.isPending ? <Spinner size="sm" variant="dark" /> : null} Save
            </button>
            <button className={styles.cancelBtn} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tax groups list */}
      {isLoading ? <div className={styles.loading}><Spinner variant="amber" /></div> :
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>CGST %</th>
                <th>SGST %</th>
                <th>IGST %</th>
                <th>Cess %</th>
                <th>Total %</th>
                <th className={styles.centerAlignHeader}>Inclusive</th>
                <th className={styles.centerAlignHeader}>Default</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {taxGroups.map(tg => (
                <tr key={tg.id}>
                  <td className={styles.boldCell}>{tg.name}{tg.isDefault && (
                    <span className={styles.defaultTag}>DEFAULT</span>)}</td>
                  <td>{fmt(tg.cgstPct)}</td>
                  <td>{fmt(tg.sgstPct)}</td>
                  <td>{fmt(tg.igstPct)}</td>
                  <td>{fmt(tg.cessPct)}</td>
                  <td className={styles.boldCell}>
                    {fmt(Number(tg.cgstPct) + Number(tg.sgstPct) + Number(tg.igstPct) + Number(tg.cessPct))}%
                  </td>
                  <td className={styles.centerAlignColumn}>{tg.isInclusive ? '✓' : '—'}</td>
                  <td className={styles.centerAlignHeader}>
                    {tg.isDefault
                      ? <span style={{ color: 'var(--accent2)', fontSize: 16, fontWeight: 'bold' }}>✓</span>
                      : <button className={styles.setDefaultBtn}
                        onClick={() => handleSetDefault(tg.id)}
                        title="Set as default tax group">
                        ☆
                      </button>
                    }
                  </td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(tg.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {taxGroups.length === 0 && (
                <tr><td colSpan={8} className={styles.emptyCell}>No tax groups yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
