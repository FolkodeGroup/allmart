import React from 'react';

interface ProductFeedbackSectionProps {
  success?: string | null;
  error?: string | null;
}

export const ProductFeedbackSection: React.FC<ProductFeedbackSectionProps> = ({ success, error }) => (
  <section aria-live="polite" aria-atomic="true">
    {success && <div style={{ color: '#22c55e', marginBottom: 4, fontWeight: 500 }}>{success}</div>}
    {error && <div style={{ color: '#ef4444', marginBottom: 4, fontWeight: 500 }}>{error}</div>}
  </section>
);
