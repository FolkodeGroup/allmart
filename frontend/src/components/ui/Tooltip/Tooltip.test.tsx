
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders child and shows tooltip on hover', () => {
    render(
      <Tooltip content="Texto de ayuda">
        <button>Acción</button>
      </Tooltip>
    );
    expect(screen.getByText('Acción')).toBeInTheDocument();
    // Tooltip no visible inicialmente
    expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
    // Hover
    fireEvent.mouseEnter(screen.getByText('Acción'));
    expect(screen.getByText('Texto de ayuda')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText('Acción'));
    expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus (accesibilidad)', async () => {
    render(
      <Tooltip content="Ayuda accesible">
        <button>Botón</button>
      </Tooltip>
    );
    const btn = screen.getByText('Botón');
    await act(async () => {
      btn.focus();
    });
    expect(await screen.findByText('Ayuda accesible')).toBeInTheDocument();
    await act(async () => {
      btn.blur();
    });
    expect(screen.queryByText('Ayuda accesible')).not.toBeInTheDocument();
  });
});
