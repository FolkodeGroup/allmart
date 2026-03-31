import React, { useState } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string; // URL de imagen liviana o color
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
}

/**
 * Imagen de producto optimizada: lazy, progresiva, WebP, placeholder, layout shift safe
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className,
  width = 240,
  height = 180,
  placeholder = 'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E',
  style,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes,
}) => {
  const [loaded, setLoaded] = useState(false);
  const safeSrc = typeof src === 'string' ? src : '';

  if (!safeSrc) {
    // Si no hay imagen, mostrar placeholder
    return (
      <img
        src={placeholder}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={{ objectFit: 'cover', ...style }}
        aria-label={alt}
      />
    );
  }
  // Derivar WebP si es posible
  const webpSrc = safeSrc.endsWith('.jpg') || safeSrc.endsWith('.jpeg')
    ? safeSrc.replace(/\.(jpg|jpeg)$/i, '.webp')
    : safeSrc.endsWith('.png')
      ? safeSrc.replace(/\.png$/i, '.webp')
      : undefined;
  return (
    <div style={{ position: 'relative', width, height, ...style }} className={className}>
      {/* Placeholder blur/liviano */}
      <img
        src={placeholder}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: loaded ? 'none' : 'blur(8px)',
          opacity: loaded ? 0 : 1,
          transition: 'opacity 0.4s',
          zIndex: 1,
        }}
      />
      {/* Imagen final optimizada */}
      <picture>
        {webpSrc && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        <img
          src={safeSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          sizes={sizes}
          width={width}
          height={height}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s',
            zIndex: 1,
            position: 'relative',
          }}
          onLoad={() => setLoaded(true)}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src = placeholder;
            setLoaded(true);
          }}
        />
      </picture>
    </div>
  );
};
