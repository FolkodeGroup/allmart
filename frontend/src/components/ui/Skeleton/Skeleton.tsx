import styles from './Skeleton.module.css';

type SkeletonVariant = 'text' | 'title' | 'image' | 'card' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
      role="presentation"
    />
  );
}
