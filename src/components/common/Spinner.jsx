import styles from './Spinner.module.css';

/**
 * Spinner — inline action spinner
 *
 * Props:
 *   size     — 'sm' | 'md' | 'lg'   (default: 'md')
 *   variant  — 'white' | 'dark' | 'amber' | 'green' | 'red'  (default: 'white')
 */
export default function Spinner({ size = 'md', variant = 'white' }) {
  return (
    <span
      className={`${styles.spinner} ${styles[size]} ${styles[variant]}`}
      role="status"
      aria-label="Loading"
    />
  );
}
