import React from 'react';

interface ModalConfirmProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ModalConfirm: React.FC<ModalConfirmProps> = ({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="fadeIn scaleIn microHover" style={{
        background: '#fff',
        borderRadius: 12,
        padding: '40px 32px',
        minWidth: 340,
        maxWidth: 480,
        boxShadow: '0 8px 32px #0003',
        textAlign: 'center',
        margin: 'auto',
        fontSize: '1.15rem',
        outline: 'none',
      }}>
        <h2 style={{ marginBottom: 12, fontWeight: 'bold', fontSize: '1.4rem' }}>{title}</h2>
        {description && <p style={{ marginBottom: 24, color: '#555' }}>{description}</p>}
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
          <button
            style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '10px 32px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.18s' }}
            className="microHover"
            onClick={onConfirm}
          >{confirmText}</button>
          <button
            style={{ background: '#eee', color: '#333', border: 'none', padding: '10px 32px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.18s' }}
            className="microHover"
            onClick={onCancel}
          >{cancelText}</button>
        </div>
      </div>
    </div>
  );
};
