import styles from './MenuItem.module.css';

/**
 * MenuItem card
 * Props:
 *   item     — menu item from API
 *   onAdd    — called when tapped
 *   cartQty  — how many are in cart (0 = not added)
 */
export default function MenuItem({ item, onAdd, cartQty = 0 }) {
  const isVeg = item.foodType === 'VEG';
  const unavailable = !item.isAvailable || !item.isActive;

  return (
    <div
      className={`${styles.card} ${unavailable ? styles.unavailable : ''} ${cartQty > 0 ? styles.inCart : ''}`}
      onClick={() => !unavailable && onAdd(item)}
      role="button"
      tabIndex={unavailable ? -1 : 0}
      onKeyDown={e => e.key === 'Enter' && !unavailable && onAdd(item)}
      aria-label={`${item.name}, ₹${item.basePrice}`}
    >
      {/* Veg / Non-veg indicator */}
      <div className={styles.topRow}>
        <div className={`${styles.vegDot} ${isVeg ? styles.veg : styles.nonVeg}`}>
          <span className={styles.vegInner} />
        </div>
        {item.isBestseller && <span className={styles.tag}>⭐ Best</span>}
        {item.isRecommended && !item.isBestseller && <span className={styles.tag}>👍 Chef's</span>}
        {unavailable && <span className={`${styles.tag} ${styles.tagUnavail}`}>Unavailable</span>}
      </div>

      {/* Item image or emoji placeholder */}
      {item.primaryImageUrl ? (
        <img
          className={styles.img}
          src={`http://localhost:8080/${item.primaryImageUrl}`}
          alt={item.name}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className={styles.imgPlaceholder}>
          {isVeg ? '🥗' : '🍗'}
        </div>
      )}

      {/* Name */}
      <div className={styles.name}>{item.name}</div>

      {/* Category */}
      <div className={styles.category}>{item.categoryName}</div>

      {/* Price row */}
      <div className={styles.priceRow}>
        <span className={styles.price}>₹ {Number(item.basePrice).toFixed(0)}</span>
        {item.taxGroupName && (
          <span className={styles.tax}>{item.taxGroupName}</span>
        )}
      </div>

      {/* Cart qty badge */}
      {cartQty > 0 && (
        <div className={styles.cartBadge}>{cartQty}</div>
      )}
    </div>
  );
}
