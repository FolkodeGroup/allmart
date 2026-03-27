import React from 'react';
import { CheckSquare } from 'lucide-react';

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
        marginBottom: 16,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #faf8f5 0%, #f5f3f0 100%)',
        borderRadius: 10,
        border: '2px solid #e5e2dd',
        width: '100%',
        maxWidth: '1200px',
        alignSelf: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#d0ccc7';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(118, 146, 130, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e2dd';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-label="Seleccionar todos los productos visibles"
        style={{
          width: 20,
          height: 20,
          cursor: 'pointer',
          accentColor: '#769282',
        }}
      />
      <CheckSquare size={20} color="#769282" style={{ flexShrink: 0 }} />
      <span
        style={{
          fontSize: 14,
          color: '#333',
          fontWeight: 500,
          userSelect: 'none',
          lineHeight: 1.5,
        }}
      >
        Seleccionar todos los productos visibles
      </span>
    </div>
  );
};
