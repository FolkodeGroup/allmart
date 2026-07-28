import { useState, useEffect, type CSSProperties } from 'react';
import styles from './ImageWithFallback.module.css';

interface Props {
  srcCandidates: Array<string | null | undefined>;
  alt: string;
  className?: string;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
}

const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Cpath d="M96 192l88-104 72 88 40-48 88 104z" fill="%23d1d5db"/%3E%3Ccircle cx="192" cy="104" r="24" fill="%23d1d5db"/%3E%3C/svg%3E';

export default function ImageWithFallback({
  srcCandidates,
  alt,
  className,
  placeholder = DEFAULT_PLACEHOLDER,
  loading = 'lazy',
  style,
  width,
  height,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder);

  useEffect(() => {
    const nextSrc = srcCandidates
      .filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
      .map((candidate) => candidate.trim());

    if (nextSrc.length === 0) {
      setCurrentIndex(-1);
      setCurrentSrc(placeholder);
      return;
    }

    setCurrentIndex(0);
    setCurrentSrc(nextSrc[0]);
  }, [placeholder, srcCandidates]);

  const handleError = () => {
    const nextSrcs = srcCandidates
      .filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
      .map((candidate) => candidate.trim());

    const nextIndex = currentIndex + 1;
    if (nextIndex >= nextSrcs.length) {
      setCurrentIndex(-1);
      setCurrentSrc(placeholder);
      return;
    }

    setCurrentIndex(nextIndex);
    setCurrentSrc(nextSrcs[nextIndex]);
  };

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={{ width: width ?? '100%', height: height ?? '100%', ...style }}
    >
      <img
        className={styles.image}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        width={width}
        height={height}
        onError={handleError}
      />
    </div>
  );
}
