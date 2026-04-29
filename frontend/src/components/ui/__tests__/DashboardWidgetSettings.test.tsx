/**
 * components/ui/__tests__/DashboardWidgetSettings.test.tsx
 *
 * Tests for DashboardWidgetSettings component
 * Verifies widget toggle, reorder, and preview functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardWidgetSettings } from '../DashboardWidgetSettings';
import type { WidgetId } from '../../../context/DashboardLayoutContext';

describe('DashboardWidgetSettings', () => {
  const mockWidgets = [
    { id: 'metrics' as WidgetId, label: 'Métricas Clave', enabled: true },
    { id: 'critical_stock' as WidgetId, label: 'Acciones Requeridas', enabled: true },
    { id: 'activity_feed' as WidgetId, label: 'Actividad Reciente', enabled: false },
  ];

  const mockOnToggleWidget = vi.fn();
  const mockOnResetLayout = vi.fn();
  const mockOnReorderWidgets = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        onReorderWidgets={mockOnReorderWidgets}
        isOpen={false}
        onClose={mockOnClose}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        onReorderWidgets={mockOnReorderWidgets}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText('Personalizar Panel')).toBeInTheDocument();
  });

  it('should display widget count', () => {
    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText(/Widgets visibles \(2\/3\)/)).toBeInTheDocument();
  });

  it('should toggle widget visibility', async () => {
    mockOnToggleWidget.mockResolvedValue(undefined);

    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnToggleWidget).toHaveBeenCalledWith('metrics');
    });
  });

  it('should close panel when close button is clicked', () => {
    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close panel when backdrop is clicked', () => {
    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    const backdrop = document.querySelector('[role="presentation"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop as HTMLElement);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show preview tab when onReorderWidgets is provided', () => {
    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        onReorderWidgets={mockOnReorderWidgets}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    const previewTab = screen.getByText('👁️ Vista Previa');
    expect(previewTab).toBeInTheDocument();
  });

  it('should display preview section with enabled and disabled widgets', async () => {
    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        onReorderWidgets={mockOnReorderWidgets}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    // Click preview tab
    const previewTab = screen.getByText('👁️ Vista Previa');
    fireEvent.click(previewTab);

    // Check for preview sections
    await waitFor(() => {
      expect(screen.getByText(/📺 Widgets Activos/)).toBeInTheDocument();
      expect(screen.getByText(/🔒 Widgets Inactivos/)).toBeInTheDocument();
    });
  });

  it('should handle reset layout with confirmation', async () => {
    mockOnResetLayout.mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    const resetButton = screen.getByText(/Restaurar diseño predeterminado/);
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockOnResetLayout).toHaveBeenCalled();
    });
  });

  it('should not call reset layout if user cancels confirmation', async () => {
    window.confirm = vi.fn(() => false);

    render(
      <DashboardWidgetSettings
        widgets={mockWidgets}
        onToggleWidget={mockOnToggleWidget}
        onResetLayout={mockOnResetLayout}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );

    const resetButton = screen.getByText(/Restaurar diseño predeterminado/);
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockOnResetLayout).not.toHaveBeenCalled();
    });
  });
});
