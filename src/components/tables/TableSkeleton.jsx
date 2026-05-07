import styles from './TableSkeleton.module.css';

/* Renders N skeleton table cards while data loads */
export default function TableSkeleton({ count = 12 }) {
  return (
    <>
      {/* Badge skeletons */}
      <div className={styles.badgeRow}>
        {[90, 72, 88, 76].map((w, i) => (
          <div key={i} className={`skeleton ${styles.badgeSkel}`} style={{ width: w }} />
        ))}
      </div>

      {/* Card grid skeletons */}
      <div className={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={`skeleton ${styles.dot}`} />
            <div className={`skeleton ${styles.num}`} />
            <div className={`skeleton ${styles.label}`} />
            {i % 3 !== 1 && <div className={`skeleton ${styles.timer}`} />}
            <div className={`skeleton ${styles.covers}`} />
            {i % 3 !== 1 && <div className={`skeleton ${styles.amount}`} />}
          </div>
        ))}
      </div>
    </>
  );
}
