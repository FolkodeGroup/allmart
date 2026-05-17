import { useState, useEffect, useCallback } from 'react';
import { reviewsService, type Review } from '../../services/reviewsService';
import styles from './ProductReviews.module.css';

// ─── Star helpers ──────────────────────────────────────────────────────────────

function StarDisplay({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= Math.round(value) ? styles.starFull : styles.starEmpty}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className={styles.starPicker} role="group" aria-label="Elegí tu puntuación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= (hovered || value) ? styles.starPickerFull : styles.starPickerEmpty}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          aria-pressed={value === n}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className={styles.starPickerLabel}>
          {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][value]}
        </span>
      )}
    </div>
  );
}

// ─── Rating summary bar ────────────────────────────────────────────────────────

function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className={styles.summary}>
      <div className={styles.summaryScore}>
        <span className={styles.summaryAvg}>{avg.toFixed(1)}</span>
        <StarDisplay value={avg} />
        <span className={styles.summaryTotal}>{reviews.length} opiniones</span>
      </div>
      <div className={styles.summaryBars}>
        {counts.map(({ star, count }) => (
          <div key={star} className={styles.summaryBarRow}>
            <span className={styles.summaryBarLabel}>{star} ★</span>
            <div className={styles.summaryBarTrack}>
              <div
                className={styles.summaryBarFill}
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className={styles.summaryBarCount}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={styles.cardAuthor}>{review.userName}</span>
          {review.verified && (
            <span className={styles.verifiedBadge} title="Compra verificada">
              ✓ Compra verificada
            </span>
          )}
        </div>
        <StarDisplay value={review.rating} />
      </div>
      {review.title && <p className={styles.cardTitle}>{review.title}</p>}
      {review.text && <p className={styles.cardText}>{review.text}</p>}
      <time className={styles.cardDate} dateTime={review.createdAt}>
        {date}
      </time>
    </article>
  );
}

// ─── Review form ───────────────────────────────────────────────────────────────

interface FormState {
  rating: number;
  reviewerName: string;
  orderId: string;
  title: string;
  text: string;
}

const EMPTY_FORM: FormState = {
  rating: 0,
  reviewerName: '',
  orderId: '',
  title: '',
  text: '',
};

function ReviewForm({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess: (r: Review) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      setError('Por favor elegí una puntuación.');
      return;
    }
    if (!form.reviewerName.trim()) {
      setError('Ingresá tu nombre.');
      return;
    }
    if (!form.orderId.trim()) {
      setError('Ingresá tu número de pedido.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const review = await reviewsService.createGuestReview(productId, {
        orderId: form.orderId.trim(),
        reviewerName: form.reviewerName.trim(),
        rating: form.rating,
        title: form.title.trim() || undefined,
        text: form.text.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      onSuccess(review);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al enviar la reseña. Verificá el número de pedido.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.formHelp}>
        Solo podés dejar una reseña si compraste este producto. Ingresá tu número de pedido para
        verificar la compra.
      </p>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Tu puntuación <span className={styles.required}>*</span>
        </label>
        <StarPicker value={form.rating} onChange={(v) => set('rating', v)} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="rev-name" className={styles.formLabel}>
            Tu nombre <span className={styles.required}>*</span>
          </label>
          <input
            id="rev-name"
            className={styles.formInput}
            type="text"
            maxLength={100}
            placeholder="Ej: María G."
            value={form.reviewerName}
            onChange={(e) => set('reviewerName', e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="rev-order" className={styles.formLabel}>
            Número de pedido <span className={styles.required}>*</span>
          </label>
          <input
            id="rev-order"
            className={styles.formInput}
            type="text"
            placeholder="ID de tu pedido"
            value={form.orderId}
            onChange={(e) => set('orderId', e.target.value)}
            required
          />
          <span className={styles.formHint}>
            Lo encontrás en el correo de confirmación de tu compra.
          </span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rev-title" className={styles.formLabel}>
          Título (opcional)
        </label>
        <input
          id="rev-title"
          className={styles.formInput}
          type="text"
          maxLength={120}
          placeholder="Ej: Excelente producto"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rev-text" className={styles.formLabel}>
          Comentario (opcional)
        </label>
        <textarea
          id="rev-text"
          className={styles.formTextarea}
          rows={4}
          maxLength={1000}
          placeholder="Contanos tu experiencia con el producto..."
          value={form.text}
          onChange={(e) => set('text', e.target.value)}
        />
        <span className={styles.formHint}>{form.text.length}/1000 caracteres</span>
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={submitting}
      >
        {submitting ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Tab = 'list' | 'form';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [tab, setTab] = useState<Tab>('list');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const LIMIT = 5;

  const loadReviews = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await reviewsService.getProductReviews(productId, p, LIMIT);
        if (p === 1) {
          setReviews(res.data);
        } else {
          setReviews((prev) => [...prev, ...res.data]);
        }
        setTotal(res.total);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    setPage(1);
    setReviews([]);
    loadReviews(1);
  }, [productId, loadReviews]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadReviews(next);
  };

  const handleNewReview = (r: Review) => {
    setSuccess(true);
    setReviews((prev) => [r, ...prev]);
    setTotal((t) => t + 1);
    setTab('list');
    setTimeout(() => setSuccess(false), 5000);
  };

  const hasMore = reviews.length < total;

  return (
    <section className={styles.root} aria-label="Opiniones del producto">
      <div className={styles.header}>
        <h2 className={styles.title}>Opiniones</h2>
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            type="button"
            className={`${styles.tab} ${tab === 'list' ? styles.tabActive : ''}`}
            aria-selected={tab === 'list'}
            onClick={() => setTab('list')}
          >
            Ver opiniones {total > 0 && <span className={styles.tabCount}>{total}</span>}
          </button>
          <button
            role="tab"
            type="button"
            className={`${styles.tab} ${tab === 'form' ? styles.tabActive : ''}`}
            aria-selected={tab === 'form'}
            onClick={() => setTab('form')}
          >
            Dejar una opinión
          </button>
        </div>
      </div>

      {success && (
        <div className={styles.successBanner} role="status">
          ¡Gracias por tu reseña! Ya aparece publicada.
        </div>
      )}

      {tab === 'list' && (
        <div className={styles.listPanel}>
          <RatingSummary reviews={reviews} />

          {loading && reviews.length === 0 && (
            <p className={styles.empty}>Cargando opiniones...</p>
          )}

          {!loading && reviews.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.empty}>Este producto aún no tiene opiniones.</p>
              <button
                type="button"
                className={styles.beFirstBtn}
                onClick={() => setTab('form')}
              >
                Sé el primero en opinar
              </button>
            </div>
          )}

          <div className={styles.list}>
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMore}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Ver más opiniones'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'form' && (
        <div className={styles.formPanel}>
          <ReviewForm productId={productId} onSuccess={handleNewReview} />
        </div>
      )}
    </section>
  );
}
