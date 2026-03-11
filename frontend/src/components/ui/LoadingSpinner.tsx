import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Cargando...', 
  size = 'md',
  fullPage = false 
}) => {
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '64px'
  };

  const containerStyle: React.CSSProperties = fullPage ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    width: '100%'
  };

  return (
    <div style={containerStyle}>
      <div className="spinner" style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: '4px solid #f3f3f3',
        borderTop: '4px solid var(--color-primary, #2563eb)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      {message && (
        <p style={{ 
          marginTop: '1rem', 
          color: '#666', 
          fontWeight: 500,
          fontSize: size === 'sm' ? '0.875rem' : '1rem'
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
