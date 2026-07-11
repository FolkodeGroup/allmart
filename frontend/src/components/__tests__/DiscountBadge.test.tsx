import { render, screen } from '@testing-library/react';
import DiscountBadge from '../DiscountBadge';

describe('DiscountBadge', () => {
  it('renders BOGO badge', () => {
    render(<DiscountBadge promotionType="bogo" />);
    expect(screen.getByText('BOGO')).toBeInTheDocument();
  });

  it('renders percentage badge', () => {
    render(<DiscountBadge promotionType="percentage" discountPercentage={25} />);
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  it('renders fixed badge', () => {
    render(<DiscountBadge promotionType="fixed" discountAmount={1200} />);
    expect(screen.getByText('-$1200')).toBeInTheDocument();
  });
});
