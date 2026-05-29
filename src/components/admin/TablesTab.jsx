import { useState } from 'react';
import { useSections, useSectionMutations, useAdminTables, useTableMutations } from '../../hooks/useAdmin';
import { useToast } from '../common/Toast';
import { mapApiError } from '../common/ErrorHandler';
import Spinner from '../common/Spinner';
import styles from './AdminTabs.module.css';

const emptySection = { name: '', displayOrder: 1 };
const emptyTable   = { tableNumber: '', capacity: 4 };

export default function TablesTab() {
  const toast = useToast();
  const [selectedSection, setSelectedSection] = useState(null);
  const [secForm,  setSecForm]  = useState(null);
  const [tblForm,  setTblForm]  = useState(null);

  const { data: sections = [], isLoading: secLoading } = useSections();
  const { data: allTables = [], isLoading: tblLoading } = useAdminTables();
  const secMut = useSectionMutations();
  const tblMut = useTableMutations();

  const filteredTables = selectedSection
    ? allTables.filter(t => t.sectionId === selectedSection.id)
    : [];

  /* Section actions */
  async function handleSecSave() {
    try {
      if (secForm.id) await secMut.update.mutateAsync({ id: secForm.id, data: secForm });
      else            await secMut.create.mutateAsync(secForm);
      toast.success(secForm.id ? 'Section updated' : 'Section created');
      setSecForm(null);
    } catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleSecDelete(id) {
    if (!window.confirm('Delete this section? All tables in it must be deleted first.')) return;
    try { await secMut.remove.mutateAsync(id); toast.success('Section deleted'); if (selectedSection?.id === id) setSelectedSection(null); }
    catch (err) { toast.error(mapApiError(err).message); }
  }

  /* Table actions */
  async function handleTblSave() {
    const payload = { ...tblForm, sectionId: selectedSection?.id, capacity: Number(tblForm.capacity) };
    try {
      if (tblForm.id) await tblMut.update.mutateAsync({ id: tblForm.id, data: payload });
      else            await tblMut.create.mutateAsync(payload);
      toast.success(tblForm.id ? 'Table updated' : 'Table created');
      setTblForm(null);
    } catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleTblDelete(id) {
    if (!window.confirm('Delete this table?')) return;
    try { await tblMut.remove.mutateAsync(id); toast.success('Table deleted'); }
    catch (err) { toast.error(mapApiError(err).message); }
  }

  return (
    <div className={styles.splitLayout}>

      {/* LEFT — Sections */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Sections</span>
          <button className={styles.addBtn} onClick={() => setSecForm(emptySection)}>+ Add</button>
        </div>

        {secForm && (
          <div className={styles.inlineForm}>
            <input className={styles.input} placeholder="Section name *"
              value={secForm.name} onChange={e => setSecForm(p => ({ ...p, name: e.target.value }))} />
            <input className={styles.input} placeholder="Display order" type="number"
              value={secForm.displayOrder} onChange={e => setSecForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} />
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSecSave} disabled={!secForm.name}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setSecForm(null)}>Cancel</button>
            </div>
          </div>
        )}

        {secLoading ? <div className={styles.loading}><Spinner variant="amber" /></div> :
          <div className={styles.list}>
            {sections.map(sec => (
              <div key={sec.id}
                className={`${styles.listItem} ${selectedSection?.id === sec.id ? styles.listItemActive : ''}`}
                onClick={() => { setSelectedSection(sec); setTblForm(null); }}>
                <div className={styles.listItemName}>🏛️ {sec.name}</div>
                <div className={styles.listItemMeta}>
                  {allTables.filter(t => t.sectionId === sec.id).length} tables
                </div>
                <div className={styles.listItemActions}>
                  <button className={styles.editBtn} onClick={e => { e.stopPropagation(); setSecForm(sec); }}>✏️</button>
                  <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); handleSecDelete(sec.id); }}>🗑️</button>
                </div>
              </div>
            ))}
            {sections.length === 0 && <div className={styles.empty}>No sections yet</div>}
          </div>
        }
      </div>

      {/* RIGHT — Tables */}
      <div className={styles.rightPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>
            {selectedSection ? `${selectedSection.name} — Tables` : 'Select a section'}
          </span>
          {selectedSection && (
            <button className={styles.addBtn} onClick={() => setTblForm(emptyTable)}>+ Add Table</button>
          )}
        </div>

        {tblForm && (
          <div className={styles.inlineForm}>
            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Table number *"
                value={tblForm.tableNumber} onChange={e => setTblForm(p => ({ ...p, tableNumber: e.target.value }))} />
              <input className={styles.input} placeholder="Capacity" type="number"
                value={tblForm.capacity} onChange={e => setTblForm(p => ({ ...p, capacity: e.target.value }))} />
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleTblSave} disabled={!tblForm.tableNumber}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setTblForm(null)}>Cancel</button>
            </div>
          </div>
        )}

        {!selectedSection ? (
          <div className={styles.empty}>← Select a section to manage tables</div>
        ) : tblLoading ? (
          <div className={styles.loading}><Spinner variant="amber" /></div>
        ) : (
          <div className={styles.tableGrid}>
            {filteredTables.map(table => (
              <div key={table.id} className={styles.tableCard}>
                <div className={styles.tableNum}>{table.tableNumber}</div>
                <div className={styles.tableMeta}>👥 {table.capacity} covers</div>
                <div className={styles.tableStatus}>{table.tableStatus}</div>
                <div className={styles.tableActions}>
                  <button className={styles.editBtn} onClick={() => setTblForm(table)}>✏️</button>
                  <button className={styles.deleteBtn} onClick={() => handleTblDelete(table.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {filteredTables.length === 0 && <div className={styles.empty}>No tables in this section</div>}
          </div>
        )}
      </div>
    </div>
  );
}
