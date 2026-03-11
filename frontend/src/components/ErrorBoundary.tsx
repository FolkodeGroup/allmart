import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Aquí se podrían enviar los errores a un servicio de logging externo (ej. Sentry)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h1 style={{ color: '#b91c1c', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Algo salió mal
          </h1>
          <p style={{ color: '#7f1d1d', marginBottom: '1.5rem' }}>
            Lo sentimos, ha ocurrido un error inesperado. Intente recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
          
          {import.meta.env.MODE === 'development' && (
            <pre style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              textAlign: 'left',
              overflow: 'auto',
              fontSize: '0.8rem',
              color: '#334155'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
