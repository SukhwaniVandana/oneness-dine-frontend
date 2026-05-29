import { useState } from 'react';
import { useCategories, useCategoryMutations, useMenuItems, useMenuItemMutations, useTaxGroups } from '../../hooks/useAdmin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { mapApiError } from '../common/ErrorHandler';
import Spinner from '../common/Spinner';
import styles from './AdminTabs.module.css';

const FOOD_TYPES = ['VEG','NON_VEG','EGG','VEGAN'];
const FOOD_ICONS = { VEG:'🟢', NON_VEG:'🔴', EGG:'🟡', VEGAN:'🌿' };

const emptyCat  = { name: '', displayOrder: 1, colorCode: '#f59e0b' };
const emptyItem = { name: '', shortName: '', basePrice: '', categoryId: '', taxGroupId: '', foodType: 'VEG', description: '', isRecommended: false, isBestseller: false };

export default function MenuTab() {
  const toast = useToast();
  const { session } = useAuth();
  const branchId = session?.branchId || 1;

  const [selectedCat, setSelectedCat] = useState(null);
  const [catForm,     setCatForm]     = useState(null);  // null=closed, {}=new, {id}=edit
  const [itemForm,    setItemForm]    = useState(null);

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: items = [],      isLoading: itemsLoading } = useMenuItems(selectedCat?.id);
  const { data: taxGroups = [] }                           = useTaxGroups();
  const catMut  = useCategoryMutations();
  const itemMut = useMenuItemMutations();

  /* ── Category actions ── */
  async function handleCatSave() {
    try {
      if (catForm.id) await catMut.update.mutateAsync({ id: catForm.id, data: catForm });
      else            await catMut.create.mutateAsync(catForm);
      toast.success(catForm.id ? 'Category updated' : 'Category created');
      setCatForm(null);
    } catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleCatDelete(id) {
    if (!window.confirm('Delete this category?')) return;
    try { await catMut.remove.mutateAsync(id); toast.success('Category deleted'); }
    catch (err) { toast.error(mapApiError(err).message); }
  }

  /* ── Item actions ── */
  async function handleItemSave() {
    const payload = { ...itemForm, categoryId: selectedCat?.id, basePrice: Number(itemForm.basePrice) };
    try {
      if (itemForm.id) await itemMut.update.mutateAsync({ id: itemForm.id, data: payload });
      else             await itemMut.create.mutateAsync(payload);
      toast.success(itemForm.id ? 'Item updated' : 'Item created');
      setItemForm(null);
    } catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleItemDelete(id) {
    if (!window.confirm('Delete this item?')) return;
    try { await itemMut.remove.mutateAsync(id); toast.success('Item deleted'); }
    catch (err) { toast.error(mapApiError(err).message); }
  }
  async function handleToggle(item) {
    try { await itemMut.toggleAvailability.mutateAsync({ id: item.id, isAvailable: !item.isAvailable }); }
    catch (err) { toast.error(mapApiError(err).message); }
  }

  return (
    <div className={styles.splitLayout}>

      {/* LEFT — Categories */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Categories</span>
          <button className={styles.addBtn} onClick={() => setCatForm(emptyCat)}>+ Add</button>
        </div>

        {/* Category form */}
        {catForm && (
          <div className={styles.inlineForm}>
            <input className={styles.input} placeholder="Category name *"
              value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} />
            <input className={styles.input} placeholder="Display order" type="number"
              value={catForm.displayOrder} onChange={e => setCatForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} />
            <div className={styles.formRow}>
              <input type="color" className={styles.colorPicker}
                value={catForm.colorCode || '#f59e0b'}
                onChange={e => setCatForm(p => ({ ...p, colorCode: e.target.value }))} />
              <span className={styles.colorLabel}>Color</span>
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleCatSave}
                disabled={!catForm.name || catMut.create.isPending || catMut.update.isPending}>
                {catMut.create.isPending || catMut.update.isPending ? <Spinner size="sm" variant="dark" /> : null}
                Save
              </button>
              <button className={styles.cancelBtn} onClick={() => setCatForm(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Category list */}
        {catsLoading ? <div className={styles.loading}><Spinner variant="amber" /></div> :
          <div className={styles.list}>
            {categories.map(cat => (
              <div key={cat.id}
                className={`${styles.listItem} ${selectedCat?.id === cat.id ? styles.listItemActive : ''}`}
                onClick={() => { setSelectedCat(cat); setItemForm(null); }}>
                <div className={styles.catDot} style={{ background: cat.colorCode || '#f59e0b' }} />
                <div className={styles.listItemName}>{cat.name}</div>
                <div className={styles.listItemMeta}>#{cat.displayOrder}</div>
                <div className={styles.listItemActions}>
                  <button className={styles.editBtn}
                    onClick={e => { e.stopPropagation(); setCatForm(cat); }}>✏️</button>
                  <button className={styles.deleteBtn}
                    onClick={e => { e.stopPropagation(); handleCatDelete(cat.id); }}>🗑️</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className={styles.empty}>No categories yet</div>}
          </div>
        }
      </div>

      {/* RIGHT — Items */}
      <div className={styles.rightPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>
            {selectedCat ? `${selectedCat.name} — Items` : 'Select a category'}
          </span>
          {selectedCat && (
            <button className={styles.addBtn} onClick={() => setItemForm(emptyItem)}>+ Add Item</button>
          )}
        </div>

        {/* Item form */}
        {itemForm && (
          <div className={styles.inlineForm}>
            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Item name *" style={{ flex: 2 }}
                value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
              <input className={styles.input} placeholder="Short name"
                value={itemForm.shortName} onChange={e => setItemForm(p => ({ ...p, shortName: e.target.value }))} />
            </div>
            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Base price *" type="number"
                value={itemForm.basePrice} onChange={e => setItemForm(p => ({ ...p, basePrice: e.target.value }))} />
              <select className={styles.select} value={itemForm.foodType}
                onChange={e => setItemForm(p => ({ ...p, foodType: e.target.value }))}>
                {FOOD_TYPES.map(t => <option key={t} value={t}>{FOOD_ICONS[t]} {t.replace('_',' ')}</option>)}
              </select>
              <select className={styles.select} value={itemForm.taxGroupId || ''}
                onChange={e => setItemForm(p => ({ ...p, taxGroupId: e.target.value || null }))}>
                <option value="">No Tax Group</option>
                {taxGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
              </select>
            </div>
            <textarea className={styles.textarea} placeholder="Description (optional)"
              value={itemForm.description} rows={2}
              onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} />
            <div className={styles.formRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={itemForm.isRecommended}
                  onChange={e => setItemForm(p => ({ ...p, isRecommended: e.target.checked }))} />
                Recommended
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={itemForm.isBestseller}
                  onChange={e => setItemForm(p => ({ ...p, isBestseller: e.target.checked }))} />
                Bestseller
              </label>
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleItemSave}
                disabled={!itemForm.name || !itemForm.basePrice || itemMut.create.isPending || itemMut.update.isPending}>
                Save
              </button>
              <button className={styles.cancelBtn} onClick={() => setItemForm(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Items list */}
        {!selectedCat ? (
          <div className={styles.empty}>← Select a category to manage items</div>
        ) : itemsLoading ? (
          <div className={styles.loading}><Spinner variant="amber" /></div>
        ) : (
          <div className={styles.list}>
            {items.map(item => (
              <div key={item.id} className={styles.listItem}>
                <span className={styles.foodIcon}>{FOOD_ICONS[item.foodType] || '🍽️'}</span>
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemName}>
                    {item.name}
                    {item.isBestseller  && <span className={styles.tag}>⭐ Best</span>}
                    {item.isRecommended && <span className={styles.tag}>👍 Rec</span>}
                  </div>
                  <div className={styles.listItemMeta}>₹ {Number(item.basePrice).toLocaleString('en-IN')}</div>
                </div>
                <div className={styles.listItemActions}>
                  {/* Availability toggle */}
                  <button
                    className={`${styles.toggleBtn} ${item.isAvailable ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => handleToggle(item)}
                    title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}>
                    {item.isAvailable ? '✓ Available' : '✕ Unavailable'}
                  </button>
                  <button className={styles.editBtn}
                    onClick={() => setItemForm(item)}>✏️</button>
                  <button className={styles.deleteBtn}
                    onClick={() => handleItemDelete(item.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className={styles.empty}>No items in this category</div>}
          </div>
        )}
      </div>
    </div>
  );
}
