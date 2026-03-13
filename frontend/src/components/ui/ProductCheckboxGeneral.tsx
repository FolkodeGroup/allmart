import React from 'react';

interface ProductCheckboxGeneralProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}

export const ProductCheckboxGeneral: React.FC<ProductCheckboxGeneralProps> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        width: '100%',
        maxWidth: '100vw',
      }}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-label="Seleccionar todos los productos visibles"
        style={{
          marginRight: 8,
          width: 24,
          height: 24,
          accentColor: 'var(--color-primary, #2563eb)',
        }}
      />
      <span
        style={{
          fontSize: 16,
          color: '#555',
          fontWeight: 500,
          userSelect: 'none',
          lineHeight: 1.2,
        }}
      >
        Seleccionar todos los productos visibles
      </span>
    </div>
  );
};
