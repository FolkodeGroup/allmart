import React, { useEffect, useRef } from 'react';
import type { Collection } from '../../features/admin/collections/collectionsService';
import { resolveImageUrl } from '../../utils/imageHelpers';
import { normalizeImageUrl, getFirstProductImage, DEFAULT_IMAGE_PLACEHOLDER, toThumbnailImageUrl } from '../../utils/imageUrl';
import ImageWithFallback from '../ui/ImageWithFallback';
import styles from './CollectionPreview.module.css';

interface Props {
    collection: Collection;
    anchorRect: DOMRect | null;
    onClose: () => void;
}

export default function CollectionPreview({ collection, anchorRect, onClose }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [onClose]);

    // Position near anchorRect and keep the panel inside the viewport.
    const style: React.CSSProperties = anchorRect
        ? (() => {
            const minWidth = 320;
            const gutter = 16;
            const viewportWidth = window.innerWidth;
            const anchorLeft = anchorRect.left;
            const anchorRight = anchorRect.right;
            const maxWidth = viewportWidth - gutter * 2;
            const width = Math.min(minWidth, maxWidth);
            const canOpenRight = anchorLeft + width + gutter <= viewportWidth;
            const canOpenLeft = anchorRight - width - gutter >= 0;
            const left = canOpenRight
                ? Math.max(gutter, anchorLeft)
                : canOpenLeft
                    ? Math.max(gutter, anchorRight - width)
                    : Math.max(gutter, viewportWidth - width - gutter);

            return {
                position: 'fixed',
                top: anchorRect.bottom + 8,
                left,
                width,
                maxHeight: 'calc(100vh - 32px)',
                overflow: 'auto',
                zIndex: 9999,
            };
        })()
        : { display: 'none' };

    return (
        <div ref={ref} className={styles.panel} style={style} role="dialog" aria-label={`Previsualización ${collection.name}`}>
            <div className={styles.header}>
                <div className={styles.title}>{collection.name}</div>
                <button className={styles.close} onClick={onClose} aria-label="Cerrar">×</button>
            </div>

            <div className={styles.productsTitle}>Productos ({collection.productCount})</div>
            <div className={styles.products}>
                {(collection.products || []).slice(0, 6).map((p) => {
                    const candidates: (string | null | undefined)[] = [];
                    const firstImage = normalizeImageUrl(getFirstProductImage(p)) || normalizeImageUrl(p.imageUrl);
                    const thumb = firstImage ? toThumbnailImageUrl(firstImage) : `/api/images/products/${p.id}/thumb`;

                    if (firstImage) {
                        const resolved = resolveImageUrl(firstImage);
                        if (resolved && resolved !== firstImage) candidates.push(resolved);
                        candidates.push(firstImage);
                    }

                    if (thumb && thumb !== firstImage) {
                        const rThumb = resolveImageUrl(thumb);
                        if (rThumb && rThumb !== thumb) candidates.push(rThumb);
                        candidates.push(thumb);
                    }

                    candidates.push(DEFAULT_IMAGE_PLACEHOLDER);

                    return (
                        <div key={p.id} className={styles.product}>
                            <ImageWithFallback srcCandidates={candidates} alt={p.name} height={"fit-content"} />
                            <div className={styles.productName}>{p.name}</div>
                            <div className={styles.productPrice}>${p.price}</div>
                        </div>
                    );
                })}
                {(collection.products || []).length === 0 && (
                    <div className={styles.noProducts}>No hay productos en esta colección</div>
                )}
            </div>
        </div>
    );
}
