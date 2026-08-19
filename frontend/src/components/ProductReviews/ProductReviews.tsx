import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reviewsService, type Review, type VerifiedTokenInfo } from '../../services/reviewsService';
import { CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
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
            <span className={styles.verifiedBadge} title="Compra verificada por Allmart">
              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 3 }} /> Compra verificada
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

// ─── Formulario de Opinión Tokenizado & Optimizado ────────────────────────────

interface ReviewFormProps {
  tokenInfo: VerifiedTokenInfo | null;
  tokenString: string | null;
  onSuccess: (r: Review) => void;
}

function ReviewForm({ tokenInfo, tokenString, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(tokenInfo?.customerName || '');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenInfo?.customerName) {
      setReviewerName(tokenInfo.customerName);
    }
  }, [tokenInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor elegí una puntuación en estrellas.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      if (tokenString && tokenInfo?.isValid) {
        const review = await reviewsService.createTokenReview(tokenString, {
          rating,
          title: title.trim() || undefined,
          text: text.trim() || undefined,
        });
        onSuccess(review);
      } else {
        setError('Para calificar este producto necesitás ingresar desde el enlace que enviamos a tu email tras la entrega.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar la reseña.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Si NO tiene token, informar que las opiniones son 100% verificadas por compra
  if (!tokenString || !tokenInfo?.isValid) {
    return (
      <div className={styles.verifiedNoticeCard}>
        <div className={styles.verifiedNoticeHeader}>
          <ShieldCheck size={22} color="#769282" />
          <h3 className={styles.verifiedNoticeTitle}>Opiniones 100% Verificadas</h3>
        </div>
        <p className={styles.verifiedNoticeText}>
          En Allmart garantizamos la transparencia: las valoraciones están reservadas a clientes que recibieron el producto.
        </p>
        <p className={styles.verifiedNoticeSub}>
          Cuando tu pedido sea entregado, recibirás un correo electrónico de Allmart con un botón directo para dejar tu reseña con un solo clic.
        </p>
      </div>
    );
  }

  // Si el token ya fue utilizado previamente
  if (tokenInfo.alreadyReviewed) {
    return (
      <div className={styles.verifiedNoticeCard} style={{ borderColor: '#769282' }}>
        <div className={styles.verifiedNoticeHeader}>
          <CheckCircle2 size={22} color="#769282" />
          <h3 className={styles.verifiedNoticeTitle}>¡Ya dejaste tu opinión!</h3>
        </div>
        <p className={styles.verifiedNoticeText}>
          Ya registramos tu reseña para este producto con tu pedido <strong>#{tokenInfo.orderId.slice(0, 8).toUpperCase()}</strong>.
        </p>
        <p className={styles.verifiedNoticeSub}>
          Muchas gracias por ayudar a la comunidad de compradores de Allmart.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Banner de Compra Verificada con datos autocompletados */}
      <div className={styles.tokenVerifiedBanner}>
        <Sparkles size={16} color="#769282" />
        <span>
          Invitación de compra verificada para el pedido <strong>#{tokenInfo.orderId.slice(0, 8).toUpperCase()}</strong>
        </span>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rating-picker-component" className={styles.formLabel}>
          Tu puntuación <span className={styles.required}>*</span>
        </label>
        <div id="rating-picker-component">
          <StarPicker value={rating} onChange={(v) => { setRating(v); if (error) setError(null); }} />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rev-name" className={styles.formLabel}>
          Tu nombre
        </label>
        <input
          id="rev-name"
          className={styles.formInput}
          type="text"
          maxLength={100}
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Nombre visible en la reseña"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rev-title" className={styles.formLabel}>
          Título de tu opinión (opcional)
        </label>
        <input
          id="rev-title"
          className={styles.formInput}
          type="text"
          maxLength={120}
          placeholder="Ej: Excelente calidad, muy práctico..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rev-text" className={styles.formLabel}>
          Contanos tu experiencia (opcional)
        </label>
        <textarea
          id="rev-text"
          className={styles.formTextarea}
          rows={4}
          maxLength={1000}
          placeholder="¿Qué fue lo que más te gustó del producto? ¿Cómo te resultó en el uso diario?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className={styles.charCounter}>
          {text.length}/1000 caracteres
        </div>
      </div>

      {error && (
        <div className={styles.formError} role="alert">
          <AlertCircle size={15} style={{ display: 'inline', marginRight: 4 }} />
          {error}
        </div>
      )}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={submitting || rating === 0}
      >
        {submitting ? 'Publicando...' : 'Publicar mi opinión'}
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
  const [searchParams] = useSearchParams();
  const reviewTokenParam = searchParams.get('review_token');

  const [tab, setTab] = useState<Tab>(reviewTokenParam ? 'form' : 'list');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const [tokenInfo, setTokenInfo] = useState<VerifiedTokenInfo | null>(null);
  const [tokenLoading, setTokenLoading] = useState(Boolean(reviewTokenParam));

  const LIMIT = 5;

  // Validación del token al ingresar
  useEffect(() => {
    if (!reviewTokenParam) {
      setTokenLoading(false);
      return;
    }

    let active = true;
    setTokenLoading(true);

    reviewsService
      .verifyReviewToken(reviewTokenParam)
      .then((info) => {
        if (!active) return;
        setTokenInfo(info);
        if (info.isValid && !info.alreadyReviewed) {
          setTab('form');
        }
      })
      .catch((err) => {
        console.error('[Reviews] Error validando token:', err);
      })
      .finally(() => {
        if (active) setTokenLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reviewTokenParam]);

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
    setTimeout(() => setSuccess(false), 6000);
  };

  const hasMore = reviews.length < total;

  return (
    <section className={styles.root} aria-label="Opiniones del producto">
      <div className={styles.header}>
        <h2 className={styles.title}>Opiniones de clientes</h2>
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
            {reviewTokenParam ? '★ Dejar mi opinión' : '¿Cómo opinar?'}
          </button>
        </div>
      </div>

      {success && (
        <div className={styles.successBanner} role="status">
          <CheckCircle2 size={18} />
          <span>¡Muchas gracias! Tu opinión ya se encuentra publicada.</span>
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
              <p className={styles.empty}>Este producto aún no tiene opiniones publicadas.</p>
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
          {tokenLoading ? (
            <p className={styles.empty}>Verificando invitación de compra...</p>
          ) : (
            <ReviewForm
              tokenInfo={tokenInfo}
              tokenString={reviewTokenParam}
              onSuccess={handleNewReview}
            />
          )}
        </div>
      )}
    </section>
  );
}