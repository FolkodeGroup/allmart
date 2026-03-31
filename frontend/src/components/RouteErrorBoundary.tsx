import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { useEffect } from 'react';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('[RouteErrorBoundary] Navigation/render error:', error);
  }, [error]);

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>
          {error.status} {error.statusText}
        </h1>
        <p style={{ marginBottom: '1rem' }}>
          {typeof error.data === 'string' ? error.data : 'Ocurrió un error en la navegación.'}
        </p>
        <button type="button" onClick={() => navigate(0)}>
          Reintentar
        </button>
      </div>
    );
  }

  const message = error instanceof Error ? error.message : 'Error desconocido de navegación';

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Error inesperado</h1>
      <p style={{ marginBottom: '1rem' }}>{message}</p>
      <button type="button" onClick={() => navigate(0)}>
        Recargar vista
      </button>
    </div>
  );
}
