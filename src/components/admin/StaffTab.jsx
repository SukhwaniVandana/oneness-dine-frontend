import { useState } from 'react';
import { useStaff, useStaffMutations } from '../../hooks/useAdmin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import Spinner from '../common/Spinner';
import styles from './AdminTabs.module.css';

const ROLES = ['ADMIN', 'MANAGER', 'CAPTAIN', 'CASHIER', 'KITCHEN'];

const ROLE_COLORS = {
  ADMIN: 'purple', MANAGER: 'blue', CAPTAIN: 'amber',
  CASHIER: 'green', KITCHEN: 'red',
};

export default function StaffTab() {
  const toast = useToast();
  const { session } = useAuth();
  const branchId = session?.branchId || 1;

  const [staffForm, setStaffForm] = useState(null);
  const [search,    setSearch]    = useState('');

  const { data: staff = [], isLoading } = useStaff();
  const staffM = useStaffMutations();

  const filtered = staff.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.roleName?.toLowerCase().includes(search.toLowerCase())
  );

  async function saveStaff(form) {
    try {
      const payload = {
        fullName: form.fullName, username: form.username,
        phone: form.phone || '', email: form.email || '',
        roleName: form.roleName || 'CAPTAIN',
        branchId,
        ...(form.password ? { password: form.password } : {}),
      };
      if (form.id) await staffM.update.mutateAsync({ id: form.id, data: payload });
      else         await staffM.create.mutateAsync(payload);
      toast.success(form.id ? 'Staff updated' : 'Staff created');
      setStaffForm(null);
    } catch { toast.error('Could not save staff member'); }
  }

  if (isLoading) return <div className={styles.loading}><Spinner size="lg" variant="amber" /></div>;

  return (
    <div className={styles.tabContent}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input className={styles.searchInput} placeholder="Search staff..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className={styles.addBtnLarge} onClick={() => setStaffForm({})}>+ Add Staff</button>
      </div>

      {/* Staff table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th><th>Username</th><th>Role</th>
              <th>Phone</th><th>Last Login</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td className={styles.staffName}>{s.fullName}</td>
                <td className={styles.monoCell}>@{s.username}</td>
                <td>
                  <span className={`${styles.roleBadge} ${styles['role_' + (ROLE_COLORS[s.roleName] || 'amber')]}`}>
                    {s.roleName}
                  </span>
                </td>
                <td>{s.phone || '—'}</td>
                <td className={styles.dateCell}>
                  {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString('en-IN') : 'Never'}
                </td>
                <td>
                  <span className={`${styles.activeBadge} ${s.isActive ? styles.activeOn : styles.activeOff}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className={styles.iconBtn} onClick={() => setStaffForm(s)}>✏️</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.emptyCell}>No staff found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Form Modal */}
      {staffForm !== null && (
        <div className={styles.overlay} onClick={() => setStaffForm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{staffForm.id ? 'Edit Staff' : 'New Staff'}</div>
              <button className={styles.closeBtn} onClick={() => setStaffForm(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Full Name<span className={styles.req}>*</span></label>
                  <input className={styles.input} value={staffForm.fullName || ''} autoFocus
                    onChange={e => setStaffForm(p => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Username<span className={styles.req}>*</span></label>
                  <input className={styles.input} value={staffForm.username || ''}
                    onChange={e => setStaffForm(p => ({ ...p, username: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Role<span className={styles.req}>*</span></label>
                  <select className={styles.input} value={staffForm.roleName || 'CAPTAIN'}
                    onChange={e => setStaffForm(p => ({ ...p, roleName: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Phone</label>
                  <input className={styles.input} value={staffForm.phone || ''}
                    onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Email</label>
                  <input className={styles.input} type="email" value={staffForm.email || ''}
                    onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    {staffForm.id ? 'New Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input className={styles.input} type="password" value={staffForm.password || ''}
                    onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setStaffForm(null)}>Cancel</button>
                <button className={styles.saveBtn}
                  disabled={!staffForm.fullName || !staffForm.username || (!staffForm.id && !staffForm.password)}
                  onClick={() => saveStaff(staffForm)}>
                  {staffForm.id ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
