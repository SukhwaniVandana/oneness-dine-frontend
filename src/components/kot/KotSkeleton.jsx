import styles from './KotSkeleton.module.css';

export default function KotSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={`skeleton ${styles.tableNum}`} />
          <div className={`skeleton ${styles.label}`} />
        </div>
        <div className={`skeleton ${styles.timer}`} />
      </div>
      <div className={styles.items}>
        {[1,2,3].map(i => (
          <div key={i} className={styles.item}>
            <div className={`skeleton ${styles.qty}`} />
            <div className={`skeleton ${styles.name}`} />
          </div>
        ))}
      </div>
      <div className={`skeleton ${styles.btn}`} />
    </div>
  );
}
