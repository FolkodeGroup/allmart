import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AdminAuthProvider } from '../../../../context/AdminAuthContext';
import { BannerFilterBuilder } from '../BannerFilterBuilder';
import type { BannerFilterConfig } from '../../../../types/bannerFilter';

function TestHarness() {
  const [value, setValue] = useState<BannerFilterConfig>({});

  return (
    <AdminAuthProvider>
      <BannerFilterBuilder value={value} onChange={setValue} categories={[]} />
    </AdminAuthProvider>
  );
}

describe('BannerFilterBuilder', () => {
  it('keeps only one tag active at a time', () => {
    render(<TestHarness />);

    const ofertaBtn = screen.getByRole('radio', { name: /en oferta/i });
    const destacadoBtn = screen.getByRole('radio', { name: /destacados/i });
    const novedadBtn = screen.getByRole('radio', { name: /novedades/i });

    fireEvent.click(ofertaBtn);
    expect(ofertaBtn).toHaveAttribute('aria-checked', 'true');
    expect(destacadoBtn).toHaveAttribute('aria-checked', 'false');
    expect(novedadBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(destacadoBtn);
    expect(ofertaBtn).toHaveAttribute('aria-checked', 'false');
    expect(destacadoBtn).toHaveAttribute('aria-checked', 'true');
    expect(novedadBtn).toHaveAttribute('aria-checked', 'false');
  });
});
